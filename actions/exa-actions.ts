'use server'

import Exa from "exa-js";

const exa = new Exa(process.env.EXA_API_KEY);

export async function searchExaContent(query: string) {
  try {
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
  } catch (error) {
    console.error('Error in searchExaContent:', error);
    throw new Error('Failed to search Exa content');
  }
}