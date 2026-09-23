import type { AIDriver, DriverOptions, OptionsDescription } from './AIDriver';

// Типизация для ответа API Ollama (Generate Completion)
interface GenerateCompletionResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
  context?: number[];
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
  done_reason?: string;
}

// Типизация для параметров Ollama
export interface OllamaOptions extends DriverOptions {
  apiUrl?: string;
  frequencyPenalty?: number;
  presencePenalty?: number;
  min?: number;
  max?: number;
  stream?: boolean;
}

export class OllamaDriver implements AIDriver<OllamaOptions> {
  getOptionsDescription(): OptionsDescription {
    return {
      model: {
        type: 'input',
        label: 'Model',
        default: 'llama2',
      },
      apiUrl: {
        type: 'input',
        label: 'Api Url',
        default: 'http://localhost:11434',
      },
      maxTokens: {
        type: 'number',
        label: 'Max Tokens',
        default: 100,
        min: 1,
        max: 2048,
      },
      temperature: {
        type: 'number',
        label: 'Temperature',
        default: 0.7,
        min: 0,
        max: 2,
      },
      topP: {
        type: 'number',
        label: 'Top P',
        default: 1,
        min: 0,
        max: 1,
      },
      frequencyPenalty: {
        type: 'number',
        label: 'Frequency Penalty',
        default: 0,
        min: 0,
        max: 2,
      },
      presencePenalty: {
        type: 'number',
        label: 'Presence Penalty',
        default: 0,
        min: 0,
        max: 2,
      },
    };
  }

  /**
   * Генерация текста с использованием API Ollama.
   * Поддерживает потоковые и не потоковые ответы.
   */
  async generateText(prompt: string, options?: OllamaOptions): Promise<string> {
    const baseUrl = options?.apiUrl || 'http://localhost:11434';
    const requestBody = {
      model: options?.model || 'llama2',
      prompt,
      max_tokens: options?.maxTokens ?? 100,
      temperature: options?.temperature ?? 0.7,
      top_p: options?.topP ?? 1,
      frequency_penalty: options?.frequencyPenalty ?? 0,
      presence_penalty: options?.presencePenalty ?? 0,
      stream: options?.stream ?? false,
    };

    const response = await fetch(`${baseUrl}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error('Failed to generate text with Ollama');
    }

    if (requestBody.stream) {
      // Обработка потокового ответа
      const reader = response.body?.getReader();
      let result = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            break;
          }

          const chunk = new TextDecoder().decode(value);
          const parsedChunk = JSON.parse(chunk) as GenerateCompletionResponse;
          result += parsedChunk.response;
        }
      }

      return result;
    }
    // Обработка не потокового ответа
    const data = (await response.json()) as GenerateCompletionResponse;
    return data.response;
  }
}
