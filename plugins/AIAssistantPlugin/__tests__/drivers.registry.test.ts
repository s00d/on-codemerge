import { describe, expect, it } from 'vitest';
import { createDrivers, getDriver } from '../drivers/registry';

describe('AIAssistant createDrivers registry', () => {
  it('builds all named drivers', () => {
    expect.hasAssertions();
    const drivers = createDrivers('test-key');
    expect(Object.keys(drivers).toSorted()).toStrictEqual(
      ['deepseek', 'github', 'huggingface', 'llama', 'mistral', 'ollama', 'openai'].toSorted()
    );
    expect(getDriver(drivers, 'openai')).toBe(drivers.openai);
    expect(getDriver(drivers, 'missing')).toBeUndefined();
  });
});
