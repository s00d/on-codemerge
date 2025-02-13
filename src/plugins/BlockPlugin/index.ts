import './style.scss';
import './public.scss';

import type { Plugin } from '../../core/Plugin';
import type { HTMLEditor } from '../../core/HTMLEditor';
import { BlockContextMenu } from './components/BlockContextMenu';
import { BlockCommand } from './commands/BlockCommand';
import { createToolbarButton } from '../ToolbarPlugin/utils';
import { blockIcon } from '../../icons';
import { Resizer } from '../../utils/Resizer';

export class BlockPlugin implements Plugin {
  name = 'block';
  hotkeys = [{ keys: 'Ctrl+Alt+B', description: 'Insert block', command: 'block', icon: '🧱' }];
  private editor: HTMLEditor | null = null;
  private contextMenu: BlockContextMenu | null = null;
  private activeBlock: HTMLElement | null = null;
  private currentResizer: Resizer | null = null;

  initialize(editor: HTMLEditor): void {
    this.contextMenu = new BlockContextMenu(editor);
    this.editor = editor;
    this.addToolbarButton();
    this.setupBlockEvents();
    this.editor.on('block', () => {
      this.insertBlock();
    });
  }

  private addToolbarButton(): void {
    const toolbar = document.querySelector('.editor-toolbar');
    if (!toolbar) return;

    const button = createToolbarButton({
      icon: blockIcon,
      title: 'Insert Block',
      onClick: () => this.insertBlock(),
    });
    toolbar.appendChild(button);
  }

  private setupBlockEvents(): void {
    if (!this.editor) return;

    const container = this.editor.getContainer();

    // Сохраняем ссылки на обработчики для последующего удаления
    this.handleBlockClick = this.handleBlockClick.bind(this);
    this.handleContextMenu = this.handleContextMenu.bind(this);

    container.addEventListener('click', this.handleBlockClick);
    container.addEventListener('contextmenu', this.handleContextMenu);
  }

  private handleBlockClick(e: MouseEvent): void {
    if (!this.editor) return;

    const block = (e.target as Element).closest('.editor-block');

    if (block instanceof HTMLElement) {
      if (this.activeBlock !== block) {
        this.deactivateBlock();
        this.activateBlock(block);
      }

      if (this.currentResizer) {
        this.currentResizer.destroy();
        this.currentResizer = null;
      }

      // Создаем новый Resizer для блока
      this.currentResizer = new Resizer(block, {
        handleSize: 10,
        handleColor: 'blue',
        onResizeStart: () => this.editor?.disableObserver(),
        onResize: (width, height) => console.log(`Resized to ${width}x${height}`),
        onResizeEnd: () => this.editor?.enableObserver(),
      });

      // Фокусируемся на содержимом блока
      const content = block.querySelector('.block-content') as HTMLElement;
      if (content) {
        content.focus();
      }
    } else {
      this.deactivateBlock();
    }
  }

  private handleContextMenu(e: MouseEvent): void {
    const block = (e.target as Element).closest('.editor-block');
    if (block instanceof HTMLElement) {
      e.preventDefault();
      const mouseX = (e as MouseEvent).clientX + window.scrollX;
      const mouseY = (e as MouseEvent).clientY + window.scrollY;

      console.log('Mouse coordinates with scroll:', mouseX, mouseY);

      this.contextMenu?.show(block, mouseX, mouseY);
    }
  }

  private activateBlock(block: HTMLElement): void {
    this.activeBlock = block;
    block.classList.add('active');
    block.focus();
  }

  private deactivateBlock(): void {
    if (this.activeBlock) {
      this.activeBlock.classList.remove('active');
      const content = this.activeBlock.querySelector('.block-content') as HTMLElement;
      if (content) {
        content.contentEditable = 'false';
      }
    }
    this.activeBlock = null;
  }

  private insertBlock(): void {
    if (!this.editor) return;

    const command = new BlockCommand(this.editor);
    command.execute();
  }

  destroy(): void {
    if (this.editor) {
      const container = this.editor.getContainer();
      container.removeEventListener('click', this.handleBlockClick);
      container.removeEventListener('contextmenu', this.handleContextMenu);
    }

    this.editor?.off('block');

    if (this.currentResizer) {
      this.currentResizer.destroy();
      this.currentResizer = null;
    }

    if (this.contextMenu) {
      this.contextMenu.destroy();
      this.contextMenu = null;
    }

    this.deactivateBlock();

    this.editor = null;
    this.activeBlock = null;
  }
}
