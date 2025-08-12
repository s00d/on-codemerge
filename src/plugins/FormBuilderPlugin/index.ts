import './style.scss';
import './public.scss';

import type { HTMLEditor } from '../../app';
import type { Plugin } from '../../core/Plugin';
import { ContextMenu } from '../../core/ui/ContextMenu.ts';
import { deleteIcon, editIcon, formIcon } from '../../icons/';
import { FormManager } from './services/FormManager.ts';
import { TemplateManager } from './services/TemplateManager.ts';
import { FormPopup } from './components/FormPopup.ts';
import { TemplatesModal } from './components/TemplatesModal.ts';
import { FormBuilderModal } from './components/FormBuilderModal.ts';
import type { FormConfig } from './types';
import { createToolbarButton } from '../ToolbarPlugin/utils.ts';
import { createLineBreak } from '../../utils/helpers';
import { DeleteFormCommand } from './commands/DeleteFormCommand';
import { DuplicateFormCommand } from './commands/DuplicateFormCommand';

export class FormBuilderPlugin implements Plugin {
  name = 'form-builder';
  hotkeys = [{ keys: 'Ctrl+Alt+F', description: 'Insert form', command: 'form', icon: '📝' }];

  private editor!: HTMLEditor;
  private formPopup: FormPopup | null = null;
  private templatesModal: TemplatesModal | null = null;
  private contextMenu: ContextMenu | null = null;
  private formManager!: FormManager;
  private templateManager!: TemplateManager;

  constructor() {}

  /**
   * Initialize plugin
   */
  initialize(editor: HTMLEditor): void {
    this.editor = editor;
    this.formPopup = new FormPopup(this.editor);
    this.templatesModal = new TemplatesModal(this.editor);
    this.addToolbarButton();
    this.setupContextMenu();
    this.setupFormEvents();

    this.formManager = new FormManager(this.editor);
    this.templateManager = new TemplateManager(this.editor);
    this.templateManager.initialize();

    this.editor.on('form', () => {
      this.openFormBuilder();
    });
  }

  /**
   * Open form builder modal
   */
  private openFormBuilder(): void {
    // Сохраняем позицию курсора перед открытием модального окна
    const savedPosition = this.editor.saveCursorPosition();
    
    const formBuilderModal = new FormBuilderModal(this.editor);
    formBuilderModal.show(
      (formConfig: FormConfig) => {
        // Восстанавливаем позицию курсора
        if (savedPosition) {
          this.editor.restoreCursorPosition(savedPosition);
        }
        
        const formHtml = this.formManager.createForm(formConfig);

        // Вставляем форму используя встроенный метод insertContent
        this.editor.insertContent(formHtml);
        this.editor.insertContent(createLineBreak());
        
        // destroy не нужен, popup просто скрывается
      },
      false,
      null
    );
  }

  /**
   * Setup context menu
   */
  private setupContextMenu(): void {
    const buttons = [
      {
        label: this.editor.t('Edit Form'),
        icon: editIcon,
        onClick: (element: HTMLElement | null) => {
          if (element && element.tagName === 'FORM') {
            const formBuilderModal = new FormBuilderModal(this.editor);
            formBuilderModal.show(
              (_formConfig: FormConfig) => {
                // destroy не нужен, popup просто скрывается
              },
              true,
              element
            );
          }
        },
      },
      {
        label: this.editor.t('Duplicate Form'),
        icon: formIcon,
        onClick: (element: HTMLElement | null) => {
          if (element && element.tagName === 'FORM') {
            const command = new DuplicateFormCommand(this.editor, element);
            command.execute();
          }
        },
      },
      {
        label: this.editor.t('Delete Form'),
        icon: deleteIcon,
        onClick: (element: HTMLElement | null) => {
          if (element && element.tagName === 'FORM') {
            const command = new DeleteFormCommand(this.editor, element);
            command.execute();
          }
        },
      },
    ];

    this.contextMenu = new ContextMenu(this.editor, buttons);
  }

  /**
   * Setup form events
   */
  private setupFormEvents(): void {
    if (!this.editor) return;

    const container = this.editor.getContainer();
    if (!container) return;

    container.addEventListener('contextmenu', this.handleFormContextMenu);
  }

  /**
   * Handle form context menu
   */
  private handleFormContextMenu = (e: Event): void => {
    const form = (e.target as Element).closest('form');
    if (form instanceof HTMLElement) {
      e.preventDefault();

      // Получаем координаты мыши с учётом прокрутки страницы
      const mouseX = (e as MouseEvent).clientX + window.scrollX;
      const mouseY = (e as MouseEvent).clientY + window.scrollY;

      // Показываем контекстное меню
      this.contextMenu?.show(form, mouseX, mouseY);
    }
  };

  /**
   * Add toolbar button
   */
  private addToolbarButton(): void {
    const toolbar = this.editor?.getToolbar();
    if (toolbar) {
      const button = createToolbarButton({
        icon: formIcon,
        title: this.editor.t('Insert Form'),
        onClick: () => {
          this.openFormBuilder();
        },
      });
      toolbar.appendChild(button);
    }
  }

  /**
   * Destroy plugin
   */
  destroy(): void {
    if (this.contextMenu) {
      this.contextMenu.destroy();
      this.contextMenu = null;
    }
    if (this.formPopup) {
      this.formPopup.destroy();
      this.formPopup = null;
    }
    if (this.templatesModal) {
      this.templatesModal.destroy();
      this.templatesModal = null;
    }

    // Удаляем обработчик событий
    if (this.editor) {
      const container = this.editor.getContainer();
      if (container) {
        container.removeEventListener('contextmenu', this.handleFormContextMenu);
      }
    }
  }
}

export default FormBuilderPlugin;
