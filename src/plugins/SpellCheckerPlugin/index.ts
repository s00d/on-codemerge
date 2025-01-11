import type { HTMLEditor } from '../../core/HTMLEditor';
import type { Plugin } from '../../core/Plugin';
import { createToolbarButton } from '../ToolbarPlugin/utils';
import { spellCheckIcon } from '../../icons';
import type { SpellcheckerWasm } from 'spellchecker-wasm/lib/browser';
import wasmUrl from 'spellchecker-wasm/lib/spellchecker-wasm.wasm?url';

const dictionaries = import.meta.glob('./dictionaries/**/*', {
  query: '?url',
  import: 'default',
});

export class SpellCheckerPlugin implements Plugin {
  name = 'spellchecker';
  hotkeys = [
    { keys: 'Ctrl+Shift+L', description: 'Run spell checker', command: 'spellchecker', icon: '🔍✅' }
  ];
  private editor: HTMLEditor | null = null;
  private toolbarButton: HTMLElement | null = null;
  private isSpellCheckEnabled: boolean = false;
  private spellChecker: SpellcheckerWasm | null = null;
  private misspelledWords: Map<Text, Range> = new Map();
  private lastResults: any[] = [];

  constructor() {}

  async initialize(editor: HTMLEditor): Promise<void> {
    this.editor = editor;
    this.addToolbarButton();
    this.enableSpellCheck(this.isSpellCheckEnabled);

    this.editor.on('spellchecker', async () => {
      this.isSpellCheckEnabled = !this.isSpellCheckEnabled;
      if (this.isSpellCheckEnabled) await this.loadDictionary(this.editor?.getLocale() ?? 'en');
      this.enableSpellCheck(this.isSpellCheckEnabled);
      this.toolbarButton?.classList.toggle('active', this.isSpellCheckEnabled);
    });
  }

  private async loadDictionary(locale: string): Promise<void> {
    try {
      // Загружаем WASM-модуль и словари
      const wasm = await fetch(wasmUrl);

      // Получаем функции, которые возвращают URL-адреса
      const dicUrlFn = dictionaries[`./dictionaries/${locale}.txt`];

      if (!dicUrlFn) {
        throw new Error(`Dictionary files for locale ${locale} not found`);
      }

      // Вызываем функции и получаем URL-адреса
      const dicUrl = (await dicUrlFn()) as string;

      // Загружаем файлы
      const dicResponse = await fetch(dicUrl);

      if (!wasm.ok || !dicResponse.ok) {
        throw new Error('Failed to load dictionary files');
      }

      const { SpellcheckerWasm } = await import('spellchecker-wasm/lib/browser');

      // Инициализация SpellcheckerWasm
      this.spellChecker = new SpellcheckerWasm((results) => {
        this.lastResults = results;
      });

      // Подготовка spellchecker с загруженными словарями
      await this.spellChecker.prepareSpellchecker(wasm, dicResponse);
    } catch (error) {
      console.error('Failed to load dictionary:', error);
      this.spellChecker = null;
    }
  }

  private addToolbarButton(): void {
    const toolbar = document.querySelector('.editor-toolbar');
    if (!toolbar) return;

    this.toolbarButton = createToolbarButton({
      icon: spellCheckIcon,
      title: this.editor?.t('Spell Check'),
      onClick: async () => {
        this.isSpellCheckEnabled = !this.isSpellCheckEnabled;
        if (this.isSpellCheckEnabled) await this.loadDictionary(this.editor?.getLocale() ?? 'en');
        this.enableSpellCheck(this.isSpellCheckEnabled);
        this.toolbarButton?.classList.toggle('active', this.isSpellCheckEnabled);
      },
    });

    toolbar.appendChild(this.toolbarButton);
  }

  private enableSpellCheck(enabled: boolean): void {
    const editorContainer = this.editor?.getContainer();
    if (editorContainer) {
      if (enabled) {
        this.addSpellCheckListeners();
        this.checkAllText();
      } else {
        this.removeSpellCheckListeners();
        this.clearHighlights();
      }
    }
  }

  private addSpellCheckListeners(): void {
    const editorContainer = this.editor?.getContainer();
    if (editorContainer) {
      editorContainer.addEventListener('input', this.handleInput.bind(this));
      editorContainer.addEventListener('mouseup', this.handleMouseUp.bind(this));
      editorContainer.addEventListener('contextmenu', this.handleContextMenu.bind(this));
    }
  }

  private removeSpellCheckListeners(): void {
    const editorContainer = this.editor?.getContainer();
    if (editorContainer) {
      editorContainer.removeEventListener('input', this.handleInput.bind(this));
      editorContainer.removeEventListener('mouseup', this.handleMouseUp.bind(this));
      editorContainer.removeEventListener('contextmenu', this.handleContextMenu.bind(this));
    }
  }

  private handleInput(_event: Event): void {
    this.checkAllText();
  }

