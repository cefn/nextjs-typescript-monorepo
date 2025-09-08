import { defineConfig } from "vitest/config";

import { coverage } from "./vite.coverage.ts";

export default defineConfig({
  resolve: {
    conditions: ["@myrepo"],
  },
  ssr: { resolve: { conditions: ["@myrepo"] } },
  test: {
    reporters: ["verbose"],
    coverage,
  },
});
