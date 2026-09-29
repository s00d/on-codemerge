import { beforeAll, describe, expect, it } from 'vitest';
import { createDictionary } from '../index';
import type { HunspellDictionary } from '../index';
import { getDictionaryEn, readDictionaryEnRaw } from './fixtures/dictionaries';

const RUN = process.env.HUNSPELL_BENCH === '1';

/**
 * Opt-in A/B: eager (production) throughput on dictionary-en.
 * Run: HUNSPELL_BENCH=1 pnpm exec vitest run packages/hunspell/src/__tests__/parseDic.perf.test.ts
 */
describe.skipIf(!RUN)('parseDic eager vs stems-only bench', () => {
  let eager: HunspellDictionary;
  let raw: { aff: string; dic: string };

  beforeAll(() => {
    raw = readDictionaryEnRaw();
    eager = getDictionaryEn();
  });

  it('reports create + check throughput (eager)', () => {
    const warm: number[] = [];
    for (let i = 0; i < 4; i++) {
      const t0 = performance.now();
      createDictionary(raw.aff, raw.dic);
      warm.push(performance.now() - t0);
    }
    const createMs = warm.slice(1).reduce((a, b) => a + b, 0) / (warm.length - 1);

    const words = ['beautiful', 'cats', 'unhappy', '21st', 'zxqwy', 'Beautiful', "don't"];
    const t1 = performance.now();
    const N = 50_000;
    for (let i = 0; i < N; i++) {
      eager.check(words[i % words.length]!);
    }
    const checkMs = performance.now() - t1;
    const opsPerSec = Math.round(N / (checkMs / 1000));

    // eslint-disable-next-line no-console -- bench report
    console.log(
      JSON.stringify({
        mode: 'eager',
        createMsMedianish: Number(createMs.toFixed(2)),
        checkOpsPerSec: opsPerSec,
        checkMsPer50k: Number(checkMs.toFixed(2)),
      })
    );

    expect(createMs).toBeLessThan(2000);
    expect(opsPerSec).toBeGreaterThan(100_000);
  });

  it('suggest budget on dictionary-en', () => {
    const typos = ['beautifull', 'teh', 'recieve', 'seperate', 'occured'];
    const t0 = performance.now();
    for (const w of typos) {
      eager.suggest(w, 5);
    }
    const ms = performance.now() - t0;
    // eslint-disable-next-line no-console -- bench report
    console.log(
      JSON.stringify({ mode: 'eager-suggest', typos: typos.length, ms: Number(ms.toFixed(2)) })
    );
    expect(ms).toBeLessThan(2000);
  });
});

describe('dictionary-en perf smoke (always on)', () => {
  it('loads dictionary-en under 3s and checks fast', () => {
    const t0 = performance.now();
    const dict = getDictionaryEn();
    const loadMs = performance.now() - t0;
    expect(loadMs).toBeLessThan(3000);

    const t1 = performance.now();
    for (let i = 0; i < 10_000; i++) {
      dict.check('beautiful');
      dict.check('beautifull');
    }
    const checkMs = performance.now() - t1;
    expect(checkMs).toBeLessThan(2000);
  });

  it('suggests near-miss under 200ms warm', () => {
    const dict = getDictionaryEn();
    dict.suggest('beautifull', 5); // warm / memo
    const t0 = performance.now();
    const suggestions = dict.suggest('beautifull', 5);
    const ms = performance.now() - t0;
    expect(suggestions).toContain('beautiful');
    expect(ms).toBeLessThan(200);
  });
});
