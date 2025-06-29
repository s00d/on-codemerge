import type { HTMLEditor } from '../../../core/HTMLEditor';
import { PopupManager } from '../../../core/ui/PopupManager';
import { TABLE_STYLES, TABLE_THEMES, BORDER_STYLES, BORDER_WIDTHS } from './TableStyles';
import {
  createContainer,
  createSelectField,
  createInputField,
  createLabel,
} from '../../../utils/helpers';
import { ApplyTableStyleCommand, type TableStyleOptions } from '../commands/ApplyTableStyleCommand';
import {
  ApplyTableResponsiveCommand,
  type TableResponsiveOptions,
} from '../commands/ApplyTableResponsiveCommand';
import { GetTableBreakpointCommand } from '../commands/GetTableBreakpointCommand';

export interface TableEditorOptions {
  style?: string;
  theme?: string;
  width?: string;
  height?: string;
  cellPadding?: string;
  cellSpacing?: string;
  borderWidth?: string;
  borderStyle?: string;
  borderColor?: string;
  headerBackground?: string;
  headerColor?: string;
  zebraStripe?: boolean;
  hoverEffect?: boolean;
  // Responsive settings
  breakpoint?: number;
  enableScroll?: boolean;
  enableTouch?: boolean;
  enableCards?: boolean;
}

export class TableEditor {
  private editor: HTMLEditor;
  private popup: PopupManager;
  private activeTable: HTMLElement | null = null;
  private options: TableEditorOptions = {
    breakpoint: 768,
    enableScroll: false,
    enableTouch: false,
    enableCards: false,
  };

  constructor(editor: HTMLEditor) {
    this.editor = editor;
    this.popup = new PopupManager(editor, {
      title: editor.t('Table Properties'),
      className: 'table-editor-popup',
      closeOnClickOutside: true,
      buttons: [
        {
          label: editor.t('Apply'),
          variant: 'primary',
          onClick: () => this.applyChanges(),
        },
        {
          label: editor.t('Cancel'),
          variant: 'secondary',
          onClick: () => this.popup.hide(),
        },
      ],
      items: [
        {
          type: 'custom',
          id: 'table-editor-content',
          content: () => this.createContent(),
        },
      ],
    });
  }

  private createContent(): HTMLElement {
    const container = createContainer('table-editor-content p-4 space-y-4');

    // Style and Theme
    const styleSection = this.createStyleSection();
    container.appendChild(styleSection);

    // Dimensions
    const dimensionsSection = this.createDimensionsSection();
    container.appendChild(dimensionsSection);

    // Borders
    const bordersSection = this.createBordersSection();
    container.appendChild(bordersSection);

    // Colors
    const colorsSection = this.createColorsSection();
    container.appendChild(colorsSection);

    // Effects
    const effectsSection = this.createEffectsSection();
    container.appendChild(effectsSection);

    // Responsive
    const responsiveSection = this.createResponsiveSection();
    container.appendChild(responsiveSection);

    return container;
  }

  private createStyleSection(): HTMLElement {
    const section = createContainer('style-section');
    const title = document.createElement('h3');
    title.textContent = this.editor.t('Style & Theme');
    title.className = 'text-lg font-semibold mb-3';

    // Style selector
    const styleContainer = createContainer('mb-3');
    const styleLabel = createLabel(this.editor.t('Table Style'));
    const styleSelect = createSelectField(
      TABLE_STYLES.map((style) => ({ value: style.id, label: style.name })),
      this.options.style || 'default',
      (value: string) => (this.options.style = value)
    );
    styleContainer.appendChild(styleLabel);
    styleContainer.appendChild(styleSelect);

    // Theme selector
    const themeContainer = createContainer('mb-3');
    const themeLabel = createLabel(this.editor.t('Theme'));
    const themeSelect = createSelectField(
      TABLE_THEMES.map((theme) => ({ value: theme.id, label: theme.name })),
      this.options.theme || 'light',
      (value: string) => (this.options.theme = value)
    );
    themeContainer.appendChild(themeLabel);
    themeContainer.appendChild(themeSelect);

    section.appendChild(title);
    section.appendChild(styleContainer);
    section.appendChild(themeContainer);

    return section;
  }

