import { Zodios } from "@zodios/core";

import { API } from "./api.ts";

export function createClient(endpoint: string) {
  return new Zodios(endpoint, API);
}
