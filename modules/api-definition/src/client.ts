import { Zodios } from "@zodios/core";

import { DICTIONARY_API } from "./api.ts";

export function createClient(endpoint: string) {
  return new Zodios(endpoint, DICTIONARY_API);
}
