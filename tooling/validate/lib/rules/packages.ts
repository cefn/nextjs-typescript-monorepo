import { sep } from "path";

import { PackageMeta } from "../../types.js";
import { isMember } from "../util.js";

/** The scope prefix */
export const SCOPE = "@myrepo";

export const PACKAGE_TYPES = ["servers", "packages"] as const;
export type PackageType = (typeof PACKAGE_TYPES)[number];

/** Extract the last three segments of the path to package.json.
 * This ends up like ["servers", "archetype-backend-script", "package.json"]
 */
function getTrailingPathSegments(options: { packagePath: string }) {
  const { packagePath } = options;
  const pathSegments = packagePath.split(sep);
  const lastSegments = pathSegments.slice(pathSegments.length - 3);
  if (
    lastSegments.length === 3 &&
    lastSegments.every((segment) => typeof segment === "string")
  ) {
    return lastSegments as [
      packageType: string,
      packageSlug: string,
      `package.json`,
    ];
  }
  throw new Error(`packagePath '${packagePath}' doesn't have 3 segments`);
}

/** Check what parent folder the package is in. */
export function getPackageType({
  packagePath,
}: Pick<PackageMeta, "packagePath">) {
  const [packageType] = getTrailingPathSegments({
    packagePath,
  });
  if (isMember(PACKAGE_TYPES, packageType)) {
    return packageType;
  }
  throw new Error(`Could not extract packageType from ${packagePath}`);
}

/** Interrogate a package.json path, extracting the name of the containing folder */
export function getPackageSlug({
  packagePath,
}: Pick<PackageMeta, "packagePath">) {
  const [_packageType, packageSlug] = getTrailingPathSegments({
    packagePath,
  });
  return packageSlug;
}

/** List upstream dependencies from packageJson */
export function getUpstreamNames({ packageJson }: PackageMeta) {
  const upstreamNames: string[] = [];
  const deps = {
    ...packageJson.dependencies,
    ...packageJson.peerDependencies,
  };
  for (const scopedName of Object.keys(deps)) {
    const [scope, name] = scopedName.split("/");
    if (name !== undefined && scope === SCOPE) {
      upstreamNames.push(name);
    }
  }
  return upstreamNames.length > 0 ? upstreamNames : null;
}
