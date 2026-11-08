import { BearerCompletionsDriver } from './BearerCompletionsDriver';

/** GitHub Models (models.inference.ai.azure.com is retired; ids are `publisher/model`). */
export class GitHubAzureDriver extends BearerCompletionsDriver {
  constructor(apiKey: string) {
    super(apiKey, {
      label: 'GitHub Models',
      url: 'https://models.github.ai/inference/chat/completions',
      description: {
        model: {
          type: 'list',
          label: 'Model',
          options: [
            'openai/gpt-4.1',
            'openai/gpt-4.1-mini',
            'openai/gpt-4o',
            'openai/gpt-4o-mini',
            'meta/Llama-3.3-70B-Instruct',
            'microsoft/Phi-4',
            'deepseek/DeepSeek-V3-0324',
            'mistral-ai/Mistral-Large-2411',
          ],
          default: 'openai/gpt-4o-mini',
        },
        temperature: { type: 'number', label: 'Temperature', default: 1 },
        maxTokens: { type: 'number', label: 'Max Tokens', default: 4096 },
        topP: { type: 'number', label: 'Top P', default: 1 },
      },
      buildBody: (prompt, options) => ({
        messages: [{ role: 'user', content: prompt }],
        model: options?.model || 'openai/gpt-4o-mini',
        temperature: options?.temperature ?? 1,
        max_tokens: options?.maxTokens ?? 4096,
        top_p: options?.topP ?? 1,
      }),
    });
  }
}
