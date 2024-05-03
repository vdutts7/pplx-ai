'use server'

import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function createChatCompletion(messages: OpenAI.Chat.ChatCompletionMessage[]) {
  try {
    const completion = await openai.chat.completions.create({
      messages: messages,
      model: "gpt-4o",
    });

    return completion.choices[0];
  } catch (error) {
    console.error('Error in createChatCompletion:', error);
    throw new Error('Failed to create chat completion');
  }
}