import { definePlugin, pluginToolbarPlacement } from '@codemerge/sdk';
import type { EditorAPI, PluginToolbarOpts } from '@codemerge/sdk';

import type { DocNode, Operation } from '@codemerge/kernel';
import { plainText, textLength } from '@codemerge/kernel';
import { createDictionary } from '@codemerge/hunspell';
import type { HunspellDictionary } from '@codemerge/hunspell';
import { spellCheckIcon } from '@codemerge/sdk/icons';

const WORD_RE = /[A-Za-zА-Яа-яЁё'\u2019]{2,}/g;

/** Map typographic apostrophe to ASCII so Hunspell stems match. */
export function normalizeSpellText(text: string): string {
  return text.replaceAll('\u2019', "'");
}

/** Strip edge apostrophes; skip digits / tiny tokens (plugin + tests). */
export function isMisspelledWord(spellChecker: HunspellDictionary | null, word: string): boolean {
  if (!spellChecker) {
    return false;
  }
  let clean = normalizeSpellText(word).replaceAll(/^'+|'+$/g, '');
  if (clean.length < 2) {
    return false;
  }
  if (/^\d+$/.test(clean)) {
    return false;
  }
  return !spellChecker.check(clean);
}

/** Hunspell dictionary file URLs for one locale (`.aff` + `.dic`). */
export type SpellDictionaryFiles = {
  aff: string;
  dic: string;
};

export type SpellCheckerOptions = PluginToolbarOpts & {
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
  const { menu, group, order, dictionaries: dictIn, defaultLocale: localeIn } = options;
  const toolbarOpts: PluginToolbarOpts = {
    ...(menu !== undefined ? { menu } : {}),
    ...(group !== undefined ? { group } : {}),
    ...(order !== undefined ? { order } : {}),
  };
  const dictionaries = dictIn ?? {};
  const defaultLocale = localeBase(localeIn ?? 'en');
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
      let spellChecker: HunspellDictionary | null = null;
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
          spellChecker = createDictionary(affData, wordsData);
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

      const isMisspelled = (word: string): boolean => isMisspelledWord(spellChecker, word);

      const paintMisspelledOps = (doc: DocNode): Operation[] => {
        const ops: Operation[] = [...clearMisspelledOps(doc)];
        eachTextBlock(doc, [], (path, block) => {
          // Length-preserving: U+2019 → U+0027 so WORD_RE keeps contraction tokens.
          const text = normalizeSpellText(plainText(block));
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

      ctx.scope.disposable(
        editor.onLocaleChange(() => {
          if (!enabled) {
            return;
          }
          ctx.defer(async () => {
            const locale = resolveSpellLocale(
              editor.getLocale() || defaultLocale,
              dictionaries,
              defaultLocale
            );
            if (loadedLocale === locale) {
              return;
            }
            await loadDictionary(locale);
            if (!spellChecker) {
              enabled = false;
              editor.toolbar.refresh();
              return;
            }
            lastPlain = '';
            rescan();
          });
        })
      );

      ctx.toolbar.add({
        id: 'spell',
        icon: spellCheckIcon,
        title: () => editor.t('common.spellChecker'),
        ...pluginToolbarPlacement({ menu: 'tools', order: 73 }, toolbarOpts),
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
