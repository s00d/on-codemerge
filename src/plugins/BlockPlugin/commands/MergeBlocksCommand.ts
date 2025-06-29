import type { Command } from '../../../core/commands/Command';
import type { HTMLEditor } from '../../../core/HTMLEditor';
import { createContainer } from '../../../utils/helpers.ts';

export interface MergeBlocksCommandData {
  blocks: HTMLElement[];
}

export class MergeBlocksCommand implements Command {
  name = 'mergeBlocks';
  private blocks: HTMLElement[] = [];
  private mergedBlock: HTMLElement | null = null;
  private originalBlocks: HTMLElement[] = [];

  constructor(_editor: HTMLEditor) {
  }

  setData(data: MergeBlocksCommandData): void {
    this.blocks = data.blocks;
  }

  execute(): void {
    if (this.blocks.length < 2) return;

    // Проверяем, что все блоки валидны и соседние
    if (!this.areValidAdjacentBlocks(this.blocks)) return;

    this.originalBlocks = [...this.blocks];

    // Создаем объединенный блок
    this.mergedBlock = this.createMergedBlock(this.blocks);

    // Заменяем первый блок объединенным
    const firstBlock = this.blocks[0];
    firstBlock.parentNode?.replaceChild(this.mergedBlock, firstBlock);

    // Удаляем остальные блоки
    for (let i = 1; i < this.blocks.length; i++) {
      this.blocks[i].remove();
    }

    // Фокусируемся на объединенном блоке
    this.focusBlock(this.mergedBlock);
  }

  undo(): void {
    if (this.mergedBlock && this.originalBlocks.length > 0) {
      // Возвращаем исходные блоки
      this.mergedBlock.parentNode?.replaceChild(this.originalBlocks[0], this.mergedBlock);

      for (let i = 1; i < this.originalBlocks.length; i++) {
        this.mergedBlock.parentNode?.insertBefore(this.originalBlocks[i], this.originalBlocks[i - 1].nextSibling);
      }
    }
  }

  redo(): void {
    if (this.mergedBlock && this.originalBlocks.length > 0) {
      // Повторно объединяем блоки
      const firstBlock = this.originalBlocks[0];
      firstBlock.parentNode?.replaceChild(this.mergedBlock, firstBlock);

      for (let i = 1; i < this.originalBlocks.length; i++) {
        this.originalBlocks[i].remove();
      }
    }
  }

  private areValidAdjacentBlocks(blocks: HTMLElement[]): boolean {
    if (blocks.length < 2) return false;

    // Проверяем, что все блоки валидны
    for (const block of blocks) {
      if (!this.isValidBlock(block)) return false;
    }

    // Проверяем, что блоки соседние
    for (let i = 0; i < blocks.length - 1; i++) {
      if (blocks[i].nextElementSibling !== blocks[i + 1]) {
        return false;
      }
    }

    return true;
  }

  private isValidBlock(block: HTMLElement): boolean {
    return block.classList.contains('editor-block') &&
           block.getAttribute('data-block-type') === 'text';
  }

  private createMergedBlock(blocks: HTMLElement[]): HTMLElement {
    const mergedBlock = createContainer('editor-block text-block');
    mergedBlock.setAttribute('contenteditable', 'false');
    mergedBlock.setAttribute('data-block-type', 'text');

    const blockContent = createContainer('block-content');
    blockContent.contentEditable = 'true';

    // Объединяем содержимое всех блоков
    const contents: string[] = [];
    for (const block of blocks) {
      const content = block.querySelector('.block-content');
      if (content && content.textContent?.trim()) {
        contents.push(content.textContent.trim());
      }
    }

    blockContent.textContent = contents.join('\n');
    mergedBlock.appendChild(blockContent);

    return mergedBlock;
  }

  private focusBlock(block: HTMLElement): void {
    const content = block.querySelector('.block-content') as HTMLElement;
    if (content && content.contentEditable === 'true') {
      // Убеждаемся, что contentEditable установлен
      content.contentEditable = 'true';

      // НЕ устанавливаем фокус программно - браузер сам поставит курсор
      // content.focus();

      // Добавляем активный класс
      block.classList.add('active');
    }
  }
}
