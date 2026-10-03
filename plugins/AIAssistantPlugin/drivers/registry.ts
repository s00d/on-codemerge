import type { AIDriver, DriverOptions } from './AIDriver';
import { DeepSeekDriver } from './DeepSeekDriver';
import { GitHubAzureDriver } from './GitHubAzureDriver';
import { HuggingFaceDriver } from './HuggingFaceDriver';
import { LlamaDriver } from './LlamaDriver';
import { MistralDriver } from './MistralDriver';
import { OllamaDriver } from './OllamaDriver';
import { OpenAIDriver } from './OpenAIDriver';

export type AIDriverName =
  | 'openai'
  | 'deepseek'
  | 'huggingface'
  | 'github'
  | 'llama'
  | 'mistral'
  | 'ollama';

/** Provider map — rebuilt when the session opens (apiKey applied later via Reflect). */
export function createDrivers(apiKey = ''): Record<AIDriverName, AIDriver<DriverOptions>> {
  return {
    openai: new OpenAIDriver(apiKey),
    deepseek: new DeepSeekDriver(apiKey),
    huggingface: new HuggingFaceDriver(apiKey),
    github: new GitHubAzureDriver(apiKey),
    llama: new LlamaDriver(apiKey),
    mistral: new MistralDriver(apiKey),
    ollama: new OllamaDriver(),
  };
}

export function getDriver(
  drivers: Record<string, AIDriver<DriverOptions>>,
  name: string
): AIDriver<DriverOptions> | undefined {
  return drivers[name];
}
