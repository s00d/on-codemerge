import { BearerCompletionsDriver } from './BearerCompletionsDriver';

/** Chat API — `/v1/completions` is FIM-only; unknown params (top_k…) are rejected with 422. */
export class MistralDriver extends BearerCompletionsDriver {
  constructor(apiKey: string) {
    super(apiKey, {
      label: 'Mistral',
      url: 'https://api.mistral.ai/v1/chat/completions',
      description: {
        model: {
          type: 'list',
          label: 'Model',
          options: [
            'mistral-large-latest',
            'mistral-medium-latest',
            'mistral-small-latest',
            'ministral-8b-latest',
            'open-mistral-nemo',
            'codestral-latest',
          ],
          default: 'mistral-small-latest',
        },
        maxTokens: { type: 'number', label: 'Max Tokens', default: 100 },
        temperature: { type: 'number', label: 'Temperature', default: 0.7 },
        topP: { type: 'number', label: 'Top P', default: 1 },
      },
      buildBody: (prompt, options) => ({
        model: options?.model || 'mistral-small-latest',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: options?.maxTokens ?? 100,
        temperature: options?.temperature ?? 0.7,
        top_p: options?.topP ?? 1,
      }),
    });
  }
}