  private createDimensionsSection(): HTMLElement {
    const section = createContainer('dimensions-section');
    const title = document.createElement('h3');
    title.textContent = this.editor.t('Dimensions');
    title.className = 'text-lg font-semibold mb-3';

    // Width
    const widthContainer = createContainer('mb-3 width-container');
    const widthLabel = createLabel(this.editor.t('Width'));
    const widthInput = createInputField(
      'text',
      'e.g., 100%, 800px',
      this.options.width || '100%',
      (value: string) => (this.options.width = value)
    );
    widthInput.name = 'width';

    // Отключаем поле Width если включен scroll
    if (this.options.enableScroll) {
      widthInput.disabled = true;
      widthInput.style.opacity = '0.5';
      widthInput.style.cursor = 'not-allowed';
    }

    widthContainer.appendChild(widthLabel);
    widthContainer.appendChild(widthInput);

    // Warning about scroll conflict
    if (this.options.enableScroll) {
      const warningContainer = createContainer('mb-3 width-warning');
      const warning = document.createElement('p');
      warning.textContent = this.editor.t(
        'Note: Width is disabled when Horizontal Scroll is enabled'
      );
      warning.className =
        'text-sm text-orange-600 bg-orange-50 p-2 rounded border border-orange-200';
      warningContainer.appendChild(warning);
      widthContainer.appendChild(warningContainer);
    }

    // Cell padding
    const paddingContainer = createContainer('mb-3');
    const paddingLabel = createLabel(this.editor.t('Cell Padding'));
    const paddingInput = createInputField(
      'text',
      'e.g., 8px',
      this.options.cellPadding || '8px',
      (value: string) => (this.options.cellPadding = value)
    );
    paddingContainer.appendChild(paddingLabel);
    paddingContainer.appendChild(paddingInput);

    section.appendChild(title);
    section.appendChild(widthContainer);
    section.appendChild(paddingContainer);

    return section;
  }

  private createBordersSection(): HTMLElement {
    const section = createContainer('borders-section');
    const title = document.createElement('h3');
    title.textContent = this.editor.t('Borders');
    title.className = 'text-lg font-semibold mb-3';

    // Border style
    const styleContainer = createContainer('mb-3');
    const styleLabel = createLabel(this.editor.t('Border Style'));
    const styleSelect = createSelectField(
      BORDER_STYLES.map((border) => ({ value: border.value, label: border.label })),
      this.options.borderStyle || 'solid',
      (value: string) => (this.options.borderStyle = value)
    );
    styleContainer.appendChild(styleLabel);
    styleContainer.appendChild(styleSelect);

    // Border width
    const widthContainer = createContainer('mb-3');
    const widthLabel = createLabel(this.editor.t('Border Width'));
    const widthSelect = createSelectField(
      BORDER_WIDTHS.map((width) => ({ value: width.value, label: width.label })),
      this.options.borderWidth || '1px',
      (value: string) => (this.options.borderWidth = value)
    );
    widthContainer.appendChild(widthLabel);
    widthContainer.appendChild(widthSelect);

    // Border color
    const colorContainer = createContainer('mb-3');
    const colorLabel = createLabel(this.editor.t('Border Color'));
    const colorInput = createInputField(
      'color',
      '',
      this.options.borderColor || '#e0e0e0',
      (value: string) => (this.options.borderColor = value)
    );
    colorContainer.appendChild(colorLabel);
    colorContainer.appendChild(colorInput);

    section.appendChild(title);
    section.appendChild(styleContainer);
    section.appendChild(widthContainer);
    section.appendChild(colorContainer);

    return section;
  }

  private createColorsSection(): HTMLElement {
    const section = createContainer('colors-section');
    const title = document.createElement('h3');
    title.textContent = this.editor.t('Colors');
    title.className = 'text-lg font-semibold mb-3';

    // Header background
    const headerBgContainer = createContainer('mb-3');
    const headerBgLabel = createLabel(this.editor.t('Header Background'));
    const headerBgInput = createInputField(
      'color',
      '',
      this.options.headerBackground || '#f8f9fa',
      (value: string) => (this.options.headerBackground = value)
    );
    headerBgContainer.appendChild(headerBgLabel);
    headerBgContainer.appendChild(headerBgInput);

    // Header text color
    const headerColorContainer = createContainer('mb-3');
    const headerColorLabel = createLabel(this.editor.t('Header Text Color'));
    const headerColorInput = createInputField(
      'color',
      '',
      this.options.headerColor || '#495057',
      (value: string) => (this.options.headerColor = value)
    );
    headerColorContainer.appendChild(headerColorLabel);
    headerColorContainer.appendChild(headerColorInput);

    section.appendChild(title);
    section.appendChild(headerBgContainer);
    section.appendChild(headerColorContainer);

    return section;
  }

