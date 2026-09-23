import type { AIDriver, DriverOptions, OptionsDescription } from './AIDriver';

type ChoicePayload = {
  choices?: { text?: string; message?: { content?: string } }[];
  text?: string;
};

/** Shared parse for OpenAI-style completions / chat responses. */
export function readAiChoiceText(data: unknown): string {
  if (data === null || data === undefined || typeof data !== 'object') {
    throw new Error('Invalid AI response');
  }
  const payload = data as ChoicePayload;
  if (typeof payload.text === 'string') {
    return payload.text;
  }
  const choice = payload.choices?.[0];
  const text = choice?.text ?? choice?.message?.content;
  if (typeof text !== 'string') {
    throw new TypeError('Invalid AI response');
  }
  return text;
}

export type CompletionsDriverConfig<O extends DriverOptions = DriverOptions> = {
  label: string;
  url: string;
  description: OptionsDescription;
  buildBody: (prompt: string, options?: O) => Record<string, unknown>;
};

/** Bearer-auth POST to a prompt/completions endpoint. */
export class BearerCompletionsDriver<
  O extends DriverOptions = DriverOptions,
> implements AIDriver<O> {
  constructor(
    private readonly apiKey: string,
    private readonly config: CompletionsDriverConfig<O>
  ) {}

  getOptionsDescription(): OptionsDescription {
    return this.config.description;
  }

  async generateText(prompt: string, options?: O): Promise<string> {
    const response = await fetch(this.config.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(this.config.buildBody(prompt, options)),
    });

    if (!response.ok) {
      throw new Error(`Failed to generate text with ${this.config.label}`);
    }

    return readAiChoiceText(await response.json());
  }
}
