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
  apiUrl?: number; // Штраф за частоту
  frequencyPenalty?: number; // Штраф за частоту
  presencePenalty?: number; // Штраф за присутствие
  min?: number; // Минимальное значение для параметров
  max?: number; // Максимальное значение для параметров
  stream?: boolean; // Включение потокового ответа
}

export class OllamaDriver implements AIDriver<OllamaOptions> {
  // private apiKey: string;

  constructor(_apiKey: string) {
    // this.apiKey = apiKey;
  }

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
        default: '',
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
        min: 0.0,
        max: 2.0,
      },
      topP: {
        type: 'number',
        label: 'Top P',
        default: 1.0,
        min: 0.0,
        max: 1.0,
      },
      frequencyPenalty: {
        type: 'number',
        label: 'Frequency Penalty',
        default: 0.0,
        min: 0.0,
        max: 2.0,
      },
      presencePenalty: {
        type: 'number',
        label: 'Presence Penalty',
        default: 0.0,
        min: 0.0,
        max: 2.0,
      },
    };
  }

  /**
   * Генерация текста с использованием API Ollama.
   * Поддерживает потоковые и не потоковые ответы.
   */
  async generateText(prompt: string, options?: OllamaOptions): Promise<string> {
    const requestBody = {
      model: options?.model || '',
      prompt: prompt,
      max_tokens: options?.maxTokens || 100,
      temperature: options?.temperature || 0.7,
      top_p: options?.topP || 1.0,
      frequency_penalty: options?.frequencyPenalty || 0.0,
      presence_penalty: options?.presencePenalty || 0.0,
      stream: options?.stream || false, // По умолчанию отключаем потоковый ответ
    };

    const response = await fetch(`${options?.apiUrl}/api/generate`, {
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
          if (done) break;

          const chunk = new TextDecoder().decode(value);
          const parsedChunk: GenerateCompletionResponse = JSON.parse(chunk);
          result += parsedChunk.response;
        }
      }

      return result;
    } else {
      // Обработка не потокового ответа
      const data: GenerateCompletionResponse = await response.json();
      return data.response;
    }
  }
}
