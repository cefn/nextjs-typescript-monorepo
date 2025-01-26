import { readdirSync, statSync } from "fs";
import { dirname } from "path";
import { $ } from "zx/core";

import { AbsolutePath, PackageMeta, PackageSkeletonIssue } from "../types.js";
import { getPackageType } from "./rules/packages.js";
import {
  getToolingPath,
  resolveAbsolute,
  SKELETON_RSYNC_OPTIONS,
} from "./util.js";

export async function* listPackageSkeletonIssues(packageMeta: PackageMeta) {
  const roots = ["shared", getPackageType(packageMeta)] as const; // e.g. ["shared", "servers"] or ["shared", "packages"]
  for (const root of roots) {
    const referencePath = resolveAbsolute(
      getToolingPath(),
      `./validate/skeleton/${root}`,
    );
    yield* listReferencePathIssues(packageMeta, referencePath);
  }
}

export async function* listReferencePathIssues(
  { packagePath }: PackageMeta,
  referenceRoot: AbsolutePath,
): AsyncGenerator<PackageSkeletonIssue> {
  // derive root from package.json path
  const packageRoot = dirname(packagePath) as AbsolutePath;
  // get folder listings
  const relativePaths = readdirSync(referenceRoot);

  // check all reference file contents are identical with package file contents
  for (const relativePath of relativePaths) {
    const referencePath = resolveAbsolute(referenceRoot, relativePath);
    const packagePath = resolveAbsolute(packageRoot, relativePath);

    // add trailing slash to origin directories for rsync compatibility
    const referenceRsyncPath = (
      statSync(referencePath).isDirectory()
        ? `${referencePath}/`
        : referencePath
    ) as typeof referencePath;

    const result = await $({
      quiet: true,
    })`rsync --dry-run --recursive --checksum --itemize-changes ${SKELETON_RSYNC_OPTIONS} ${referenceRsyncPath} ${packagePath}`;
    const message = result.stdout.trim();
    if (message.length === 0) {
      // skip path - already includes whole reference tree
      continue;
    }

    // some part of tree is missing or mismatched
    yield {
      referencePath: referenceRsyncPath,
      message,
      packagePath,
    };
  }
}
