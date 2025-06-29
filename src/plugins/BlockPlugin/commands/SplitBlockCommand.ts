import type { Command } from '../../../core/commands/Command';
import type { HTMLEditor } from '../../../core/HTMLEditor';
import { createContainer } from '../../../utils/helpers.ts';

export interface SplitBlockCommandData {
  direction: 'horizontal' | 'vertical';
  block: HTMLElement;
}

export class SplitBlockCommand implements Command {
  name = 'splitBlock';
  private editor: HTMLEditor;
  private originalBlock: HTMLElement | null = null;
  private splitContainer: HTMLElement | null = null;
  private direction: 'horizontal' | 'vertical' = 'horizontal';
  private block: HTMLElement | null = null;

  constructor(editor: HTMLEditor) {
    this.editor = editor;
  }

  setData(data: SplitBlockCommandData): void {
    this.direction = data.direction;
    this.block = data.block;
  }

  execute(): void {
    if (!this.block || !this.isValidBlock(this.block)) return;

    this.originalBlock = this.block;
    
    // Создаем контейнер для разделения
    this.splitContainer = this.createSplitContainer(this.direction, this.block);
    
    // Заменяем исходный блок контейнером
    this.block.parentNode?.replaceChild(this.splitContainer, this.block);
    
    // Фокусируемся на первом блоке с задержкой для стабильности DOM
    setTimeout(() => {
      const firstBlock = this.splitContainer?.querySelector('.editor-block') as HTMLElement;
      if (firstBlock) {
        this.focusBlock(firstBlock);
      }
    }, 10);
  }

  undo(): void {
    if (this.originalBlock && this.splitContainer) {
      // Возвращаем исходный блок
      this.splitContainer.parentNode?.replaceChild(this.originalBlock, this.splitContainer);
    }
  }

  redo(): void {
    if (this.originalBlock && this.splitContainer) {
      // Повторно применяем разделение
      this.originalBlock.parentNode?.replaceChild(this.splitContainer, this.originalBlock);
    }
  }

  private isValidBlock(block: HTMLElement): boolean {
    return block.classList.contains('editor-block') && 
           !block.classList.contains('split-container');
  }

  private createSplitContainer(direction: 'horizontal' | 'vertical', originalBlock: HTMLElement): HTMLElement {
    const container = createContainer(`editor-block split-container ${direction}`);
    container.setAttribute('contenteditable', 'false');
    container.setAttribute('data-block-type', 'split');
    container.setAttribute('data-direction', direction);

    // Создаем два блока на основе исходного
    const block1 = this.createBlockFromOriginal(originalBlock, 'Block 1');
    const block2 = this.createBlockFromOriginal(originalBlock, 'Block 2');

    container.appendChild(block1);
    container.appendChild(block2);

    return container;
  }

  private createBlockFromOriginal(originalBlock: HTMLElement, defaultText: string): HTMLElement {
    const block = createContainer('editor-block text-block');
    block.setAttribute('contenteditable', 'false'); // Блок не редактируемый, только содержимое
    block.setAttribute('data-block-type', 'text');

    const blockContent = createContainer('block-content');
    blockContent.contentEditable = 'true';
    
    // Копируем содержимое из исходного блока или используем текст по умолчанию
    const originalContent = originalBlock.querySelector('.block-content');
    if (originalContent && originalContent.textContent?.trim()) {
      blockContent.textContent = originalContent.textContent;
    } else {
      blockContent.textContent = this.editor.t(defaultText);
    }

    block.appendChild(blockContent);
    return block;
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