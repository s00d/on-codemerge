import { BearerCompletionsDriver } from './BearerCompletionsDriver';

/** Meta Llama API, OpenAI-compatible endpoint (api.llama.ai is gone). */
export class LlamaDriver extends BearerCompletionsDriver {
  constructor(apiKey: string) {
    super(apiKey, {
      label: 'Llama',
      url: 'https://api.llama.com/compat/v1/chat/completions',
      description: {
        model: {
          type: 'list',
          label: 'Model',
          options: [
            'Llama-4-Maverick-17B-128E-Instruct-FP8',
            'Llama-4-Scout-17B-16E-Instruct-FP8',
            'Llama-3.3-70B-Instruct',
            'Llama-3.3-8B-Instruct',
          ],
          default: 'Llama-3.3-70B-Instruct',
        },
        maxTokens: { type: 'number', label: 'Max Tokens', default: 100 },
        temperature: { type: 'number', label: 'Temperature', default: 0.7 },
        topP: { type: 'number', label: 'Top P', default: 1 },
      },
      buildBody: (prompt, options) => ({
        model: options?.model || 'Llama-3.3-70B-Instruct',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: options?.maxTokens ?? 100,
        temperature: options?.temperature ?? 0.7,
        top_p: options?.topP ?? 1,
      }),
    });
  }
}
