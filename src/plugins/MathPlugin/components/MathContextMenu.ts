import {editIcon, deleteIcon, alignLeftIcon, alignCenterIcon, alignRightIcon} from '../../../icons';
import { ContextMenu } from '../../../core/ui/ContextMenu.ts';
import type { HTMLEditor } from '../../../core/HTMLEditor.ts';
import type { MathMenu } from './MathMenu';

export class MathContextMenu {
  private contextMenu: ContextMenu;
  private activeMath: HTMLElement | null = null;

  constructor(
    editor: HTMLEditor,
    private mathMenu: MathMenu
  ) {
    this.contextMenu = new ContextMenu(
      editor,
      [
        {
          title: editor.t('Edit'),
          icon: editIcon,
          action: 'edit',
          onClick: () => this.handleEdit(),
        },
        {
          title: editor.t('Delete'),
          icon: deleteIcon,
          action: 'delete',
          className: 'text-red-600',
          onClick: () => this.handleDelete(),
        },
        {
          type: 'divider', // Разделитель между группами
        },
        {
          title: editor.t('Align Left'),
          icon: alignLeftIcon,
          action: 'align-left',
          onClick: () => this.handleAlign('flex-start'),
        },
        {
          title: editor.t('Align Center'),
          icon: alignCenterIcon,
          action: 'align-center',
          onClick: () => this.handleAlign('center'),
        },
        {
          title: editor.t('Align Right'),
          icon: alignRightIcon,
          action: 'align-right',
          onClick: () => this.handleAlign('flex-end'),
        },
      ],
      { orientation: 'vertical' }
    );
  }

  private handleAlign(alignment: 'flex-start' | 'center' | 'flex-end'): void {
    if (!this.activeMath) return;

    // Удаляем предыдущие классы выравнивания
    this.activeMath.parentElement?.classList.remove('align-left', 'align-center', 'align-right');

    // Добавляем новый класс в зависимости от выбранного выравнивания
    switch (alignment) {
      case 'flex-start':
        this.activeMath.parentElement?.classList.add('align-left');
        break;
      case 'center':
        this.activeMath.parentElement?.classList.add('align-center');
        break;
      case 'flex-end':
        this.activeMath.parentElement?.classList.add('align-right');
        break;
    }
  }


  private handleEdit(): void {
    if (!this.activeMath) return;

    const expression = this.activeMath.getAttribute('data-math-expression');
    if (expression) {
      this.mathMenu.edit(this.activeMath);
    }
  }

  private handleDelete(): void {
    if (this.activeMath) {
      this.activeMath.remove();
    }
  }

  public show(math: HTMLElement, x: number, y: number): void {
    this.activeMath = math;
    this.contextMenu.show(math, x, y);
  }

  public hide(): void {
    this.contextMenu.hide();
    this.activeMath = null;
  }

  public destroy(): void {
    if (typeof this.contextMenu.destroy === 'function') {
      this.contextMenu.destroy();
    }

    this.contextMenu = null!;
    this.activeMath = null;
    this.mathMenu = null!;
  }
}
