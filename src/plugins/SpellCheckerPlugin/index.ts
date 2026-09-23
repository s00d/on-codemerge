import './style.scss';

import { definePlugin } from '@on-codemerge/sdk';
import type { EditorAPI } from '@on-codemerge/sdk';
import type { DocNode, Operation } from '@on-codemerge/kernel';
import { plainText, textLength } from '@on-codemerge/kernel';
import Typo from 'typo-js';
import { spellCheckIcon } from '../../icons';

const WORD_RE = /[A-Za-zА-Яа-яЁё']{2,}/g;

/** Hunspell dictionary file URLs for one locale (`.aff` + `.dic`). */
export type SpellDictionaryFiles = {
  aff: string;
  dic: string;
};

export type SpellCheckerOptions = {
  /**
   * Locale → Hunspell file URLs. Required — dictionaries are not bundled.
   * Example (Vite): `new URL('../node_modules/dictionary-en/index.aff', import.meta.url).href`
   * (package `exports` only exposes Node `index.js` — deep `?url` imports of `.aff`/`.dic` fail).
   */
  dictionaries: Record<string, SpellDictionaryFiles>;
  /** Used when `editor.getLocale()` has no matching entry (default: `'en'`). */
  defaultLocale?: string;
};

function localeBase(locale: string): string {
  const part = (locale || 'en').split(/[_-]/)[0];
  return (part || 'en').toLowerCase();
}

function eachTextBlock(
  node: DocNode,
  path: number[],
  visit: (path: number[], block: DocNode) => void
): void {
  if (node.type === 'codeBlock' || node.type === 'code_block') {
    return;
  }
  // Leaf text carriers only — avoid double-visiting blockquote + inner paragraphs.
  if (node.type === 'paragraph' || node.type === 'heading' || node.type === 'listItem') {
    visit(path, node);
    return;
  }
  (node.content ?? []).forEach((child, i) => {
    eachTextBlock(child, [...path, i], visit);
  });
}

function docPlainFingerprint(doc: DocNode): string {
  const parts: string[] = [];
  eachTextBlock(doc, [], (_path, block) => {
    parts.push(plainText(block));
  });
  return parts.join('\n');
}

function clearMisspelledOps(doc: DocNode): Operation[] {
  const ops: Operation[] = [];
  eachTextBlock(doc, [], (path, block) => {
    const len = textLength(block);
    if (len > 0) {
      ops.push({ type: 'remove_mark', path, from: 0, to: len, markType: 'misspelled' });
    }
  });
  return ops;
}

function resolveSpellLocale(
  locale: string,
  dictionaries: Record<string, SpellDictionaryFiles>,
  defaultLocale: string
): string {
  const base = localeBase(locale);
  if (Object.hasOwn(dictionaries, base)) {
    return base;
  }
  if (Object.hasOwn(dictionaries, defaultLocale)) {
    return defaultLocale;
  }
  return Object.keys(dictionaries)[0] ?? base;
}

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch dictionary: ${url} (${res.status})`);
  }
  return res.text();
}

export function SpellCheckerPlugin(options: SpellCheckerOptions) {
  const dictionaries = options.dictionaries ?? {};
  const defaultLocale = localeBase(options.defaultLocale ?? 'en');
  let toggle: (() => void) | null = null;

  return definePlugin({
    name: 'spell-checker',
    marks: [{ name: 'misspelled', attrs: {} }],
    hotkeys: [
      { keys: 'Mod-Shift-s', command: 'toggleSpellCheck', description: 'Toggle spell check' },
    ],
    commands: {
      toggleSpellCheck: () => {
        toggle?.();
        return null;
      },
    },
    setup(ctx) {
      const editor = ctx.editor;
      let enabled = false;
      let spellChecker: Typo | null = null;
      let loadedLocale = '';
      let lastPlain = '';
      let applying = false;
      let debounceTimer: ReturnType<typeof setTimeout> | null = null;

      const loadDictionary = async (locale: string) => {
        const base = resolveSpellLocale(locale, dictionaries, defaultLocale);
        const files = dictionaries[base];
        try {
          // oxlint-disable-next-line typescript/strict-boolean-expressions -- missing entry guard
          if (!files?.aff || !files?.dic) {
            throw new Error(`Dictionary not configured for locale: ${base}`);
          }
          const [affData, wordsData] = await Promise.all([
            fetchText(files.aff),
            fetchText(files.dic),
          ]);
          spellChecker = new Typo(base, affData, wordsData);
          loadedLocale = base;
        } catch (error) {
          console.error('Failed to load dictionary:', error);
          spellChecker = null;
          loadedLocale = '';
          editor.notify(
            editor.t('common.spellCheckerDictionaryUnavailable') || 'Dictionary unavailable'
          );
        }
      };

      const isMisspelled = (word: string): boolean => {
        if (!spellChecker) {
          return false;
        }
        const clean = word.replaceAll(/^'+|'+$/g, '');
        if (clean.length < 2) {
          return false;
        }
        if (/^\d+$/.test(clean)) {
          return false;
        }
        return !spellChecker.check(clean);
      };

      const paintMisspelledOps = (doc: DocNode): Operation[] => {
        const ops: Operation[] = [...clearMisspelledOps(doc)];
        eachTextBlock(doc, [], (path, block) => {
          const text = plainText(block);
          WORD_RE.lastIndex = 0;
          let match: RegExpExecArray | null;
          while ((match = WORD_RE.exec(text))) {
            const word = match[0];
            const from = match.index;
            const to = from + word.length;
            if (isMisspelled(word)) {
              ops.push({
                type: 'set_mark',
                path,
                from,
                to,
                mark: { type: 'misspelled' },
              });
            }
          }
        });
        return ops;
      };

      const rescan = () => {
        if (!enabled || !spellChecker || applying) {
          return;
        }
        const doc = editor.getJSON().doc;
        const plain = docPlainFingerprint(doc);
        const ops = paintMisspelledOps(doc);
        // Always clear+repaint when enabled so toggles refresh; skip no-op empty clears on empty doc.
        if (ops.length === 0) {
          lastPlain = plain;
          return;
        }
        applying = true;
        lastPlain = plain;
        editor.run(() => ops);
        applying = false;
      };

      const scheduleRescan = () => {
        if (!enabled) {
          return;
        }
        if (debounceTimer) {
          clearTimeout(debounceTimer);
        }
        debounceTimer = setTimeout(() => {
          debounceTimer = null;
          rescan();
        }, 280);
      };

      const clearAllMarks = (api: EditorAPI) => {
        const doc = api.getJSON().doc;
        const ops = clearMisspelledOps(doc);
        if (ops.length === 0) {
          return;
        }
        applying = true;
        api.run(() => ops);
        applying = false;
      };

      const setEnabled = (on: boolean) => {
        enabled = on;
        editor.toolbar.refresh();
        if (!on) {
          if (debounceTimer) {
            clearTimeout(debounceTimer);
            debounceTimer = null;
          }
          clearAllMarks(editor);
          lastPlain = '';
          return;
        }
        ctx.defer(async () => {
          const locale = resolveSpellLocale(
            editor.getLocale() || defaultLocale,
            dictionaries,
            defaultLocale
          );
          if (!spellChecker || loadedLocale !== locale) {
            await loadDictionary(locale);
          }
          if (!spellChecker) {
            enabled = false;
            editor.toolbar.refresh();
            return;
          }
          lastPlain = '';
          rescan();
        });
      };

      toggle = () => {
        setEnabled(!enabled);
      };

      ctx.on('docChanged', () => {
        if (!enabled || applying) {
          return;
        }
        const plain = docPlainFingerprint(editor.getJSON().doc);
        if (plain === lastPlain) {
          return;
        }
        scheduleRescan();
      });

      ctx.toolbar.add({
        id: 'spell',
        icon: spellCheckIcon,
        title: editor.t('common.spellChecker'),
        menu: 'tools',
        order: 73,
        active: () => enabled,
        onClick: () => toggle?.(),
      });

      ctx.scope.disposable(() => {
        if (debounceTimer) {
          clearTimeout(debounceTimer);
        }
        if (enabled) {
          enabled = false;
          clearAllMarks(editor);
        }
      });
    },
  });
}
