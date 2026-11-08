import { afterEach, describe, expect, it, vi } from 'vitest';
import { createDrivers } from '../drivers/registry';

type Call = { url: string; body: Record<string, unknown> };

function stubFetch(payload: unknown): Call[] {
  const calls: Call[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn((url: string, init: RequestInit) => {
      calls.push({ url, body: JSON.parse(init.body as string) as Record<string, unknown> });
      return Promise.resolve(Response.json(payload));
    })
  );
  return calls;
}

describe('AI drivers use chat/completions shapes', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it.each(['openai', 'deepseek', 'huggingface', 'github', 'llama', 'mistral'] as const)(
    '%s posts messages to a chat/completions endpoint',
    async (name) => {
      const calls = stubFetch({ choices: [{ message: { content: 'ok' } }] });
      const driver = createDrivers('k')[name];
      await expect(driver.generateText('hi', { model: '' })).resolves.toBe('ok');
      expect(calls[0]?.url).toMatch(/\/chat\/completions$/);
      expect(calls[0]?.body['messages']).toStrictEqual([{ role: 'user', content: 'hi' }]);
      expect(calls[0]?.body['model']).toBeTruthy();
      expect(calls[0]?.body).not.toHaveProperty('prompt');
    }
  );

  it('ollama nests sampling params under options', async () => {
    const calls = stubFetch({ response: 'ok' });
    const out = await createDrivers().ollama.generateText('hi', { model: '', maxTokens: 7 });
    expect(out).toBe('ok');
    expect(calls[0]?.url).toBe('http://localhost:11434/api/generate');
    expect(calls[0]?.body).toMatchObject({ model: 'llama3.2', options: { num_predict: 7 } });
  });
});
