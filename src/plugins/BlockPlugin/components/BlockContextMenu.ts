import {
  splitVerticalIcon,
  splitHorizontalIcon,
  moveIcon,
  duplicateIcon,
  deleteIcon,
} from '../../../icons';
import { ContextMenu } from '../../../core/ui/ContextMenu';
import type { HTMLEditor } from '../../../core/HTMLEditor.ts';
import { createContainer } from '../../../utils/helpers.ts';

export class BlockContextMenu {
  private editor: HTMLEditor;
  private contextMenu: ContextMenu;
  private activeBlock: HTMLElement | null = null;

  constructor(editor: HTMLEditor) {
    this.editor = editor;
    this.contextMenu = new ContextMenu(
      editor,
      [
        {
          title: editor.t('Split Horizontally'),
          icon: splitHorizontalIcon,
          action: 'split-horizontal',
          onClick: () => this.handleAction('split-horizontal'),
        },
        {
          title: editor.t('Split Vertically'),
          icon: splitVerticalIcon,
          action: 'split-vertical',
          onClick: () => this.handleAction('split-vertical'),
        },
        {
          type: 'divider',
        },
        {
          title: editor.t('Move Up'),
          icon: moveIcon,
          action: 'move-up',
          onClick: () => this.handleAction('move-up'),
        },
        {
          title: editor.t('Move Down'),
          icon: moveIcon,
          action: 'move-down',
          onClick: () => this.handleAction('move-down'),
        },
        {
          type: 'divider',
        },
        {
          title: editor.t('Duplicate'),
          icon: duplicateIcon,
          action: 'duplicate',
          onClick: () => this.handleAction('duplicate'),
        },
        {
          title: editor.t('Remove'),
          icon: deleteIcon,
          action: 'remove',
          className: 'text-red-600',
          onClick: () => this.handleAction('remove'),
        },
      ],
      { orientation: 'vertical' } // Ориентация меню (вертикальная)
    );
  }

  private handleAction(action: string): void {
    if (!this.activeBlock) return;

    switch (action) {
      case 'split-horizontal':
        this.splitBlock('horizontal');
        break;
      case 'split-vertical':
        this.splitBlock('vertical');
        break;
      case 'move-up':
        const prev = this.activeBlock.previousElementSibling;
        if (prev) {
          prev.parentNode?.insertBefore(this.activeBlock, prev);
        }
        break;
      case 'move-down':
        const next = this.activeBlock.nextElementSibling;
        if (next) {
          next.parentNode?.insertBefore(next, this.activeBlock);
        }
        break;
      case 'duplicate':
        const clone = this.activeBlock.cloneNode(true) as HTMLElement;
        this.activeBlock.parentNode?.insertBefore(clone, this.activeBlock.nextSibling);
        break;
      case 'remove':
        this.activeBlock.remove();
        break;
    }
  }

  private splitBlock(direction: 'horizontal' | 'vertical'): void {
    if (!this.activeBlock) return;

    // Проверяем, является ли активный блок контейнером
    const isContainer = this.activeBlock.classList.contains('split-container');

    // Если активный блок уже является контейнером, заменяем его содержимое
    if (isContainer) {
      const container = this.activeBlock;

      // Удаляем все дочерние элементы контейнера
      while (container.firstChild) {
        container.firstChild.remove();
      }

      // Создаем два новых блока
      const block1 = createContainer('editor-block');
      block1.setAttribute('contenteditable', 'true');

      const block2 = createContainer('editor-block');
      block2.setAttribute('contenteditable', 'true');

      // Добавляем содержимое в блоки
      const content1 = createContainer('block-content');
      const content2 = createContainer('block-content');
      content1.textContent = this.editor.t('Block 1');
      content2.textContent = this.editor.t('Block 2');

      block1.appendChild(content1);
      block2.appendChild(content2);

      // Добавляем блоки в контейнер
      container.appendChild(block1);
      container.appendChild(block2);
    } else {
      // Если активный блок не является контейнером, создаем новый контейнер
      const container = createContainer(`split-container ${direction}`);

      // Создаем два новых блока
      const block1 = this.activeBlock.cloneNode(true) as HTMLElement;
      const block2 = this.activeBlock.cloneNode(true) as HTMLElement;

      // Очищаем содержимое второго блока
      const content2 = block2.querySelector('.block-content');
      if (content2) content2.textContent = '';

      // Добавляем блоки в контейнер
      container.appendChild(block1);
      container.appendChild(block2);

      // Заменяем исходный блок контейнером
      this.activeBlock.parentNode?.replaceChild(container, this.activeBlock);
    }
  }

  public show(block: HTMLElement, x: number, y: number): void {
    this.activeBlock = block;
    this.contextMenu.show(block, x, y); // Показываем контекстное меню
  }

  public hide(): void {
    this.contextMenu.hide(); // Скрываем контекстное меню
    this.activeBlock = null;
  }

  /**
   * Уничтожение контекстного меню
   */
  public destroy(): void {
    // Уничтожаем контекстное меню, если у него есть метод destroy
    if (this.contextMenu && typeof this.contextMenu.destroy === 'function') {
      this.contextMenu.destroy();
    }

    // Очищаем ссылки
    this.editor = null!;
    this.contextMenu = null!;
    this.activeBlock = null;
  }
}
