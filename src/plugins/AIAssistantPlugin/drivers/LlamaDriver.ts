import type { AIDriver, DriverOptions, OptionsDescription } from './AIDriver';

export interface LlamaOptions extends DriverOptions {
  topK?: number; // Top-k sampling
  repetitionPenalty?: number; // Штраф за повторения
}

export class LlamaDriver implements AIDriver<LlamaOptions> {
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

  async generateText(prompt: string, options?: LlamaOptions): Promise<string> {
    const response = await fetch('https://api.llama.ai/v1/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: options?.model || 'llama-3.2-90b-vision-instruct',
        prompt: prompt,
        max_tokens: options?.maxTokens || 100,
        temperature: options?.temperature || 0.7,
        top_k: options?.topK || 50,
        repetition_penalty: options?.repetitionPenalty || 1.0,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate text with Llama');
    }

    const data = await response.json();
    return data.choices[0].text;
  }
}
