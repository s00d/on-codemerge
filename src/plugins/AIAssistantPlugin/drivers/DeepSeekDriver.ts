import type { AIDriver, DriverOptions, OptionsDescription } from './AIDriver';

export class DeepSeekDriver implements AIDriver<DriverOptions> {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  // Описание параметров для DeepSeek
  getOptionsDescription(): OptionsDescription {
    return {
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
    };
  }

  async generateText(prompt: string, options?: DriverOptions): Promise<string> {
    const response = await fetch('https://api.deepseek.com/v1/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        prompt: prompt,
        max_tokens: options?.maxTokens || 100,
        temperature: options?.temperature || 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate text with DeepSeek');
    }

    const data = await response.json();
    return data.text;
  }
}
