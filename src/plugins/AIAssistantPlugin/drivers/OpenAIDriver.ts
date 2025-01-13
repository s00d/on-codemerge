import type { AIDriver, DriverOptions, OptionsDescription } from './AIDriver';

export interface OpenAIOptions extends DriverOptions {
  frequencyPenalty?: number; // Штраф за частоту
  presencePenalty?: number; // Штраф за присутствие
}

export class OpenAIDriver implements AIDriver<OpenAIOptions> {
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
          'gpt-4o',
          'gpt-4o-mini',
          'o1',
          'o1-mini',
          'gpt-3.5-turbo',
          'gpt-4',
          'gpt-4-turbo-preview',
          'gpt-4-32k',
          'gpt-4-vision-preview',
          'text-davinci-003',
          'text-curie-001',
          'text-babbage-001',
          'text-ada-001',
          'code-davinci-002',
          'code-cushman-001',
        ],
        default: 'gpt-3.5-turbo',
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
      topP: {
        type: 'number',
        label: 'Top P',
        default: 1.0,
      },
      frequencyPenalty: {
        type: 'number',
        label: 'Frequency Penalty',
        default: 0.0,
      },
      presencePenalty: {
        type: 'number',
        label: 'Presence Penalty',
        default: 0.0,
      },
    };
  }

  async generateText(prompt: string, options?: OpenAIOptions): Promise<string> {
    const response = await fetch('https://api.openai.com/v1/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: options?.model || 'gpt-3.5-turbo',
        prompt: prompt,
        max_tokens: options?.maxTokens || 100,
        temperature: options?.temperature || 0.7,
        top_p: options?.topP || 1.0,
        frequency_penalty: options?.frequencyPenalty || 0.0,
        presence_penalty: options?.presencePenalty || 0.0,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate text with OpenAI');
    }

    const data = await response.json();
    return data.choices[0].text;
  }
}
