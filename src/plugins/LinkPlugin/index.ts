import './style.scss';
import './public.scss';

import type { Plugin } from '../../core/Plugin';
import type { HTMLEditor } from '../../core/HTMLEditor';
import { LinkMenu } from './components/LinkMenu';
import { createToolbarButton } from '../ToolbarPlugin/utils';
import { linkIcon, editIcon, deleteIcon } from '../../icons/';
import { ContextMenu } from '../../core/ui/ContextMenu.ts';

interface LinkData {
  url: string; // URL ссылки
  anchor: string; // Текст анкора
  title: string; // Заголовок ссылки (атрибут title)
  nofollow: boolean; // Добавить rel="nofollow"
  targetBlank: boolean; // Открывать ссылку в новой вкладке (target="_blank")
}

export class LinkPlugin implements Plugin {
  name = 'link';
  private editor: HTMLEditor | null = null;
  private menu: LinkMenu | null = null;
  private contextMenu: ContextMenu | null = null;
  private currentRange: Range | null = null;
  private toolbarButton: HTMLElement | null = null;

  constructor() {}

  initialize(editor: HTMLEditor): void {
    this.menu = new LinkMenu(editor);
    this.contextMenu = new ContextMenu(
      editor,
      [
        {
          label: this.editor?.t('Edit'),
          icon: editIcon,
          iconPosition: 'right',
          hotkey: 'S',
          onClick: (activeLink) => {
            if (activeLink) this.editLink(activeLink as HTMLAnchorElement);
          },
        },
        {
          type: 'divider',
        },
        {
          label: this.editor?.t('Remove'),
          icon: deleteIcon,
          iconPosition: 'right',
          hotkey: 'D',
          onClick: (activeLink) => {
            if (activeLink) this.removeLink(activeLink as HTMLAnchorElement);
          },
        },
      ],
      {
        orientation: 'horizontal',
      }
    );
    this.editor = editor;
    this.addToolbarButton();
    this.setupContextMenu();
    this.editor.on('link', () => {
      this.openModal();
    });
  }

  private addToolbarButton(): void {
    const toolbar = document.querySelector('.editor-toolbar');
    if (!toolbar) return;

    this.toolbarButton = createToolbarButton({
      icon: linkIcon,
      title: this.editor?.t('Insert Link'),
      onClick: () => {
        this.openModal();
      },
    });
    toolbar.appendChild(this.toolbarButton);
  }

  private setupContextMenu(): void {
    if (!this.editor) return;

    const container = this.editor.getContainer();
    container.addEventListener('contextmenu', this.handleContextMenu);
  }

  private handleContextMenu = (e: MouseEvent): void => {
    const link = (e.target as Element).closest('a');
    if (link instanceof HTMLAnchorElement) {
      e.preventDefault();
      this.contextMenu?.show(link, e.clientX, e.clientY);
    }
  };

  private openModal(): void {
    if (!this.editor) return;

    this.editor?.ensureEditorFocus();

    // Сохраняем текущий Range (выделение) при открытии модального окна
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      this.currentRange = selection.getRangeAt(0).cloneRange();
    }

    const selectedText = selection ? selection.toString().trim() : '';

    this.menu?.show(
      (linkData) => {
        this.handleLinkInsertion(linkData, selectedText);
      },
      { anchor: selectedText }
    );
  }

  private handleLinkInsertion(linkData: LinkData, selectedText: string): void {
    if (!this.editor || !this.currentRange) return;

    const anchor = linkData.anchor || selectedText;
    const link = document.createElement('a');
    link.href = linkData.url;
    link.textContent = anchor;

    if (linkData.title) {
      link.title = linkData.title;
    }

    if (linkData.nofollow) {
      link.rel = 'nofollow';
    }

    if (linkData.targetBlank) {
      link.target = '_blank';
    }

    // Вставляем ссылку в сохраненный Range
    this.currentRange.deleteContents();
    this.currentRange.insertNode(link);
    this.currentRange.collapse(false);

    // Сбрасываем сохраненный Range после вставки
    this.currentRange = null;
  }

  private editLink(link: HTMLAnchorElement): void {
    if (!this.editor) return;

    // Начальные данные для редактирования ссылки
    const initialData: LinkData = {
      url: link.href,
      anchor: link.textContent || '',
      title: link.title,
      nofollow: link.rel.includes('nofollow'),
      targetBlank: link.target === '_blank',
    };

    this.menu?.show((newLinkData) => {
      link.href = newLinkData.url;
      link.textContent = newLinkData.anchor || newLinkData.url;
      link.title = newLinkData.title || '';
      link.rel = newLinkData.nofollow ? 'nofollow' : '';
      link.target = newLinkData.targetBlank ? '_blank' : '';
    }, initialData);
  }

  private removeLink(link: HTMLAnchorElement): void {
    if (!this.editor) return;

    const textNode = document.createTextNode(link.textContent || '');
    link.replaceWith(textNode);
  }

  destroy(): void {
    this.editor?.off('link');

    if (this.contextMenu) {
      this.contextMenu.destroy();
      this.contextMenu = null;
    }

    if (this.toolbarButton && this.toolbarButton.parentElement) {
      this.toolbarButton.parentElement.removeChild(this.toolbarButton);
      this.toolbarButton = null;
    }

    const container = this.editor?.getContainer();
    if (container) {
      container.removeEventListener('contextmenu', this.handleContextMenu);
    }

    // Очищаем ссылки на объекты
    this.menu = null;
    this.editor = null;
    this.currentRange = null;
  }
}
