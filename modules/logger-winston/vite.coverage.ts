import { ResolvedCoverageOptions } from "vitest/node";

export const coverage = {
  include: ["src/**/*.ts"],
  thresholds: {
    lines: 100,
    statements: 100,
    branches: 100,
    functions: 100,
  },
} satisfies Partial<ResolvedCoverageOptions<"v8">>;
