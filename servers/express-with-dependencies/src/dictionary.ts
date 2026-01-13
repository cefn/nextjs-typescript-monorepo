import {
  DICTIONARY_DOWNSTREAM_RESPONSE_SCHEMA,
  DictionaryBffResult,
} from "@myrepo/api-definition";

const DICTIONARY_API = "https://api.dictionaryapi.dev/api/v2/entries/en/";

export async function composeDictionaryBffResponse(options: {
  query: string;
}): Promise<DictionaryBffResult> {
  const { query } = options;
  try {
    const response = await fetch(
      `${DICTIONARY_API}/${encodeURIComponent(query)}`,
    );
    if (response.ok) {
      const json = await response.json();
      const parseResult = DICTIONARY_DOWNSTREAM_RESPONSE_SCHEMA.safeParse(json);
      if (parseResult.success) {
        return {
          httpStatus: 200,
          body: parseResult.data,
        };
      }
      return {
        httpStatus: 500,
        message: "Dictionary API served unexpected response",
      };
    }
    return {
      httpStatus: 503,
      message: `Dictionary API unexpectedly responded with ${response.status}`,
    };
  } catch (error) {
    return {
      httpStatus: 503,
      message: `Backend network error`,
    };
  }
}
