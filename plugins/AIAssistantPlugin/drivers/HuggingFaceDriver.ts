import { BearerCompletionsDriver } from './BearerCompletionsDriver';

/** HF Inference Providers router, OpenAI-compatible (api-inference.huggingface.co is retired). */
export class HuggingFaceDriver extends BearerCompletionsDriver {
  constructor(apiKey: string) {
    super(apiKey, {
      label: 'Hugging Face',
      url: 'https://router.huggingface.co/v1/chat/completions',
      description: {
        model: {
          type: 'list',
          label: 'Model',
          options: [
            'meta-llama/Llama-3.1-8B-Instruct',
            'meta-llama/Llama-3.3-70B-Instruct',
            'Qwen/Qwen2.5-7B-Instruct',
            'Qwen/Qwen2.5-Coder-32B-Instruct',
            'mistralai/Mistral-7B-Instruct-v0.3',
            'google/gemma-2-9b-it',
            'deepseek-ai/DeepSeek-V3',
          ],
          default: 'meta-llama/Llama-3.1-8B-Instruct',
        },
        maxTokens: { type: 'number', label: 'Max Tokens', default: 100 },
        temperature: { type: 'number', label: 'Temperature', default: 0.7 },
        topP: { type: 'number', label: 'Top P', default: 1 },
      },
      buildBody: (prompt, options) => ({
        model: options?.model || 'meta-llama/Llama-3.1-8B-Instruct',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: options?.maxTokens ?? 100,
        temperature: options?.temperature ?? 0.7,
        top_p: options?.topP ?? 1,
      }),
    });
  }
}
