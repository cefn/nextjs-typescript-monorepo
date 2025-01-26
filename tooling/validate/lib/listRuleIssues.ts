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
import { $ } from "zx";

import { PACKAGE_JSON_RULES } from "../ruleConfig.js";
import type {
  AbsolutePath,
  PackageJsonIssue,
  PackageMeta,
  Value,
  ValuePath,
  ValueRule,
} from "../types.js";
import { PACKAGE_TYPES } from "./rules/packages.js";
import { typedObjectEntries } from "./util.js";

/** Traverse monorepo to find package.json files */
export async function listPackageJsonPaths(glob: string) {
  $.verbose = false;
  const findStdOut = (
    await $`find ${PACKAGE_TYPES} -mindepth 2 -maxdepth 2 -iname 'package.json'`
  ).stdout;
  if(findStdOut === ''){
    throw new Error(`Could not find any packages to validate`)
  }
  const relativePackagePaths = findStdOut.trim().split("\n");
  $.verbose = true;
  return relativePackagePaths
    .filter((packagePath) => minimatch(packagePath, glob))
    .map((packagePath) => resolve(packagePath) as AbsolutePath);
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

function* listRuleIssues(
  packageMeta: PackageMeta,
  valuePath: ValuePath,
  valueRule: ValueRule,
): Generator<PackageJsonIssue> {
  const { packageJson } = packageMeta;
  const actualValue = lodashGet(packageJson, valuePath) as Value | undefined;

  // handle RegExp rules which generate no expected value
  if (valueRule instanceof RegExp && typeof actualValue === "string") {
    if (!valueRule.test(actualValue)) {
      yield {
        message: `Value ${actualValue} doesn't match ${valueRule.toString()}`,
        path: valuePath,
        // fix: omitted. RegExp pattern rules have no automatic fix
      };
    }
    return;
  }

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
  const expectedValue = currentValueRule;

  // null value means leave unchanged
  if (expectedValue === null) {
    return;
  }

  // handle case where path should be undefined (fix by deletion)
  if (expectedValue === undefined) {
    if (actualValue !== undefined) {
      yield {
        message: `EXPECTED undefined FOUND ${JSON.stringify(actualValue)}`,
        path: valuePath,
        fix: ({ packageJson }) => lodashUnset(packageJson, valuePath),
      };
    }
    return;
  }

  // treat all other cases as expecting equality
  if (!isDeepStrictEqual(expectedValue, actualValue)) {
    const diffString = jsonDiff.diffString(actualValue, expectedValue);
    yield {
      message: `DIFFERS FROM RULE:\n${diffString}`,
      path: valuePath,
      fix: ({ packageJson }) =>
        lodashSet(packageJson, valuePath, expectedValue),
    };
  }
}
