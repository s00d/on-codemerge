import type { HTMLEditor } from '../../../core/HTMLEditor';
import type { Command } from '../../../core/commands/Command';

export interface TableResponsiveOptions {
  breakpoint?: number;
  enableScroll?: boolean;
  enableTouch?: boolean;
  enableCards?: boolean;
}

interface TablePreviousState {
  classes: string[];
  width: string | null;
}

export class ApplyTableResponsiveCommand implements Command {
  private table: HTMLElement;
  private options: TableResponsiveOptions;
  private previousState: TablePreviousState;

  constructor(_editor: HTMLEditor, table: HTMLElement, options: TableResponsiveOptions) {
    this.table = table;
    this.options = options;

    // Сохраняем предыдущее состояние для отмены
    this.previousState = {
      classes: Array.from(this.table.classList),
      width: this.table.style.width || null,
    };
  }

  execute(): void {
    // Удаляем все responsive классы
    this.table.classList.remove(
      'responsive-table',
      'responsive-table--scroll',
      'responsive-table--touch',
      'responsive-table--cards'
    );

    // Удаляем все брейкпоинт классы
    this.table.classList.remove(
      'breakpoint-320',
      'breakpoint-480',
      'breakpoint-640',
      'breakpoint-768',
      'breakpoint-1024',
      'breakpoint-1280',
      'breakpoint-1440',
      'breakpoint-1536',
      'breakpoint-1920',
      'breakpoint-2560'
    );

    // Применяем брейкпоинт
    if (this.options.breakpoint) {
      this.table.classList.add(`breakpoint-${this.options.breakpoint}`);
    }

    // Применяем responsive классы
    // Добавляем базовый класс responsive-table если есть любые responsive настройки
    if (this.options.enableScroll || this.options.enableTouch || this.options.enableCards) {
      this.table.classList.add('responsive-table');
    }

    if (this.options.enableScroll) {
      this.table.classList.add('responsive-table--scroll');
      // При включении scroll убираем фиксированную ширину
      this.table.style.removeProperty('width');
    }
    if (this.options.enableTouch) {
      this.table.classList.add('responsive-table--touch');
    }
    if (this.options.enableCards) {
      this.table.classList.add('responsive-table--cards');
    }

    // Добавляем CSS переменные для responsive настроек
    if (this.options.breakpoint) {
      this.table.style.setProperty('--responsive-breakpoint', `${this.options.breakpoint}px`);
    }
    if (this.options.enableScroll) {
      this.table.style.setProperty('--responsive-enable-scroll', '1');
    } else {
      this.table.style.setProperty('--responsive-enable-scroll', '0');
    }
    if (this.options.enableTouch) {
      this.table.style.setProperty('--responsive-enable-touch', '1');
    } else {
      this.table.style.setProperty('--responsive-enable-touch', '0');
    }
    if (this.options.enableCards) {
      this.table.style.setProperty('--responsive-enable-cards', '1');
    } else {
      this.table.style.setProperty('--responsive-enable-cards', '0');
    }
  }

  undo(): void {
    // Восстанавливаем предыдущее состояние
    this.table.className = '';
    this.previousState.classes.forEach((className) => {
      this.table.classList.add(className);
    });

    // Восстанавливаем ширину
    if (this.previousState.width) {
      this.table.style.width = this.previousState.width;
    } else {
      this.table.style.removeProperty('width');
    }

    // Удаляем CSS переменные
    this.table.style.removeProperty('--responsive-breakpoint');
    this.table.style.removeProperty('--responsive-enable-scroll');
    this.table.style.removeProperty('--responsive-enable-touch');
    this.table.style.removeProperty('--responsive-enable-cards');
  }
}
