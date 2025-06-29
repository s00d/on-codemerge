import {
  splitVerticalIcon,
  splitHorizontalIcon,
  moveIcon,
  duplicateIcon,
  deleteIcon,
} from '../../../icons';
import { ContextMenu } from '../../../core/ui/ContextMenu';
import type { HTMLEditor } from '../../../core/HTMLEditor.ts';
import { SplitBlockCommand } from '../commands/SplitBlockCommand';
import { MergeBlocksCommand } from '../commands/MergeBlocksCommand';
import { BlockCommand } from '../commands/BlockCommand';
import { DuplicateBlockCommand } from '../commands/DuplicateBlockCommand';
import { DeleteBlockCommand } from '../commands/DeleteBlockCommand';

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
          title: editor.t('Insert'),
          icon: '➕',
          subMenu: [
            {
              title: editor.t('Text Block'),
              action: 'insert-text',
              onClick: () => this.handleAction('insert-text'),
            },
            {
              title: editor.t('Container Block'),
              action: 'insert-container',
              onClick: () => this.handleAction('insert-container'),
            },
            {
              title: editor.t('Split Container'),
              action: 'insert-split',
              onClick: () => this.handleAction('insert-split'),
            },
          ],
        },
        {
          title: editor.t('Split'),
          icon: splitHorizontalIcon,
          subMenu: [
            {
              title: editor.t('Horizontally'),
              icon: splitHorizontalIcon,
              action: 'split-horizontal',
              onClick: () => this.handleAction('split-horizontal'),
            },
            {
              title: editor.t('Vertically'),
              icon: splitVerticalIcon,
              action: 'split-vertical',
              onClick: () => this.handleAction('split-vertical'),
            },
          ],
        },
        {
          title: editor.t('Merge'),
          icon: '🔗',
          action: 'merge',
          onClick: () => this.handleAction('merge'),
        },
        {
          type: 'divider',
        },
        {
          title: editor.t('Move'),
          icon: moveIcon,
          subMenu: [
            {
              title: editor.t('Up'),
              action: 'move-up',
              onClick: () => this.handleAction('move-up'),
            },
            {
              title: editor.t('Down'),
              action: 'move-down',
              onClick: () => this.handleAction('move-down'),
            },
          ],
        },
        {
          title: editor.t('Duplicate'),
          icon: duplicateIcon,
          action: 'duplicate',
          onClick: () => this.handleAction('duplicate'),
        },
        {
          type: 'divider',
        },
        {
          title: editor.t('Settings'),
          icon: '🔧',
          subMenu: [
            {
              title: editor.t('Make Editable'),
              action: 'make-editable',
              onClick: () => this.handleAction('make-editable'),
            },
            {
              title: editor.t('Make Read-only'),
              action: 'make-readonly',
              onClick: () => this.handleAction('make-readonly'),
            },
          ],
        },
        {
          title: editor.t('Remove'),
          icon: deleteIcon,
          action: 'remove',
          className: 'text-red-600',
          onClick: () => this.handleAction('remove'),
        },
      ],
      { orientation: 'vertical' }
    );
  }

  private handleAction(action: string): void {
    if (!this.activeBlock) return;

    switch (action) {
      case 'insert-text':
        this.insertBlock('text');
        break;
      case 'insert-container':
        this.insertBlock('container');
        break;
      case 'insert-split':
        this.insertBlock('split');
        break;
      case 'split-horizontal':
        this.splitBlock('horizontal');
        break;
      case 'split-vertical':
        this.splitBlock('vertical');
        break;
      case 'merge':
        this.mergeBlocks();
        break;
      case 'move-up':
        this.moveBlock('up');
        break;
      case 'move-down':
        this.moveBlock('down');
        break;
      case 'duplicate':
        this.duplicateBlock();
        break;
      case 'make-editable':
        this.setBlockEditable(true);
        break;
      case 'make-readonly':
        this.setBlockEditable(false);
        break;
      case 'remove':
        this.removeBlock();
        break;
    }

    // Закрываем меню после выполнения действия
    this.hide();
  }

  private insertBlock(type: 'text' | 'container' | 'split'): void {
    const command = new BlockCommand(this.editor);
    command.execute({ type });
  }

  private splitBlock(direction: 'horizontal' | 'vertical'): void {
    if (!this.activeBlock || !this.canSplit(this.activeBlock)) return;

    const command = new SplitBlockCommand(this.editor);
    command.setData({ direction, block: this.activeBlock });
    command.execute();
  }

  private mergeBlocks(): void {
    if (!this.activeBlock) return;

    // Находим соседние блоки для объединения
    const blocks = this.getAdjacentBlocks(this.activeBlock);
    if (blocks.length < 2) return;

    const command = new MergeBlocksCommand(this.editor);
    command.setData({ blocks });
    command.execute();
  }

  private moveBlock(direction: 'up' | 'down'): void {
    if (!this.activeBlock) return;

    if (direction === 'up') {
      const prev = this.activeBlock.previousElementSibling;
      if (prev && prev.classList.contains('editor-block')) {
        prev.parentNode?.insertBefore(this.activeBlock, prev);
      }
    } else {
      const next = this.activeBlock.nextElementSibling;
      if (next && next.classList.contains('editor-block')) {
        next.parentNode?.insertBefore(next, this.activeBlock);
      }
    }
  }

  private duplicateBlock(): void {
    if (!this.activeBlock) return;

    const command = new DuplicateBlockCommand(this.editor);
    command.setData({ block: this.activeBlock });
    command.execute();
  }

  private setBlockEditable(editable: boolean): void {
    if (!this.activeBlock) return;

    const content = this.activeBlock.querySelector('.block-content') as HTMLElement;
    if (content) {
      content.contentEditable = editable.toString();
    }
  }

  private removeBlock(): void {
    if (!this.activeBlock) return;

    const command = new DeleteBlockCommand(this.editor);
    command.setBlock(this.activeBlock);
    command.execute();
  }

  private canSplit(block: HTMLElement): boolean {
    return block.classList.contains('editor-block') &&
           !block.classList.contains('split-container') &&
           block.getAttribute('data-block-type') === 'text';
  }

  private getAdjacentBlocks(block: HTMLElement): HTMLElement[] {
    const blocks: HTMLElement[] = [];

    // Добавляем текущий блок
    blocks.push(block);

    // Ищем предыдущие блоки
    let prev = block.previousElementSibling;
    while (prev && prev.classList.contains('editor-block') &&
           prev.getAttribute('data-block-type') === 'text') {
      blocks.unshift(prev as HTMLElement);
      prev = prev.previousElementSibling;
    }

    // Ищем следующие блоки
    let next = block.nextElementSibling;
    while (next && next.classList.contains('editor-block') &&
           next.getAttribute('data-block-type') === 'text') {
      blocks.push(next as HTMLElement);
      next = next.nextElementSibling;
    }

    return blocks;
  }

  public show(block: HTMLElement, x: number, y: number): void {
    this.activeBlock = block;
    this.contextMenu.show(block, x, y);
  }

  public hide(): void {
    this.contextMenu.hide();
    this.activeBlock = null;
  }

  public destroy(): void {
    if (this.contextMenu && typeof this.contextMenu.destroy === 'function') {
      this.contextMenu.destroy();
    }

    this.editor = null!;
    this.contextMenu = null!;
    this.activeBlock = null;
  }
}
