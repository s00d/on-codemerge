import './style.scss';
import './public.scss';

import type { Plugin } from '../../core/Plugin';
import type { HTMLEditor } from '../../core/HTMLEditor';
import { BlockContextMenu } from './components/BlockContextMenu';
import { BlockCommand } from './commands/BlockCommand';
import { MergeBlocksCommand } from './commands/MergeBlocksCommand';
import { createToolbarButton } from '../ToolbarPlugin/utils';
import { blockIcon } from '../../icons';
import { Resizer } from '../../utils/Resizer';

export class BlockPlugin implements Plugin {
  name = 'block';
  hotkeys = [
    { keys: 'Ctrl+Alt+N', description: 'Insert block', command: 'block', icon: '🧱' },
    { keys: 'Ctrl+Alt+T', description: 'Insert text block', command: 'block-text', icon: '📝' },
    { keys: 'Ctrl+Alt+C', description: 'Insert container', command: 'block-container', icon: '📦' },
  ];
  private editor: HTMLEditor | null = null;
  private contextMenu: BlockContextMenu | null = null;
  private activeBlock: HTMLElement | null = null;
  private currentResizer: Resizer | null = null;
  private isProcessing = false;

  initialize(editor: HTMLEditor): void {
    this.contextMenu = new BlockContextMenu(editor);
    this.editor = editor;
    this.addToolbarButton();
    this.setupBlockEvents();
    this.setupKeyboardEvents();

    this.editor.on('block', () => {
      this.insertBlock();
    });
    this.editor.on('block-text', () => {
      this.insertTextBlock();
    });
    this.editor.on('block-container', () => {
      this.insertContainerBlock();
    });
  }

  private addToolbarButton(): void {
    const toolbar = this.editor?.getToolbar();
    if (!toolbar) return;

    const button = createToolbarButton({
      icon: blockIcon,
      title: this.editor?.t('Insert Block') || 'Insert Block',
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
    this.handleBlockKeydown = this.handleBlockKeydown.bind(this);
    this.handleBlockBlur = this.handleBlockBlur.bind(this);
    this.handleBlockFocus = this.handleBlockFocus.bind(this);
    this.handleBlockMouseDown = this.handleBlockMouseDown.bind(this);

    container.addEventListener('click', this.handleBlockClick);
    container.addEventListener('contextmenu', this.handleContextMenu);
    container.addEventListener('keydown', this.handleBlockKeydown);
    container.addEventListener('blur', this.handleBlockBlur, true);
    container.addEventListener('focus', this.handleBlockFocus, true);
    container.addEventListener('mousedown', this.handleBlockMouseDown);
  }

  private setupKeyboardEvents(): void {
    if (!this.editor) return;

    // Обработка Enter для создания новых блоков
    this.editor.on('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        const target = e.target as HTMLElement;
        const block = target.closest('.editor-block');

        if (block && target.classList.contains('block-content')) {
          e.preventDefault();
          this.createNewBlockAfter(block as HTMLElement);
        }
      }

      // Обработка Tab для навигации между блоками
      if (e.key === 'Tab') {
        const target = e.target as HTMLElement;
        const block = target.closest('.editor-block');

        if (block && target.classList.contains('block-content')) {
          e.preventDefault();

          if (e.shiftKey) {
            // Переход к предыдущему блоку
            const prevBlock = block.previousElementSibling as HTMLElement;
            if (prevBlock && prevBlock.classList.contains('editor-block')) {
              const prevContent = prevBlock.querySelector('.block-content') as HTMLElement;
              if (prevContent && prevContent.contentEditable === 'true') {
                prevContent.focus();
              }
            }
          } else {
            // Переход к следующему блоку
            const nextBlock = block.nextElementSibling as HTMLElement;
            if (nextBlock && nextBlock.classList.contains('editor-block')) {
              const nextContent = nextBlock.querySelector('.block-content') as HTMLElement;
              if (nextContent && nextContent.contentEditable === 'true') {
                nextContent.focus();
              }
            }
          }
        }
      }
    });
  }

