import type { DriverOptions } from './AIDriver';
import { BearerCompletionsDriver } from './BearerCompletionsDriver';

export interface LlamaOptions extends DriverOptions {
  topK?: number;
  repetitionPenalty?: number;
}

export class LlamaDriver extends BearerCompletionsDriver<LlamaOptions> {
  constructor(apiKey: string) {
    super(apiKey, {
      label: 'Llama',
      url: 'https://api.llama.ai/v1/completions',
      description: {
        model: {
          type: 'list',
          label: 'Model',
          options: [
            'llama-3.2-11b-vision-instruct',
            'llama-3.2-90b-vision-instruct',
            'llama-3.3-70b-instruct',
            'meta-llama-3.1-405b-instruct',
            'meta-llama-3.1-70b-instruct',
            'meta-llama-3.1-8b-instruct',
            'meta-llama-3-70b-instruct',
            'meta-llama-3-8b-instruct',
          ],
          default: 'llama-3.2-90b-vision-instruct',
        },
        maxTokens: { type: 'number', label: 'Max Tokens', default: 100 },
        temperature: { type: 'number', label: 'Temperature', default: 0.7 },
        topK: { type: 'number', label: 'Top K', default: 50 },
        repetitionPenalty: { type: 'number', label: 'Repetition Penalty', default: 1 },
      },
      buildBody: (prompt, options) => ({
        model: options?.model ?? 'llama-3.2-90b-vision-instruct',
        prompt,
        max_tokens: options?.maxTokens ?? 100,
        temperature: options?.temperature ?? 0.7,
        top_k: options?.topK ?? 50,
        repetition_penalty: options?.repetitionPenalty ?? 1,
      }),
    });
  }
}
