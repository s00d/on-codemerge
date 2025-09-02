import './style.scss';
import './public.scss';
import type { Plugin } from '../../core/Plugin';
import type { HTMLEditor } from '../../core/HTMLEditor';
import { MathMenu } from './components/MathMenu';
import { MathContextMenu } from './components/MathContextMenu';
import { createToolbarButton } from '../ToolbarPlugin/utils';
import { Resizer } from '../../utils/Resizer.ts';
import { createLineBreak, createSpan } from '../../utils/helpers.ts';
import { mathIcon } from '../../icons';

export class MathPlugin implements Plugin {
  name = 'math';
  hotkeys = [
    { keys: 'Ctrl+Shift+M', description: 'Insert math formula', command: 'math-editor', icon: '𝛢' },
  ];
  private editor: HTMLEditor | null = null;
  private menu: MathMenu | null = null;
  private contextMenu: MathContextMenu | null = null;
  private currentResizer: Resizer | null = null;
  private toolbarButton: HTMLElement | null = null;
  private draggedElement: HTMLElement | null = null;

  constructor() {}

  initialize(editor: HTMLEditor): void {
    this.editor = editor;
    this.menu = new MathMenu(editor);
    this.contextMenu = new MathContextMenu(editor, this.menu);
    this.addToolbarButton();
    this.setupMathEvents();
    this.editor.on('math', () => {
      this.insertMath();
    });

    this.editor.on('drag-start', ({ e }: { e: DragEvent }) => {
      const math = (e.target as Element).closest('.math-wrapper');
      if (math instanceof HTMLElement) {
        this.handleDragStart(e, math);
      }
    });

    // Обработка завершения перетаскивания
    this.editor.on('drag-end', ({ e }: { e: DragEvent }) => {
      const math = (e.target as Element).closest('.math-wrapper');
      if (math instanceof HTMLElement) {
        this.handleDragEnd(e, math);
      }
    });

    this.editor.on('drag-over', ({ e }: { e: DragEvent }) => {
      this.handleDragOver(e);
    });

    this.editor.on('drag-drop', ({ e }: { e: DragEvent }) => {
      this.handleDrop(e);
    });
  }

  private handleDragStart(e: DragEvent, wrapper: HTMLElement): void {
    if (!e.dataTransfer) return;

    this.draggedElement = wrapper;
    e.dataTransfer.setData('text/plain', ''); // Для совместимости с браузерами
    e.dataTransfer.effectAllowed = 'move';

    wrapper.classList.add('dragging');
  }

  private handleDragOver(e: DragEvent): void {
    if (!this.draggedElement) return;

    e.preventDefault(); // Разрешаем сброс элемента
    e.dataTransfer!.dropEffect = 'move';
  }

  private handleDragEnd(_e: DragEvent, wrapper: HTMLElement): void {
    wrapper.classList.remove('dragging');
    this.draggedElement = null;
  }

  private handleDrop(e: DragEvent): void {
    if (!this.draggedElement || !this.editor) return;

    e.preventDefault();
    const container = this.editor.getContainer();

    // Убираем элемент из его текущей позиции
    const parent = this.draggedElement.parentElement;
    if (parent) {
      parent.removeChild(this.draggedElement);
    }

    // Определяем место вставки
    const range = document.caretRangeFromPoint(e.clientX, e.clientY);
    if (range) {
      range.insertNode(this.draggedElement);
    } else {
      container.appendChild(this.draggedElement); // Если точка не определена, добавляем в конец
    }

    this.draggedElement.classList.remove('dragging');
    this.draggedElement = null;
  }

  private addToolbarButton(): void {
    const toolbar = this.editor?.getToolbar();
    if (!toolbar) return;

    this.toolbarButton = createToolbarButton({
      icon: mathIcon,
      title: this.editor?.t('Insert Math'),
      onClick: () => {
        this.insertMath();
      },
    });
    toolbar.appendChild(this.toolbarButton);
  }

  private setupMathEvents(): void {
    if (!this.editor) return;

    const container = this.editor.getContainer();

    // Handle math clicks for resizing
    container.addEventListener('click', (e) => {
      const math = (e.target as Element).closest('.math-container');
      if (math instanceof HTMLElement) {
        if (this.currentResizer) {
          this.currentResizer.destroy();
          this.currentResizer = null;
        }

        this.currentResizer = new Resizer(math, {
          handleSize: 10,
          handleColor: 'blue',
          onResizeStart: () => this.editor?.disableObserver(),
          onResize: (width, height) => {
            console.log(`Resized to ${width}x${height}`);
            if (math instanceof HTMLElement) {
              this.menu?.redrawMath(math, math.dataset?.mathExpression ?? '', {
                width: width,
                height: height,
              });
            }
          },
          onResizeEnd: () => this.editor?.enableObserver(),
        });
      }
    });

    // Handle context menu
    container.addEventListener('contextmenu', (e) => {
      const math = (e.target as Element).closest('.math-container');
      if (math instanceof HTMLElement) {
        e.preventDefault();
              const mouseX = (e as MouseEvent).clientX;
      const mouseY = (e as MouseEvent).clientY;

        this.contextMenu?.show(math, mouseX, mouseY);
      }
    });
  }

  private insertMath(): void {
    if (!this.editor) return;

    // Сохраняем позицию курсора перед открытием меню
    const savedPosition = this.editor.saveCursorPosition();

    this.menu?.show((mathElement) => {
      if (!this.editor) return;

      // Восстанавливаем позицию курсора
      if (savedPosition) {
        this.editor.restoreCursorPosition(savedPosition);
      }

      const wrapper = createSpan('math-wrapper my-4');
      wrapper.draggable = true;
      wrapper.appendChild(mathElement);
      wrapper.appendChild(createLineBreak());

      // Используем встроенный метод insertContent для вставки математической формулы
      this.editor.insertContent(wrapper);
    });
  }

  public destroy(): void {
    if (this.menu) {
      this.menu.destroy();
      this.menu = null;
    }
    if (this.contextMenu) {
      this.contextMenu.destroy();
      this.contextMenu = null;
    }

    if (this.currentResizer) {
      this.currentResizer.destroy();
      this.currentResizer = null;
    }

    if (this.toolbarButton && this.toolbarButton.parentElement) {
      this.toolbarButton.parentElement.removeChild(this.toolbarButton);
      this.toolbarButton = null;
    }

    this.editor?.off('math');

    this.editor = null;
  }
}
