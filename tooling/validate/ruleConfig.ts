import { byParentFolder } from "./lib/rules/factories.js";
import { getPackageSlug } from "./lib/rules/packages.js";
import { PackageJsonSpec } from "./types.js";

export const PACKAGE_JSON_RULES = {
  name: byParentFolder({
    packages: ({ packagePath }) => `@myrepo/${getPackageSlug({ packagePath })}`,
    servers: ({ packagePath }) => getPackageSlug({ packagePath }),
  }),
  version: "0.0.0",
  private: byParentFolder({
    packages: undefined,
    servers: true,
  }),
  type: "module",
  main: undefined,
  module: undefined,
  types: undefined,
  keywords: undefined,
  author: undefined,
  description: undefined,
  exports: byParentFolder({
    packages: {
      "./package.json": "./package.json",
      ".": {
        import: {
          "@myrepo": "./src/index.ts",
          types: "./dist/index.d.ts",
          default: "./dist/index.js",
        },
        require: {
          types: "./dist/index.d.ts",
          default: "./dist/index.cjs",
        },
      },
    },
    servers: undefined,
  }),
  license: "MIT",
} as const satisfies PackageJsonSpec;
