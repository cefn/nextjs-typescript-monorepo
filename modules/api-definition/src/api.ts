import { makeApi } from "@zodios/core";
import { z } from "zod";

const DEFINITION_SCHEMA = z.object({
  definition: z.string(),
  synonyms: z.array(z.string()),
  antonyms: z.array(z.string()),
});

const WORD_SCHEMA = z.object({
  word: z.string(),
  phonetic: z.string(),
  meanings: z.object({
    partOfSpeech: z.string(),
    definitions: z.array(DEFINITION_SCHEMA),
  }),
  sourceUrls: z.array(z.string().url()),
});

export const DICTIONARY_DOWNSTREAM_RESPONSE_SCHEMA = z.array(WORD_SCHEMA);

export type DictionaryDownstreamResponse = z.infer<
  typeof DICTIONARY_DOWNSTREAM_RESPONSE_SCHEMA
>;

const DICTIONARY_BFF_SUCCESS_SCHEMA = z.object({
  httpStatus: z.literal(200),
  data: DICTIONARY_DOWNSTREAM_RESPONSE_SCHEMA,
});

const DICTIONARY_BFF_FAILURE_SCHEMA = z.object({
  httpStatus: z.union([z.literal(400), z.literal(500), z.literal(503)]),
  message: z.string(),
});

const DICTIONARY_BFF_RESPONSE_SCHEMA = z.union([
  DICTIONARY_BFF_SUCCESS_SCHEMA,
  DICTIONARY_BFF_FAILURE_SCHEMA,
]);

export type DictionaryBffResponse = z.infer<
  typeof DICTIONARY_BFF_RESPONSE_SCHEMA
>;

export const API = makeApi([
  {
    method: "get",
    path: "/dictionary/:query",
    description: "Lookup a word",
    parameters: [
      {
        name: "query",
        type: "Path",
        schema: z.string(),
        description: "The word to look up",
      },
    ],
    response: DICTIONARY_BFF_RESPONSE_SCHEMA,
  },
]);
