import { BearerCompletionsDriver } from './BearerCompletionsDriver';

export class DeepSeekDriver extends BearerCompletionsDriver {
  constructor(apiKey: string) {
    super(apiKey, {
      label: 'DeepSeek',
      url: 'https://api.deepseek.com/v1/generate',
      description: {
        maxTokens: { type: 'number', label: 'Max Tokens', default: 100 },
        temperature: { type: 'number', label: 'Temperature', default: 0.7 },
      },
      buildBody: (prompt, options) => ({
        prompt,
        max_tokens: options?.maxTokens ?? 100,
        temperature: options?.temperature ?? 0.7,
      }),
    });
  }
}
