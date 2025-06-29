import './style.scss';
import './public.scss';

import type { Plugin } from '../../core/Plugin';
import type { HTMLEditor } from '../../core/HTMLEditor';
import { FootnoteManager } from './services/FootnoteManager';
import { FootnoteMenu } from './components/FootnoteMenu';
import { createToolbarButton } from '../ToolbarPlugin/utils';
import { footnoteIcon } from '../../icons/';
import {
  createContainer,
  createH,
  createHr,
  createLi,
  createOl,
  createP,
  createSup,
} from '../../utils/helpers.ts';

export class FootnotesPlugin implements Plugin {
  name = 'footnotes';
  hotkeys = [
    { keys: 'Ctrl+Alt+X', description: 'Insert footnote', command: 'footnotes', icon: '👣' },
  ];
  private editor: HTMLEditor | null = null;
  private manager: FootnoteManager;
  private menu: FootnoteMenu | null = null;
  private toolbarButton: HTMLElement | null = null;

  constructor() {
    this.manager = new FootnoteManager();
  }

  initialize(editor: HTMLEditor): void {
    this.menu = new FootnoteMenu(editor);
    this.editor = editor;
    this.addToolbarButton();
    this.setupEventListeners();
    this.editor.on('footnotes', () => {
      this.insertFootnote();
    });
  }

  private addToolbarButton(): void {
    const toolbar = this.editor?.getToolbar();
    if (toolbar) {
      this.toolbarButton = createToolbarButton({
        icon: footnoteIcon,
        title: this.editor?.t('Insert Footnote') ?? '',
        onClick: () => this.insertFootnote(),
      });
      toolbar.appendChild(this.toolbarButton);
    }
  }

  private setupEventListeners(): void {
    if (!this.editor) return;

    const container = this.editor.getContainer();

    container.addEventListener('click', (e) => {
      const footnoteRef = (e.target as Element).closest('.footnote-ref');
      if (footnoteRef instanceof HTMLElement) {
        const id = footnoteRef.getAttribute('data-footnote-id');
        if (id) {
          this.editFootnote(id);
        }
      }
    });
  }

  private insertFootnote(): void {
    if (!this.editor) return;

    const selection = window.getSelection();
    if (!selection) return;

    this.menu?.show((content) => {
      const footnote = this.manager.createFootnote(content);
      this.insertFootnoteReference(footnote.id);
      this.updateFootnotesList();
    });
  }

  private editFootnote(id: string): void {
    const footnote = this.manager.getFootnote(id);
    if (!footnote) return;

    this.menu?.show((content) => {
      this.manager.updateFootnote(id, content);
      this.updateFootnotesList();
    }, footnote.content);
  }

  private insertFootnoteReference(id: string): void {
    if (!this.editor) return;

    const ref = createSup('footnote-ref');
    ref.className = 'footnote-ref';
    ref.setAttribute('data-footnote-id', id);
    ref.textContent = `[${this.manager.getFootnoteNumber(id)}]`;

    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      range.insertNode(ref);
      range.collapse(false);
    }
  }

  private updateFootnotesList(): void {
    if (!this.editor) return;

    const editorContainer = this.editor.getContainer();

    // Удаляем существующий раздел сносок, если он есть
    const existingSection = editorContainer.querySelector('.footnotes-section');
    if (existingSection) {
      existingSection.remove();
    }

    // Получаем все сноски
    const footnotes = this.manager.getAllFootnotes();
    if (footnotes.length === 0) return;

    // Создаем новый раздел для сносок
    const section = createContainer();
    section.className = 'footnotes-section';

    // Добавляем горизонтальную линию
    const hr = createHr();
    hr.className = 'my-8';
    section.appendChild(hr);

    // Добавляем заголовок раздела
    const heading = createH('h2', 'text-xl font-semibold mb-4', this.editor?.t('Footnotes') ?? '');
    section.appendChild(heading);

    // Создаем упорядоченный список для сносок
    const ol = createOl('footnotes-list');

    // Добавляем каждую сноску в список
    footnotes.forEach((footnote) => {
      const li = createLi();
      li.id = `footnote-${footnote.id}`;

      // Разделяем содержимое сноски по строкам и добавляем их как параграфы
      const lines = footnote.content.split(/\r?\n/).filter((line) => line.trim());
      lines.forEach((line) => {
        const p = createP('footnote-line', line);
        li.appendChild(p);
      });

      ol.appendChild(li);
    });

    section.appendChild(ol);
    editorContainer.appendChild(section);
  }

  public destroy(): void {
    if (this.editor) {
      const container = this.editor.getContainer();
      container.removeEventListener('click', (e) => {
        const footnoteRef = (e.target as Element).closest('.footnote-ref');
        if (footnoteRef instanceof HTMLElement) {
          const id = footnoteRef.getAttribute('data-footnote-id');
          if (id) {
            this.editFootnote(id);
          }
        }
      });
    }

    if (this.toolbarButton && this.toolbarButton.parentElement) {
      this.toolbarButton.parentElement.removeChild(this.toolbarButton);
    }

    if (this.editor) {
      const existingSection = this.editor.getContainer().querySelector('.footnotes-section');
      if (existingSection) {
        existingSection.remove();
      }
    }

    this.editor?.off('footnotes');

    this.editor = null;
    this.menu = null;
    this.toolbarButton = null;
    this.manager.destroy();
  }
}