  private handleBlockClick(e: MouseEvent): void {
    if (this.isProcessing) return;

    const block = (e.target as Element).closest('.editor-block');
    if (!block) {
      this.deactivateBlock();
      return;
    }

    // Если кликнули на тот же блок, просто включаем редактирование если нужно
    if (this.activeBlock === block) {
      const content = block.querySelector('.block-content') as HTMLElement;
      const blockType = block.getAttribute('data-block-type');

      // Включаем режим редактирования только если он был выключен
      if (blockType === 'text' && content && content.contentEditable !== 'true') {
        content.contentEditable = 'true';
        // НЕ вызываем content.focus() - браузер сам поставит курсор
      }
      return;
    }

    // Активируем новый блок
    this.deactivateBlock();
    this.activateBlock(block as HTMLElement);

    // Создаем Resizer только для текстовых блоков
    if (block.getAttribute('data-block-type') === 'text') {
      this.createResizer(block as HTMLElement);
    }
  }

  private handleContextMenu(e: MouseEvent): void {
    const block = (e.target as Element).closest('.editor-block');
    if (block instanceof HTMLElement) {
      e.preventDefault();
      const mouseX = e.clientX + window.scrollX;
      const mouseY = e.clientY + window.scrollY;

      this.contextMenu?.show(block, mouseX, mouseY);
    }
  }

  private handleBlockKeydown(e: KeyboardEvent): void {
    const target = e.target as HTMLElement;
    const block = target.closest('.editor-block');

    if (!block) return;

    // Обработка Backspace для объединения с предыдущим блоком
    if (e.key === 'Backspace' && target.classList.contains('block-content')) {
      const content = target.textContent || '';
      if (content.length === 0) {
        e.preventDefault();
        this.mergeWithPreviousBlock(block as HTMLElement);
      }
    }

    // Обработка Delete для объединения со следующим блоком
    if (e.key === 'Delete' && target.classList.contains('block-content')) {
      const content = target.textContent || '';
      if (content.length === 0) {
        e.preventDefault();
        this.mergeWithNextBlock(block as HTMLElement);
      }
    }
  }

  private handleBlockBlur(e: FocusEvent): void {
    // Автоматически объединяем пустые соседние блоки только если фокус ушел из редактора
    const container = this.editor?.getContainer();

    if (container && !container.contains(e.relatedTarget as Node)) {
      setTimeout(() => {
        this.autoMergeEmptyBlocks();
      }, 100);
    }
  }

  private handleBlockFocus(e: FocusEvent): void {
    const target = e.target as HTMLElement;
    const block = target.closest('.editor-block');

    if (block && target.classList.contains('block-content')) {
      // Активируем блок при фокусе на содержимом, но не устанавливаем позицию курсора
      if (this.activeBlock !== block) {
        this.deactivateBlock();
        this.activateBlock(block as HTMLElement);
      }
    }
  }

  private handleBlockMouseDown(e: MouseEvent): void {
    const target = e.target as HTMLElement;
    const block = target.closest('.editor-block');

    // Если кликнули на содержимое блока, не вмешиваемся в установку курсора
    if (block && target.classList.contains('block-content') && target.contentEditable === 'true') {
      // Позволяем браузеру самому установить позицию курсора
      return;
    }
  }

  private activateBlock(block: HTMLElement): void {
    this.activeBlock = block;
    block.classList.add('active');

    // Убеждаемся, что contentEditable установлен правильно
    const content = block.querySelector('.block-content') as HTMLElement;
    if (content) {
      const blockType = block.getAttribute('data-block-type');

      if (blockType === 'text') {
        content.contentEditable = 'true';
        // НЕ устанавливаем фокус программно - браузер сам поставит курсор
      } else {
        content.contentEditable = 'false';
      }
    }
  }