  private handleMouseUp(_event: MouseEvent): void {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const selectedText = range.toString();

      if (selectedText) {
        this.checkSpelling(range);
      }
    }
  }

  private handleContextMenu(event: MouseEvent): void {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const selectedText = range.toString();

      if (selectedText && this.isMisspelled(selectedText)) {
        event.preventDefault();
        const suggestions = this.getSpellingSuggestions(selectedText);
        if (suggestions.length > 0) {
          this.showContextMenu(event, suggestions, range);
        }
      }
    }
  }

  private checkAllText(): void {
    const editorContainer = this.editor?.getContainer();
    if (!editorContainer) return;

    this.clearHighlights();

    const walker = document.createTreeWalker(editorContainer, NodeFilter.SHOW_TEXT);
    let node: Node | null;
    while ((node = walker.nextNode())) {
      const textNode = node as Text;
      const text = textNode.textContent;
      if (text) {
        const words = text.split(/\s+/);
        let offset = 0;
        words.forEach((word) => {
          if (this.isMisspelled(word)) {
            const range = document.createRange();
            range.setStart(textNode, offset);
            range.setEnd(textNode, offset + word.length);
            this.highlightMisspelledWord(textNode, range);
          }
          offset += word.length + 1; // +1 для учета пробела
        });
      }
    }
  }

  private checkSpelling(range: Range): void {
    const text = range.toString();
    if (this.isMisspelled(text)) {
      const textNode = range.startContainer as Text;
      this.highlightMisspelledWord(textNode, range);
    }
  }

  private isMisspelled(word: string): boolean {
    if (!this.spellChecker) return false;

    // Сбрасываем результаты перед проверкой
    this.lastResults = [];

    // Проверяем слово
    this.spellChecker.checkSpelling(word, {
      includeUnknown: true, // Включаем слова, которых нет в словаре
      maxEditDistance: 2, // Максимальное расстояние редактирования
      verbosity: 1, // Уровень детализации предложений
      includeSelf: false, // Не включать само слово в результаты
    });

    // Если есть результаты, значит слово с ошибкой
    return this.lastResults.length > 0;
  }

  private getSpellingSuggestions(word: string): string[] {
    if (!this.spellChecker) return [];

    // Сбрасываем результаты перед проверкой
    this.lastResults = [];

    // Проверяем слово
    this.spellChecker.checkSpelling(word, {
      includeUnknown: true,
      maxEditDistance: 2,
      verbosity: 2, // Возвращаем все предложения
      includeSelf: false,
    });

    // Возвращаем предложения
    return this.lastResults.map((result) => result.term);
  }

  private highlightMisspelledWord(textNode: Text, range: Range): void {
    // Добавляем класс к родительскому элементу текстового узла
    textNode.parentElement?.classList.add('misspelled-word');
    this.misspelledWords.set(textNode, range);
  }

  private clearHighlights(): void {
    this.misspelledWords.forEach((_range, textNode) => {
      textNode.parentElement?.classList.remove('misspelled-word');
    });
    this.misspelledWords.clear();
  }

  private showContextMenu(event: MouseEvent, suggestions: string[], range: Range): void {
    const menu = document.createElement('div');
    menu.style.position = 'fixed'; // Используем fixed для точного позиционирования
    menu.style.backgroundColor = '#fff';
    menu.style.border = '1px solid #ccc';
    menu.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.2)';
    menu.style.zIndex = '1000';
    menu.style.maxHeight = '200px'; // Ограничение по высоте
    menu.style.overflowY = 'auto'; // Включаем вертикальный скролл
    menu.style.padding = '4px 0'; // Отступы внутри меню

    // Рассчитываем позицию меню
    const menuWidth = 200; // Ширина меню
    const menuHeight = Math.min(suggestions.length * 32, 200); // Высота меню (32px на элемент)
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let top = event.clientY;
    let left = event.clientX;

    // Проверяем, чтобы меню не выходило за пределы экрана
    if (top + menuHeight > viewportHeight) {
      top = viewportHeight - menuHeight; // Сдвигаем меню вверх, если оно выходит за нижнюю границу
    }
    if (left + menuWidth > viewportWidth) {
      left = viewportWidth - menuWidth; // Сдвигаем меню влево, если оно выходит за правую границу
    }

    // Устанавливаем позицию меню
    menu.style.top = `${top}px`;
    menu.style.left = `${left}px`;

    // Добавляем предложения в меню
    suggestions.forEach((suggestion) => {
      const item = document.createElement('div');
      item.style.padding = '8px 16px';
      item.style.cursor = 'pointer';
      item.textContent = suggestion;
      item.addEventListener('click', () => {
        this.replaceMisspelledWord(range, suggestion);
        menu.remove();
      });
      menu.appendChild(item);
    });

    // Добавляем меню в DOM
    this.editor?.getInnerContainer().appendChild(menu);

    // Удаляем меню при клике вне его
    document.addEventListener('click', () => menu.remove(), { once: true });
  }

  private replaceMisspelledWord(range: Range, replacement: string): void {
    range.deleteContents();
    range.insertNode(document.createTextNode(replacement));
    this.checkAllText(); // Перепроверяем текст после замены
  }

  destroy(): void {
    this.enableSpellCheck(false);
    this.toolbarButton?.remove();
    this.toolbarButton = null;
    this.editor = null;
    this.spellChecker = null;
  }
}
