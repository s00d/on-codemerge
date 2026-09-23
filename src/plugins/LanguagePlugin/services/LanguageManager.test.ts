import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { LanguageManager } from './LanguageManager';
import type { EditorAPI } from '@on-codemerge/sdk';

function mockEditor(overrides: Partial<EditorAPI> = {}): EditorAPI {
  let locale = 'en';
  return {
    getLocale: () => locale,
    listLocales: () => ['en', 'ru', 'de'],
    setLocale: vi.fn((code: string) => {
      locale = code;
    }),
    registerLocale: vi.fn(),
    registerLocaleLoader: vi.fn(),
    t: (k: string) => k,
    tc: (k: string) => k,
    onLocaleChange: () => () => {},
    ...overrides,
  } as unknown as EditorAPI;
}

describe('languageManager', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('restores saved locale via editor.setLocale', async () => {
    expect.hasAssertions();
    const editor = mockEditor();
    const manager = new LanguageManager();
    manager.initialize(editor);
    expect(manager.getLocales()).toStrictEqual(['en', 'ru', 'de']);
    localStorage.setItem('editor-language', 'ru');
    await manager.restoreSavedLocale();
    expect(editor.setLocale).toHaveBeenCalledWith('ru');
  });

  it('setLocale persists choice', async () => {
    expect.hasAssertions();
    const editor = mockEditor();
    const manager = new LanguageManager();
    manager.initialize(editor);
    await manager.setLocale('de');
    expect(editor.setLocale).toHaveBeenCalledWith('de');
    expect(localStorage.getItem('editor-language')).toBe('de');
  });
});
