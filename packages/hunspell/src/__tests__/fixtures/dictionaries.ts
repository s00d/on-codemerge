import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createDictionary } from '../../index';
import type { HunspellDictionary } from '../../index';

const here = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

let miniCache: HunspellDictionary | undefined;
let enCache: HunspellDictionary | undefined;

export function loadMini(): HunspellDictionary {
  if (miniCache) {
    return miniCache;
  }
  const aff = readFileSync(resolve(here, 'mini.aff'), 'utf8');
  const dic = readFileSync(resolve(here, 'mini.dic'), 'utf8');
  miniCache = createDictionary(aff, dic);
  return miniCache;
}

export function loadCyrillic(): HunspellDictionary {
  const aff = readFileSync(resolve(here, 'cyrillic.aff'), 'utf8');
  const dic = readFileSync(resolve(here, 'cyrillic.dic'), 'utf8');
  return createDictionary(aff, dic);
}

/** Parse real `dictionary-en` once per worker (shared across integration + perf). */
export function getDictionaryEn(): HunspellDictionary {
  if (enCache) {
    return enCache;
  }
  const indexJs = require.resolve('dictionary-en');
  const root = dirname(indexJs);
  const aff = readFileSync(resolve(root, 'index.aff'), 'utf8');
  const dic = readFileSync(resolve(root, 'index.dic'), 'utf8');
  enCache = createDictionary(aff, dic);
  return enCache;
}

export function readDictionaryEnRaw(): { aff: string; dic: string } {
  const indexJs = require.resolve('dictionary-en');
  const root = dirname(indexJs);
  return {
    aff: readFileSync(resolve(root, 'index.aff'), 'utf8'),
    dic: readFileSync(resolve(root, 'index.dic'), 'utf8'),
  };
}
