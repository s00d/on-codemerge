import type { Command } from '../../../core/commands/Command';
import type { HTMLEditor } from '../../../core/HTMLEditor';
import { createContainer, createLineBreak } from '../../../utils/helpers.ts';

export interface BlockCommandData {
  type?: 'text' | 'container' | 'split';
  content?: string;
  direction?: 'horizontal' | 'vertical';
}

export class BlockCommand implements Command {
  name = 'insertBlock';
  private editor: HTMLEditor;
  private previousContent: string | null = null;
  private insertedBlock: HTMLElement | null = null;

  constructor(editor: HTMLEditor) {
    this.editor = editor;
  }

  execute(data?: BlockCommandData): void {
    const container = this.editor.getContainer();
    if (!container) return;

    // Сохраняем текущее содержимое для отмены
    this.previousContent = this.editor.getHtml();

    // Создаем блок в зависимости от типа
    let block: HTMLElement;
    if (data?.type === 'split') {
      block = this.createSplitContainer(data.direction || 'horizontal');
    } else if (data?.type === 'container') {
      block = this.createContainerBlock();
    } else {
      block = this.createTextBlock(data?.content);
    }

    this.insertedBlock = block;

    // Получаем текущую позицию курсора
    const selection = window.getSelection();
    let range: Range;

    if (selection && selection.rangeCount > 0) {
      range = selection.getRangeAt(0);
      
      // Проверяем, что курсор находится внутри редактора
      if (!container.contains(range.commonAncestorContainer)) {
        range = this.createRangeAtEnd(container);
      }
    } else {
      range = this.createRangeAtEnd(container);
    }

    // Вставляем блок
    this.insertBlockAtRange(block, range);
    
    // Фокусируемся на новом блоке
    this.focusBlock(block);
  }

  undo(): void {
    if (this.previousContent !== null) {
      this.editor.setHtml(this.previousContent);
    }
  }

  redo(): void {
    if (this.insertedBlock) {
      // Повторно вставляем блок
      const container = this.editor.getContainer();
      if (container) {
        container.appendChild(this.insertedBlock.cloneNode(true));
      }
    }
  }

  private createTextBlock(content?: string): HTMLElement {
    const block = createContainer('editor-block text-block');
    block.setAttribute('contenteditable', 'false');
    block.setAttribute('data-block-type', 'text');

    const blockContent = createContainer('block-content');
    blockContent.contentEditable = 'true';
    blockContent.textContent = content || this.editor.t('New Block');
    
    // Устанавливаем фокус на содержимое
    blockContent.focus();

    block.appendChild(blockContent);
    return block;
  }

  private createContainerBlock(): HTMLElement {
    const block = createContainer('editor-block container-block');
    block.setAttribute('contenteditable', 'false');
    block.setAttribute('data-block-type', 'container');

    const blockContent = createContainer('block-content');
    blockContent.contentEditable = 'true';
    blockContent.textContent = this.editor.t('Container Block');

    block.appendChild(blockContent);
    return block;
  }

  private createSplitContainer(direction: 'horizontal' | 'vertical'): HTMLElement {
    const container = createContainer(`editor-block split-container ${direction}`);
    container.setAttribute('contenteditable', 'false');
    container.setAttribute('data-block-type', 'split');
    container.setAttribute('data-direction', direction);

    // Создаем два блока внутри контейнера
    const block1 = this.createTextBlock(this.editor.t('Block 1'));
    const block2 = this.createTextBlock(this.editor.t('Block 2'));

    container.appendChild(block1);
    container.appendChild(block2);

    return container;
  }

  private createRangeAtEnd(container: HTMLElement): Range {
    const range = document.createRange();
    range.selectNodeContents(container);
    range.collapse(false);
    return range;
  }

  private insertBlockAtRange(block: HTMLElement, range: Range): void {
    // Проверяем, не находимся ли мы внутри другого блока
    const parentBlock = (range.commonAncestorContainer as Element).closest('.editor-block');
    
    if (parentBlock && parentBlock !== range.commonAncestorContainer) {
      // Вставляем после родительского блока
      parentBlock.parentNode?.insertBefore(block, parentBlock.nextSibling);
    } else {
      // Обычная вставка
      range.deleteContents();
      range.insertNode(block);
      range.collapse(false);
    }

    // Добавляем перенос строки после блока
    const lineBreak = createLineBreak();
    block.parentNode?.insertBefore(lineBreak, block.nextSibling);
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
