import { readFileSync } from "fs";
import * as jsonDiff from "json-diff";
import {
  get as lodashGet,
  set as lodashSet,
  unset as lodashUnset,
} from "lodash-es";
import { minimatch } from "minimatch";
import { resolve } from "path";
import { isDeepStrictEqual } from "util";
import { ZodSchema } from "zod";
import { $ } from "zx";

import { PACKAGE_JSON_RULES } from "../ruleConfig.ts";
import type {
  AbsolutePath,
  PackageJsonIssue,
  PackageMeta,
  ValuePath,
  ValueRule,
} from "../types.ts";
import { PACKAGE_TYPES } from "./rules/packages.ts";
import { maybeRegExp, typedObjectEntries } from "./util.ts";

const RELATIVE_ROOT_PATH = "../../";

/** Traverse monorepo to find package.json files */
export async function listPackageJsonPaths(glob: string) {
  $.verbose = false;
  const relativePackagePaths = (
    await $`cd ${RELATIVE_ROOT_PATH} && find ${PACKAGE_TYPES} -mindepth 2 -maxdepth 2 -iname 'package.json'`
  ).stdout
    .trim()
    .split("\n");
  $.verbose = true;
  return relativePackagePaths
    .filter((packagePath) => minimatch(packagePath, glob))
    .map(
      (packagePath) => resolve(RELATIVE_ROOT_PATH, packagePath) as AbsolutePath,
    );
}

/** Load path and data for a single package.json */
export function loadPackageMeta(packagePath: AbsolutePath) {
  const packageJson = JSON.parse(
    readFileSync(packagePath).toString(),
  ) as PackageMeta["packageJson"];
  return {
    packagePath,
    packageJson,
  };
}

export function* listPackageJsonIssues(
  packageMeta: PackageMeta,
): Generator<PackageJsonIssue> {
  for (const [valuePath, valueRule] of typedObjectEntries(PACKAGE_JSON_RULES)) {
    yield* listRuleIssues(packageMeta, valuePath, valueRule);
  }
}

/** Traverse json yielding dot-separated paths to its leaf values */
function* listLeafPaths(val: unknown, path = ""): Iterable<string> {
  if (val === null || ["string", "number", "boolean"].includes(typeof val)) {
    // yield the path if it's a leaf
    yield path;
  } else {
    const entries = Array.isArray(val)
      ? val.entries()
      : typeof val === "object"
        ? Object.entries(val)
        : null;
    if (entries !== null) {
      // descend object or array members
      const branchPrefix = path === "" ? path : `${path}.`;
      for (const [memberKey, memberVal] of entries) {
        yield* listLeafPaths(memberVal, `${branchPrefix}${memberKey}`);
      }
    }
  }
}

function* listMatchingPairs(
  packageJson: PackageMeta["packageJson"],
  valuePath: ValuePath,
) {
  const maybeRegexPath = maybeRegExp(valuePath);
  if (maybeRegexPath) {
    for (const leafPath of listLeafPaths(packageJson)) {
      if (maybeRegexPath.test(leafPath)) {
        yield [leafPath, lodashGet(packageJson, leafPath)] as const;
      }
    }
  } else {
    const value = lodashGet(packageJson, valuePath);
    if (typeof value !== "undefined") {
      yield [valuePath, value] as const;
    }
  }
}

function* listRuleIssues(
  packageMeta: PackageMeta,
  valuePath: ValuePath,
  valueRule: ValueRule,
): Generator<PackageJsonIssue> {
  const { packageJson } = packageMeta;

  // call factory until resulting value rule is not itself a factory
  let currentValueRule = valueRule;
  let countIterations = 0;
  const maxIterations = 10;
  while (typeof currentValueRule === "function") {
    // avoid infinite loop
    if (countIterations++ > maxIterations)
      throw new Error(`returned ValueFunction > ${maxIterations} times`);
    // use factory to calculate next rule
    currentValueRule = currentValueRule(packageMeta);
  }

  // alias a string rule to be regex if it has slashes
  const expectedValue =
    (typeof currentValueRule === "string" && maybeRegExp(currentValueRule)) ||
    currentValueRule;

  // null value means leave unchanged
  if (expectedValue === null) {
    return;
  }

  // extract matching pairs from package json
  const matchingPairs = [...listMatchingPairs(packageJson, valuePath)];

  if (matchingPairs.length === 0) {
    // missing match yields a failure unless...
    // * path is a pattern (nothing HAS to match it)
    // * value is undefined (item is MEANT to be missing)
    // * value is schema and accepts undefined (item CAN be missing)
    if (typeof expectedValue !== "undefined") {
      if (expectedValue instanceof ZodSchema) {
        if (!expectedValue.safeParse(undefined).success) {
          yield {
            message: `EXPECTED match for schema FOUND nothing`,
            path: valuePath,
            // fix: omitted. Zod schema rules have no automatic fix
          };
        }
      } else {
        yield {
          message: `EXPECTED ${expectedValue} FOUND nothing`,
          path: valuePath,
          fix: ({ packageJson }) =>
            lodashSet(packageJson, valuePath, expectedValue),
        };
      }
    }
  }

  // traverse all matching pairs
  for (const [actualPath, actualValue] of matchingPairs) {
    // handle case where path should be undefined (fix by deletion)
    if (expectedValue === undefined) {
      yield {
        message: `EXPECTED undefined FOUND ${JSON.stringify(actualValue)}`,
        path: actualPath,
        fix: ({ packageJson }) => lodashUnset(packageJson, actualPath),
      };
    } else if (expectedValue instanceof ZodSchema) {
      // handle zod schemas which generate no expected value
      const parseResult = expectedValue.safeParse(actualValue);
      if (parseResult.success === false) {
        const { error } = parseResult;
        const errorMessages = [...listLeafPaths(error)]
          .filter((path) => path.endsWith("message"))
          .map((path) => lodashGet(error, path));
        yield {
          message: `Value '${actualValue}' doesn't match schema for ${valuePath}.\n${errorMessages}`,
          path: actualPath,
          // fix: omitted. Zod schema rules have no automatic fix
        };
      }
    } else if (valueRule instanceof RegExp && typeof actualValue === "string") {
      // handle RegExp rules which generate no expected value
      if (!valueRule.test(actualValue)) {
        yield {
          message: `Value ${actualValue} doesn't match ${valueRule.toString()}`,
          path: actualPath,
          // fix: omitted. RegExp pattern rules have no automatic fix
        };
      }
    } else if (!isDeepStrictEqual(expectedValue, actualValue)) {
      // treat all other cases as expecting equality
      const diffString = jsonDiff.diffString(actualValue, expectedValue);
      yield {
        message: `DIFFERS FROM RULE:\n${diffString}`,
        path: actualPath,
        fix: ({ packageJson }) =>
          lodashSet(packageJson, actualPath, expectedValue),
      };
      continue;
    }
  }
}