  private createEffectsSection(): HTMLElement {
    const section = createContainer('effects-section');
    const title = document.createElement('h3');
    title.textContent = this.editor.t('Effects');
    title.className = 'text-lg font-semibold mb-3';

    // Zebra stripe
    const zebraContainer = createContainer('mb-3');
    const zebraLabel = createLabel(this.editor.t('Zebra Stripe'));
    const zebraCheckbox = document.createElement('input');
    zebraCheckbox.type = 'checkbox';
    zebraCheckbox.checked = this.options.zebraStripe || false;
    zebraCheckbox.className =
      'form-checkbox h-4 w-4 text-blue-600 transition duration-150 ease-in-out';
    zebraCheckbox.addEventListener('change', (e) => {
      this.options.zebraStripe = (e.target as HTMLInputElement).checked;
    });
    zebraContainer.appendChild(zebraLabel);
    zebraContainer.appendChild(zebraCheckbox);

    // Hover effect
    const hoverContainer = createContainer('mb-3');
    const hoverLabel = createLabel(this.editor.t('Hover Effect'));
    const hoverCheckbox = document.createElement('input');
    hoverCheckbox.type = 'checkbox';
    hoverCheckbox.checked = this.options.hoverEffect || false;
    hoverCheckbox.className =
      'form-checkbox h-4 w-4 text-blue-600 transition duration-150 ease-in-out';
    hoverCheckbox.addEventListener('change', (e) => {
      this.options.hoverEffect = (e.target as HTMLInputElement).checked;
    });
    hoverContainer.appendChild(hoverLabel);
    hoverContainer.appendChild(hoverCheckbox);

    section.appendChild(title);
    section.appendChild(zebraContainer);
    section.appendChild(hoverContainer);

    return section;
  }

  private createResponsiveSection(): HTMLElement {
    const section = createContainer('responsive-section');
    const title = document.createElement('h3');
    title.textContent = this.editor.t('Responsive Settings');
    title.className = 'text-lg font-semibold mb-3';

    // Breakpoint
    const breakpointContainer = createContainer('mb-3');
    const breakpointLabel = createLabel(this.editor.t('Breakpoint'));
    const breakpointSelect = createSelectField(
      [
        { value: '320', label: 'Mobile Small (320px)' },
        { value: '480', label: 'Mobile (480px)' },
        { value: '640', label: 'Mobile Large (640px)' },
        { value: '768', label: 'Tablet (768px)' },
        { value: '1024', label: 'Tablet Large (1024px)' },
        { value: '1280', label: 'Desktop (1280px)' },
        { value: '1440', label: 'Desktop Large (1440px)' },
        { value: '1536', label: 'Desktop XL (1536px)' },
        { value: '1920', label: 'Desktop 2XL (1920px)' },
        { value: '2560', label: 'Desktop 3XL (2560px)' },
      ],
      this.options.breakpoint?.toString() || '768',
      (value: string) => {
        this.options.breakpoint = value ? parseInt(value) : 768;
      }
    );
    breakpointContainer.appendChild(breakpointLabel);
    breakpointContainer.appendChild(breakpointSelect);

    // Enable scroll
    const scrollContainer = createContainer('mb-3');
    const scrollLabel = createLabel(this.editor.t('Enable Horizontal Scroll'));

    // Создаем чекбокс вручную
    const scrollCheckboxContainer = createContainer('flex items-center');
    const scrollCheckbox = document.createElement('input');
    scrollCheckbox.type = 'checkbox';
    scrollCheckbox.checked = this.options.enableScroll || false;
    scrollCheckbox.className =
      'form-checkbox h-4 w-4 text-blue-600 transition duration-150 ease-in-out';
    scrollCheckbox.addEventListener('change', (e) => {
      this.options.enableScroll = (e.target as HTMLInputElement).checked;
    });

    scrollCheckboxContainer.appendChild(scrollCheckbox);
    scrollContainer.appendChild(scrollLabel);
    scrollContainer.appendChild(scrollCheckboxContainer);

    // Enable touch
    const touchContainer = createContainer('mb-3');
    const touchLabel = createLabel(this.editor.t('Enable Touch Support'));
    const touchCheckbox = document.createElement('input');
    touchCheckbox.type = 'checkbox';
    touchCheckbox.checked = this.options.enableTouch || false;
    touchCheckbox.className =
      'form-checkbox h-4 w-4 text-blue-600 transition duration-150 ease-in-out';
    touchCheckbox.addEventListener('change', (e) => {
      this.options.enableTouch = (e.target as HTMLInputElement).checked;
    });
    touchContainer.appendChild(touchLabel);
    touchContainer.appendChild(touchCheckbox);

    // Enable cards
    const cardsContainer = createContainer('mb-3');
    const cardsLabel = createLabel(this.editor.t('Enable Cards on Mobile'));
    const cardsCheckbox = document.createElement('input');
    cardsCheckbox.type = 'checkbox';
    cardsCheckbox.checked = this.options.enableCards || false;
    cardsCheckbox.className =
      'form-checkbox h-4 w-4 text-blue-600 transition duration-150 ease-in-out';
    cardsCheckbox.addEventListener('change', (e) => {
      this.options.enableCards = (e.target as HTMLInputElement).checked;
    });
    cardsContainer.appendChild(cardsLabel);
    cardsContainer.appendChild(cardsCheckbox);

    section.appendChild(title);
    section.appendChild(breakpointContainer);
    section.appendChild(scrollContainer);
    section.appendChild(touchContainer);
    section.appendChild(cardsContainer);

    return section;
  }

