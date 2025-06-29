import type { Command } from '../../../core/commands/Command';
import type { HTMLEditor } from '../../../core/HTMLEditor';

export interface DuplicateBlockCommandData {
  block: HTMLElement;
}

export class DuplicateBlockCommand implements Command {
  name = 'duplicateBlock';
  private editor: HTMLEditor;
  private originalBlock: HTMLElement | null = null;
  private duplicatedBlock: HTMLElement | null = null;

  constructor(editor: HTMLEditor) {
    this.editor = editor;
  }

  setData(data: DuplicateBlockCommandData): void {
    this.originalBlock = data.block;
  }

  execute(): void {
    if (!this.originalBlock || !this.isValidBlock(this.originalBlock)) return;

    // Создаем клон блока
    this.duplicatedBlock = this.originalBlock.cloneNode(true) as HTMLElement;
    
    // Очищаем содержимое клона
    const content = this.duplicatedBlock.querySelector('.block-content') as HTMLElement;
    if (content) {
      content.textContent = this.editor.t('Duplicated Block');
      // Убеждаемся, что contentEditable установлен
      content.contentEditable = 'true';
    }
    
    // Удаляем активное состояние
    this.duplicatedBlock.classList.remove('active');
    
    // Убеждаемся, что блок не редактируемый, только содержимое
    this.duplicatedBlock.setAttribute('contenteditable', 'false');
    
    // Вставляем после исходного блока
    this.originalBlock.parentNode?.insertBefore(this.duplicatedBlock, this.originalBlock.nextSibling);
    
    // Фокусируемся на новом блоке
    this.focusBlock(this.duplicatedBlock);
  }

  undo(): void {
    if (this.duplicatedBlock) {
      this.duplicatedBlock.remove();
    }
  }

  redo(): void {
    if (this.originalBlock && this.duplicatedBlock) {
      this.originalBlock.parentNode?.insertBefore(this.duplicatedBlock, this.originalBlock.nextSibling);
    }
  }

  private isValidBlock(block: HTMLElement): boolean {
    return block.classList.contains('editor-block');
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