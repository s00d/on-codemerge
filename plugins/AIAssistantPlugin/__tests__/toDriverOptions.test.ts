import { describe, expect, it } from 'vitest';
import { toDriverOptions } from '../index';

describe('AIAssistant toDriverOptions', () => {
  it('keeps driver-specific scalar options (e.g. Ollama apiUrl)', () => {
    expect.hasAssertions();
    expect(
      toDriverOptions({ model: 'llama2', apiUrl: 'http://h:1', topK: 5, junk: { a: 1 } })
    ).toStrictEqual({ model: 'llama2', apiUrl: 'http://h:1', topK: 5 });
  });
});