  public show(table: HTMLElement): void {
    this.activeTable = table;
    this.loadCurrentOptions();
    this.popup.show();
  }

  private loadCurrentOptions(): void {
    if (!this.activeTable) return;
    const computedStyle = window.getComputedStyle(this.activeTable);

    // Получаем брейкпоинт через команду
    const breakpointCommand = new GetTableBreakpointCommand(this.editor, this.activeTable);
    breakpointCommand.execute();

    this.options = {
      width: this.activeTable.style.width || computedStyle.width,
      cellPadding: computedStyle.padding || '8px',
      borderStyle: computedStyle.borderStyle || 'solid',
      borderWidth: computedStyle.borderWidth || '1px',
      borderColor: computedStyle.borderColor || '#e0e0e0',
      headerBackground:
        (this.activeTable.querySelector('.table-header-cell') as HTMLElement)?.style
          .backgroundColor || '#f8f9fa',
      headerColor:
        (this.activeTable.querySelector('.table-header-cell') as HTMLElement)?.style.color ||
        '#495057',
      zebraStripe: this.activeTable.classList.contains('table-striped'),
      hoverEffect: this.activeTable.classList.contains('table-hover'),
      // Responsive settings
      breakpoint: breakpointCommand.getBreakpoint(),
      enableScroll: this.activeTable.classList.contains('responsive-table--scroll'),
      enableTouch: this.activeTable.classList.contains('responsive-table--touch'),
      enableCards: this.activeTable.classList.contains('responsive-table--cards'),
    };
  }

  private applyChanges(): void {
    if (!this.activeTable) return;

    // Создаем команды для применения стилей и responsive настроек
    const styleOptions: TableStyleOptions = {
      style: this.options.style,
      theme: this.options.theme,
      width: this.options.width,
      cellPadding: this.options.cellPadding,
      borderStyle: this.options.borderStyle,
      borderWidth: this.options.borderWidth,
      borderColor: this.options.borderColor,
      headerBackground: this.options.headerBackground,
      headerColor: this.options.headerColor,
      zebraStripe: this.options.zebraStripe,
      hoverEffect: this.options.hoverEffect,
    };

    const responsiveOptions: TableResponsiveOptions = {
      breakpoint: this.options.breakpoint,
      enableScroll: this.options.enableScroll,
      enableTouch: this.options.enableTouch,
      enableCards: this.options.enableCards,
    };

    // Выполняем команды
    const styleCommand = new ApplyTableStyleCommand(this.editor, this.activeTable, styleOptions);
    const responsiveCommand = new ApplyTableResponsiveCommand(
      this.editor,
      this.activeTable,
      responsiveOptions
    );

    styleCommand.execute();
    responsiveCommand.execute();

    this.popup.hide();
  }

  public destroy(): void {
    this.popup.destroy();
  }
}
