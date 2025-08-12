import './style.scss';
import './public.scss';

import type { Plugin } from '../../core/Plugin';
import type { HTMLEditor } from '../../core/HTMLEditor';
import { CodeBlockModal } from './components/CodeBlockModal';
import { CodeBlockContextMenu } from './components/CodeBlockContextMenu';
import { createToolbarButton } from '../ToolbarPlugin/utils';
import { SyntaxHighlighter } from './services/SyntaxHighlighter';
import { insertIcon } from '../../icons';
import {
  createButton,
  createCode,
  createContainer,
  createPre,
  createSpan,
} from '../../utils/helpers.ts';

export class CodeBlockPlugin implements Plugin {
  name = 'code-block';
  hotkeys = [
    { keys: 'Ctrl+Alt+Q', description: 'Insert code block', command: 'code-block', icon: '</>' },
  ];
  private editor: HTMLEditor | null = null;
  private modal: CodeBlockModal | null = null;
  private contextMenu: CodeBlockContextMenu | null = null;
  private highlighter: SyntaxHighlighter;
  private toolbarButton: HTMLElement | null = null;

  constructor() {
    this.highlighter = new SyntaxHighlighter();
  }

  initialize(editor: HTMLEditor): void {
    this.contextMenu = new CodeBlockContextMenu(editor, (block) => this.editCodeBlock(block));
    this.modal = new CodeBlockModal(editor);

    this.editor = editor;
    this.addToolbarButton();
    this.setupEventListeners();
    this.editor.on('code-block', () => {
      this.insertCodeBlock();
    });
  }

  private addToolbarButton(): void {
    const toolbar = this.editor?.getToolbar();
    if (!toolbar) return;

    this.toolbarButton = createToolbarButton({
      icon: insertIcon,
      title: this.editor?.t('Insert Code Block') ?? 'Insert Code Block',
      onClick: () => this.insertCodeBlock(),
    });
    toolbar.appendChild(this.toolbarButton);
  }

  private setupEventListeners(): void {
    if (!this.editor) return;

    const container = this.editor.getContainer();

    // Обработка правого клика для контекстного меню
    container.addEventListener('contextmenu', (e) => {
      const codeBlock = (e.target as Element).closest('.code-block');
      if (codeBlock instanceof HTMLElement) {
        e.preventDefault();
        const mouseX = (e as MouseEvent).clientX + window.scrollX;
        const mouseY = (e as MouseEvent).clientY + window.scrollY;

        console.log('Mouse coordinates with scroll:', mouseX, mouseY);

        this.contextMenu?.show(codeBlock, mouseX, mouseY);
      }
    });
  }

  private insertCodeBlock(): void {
    if (!this.editor) return;

    this.modal?.show((code, language) => {
      const block = this.createCodeBlock(code, language);

      this.editor!.ensureEditorFocus();

      const container = this.editor!.getContainer();

      const selection = this.editor!.getTextFormatter()?.getSelection();
      let range: Range;

      if (selection && selection.rangeCount > 0) {
        range = selection.getRangeAt(0);
      } else {
        range = document.createRange();
        range.selectNodeContents(container);
        range.collapse(false);
      }

      range.deleteContents();
      range.insertNode(block);
      range.collapse(false);

      // Подсветка синтаксиса
      const codeElement = block.querySelector('code');
      if (codeElement) {
        this.highlighter.highlight(codeElement);
      }
    });
  }

  private editCodeBlock(block: HTMLElement): void {
    const codeElement = block.querySelector('code');
    const languageElement = block.querySelector('.code-language');

    if (codeElement && languageElement) {
      const code = codeElement.textContent || '';
      const language = languageElement.textContent || 'plaintext';

      this.modal?.show(
        (newCode, newLanguage) => {
          codeElement.textContent = newCode;
          codeElement.className = `language-${newLanguage}`;
          languageElement.textContent = newLanguage;

          // Подсветка синтаксиса
          this.highlighter.highlight(codeElement);
        },
        code,
        language
      );
    }
  }

  private createCodeBlock(code: string, language: string): HTMLElement {
    const block = createContainer(`code-block`);
    const uniqueId = `code-block-${Math.random().toString(36).substring(2, 11)}`; // Генерация уникального ID
    block.id = uniqueId; // Присвоение уникального ID

    // Создание заголовка блока
    const header = createContainer('code-header');
    header.className = 'code-header';

    const languageSpan = createSpan('code-language', language);
    const copyButton = createButton(this.editor?.t('Copy') ?? 'Copy', () => {});
    copyButton.className = 'copy-button';
    copyButton.title = this.editor?.t('Copy to clipboard') ?? 'Copy to clipboard';
    const copied = this.editor?.t('Copied!');

    // Использование onclick для сохранения функциональности в HTML
    copyButton.setAttribute(
      'onclick',
      `
      const codeElement = document.getElementById('${uniqueId}').querySelector('code');
      if (codeElement) {
        navigator.clipboard.writeText(codeElement.textContent || '');
        this.textContent = '${copied}';
        setTimeout(() => {
          this.textContent = '${copyButton.textContent}';
        }, 2000);
      }
    `
    );

    header.appendChild(languageSpan);
    header.appendChild(copyButton);

    // Создание контейнера для кода
    const pre = createPre();
    const codeElement = createCode(`language-${language}`, code);
    codeElement.contentEditable = 'true';

    pre.appendChild(codeElement);

    // Сборка структуры
    block.appendChild(header);
    block.appendChild(pre);

    return block;
  }

  /**
   * Очистка ресурсов плагина
   */
  public destroy(): void {
    if (this.toolbarButton && this.toolbarButton.parentElement) {
      this.toolbarButton.parentElement.removeChild(this.toolbarButton);
    }

    if (this.modal) {
      this.modal.destroy();
      this.modal = null;
    }

    if (this.contextMenu) {
      this.contextMenu.destroy();
      this.contextMenu = null;
    }

    this.editor?.off('code-block');

    this.editor = null;
    this.highlighter = null!;
  }
}
