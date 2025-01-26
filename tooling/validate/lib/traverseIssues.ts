import chalk from "chalk";
import { writeFileSync } from "fs";
import { sep } from "path";
import { $ } from "zx/core";

import type { AbsolutePath, ErrorReport, PackageMeta } from "../types.js";
import {
  listPackageJsonIssues,
  listPackageJsonPaths,
  loadPackageMeta,
} from "./listRuleIssues.js";
import { listPackageSkeletonIssues } from "./listSkeletonIssues.js";
import { SKELETON_RSYNC_OPTIONS } from "./util.js";

export async function traverseIssues(
  fixRequested: boolean,
  glob: string,
): Promise<ErrorReport> {
  let errorsFound = 0;
  let errorsFixed = 0;
  function aggregateErrors(report: ErrorReport) {
    errorsFound += report.errorsFound;
    errorsFixed += report.errorsFixed;
  }

  const packagePaths = [...await listPackageJsonPaths(glob)];
  for (const packagePath of packagePaths) {
    const packageMeta = loadPackageMeta(packagePath);
    aggregateErrors(traverseJsonIssues(packageMeta, fixRequested));
    aggregateErrors(await traverseSkeletonIssues(packageMeta, fixRequested));
  }

  return {
    errorsFound,
    errorsFixed,
  };
}

/** Generate issues across all  */
export function traverseJsonIssues(
  packageMeta: PackageMeta,
  fixRequested: boolean,
): ErrorReport {
  const jsonIssues = [...listPackageJsonIssues(packageMeta)];

  let errorsFound = 0;
  let errorsFixed = 0;
  if (jsonIssues.length > 0) {
    // record package errors
    errorsFound += jsonIssues.length;
    console.log(
      chalk.blue(
        `${packageMeta.packageJson.name} : ${jsonIssues.length} ISSUES `,
      ),
    );

    // list individual errors, and optionally fix them
    for (const { message, path, fix } of jsonIssues) {
      if (fixRequested) {
        // fix requested
        if (typeof fix === "function") {
          // fix is available
          console.log(chalk.greenBright(`FIXING ${path} : ${message}`));
          fix(packageMeta);
          errorsFixed += 1;
        } else {
          // no fix available
          console.log(chalk.redBright(`CANNOT FIX ${path} : ${message}`));
        }
      } else {
        // no fix requested
        console.log(chalk.yellowBright(`DETECTED ${path} : ${message}`));
      }
    }

    if (fixRequested) {
      // write package.json including any fixes performed above
      writeFileSync(
        packageMeta.packagePath,
        JSON.stringify(packageMeta.packageJson, null, 2),
      );
    }
  }
  return { errorsFound, errorsFixed };
}

async function traverseSkeletonIssues(
  packageMeta: PackageMeta,
  fixRequested: boolean,
): Promise<ErrorReport> {
  let errorsFound = 0;
  for await (const {
    referencePath,
    packagePath,
    message,
  } of listPackageSkeletonIssues(packageMeta)) {
    errorsFound++;
    if (fixRequested) {
      console.log(
        chalk.greenBright(
          `MERGING ${summaryPath(packagePath)} FROM ${summaryPath(referencePath)}`,
        ),
      );
      await $({
        quiet: true,
      })`rsync --recursive --checksum --itemize-changes ${SKELETON_RSYNC_OPTIONS} "${referencePath}" "${packagePath}"`;
    } else {
      console.log(
        chalk.yellowBright(
          `DETECTED ${summaryPath(packagePath)} DIFFERS FROM ${summaryPath(referencePath)} (${message}) `,
        ),
      );
    }
  }
  const errorsFixed = fixRequested ? errorsFound : 0;
  return {
    errorsFound,
    errorsFixed,
  };
}

function summaryPath(path: AbsolutePath) {
  const segments = path.split(sep);
  return segments.slice(segments.length - 3).join(sep);
}
