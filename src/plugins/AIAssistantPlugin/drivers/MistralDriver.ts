import type { AIDriver, DriverOptions, OptionsDescription } from './AIDriver';

export interface MistralOptions extends DriverOptions {
  topK?: number; // Top-k sampling
  repetitionPenalty?: number; // Штраф за повторения
}

export class MistralDriver implements AIDriver<MistralOptions> {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  getOptionsDescription(): OptionsDescription {
    return {
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
      maxTokens: {
        type: 'number',
        label: 'Max Tokens',
        default: 100,
      },
      temperature: {
        type: 'number',
        label: 'Temperature',
        default: 0.7,
      },
      topK: {
        type: 'number',
        label: 'Top K',
        default: 50,
      },
      repetitionPenalty: {
        type: 'number',
        label: 'Repetition Penalty',
        default: 1.0,
      },
    };
  }

  async generateText(prompt: string, options?: MistralOptions): Promise<string> {
    const response = await fetch('https://api.mistral.ai/v1/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: options?.model || 'mistral-large',
        prompt: prompt,
        max_tokens: options?.maxTokens || 100,
        temperature: options?.temperature || 0.7,
        top_k: options?.topK || 50,
        repetition_penalty: options?.repetitionPenalty || 1.0,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate text with Mistral');
    }

    const data = await response.json();
    return data.choices[0].text;
  }
}
