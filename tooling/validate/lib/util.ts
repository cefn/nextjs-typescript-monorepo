import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

import { AbsolutePath } from "../types.js";

export const SKELETON_RSYNC_OPTIONS = "--exclude=.gitkeep";

export function typedObjectEntries<Obj extends object>(obj: Obj) {
  type Entry = keyof Obj extends keyof Obj
    ? [keyof Obj, Obj[keyof Obj]]
    : never;
  return Object.entries(obj) as Entry[];
}

export function isMember<Arr extends readonly unknown[]>(
  arr: Arr,
  candidate: unknown,
): candidate is Arr[number] {
  return arr.includes(candidate);
}

export function resolveAbsolute(parentPath: AbsolutePath, childPath: string) {
  return resolve(parentPath, childPath) as AbsolutePath;
}

/** Return the location of this file (like __dirname in commonjs) */
export function getUtilPath() {
  const filePath = fileURLToPath(import.meta.url);
  const dirPath = dirname(filePath);
  return resolve(dirPath) as AbsolutePath;
}

/** Resolve a path from the /tooling folder. */
export function getToolingPath(...relativePaths: string[]) {
  return resolve(getUtilPath(), "../../", ...relativePaths) as AbsolutePath;
}

/** Resolve a path from the root of the monorepo. */
export function getRepoPath(...relativePaths: string[]) {
  return getToolingPath("../", ...relativePaths) as AbsolutePath;
}

export function getRelativePackagePath(options: { packagePath: string }) {
  const { packagePath } = options;
  const repoRoot = getRepoPath() + "/";
  const relativePath = packagePath
    .replace(repoRoot, "")
    .replace("/package.json", "");
  return relativePath;
}