  private deactivateBlock(): void {
    if (this.activeBlock) {
      this.activeBlock.classList.remove('active');
    }
    this.activeBlock = null;

    if (this.currentResizer) {
      this.currentResizer.destroy();
      this.currentResizer = null;
    }
  }

  private createResizer(block: HTMLElement): void {
    if (this.currentResizer) {
      this.currentResizer.destroy();
    }

    this.currentResizer = new Resizer(block, {
      handleSize: 8,
      handleColor: '#2563eb',
      onResizeStart: () => {
        this.editor?.disableObserver();
        this.isProcessing = true;
      },
      onResize: (width, height) => {
        // Обновляем размеры блока
        block.style.width = width + 'px';
        block.style.height = height + 'px';
      },
      onResizeEnd: () => {
        this.editor?.enableObserver();
        this.isProcessing = false;
      },
    });
  }

  private insertBlock(): void {
    if (!this.editor) return;

    const command = new BlockCommand(this.editor);
    command.execute();
  }

  private insertTextBlock(): void {
    if (!this.editor) return;

    const command = new BlockCommand(this.editor);
    command.execute({ type: 'text' });
  }

  private insertContainerBlock(): void {
    if (!this.editor) return;

    const command = new BlockCommand(this.editor);
    command.execute({ type: 'container' });
  }

  private createNewBlockAfter(_block: HTMLElement): void {
    if (!this.editor) return;

    const command = new BlockCommand(this.editor);
    command.execute({ type: 'text' });

    // НЕ устанавливаем фокус программно - браузер сам поставит курсор
    // setTimeout(() => {
    //   const newBlock = block.nextElementSibling as HTMLElement;
    //   if (newBlock && newBlock.classList.contains('editor-block')) {
    //     const content = newBlock.querySelector('.block-content') as HTMLElement;
    //     if (content && content.contentEditable === 'true') {
    //       content.focus();
    //     }
    //   }
    // }, 10);
  }

  private mergeWithPreviousBlock(block: HTMLElement): void {
    const prevBlock = block.previousElementSibling as HTMLElement;
    if (prevBlock && prevBlock.classList.contains('editor-block')) {
      this.mergeBlocks([prevBlock, block]);
    }
  }

  private mergeWithNextBlock(block: HTMLElement): void {
    const nextBlock = block.nextElementSibling as HTMLElement;
    if (nextBlock && nextBlock.classList.contains('editor-block')) {
      this.mergeBlocks([block, nextBlock]);
    }
  }

  private mergeBlocks(blocks: HTMLElement[]): void {
    if (!this.editor || blocks.length < 2) return;

    const command = new MergeBlocksCommand(this.editor);
    command.setData({ blocks });
    command.execute();
  }

  private autoMergeEmptyBlocks(): void {
    if (!this.editor) return;

    const container = this.editor.getContainer();
    const blocks = container.querySelectorAll('.editor-block');

    for (const block of blocks) {
      const content = block.querySelector('.block-content') as HTMLElement;
      if (content && (!content.textContent || content.textContent.trim() === '')) {
        const nextBlock = block.nextElementSibling as HTMLElement;
        if (nextBlock && nextBlock.classList.contains('editor-block')) {
          this.mergeBlocks([block as HTMLElement, nextBlock]);
          break; // Обрабатываем по одному за раз
        }
      }
    }
  }

  destroy(): void {
    if (this.editor) {
      // Убираем обработчики с контейнера редактора
      const container = this.editor.getContainer();
      container.removeEventListener('click', this.handleBlockClick);
      container.removeEventListener('contextmenu', this.handleContextMenu);
      container.removeEventListener('keydown', this.handleBlockKeydown);
      container.removeEventListener('blur', this.handleBlockBlur, true);
      container.removeEventListener('focus', this.handleBlockFocus, true);
      container.removeEventListener('mousedown', this.handleBlockMouseDown);
    }

    this.editor?.off('block');
    this.editor?.off('block-text');
    this.editor?.off('block-container');

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
