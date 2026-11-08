import type { DriverOptions } from './AIDriver';
import { BearerCompletionsDriver } from './BearerCompletionsDriver';

export interface OpenAIOptions extends DriverOptions {
  frequencyPenalty?: number;
  presencePenalty?: number;
}

export class OpenAIDriver extends BearerCompletionsDriver<OpenAIOptions> {
  constructor(apiKey: string) {
    super(apiKey, {
      label: 'OpenAI',
      url: 'https://api.openai.com/v1/chat/completions',
      description: {
        model: {
          type: 'list',
          label: 'Model',
          options: [
            'gpt-4o',
            'gpt-4o-mini',
            'gpt-4-turbo',
            'gpt-4',
            'gpt-3.5-turbo',
            'o1',
            'o1-mini',
          ],
          default: 'gpt-4o-mini',
        },
        maxTokens: { type: 'number', label: 'Max Tokens', default: 100 },
        temperature: { type: 'number', label: 'Temperature', default: 0.7 },
        topP: { type: 'number', label: 'Top P', default: 1 },
        frequencyPenalty: { type: 'number', label: 'Frequency Penalty', default: 0 },
        presencePenalty: { type: 'number', label: 'Presence Penalty', default: 0 },
      },
      buildBody: (prompt, options) => ({
        model: options?.model || 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: options?.maxTokens ?? 100,
        temperature: options?.temperature ?? 0.7,
        top_p: options?.topP ?? 1,
        frequency_penalty: options?.frequencyPenalty ?? 0,
        presence_penalty: options?.presencePenalty ?? 0,
      }),
    });
  }
}
