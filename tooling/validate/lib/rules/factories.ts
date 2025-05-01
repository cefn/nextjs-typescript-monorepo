/**
 * Canonical 'ValueFactories' that offer semantic sugar with rich editor support
 * for defining alternate package.json validation according to gross features of
 * a package.
 */

import { ValueFactory, ValueRule } from "../../types.ts";
import { maybeRegExp } from "../util.ts";
import { getPackageType, PackageType } from "./packages.ts";

/** ValueFactory with distinct values for PackageType 'modules' or 'servers' */
export function byParentFolder(
  lookup: Partial<Record<PackageType, ValueRule>>,
): ValueFactory {
  return (packageMeta) => {
    const parentFolder = getPackageType(packageMeta);
    return lookup[parentFolder];
  };
}

/** ValueFactory with distinct values for one or more named packages */
export function byPackageName(
  lookup: Record<string, ValueRule>,
  fallback: ValueRule,
): ValueFactory {
  return ({ packageJson }) => {
    const { name } = packageJson;
    for (const [key, rule] of Object.entries(lookup)) {
      const regexKey = maybeRegExp(key);
      if (key === name || regexKey?.test(name)) {
        return rule;
      }
    }
    return fallback;
  };
}
