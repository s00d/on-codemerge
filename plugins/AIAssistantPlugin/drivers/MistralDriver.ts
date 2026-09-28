import type { DriverOptions } from './AIDriver';
import { BearerCompletionsDriver } from './BearerCompletionsDriver';

export interface MistralOptions extends DriverOptions {
  topK?: number;
  repetitionPenalty?: number;
}

export class MistralDriver extends BearerCompletionsDriver<MistralOptions> {
  constructor(apiKey: string) {
    super(apiKey, {
      label: 'Mistral',
      url: 'https://api.mistral.ai/v1/completions',
      description: {
        model: {
          type: 'list',
          label: 'Model',
          options: [
            'mistral-large',
            'mistral-small',
            'mistral-nemo',
            'mistral-large-24.11',
            'mistral-large-2407',
          ],
          default: 'mistral-large',
        },
        maxTokens: { type: 'number', label: 'Max Tokens', default: 100 },
        temperature: { type: 'number', label: 'Temperature', default: 0.7 },
        topK: { type: 'number', label: 'Top K', default: 50 },
        repetitionPenalty: { type: 'number', label: 'Repetition Penalty', default: 1 },
      },
      buildBody: (prompt, options) => ({
        model: options?.model ?? 'mistral-large',
        prompt,
        max_tokens: options?.maxTokens ?? 100,
        temperature: options?.temperature ?? 0.7,
        top_k: options?.topK ?? 50,
        repetition_penalty: options?.repetitionPenalty ?? 1,
      }),
    });
  }
}
