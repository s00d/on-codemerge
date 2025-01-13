import type { AIDriver, DriverOptions, OptionsDescription } from './AIDriver';

export interface HuggingFaceOptions extends DriverOptions {
  topK?: number; // Top-k sampling
  repetitionPenalty?: number; // Штраф за повторения
  maxLength?: number; // Штраф за повторения
}

export class HuggingFaceDriver implements AIDriver<HuggingFaceOptions> {
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
          'gpt2',
          'gpt-neo-125M',
          'gpt-neo-1.3B',
          'gpt-neo-2.7B',
          'gpt-j-6B',
          'EleutherAI/gpt-neox-20b',
          'bigscience/bloom-560m',
          'bigscience/bloom-1b7',
          'bigscience/bloom-3b',
          'bigscience/bloom-7b1',
          'bigscience/bloom',
          't5-small',
          't5-base',
          't5-large',
          't5-3b',
          't5-11b',
          'facebook/bart-base',
          'facebook/bart-large',
          'facebook/bart-large-cnn',
          'google/pegasus-xsum',
          'google/pegasus-large',
        ],
        default: 'gpt2',
      },
      maxLength: {
        type: 'number',
        label: 'Max Length',
        default: 100,
      },
      temperature: {
        type: 'number',
        label: 'Temperature',
        default: 0.7,
      },
      topP: {
        type: 'number',
        label: 'Top P',
        default: 1.0,
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

  async generateText(prompt: string, options?: HuggingFaceOptions): Promise<string> {
    const response = await fetch(
      `https://api-inference.huggingface.co/models/${options?.model || 'gpt2'}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_length: options?.maxLength || 100,
            temperature: options?.temperature || 0.7,
            top_p: options?.topP || 1.0,
            top_k: options?.topK || 50,
            repetition_penalty: options?.repetitionPenalty || 1.0,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to generate text with Hugging Face');
    }

    const data = await response.json();
    return data[0].generated_text;
  }
}
