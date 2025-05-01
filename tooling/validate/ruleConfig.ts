import { z } from "zod";

import { byPackageName, byParentFolder } from "./lib/rules/factories.ts";
import { getPackageSlug } from "./lib/rules/packages.ts";
import { getRelativePackagePath } from "./lib/util.ts";
import { PackageJsonSpec } from "./types.ts";

const TYPESCRIPT_VERSION = "^5.8.3";

const NEXTJS_PACKAGENAME_PATTERN = "/^nextjs-.*/";
const EXPRESS_PACKAGENAME_PATTERN = "/^express-.*/";

export const PACKAGE_JSON_RULES = {
  name: byParentFolder({
    modules: ({ packagePath }) => `@myrepo/${getPackageSlug({ packagePath })}`,
    servers: ({ packagePath }) => getPackageSlug({ packagePath }),
  }),
  type: "module",
  main: undefined,
  module: undefined,
  types: undefined,
  license: undefined,
  overrides: undefined,
  files: byParentFolder({
    modules: ["README.md", "dist", "src"],
    servers: undefined,
  }),
  private: byParentFolder({
    modules: undefined,
    servers: true,
  }),
  publishConfig: byParentFolder({
    servers: undefined,
  }),
  exports: (options) => {
    const { packagePath } = options;
    const packageRootName = packagePath.split("/").at(-2);
    const types = `./dist/${packageRootName}/src/index.d.ts`;
    const valueFactory = byParentFolder({
      modules: {
        "./package.json": "./package.json",
        ".": {
          import: {
            "@myrepo": "./src/index.ts",
            types,
            default: "./dist/index.js",
          },
          require: {
            types,
            default: "./dist/index.cjs",
          },
        },
      },
      servers: undefined,
    });
    return valueFactory(options);
  },
  repository: ({ packagePath }) => {
    const relativePackagePath = getRelativePackagePath({ packagePath });
    return {
      type: "git",
      url: "https://github.com/cefn/nextjs-typescript-monorepo.git",
      directory: relativePackagePath,
    };
  },
  homepage: ({ packagePath }) => {
    const relativePackagePath = getRelativePackagePath({ packagePath });
    return `https://github.com/cefn/nextjs-typescript-monorepo/tree/main/${relativePackagePath}/README.md`;
  },
  bugs: {
    url: "https://github.com/cefn/nextjs-typescript-monorepo/issues",
  },
  "scripts.compile": "tsc --noEmit",
  "scripts.test": byParentFolder({
    modules: "vitest run --coverage",
    servers: undefined,
  }),
  "scripts.test:watch": byParentFolder({
    modules: "vitest",
    servers: undefined,
  }),
  "scripts.changeset":
    "echo 'Please run `pnpm changeset` from the monorepo root'",
  "scripts.prepublishOnly": byParentFolder({ modules: "pnpm run build" }),
  "scripts.build": byParentFolder({
    modules: "vite build",
    servers: byPackageName(
      {
        [NEXTJS_PACKAGENAME_PATTERN]: "next build",
      },
      undefined,
    ),
  }),
  "dependencies.typescript": byPackageName(
    {
      [NEXTJS_PACKAGENAME_PATTERN]: TYPESCRIPT_VERSION, // non-devDependency for nextjs
    },
    undefined,
  ),
  /** Local package deps should be "workspace:*" or nothing at all */
  "/(d|devD|peerD)ependencies.@myrepo.*/": z.union([
    z.literal("workspace:^"),
    z.undefined(),
  ]),
  "devDependencies.@rollup/plugin-typescript": byParentFolder({
    modules: "^11.1.6",
    servers: undefined,
  }),
  "devDependencies.typescript": byPackageName(
    {
      [NEXTJS_PACKAGENAME_PATTERN]: undefined, // non-devDependency for nextjs
    },
    TYPESCRIPT_VERSION,
  ),
  "devDependencies.vite": byParentFolder({
    modules: "^6.0.6",
    servers: undefined,
  }),
  "devDependencies.vitest": byParentFolder({
    modules: "^2.1.8",
    servers: byPackageName(
      {
        [EXPRESS_PACKAGENAME_PATTERN]: "^2.1.8",
      },
      undefined,
    ),
  }),
  "devDependencies.@vitest/coverage-v8": byParentFolder({
    modules: "^2.1.8",
    servers: undefined,
  }),
  "devDependencies.vite-plugin-dts": byParentFolder({
    modules: "^4.4.0",
    servers: undefined,
  }),
  "devDependencies.vite-plugin-externalize-deps": byParentFolder({
    modules: "^0.8.0",
    servers: undefined,
  }),
} as const satisfies PackageJsonSpec;
