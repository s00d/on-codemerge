import type { Command } from '../../../core/commands/Command';
import type { HTMLEditor } from '../../../core/HTMLEditor';

export interface DeleteBlockCommandData {
  block: HTMLElement;
}

export class DeleteBlockCommand implements Command {
  name = 'deleteBlock';
  private block: HTMLElement | null = null;
  private parentNode: Node | null = null;
  private nextSibling: Node | null = null;
  private deletedBlock: HTMLElement | null = null;

  constructor(_editor: HTMLEditor) {}

  setBlock(block: HTMLElement): void {
    this.block = block;
  }

  execute(): void {
    if (!this.block || !this.isValidBlock(this.block)) return;

    // Сохраняем информацию для отмены
    this.deletedBlock = this.block;
    this.parentNode = this.block.parentNode;
    this.nextSibling = this.block.nextSibling;

    // Удаляем блок
    this.block.remove();
  }

  undo(): void {
    if (!this.parentNode || !this.deletedBlock) return;

    if (this.nextSibling) {
      this.parentNode.insertBefore(this.deletedBlock, this.nextSibling);
    } else {
      this.parentNode.appendChild(this.deletedBlock);
    }
  }

  private isValidBlock(block: HTMLElement): boolean {
    return block.classList.contains('editor-block');
  }
}
