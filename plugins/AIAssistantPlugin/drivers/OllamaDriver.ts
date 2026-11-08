import type { AIDriver, DriverOptions, OptionsDescription } from './AIDriver';

// Типизация для ответа API Ollama (Generate Completion)
function readOllamaResponse(value: unknown): string {
  if (value === null || typeof value !== 'object' || !('response' in value)) {
    throw new TypeError('Invalid Ollama response');
  }
  const response = Reflect.get(value, 'response');
  if (typeof response !== 'string') {
    throw new TypeError('Invalid Ollama response');
  }
  return response;
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
        default: 'llama3.2',
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
    const stream = options?.stream ?? false;
    // Sampling params live under `options` (top-level max_tokens/temperature are ignored).
    const requestBody = {
      model: options?.model || 'llama3.2',
      prompt,
      stream,
      options: {
        num_predict: options?.maxTokens ?? 100,
        temperature: options?.temperature ?? 0.7,
        top_p: options?.topP ?? 1,
        frequency_penalty: options?.frequencyPenalty ?? 0,
        presence_penalty: options?.presencePenalty ?? 0,
      },
    };

    const response = await fetch(`${baseUrl.replace(/\/$/, '')}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error('Failed to generate text with Ollama');
    }

    if (stream) {
      // NDJSON: a read() chunk may hold several lines or a partial one.
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let result = '';
      const take = (line: string) => {
        if (line.trim()) {
          result += readOllamaResponse(JSON.parse(line));
        }
      };

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            break;
          }
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';
          lines.forEach(take);
        }
        take(buffer + decoder.decode());
      }

      return result;
    }
    // Обработка не потокового ответа
    return readOllamaResponse(await response.json());
  }
}
