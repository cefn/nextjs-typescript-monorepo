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

export type DictionaryBffSuccess = {
  httpStatus: 200;
  body: DictionaryDownstreamResponse;
};

export type DictionaryBffFailure = {
  httpStatus: 404 | 500 | 503;
  message: string;
};

export type DictionaryBffResult = DictionaryBffSuccess | DictionaryBffFailure;

const DICTIONARY_BFF_ERROR_SCHEMA = z.object({
  message: z.string(),
});

export const DICTIONARY_API = makeApi([
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
    response: DICTIONARY_DOWNSTREAM_RESPONSE_SCHEMA,
    errors: [
      {
        status: 404,
        schema: DICTIONARY_BFF_ERROR_SCHEMA,
      },
      {
        status: 500,
        schema: DICTIONARY_BFF_ERROR_SCHEMA,
      },
      {
        status: 503,
        schema: DICTIONARY_BFF_ERROR_SCHEMA,
      },
    ],
  },
]);
