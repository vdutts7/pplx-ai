'use server'

import OpenAI from "openai";
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function createChatCompletion(messages: ChatCompletionMessageParam[]) {
  try {
    const completion = await openai.chat.completions.create({
      messages: messages,
      model: "gpt-4",
    });

    return completion.choices[0];
  } catch (error) {
    console.error('Error in createChatCompletion:', error);
    throw new Error('Failed to create chat completion');
  }
}