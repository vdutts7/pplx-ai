'use server'

import Exa from "exa-js";

export async function searchExaContent(query: string) {
  const exa = new Exa("edcd858c-1c94-4575-9ab5-7da7005133b5");

  const result = await exa.searchAndContents(
    query,
    {
      type: "neural",
      useAutoprompt: true,
      numResults: 10,
      text: true
    }
  );

  return result;
}