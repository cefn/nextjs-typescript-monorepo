import { DICTIONARY_API } from "@myrepo/api-definition";
import { zodiosRouter } from "@zodios/express";
import express from "express";
import { composeDictionaryBffResponse } from "./dictionary.ts";
import { sum } from "@myrepo/sum";
import { multiply } from "@myrepo/multiply";

const app = express();

const dictionaryRouter = zodiosRouter(DICTIONARY_API);

dictionaryRouter.get("/dictionary/:query", async (req, res) => {
  const { query } = req.params;
  const bffResponse = await composeDictionaryBffResponse({ query });
  const { httpStatus } = bffResponse;
  if (httpStatus === 200) {
    const { body } = bffResponse;
    return res.status(httpStatus).send(body);
  } else {
    const { message } = bffResponse;
    if (httpStatus !== 404) {
      console.error(
        `Error : Served ${JSON.stringify({ httpStatus })} processing request for ${query}`,
      );
    }
    return res.status(httpStatus).send({ message });
  }
});

app.use(dictionaryRouter);

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
