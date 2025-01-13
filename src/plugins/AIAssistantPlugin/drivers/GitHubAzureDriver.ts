import type { AIDriver, DriverOptions, OptionsDescription } from './AIDriver';

export interface GitHubAzureOptions extends DriverOptions {
  maxTokens?: number; // Максимальное количество токенов
  topP?: number; // Top-p sampling (контроль разнообразия)
}

export class GitHubAzureDriver implements AIDriver<GitHubAzureOptions> {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  // Описание параметров для GitHub Azure
  getOptionsDescription(): OptionsDescription {
    return {
      model: {
        type: 'list',
        label: 'Model',
        options: [
          'gpt-4o',
          'gpt-4o-mini',
          'Llama-3.2-90B-Vision-Instruct',
          'Ministral-3B',
          'Phi-3.5-MoE-instruct-128k',
          'Phi-3.5-mini-instruct-128k',
          'Phi-3.5-vision-instruct-128k',
          'Phi-3-medium-instruct-128k',
          'Phi-3-medium-instruct-4k',
          'Phi-3-mini-instruct-128k',
          'Phi-3-mini-instruct-4k',
          'Phi-3-small-instruct-128k',
          'Phi-3-small-instruct-8k',
          'AI21-Jamba-1.5-Large',
          'AI21-Jamba-1.5-Mini',
          'Cohere-Command-R',
          'Cohere-Command-R-08-2024',
          'Cohere-Command-R+',
          'Cohere-Command-R+-08-2024',
          'Llama-3.2-11B-Vision-Instruct',
          'Llama-3.2-90B-Vision-Instruct',
          'Llama-3.3-70B-Instruct',
          'Meta-Llama-3.1-405B-Instruct',
          'Meta-Llama-3.1-70B-Instruct',
          'Meta-Llama-3.1-8B-Instruct',
          'Meta-Llama-3-70B-Instruct',
          'Meta-Llama-3-8B-Instruct',
          'Ministral-3B',
          'Mistral-Large-24.11',
          'Mistral-Nemo',
          'Mistral-Large',
          'Mistral-Large-2407',
          'Mistral-Small',
          'JAIS-30b-Chat',
        ],
        default: 'gpt-4o',
      },
      temperature: {
        type: 'number',
        label: 'Temperature',
        default: 1.0,
      },
      maxTokens: {
        type: 'number',
        label: 'Max Tokens',
        default: 4096,
      },
      topP: {
        type: 'number',
        label: 'Top P',
        default: 1.0,
      },
    };
  }

  async generateText(prompt: string, options?: GitHubAzureOptions): Promise<string> {
    const response = await fetch('https://models.inference.ai.azure.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        model: options?.model || 'gpt-4o',
        temperature: options?.temperature || 1.0,
        max_tokens: options?.maxTokens || 4096,
        top_p: options?.topP || 1.0,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate text with GitHub Azure');
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }
}
