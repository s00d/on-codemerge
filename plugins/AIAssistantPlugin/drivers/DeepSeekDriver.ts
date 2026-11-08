import { BearerCompletionsDriver } from './BearerCompletionsDriver';

/** OpenAI-compatible chat API (`/v1/generate` never existed). */
export class DeepSeekDriver extends BearerCompletionsDriver {
  constructor(apiKey: string) {
    super(apiKey, {
      label: 'DeepSeek',
      url: 'https://api.deepseek.com/chat/completions',
      description: {
        model: {
          type: 'list',
          label: 'Model',
          options: ['deepseek-chat', 'deepseek-reasoner'],
          default: 'deepseek-chat',
        },
        maxTokens: { type: 'number', label: 'Max Tokens', default: 100 },
        temperature: { type: 'number', label: 'Temperature', default: 0.7 },
      },
      buildBody: (prompt, options) => ({
        model: options?.model || 'deepseek-chat',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: options?.maxTokens ?? 100,
        temperature: options?.temperature ?? 0.7,
      }),
    });
  }
}
