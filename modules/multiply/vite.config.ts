import typescript from "@rollup/plugin-typescript";
import path from "path";
import dts from "vite-plugin-dts";
import { externalizeDeps } from "vite-plugin-externalize-deps";
import { defineConfig } from "vitest/config";

import { coverage } from "./vite.coverage.ts";

export default defineConfig({
  resolve: {
    conditions: ["@myrepo"],
  },
  build: {
    rollupOptions: {
      plugins: [
        typescript({
          project: "./tsconfig.json",
          sourceMap: true,
          declaration: true,
          outDir: "dist",
          module: "nodeNext",
        }),
      ],
    },
    sourcemap: "inline",
    minify: false,
    lib: {
      entry: path.resolve(__dirname, "src/index.ts"),
      fileName: "index",
      formats: ["es", "cjs"],
    },
  },
  plugins: [dts(), externalizeDeps()],
  test: {
    reporters: ["verbose"],
    disableConsoleIntercept: true,
    coverage,
  },
});
