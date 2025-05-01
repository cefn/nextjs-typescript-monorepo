import { parseArgs } from "node:util";

import chalk from "chalk";

import { traverseIssues } from "./lib/traverseIssues.ts";

const rulesPath = import.meta.resolve("./ruleConfig.ts");

// read --fix or -f arg
const args = process.argv.slice(2);
const { values, positionals } = parseArgs({
  args,
  options: {
    fix: {
      type: "boolean",
      short: "f",
    },
  },
  allowPositionals: true,
});
const { fix = false } = values;
const glob = positionals[0] || "**";

// perform validation
const { errorsFixed, errorsFound } = await traverseIssues(fix, glob);

// report validation result to console
const message =
  errorsFound > 0
    ? `TOTAL VALIDATION ERRORS ${errorsFound} FIXED ${errorsFixed} (See ${rulesPath} )`
    : `NO VALIDATION ERRORS FOUND`;

const { bgGreenBright, bgYellowBright, bgRedBright } = chalk;

const colorFn =
  errorsFound === 0
    ? bgGreenBright
    : errorsFound === errorsFixed
      ? bgYellowBright
      : bgRedBright;

console.log(colorFn(message));

if (errorsFound > errorsFixed) {
  process.exit(-1);
}
