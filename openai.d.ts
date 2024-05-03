declare module 'openai/resources/chat/completions' {
  export interface ChatCompletionMessageParam {
    role: 'system' | 'user' | 'assistant';
    content: string;
    name?: string;
  }
}