import type { DriverOptions } from './AIDriver';
import { BearerCompletionsDriver } from './BearerCompletionsDriver';

export interface GitHubAzureOptions extends DriverOptions {
  maxTokens?: number;
  topP?: number;
}

export class GitHubAzureDriver extends BearerCompletionsDriver<GitHubAzureOptions> {
  constructor(apiKey: string) {
    super(apiKey, {
      label: 'GitHub Azure',
      url: 'https://models.inference.ai.azure.com/chat/completions',
      description: {
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
        temperature: { type: 'number', label: 'Temperature', default: 1 },
        maxTokens: { type: 'number', label: 'Max Tokens', default: 4096 },
        topP: { type: 'number', label: 'Top P', default: 1 },
      },
      buildBody: (prompt, options) => ({
        messages: [{ role: 'user', content: prompt }],
        model: options?.model ?? 'gpt-4o',
        temperature: options?.temperature ?? 1,
        max_tokens: options?.maxTokens ?? 4096,
        top_p: options?.topP ?? 1,
      }),
    });
  }
}
