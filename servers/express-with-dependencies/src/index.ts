import express from "express";
import { sum } from "@myrepo/sum";
import { multiply } from "@myrepo/multiply";

const app = express();

app.get("/", (_, res) => {
  res.status(200).send("OK");
});

app.get("/:op", (req, res, next) => {
  try {
    const { op } = req.params;
    const { a, b } = req.query;
    if (
      typeof op !== "string" ||
      typeof a !== "string" ||
      typeof b !== "string"
    ) {
      res.status(400).send(`Bad request`);
      return;
    }

    const numA = parseFloat(a);
    const numB = parseFloat(b);
    if ([numA, numB].some((num) => Number.isNaN(num))) {
      res.status(400).send(`Bad request`);
      return;
    }

    if (op === "sum") {
      res.status(200).send(`${a} plus ${b} is ${String(sum(numA, numB))}`);
      return;
    } else if (op === "multiply") {
      res
        .status(200)
        .send(`${a} times ${b} is ${String(multiply(numA, numB))}`);
      return;
    }
  } catch (error) {
    res.status(500).send("Something went wrong");
    return;
  }
});

app.listen(8165);
