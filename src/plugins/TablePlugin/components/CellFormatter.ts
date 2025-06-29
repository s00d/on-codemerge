import type { HTMLEditor } from '../../../core/HTMLEditor';
import { PopupManager } from '../../../core/ui/PopupManager';
import {
  CELL_ALIGNMENT_OPTIONS,
  VERTICAL_ALIGNMENT_OPTIONS,
  BORDER_STYLES,
  BORDER_WIDTHS,
} from './TableStyles';
import {
  createContainer,
  createSelectField,
  createInputField,
  createLabel,
} from '../../../utils/helpers';

export interface CellFormatOptions {
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  verticalAlign?: 'top' | 'middle' | 'bottom';
  backgroundColor?: string;
  textColor?: string;
  fontWeight?: 'normal' | 'bold' | 'bolder' | 'lighter';
  fontStyle?: 'normal' | 'italic';
  textDecoration?: 'none' | 'underline' | 'line-through';
  borderStyle?: string;
  borderWidth?: string;
  borderColor?: string;
  padding?: string;
  width?: string;
  height?: string;
}

export class CellFormatter {
  private editor: HTMLEditor;
  private popup: PopupManager;
  private activeCell: HTMLElement | null = null;
  private options: CellFormatOptions = {};

  constructor(editor: HTMLEditor) {
    this.editor = editor;
    this.popup = new PopupManager(editor, {
      title: editor.t('Cell Formatting'),
      className: 'cell-formatter-popup',
      closeOnClickOutside: true,
      buttons: [
        {
          label: editor.t('Apply'),
          variant: 'primary',
          onClick: () => this.applyFormatting(),
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
          id: 'cell-formatter-content',
          content: () => this.createContent(),
        },
      ],
    });
  }

  private createContent(): HTMLElement {
    const container = createContainer('cell-formatter-content p-4 space-y-4');

    // Text formatting
    const textSection = this.createTextSection();
    container.appendChild(textSection);

    // Alignment
    const alignmentSection = this.createAlignmentSection();
    container.appendChild(alignmentSection);

    // Colors
    const colorsSection = this.createColorsSection();
    container.appendChild(colorsSection);

    // Borders
    const bordersSection = this.createBordersSection();
    container.appendChild(bordersSection);

    // Dimensions
    const dimensionsSection = this.createDimensionsSection();
    container.appendChild(dimensionsSection);

    return container;
  }

  private createTextSection(): HTMLElement {
    const section = createContainer('text-section');
    const title = document.createElement('h3');
    title.textContent = this.editor.t('Text Formatting');
    title.className = 'text-lg font-semibold mb-3';

    // Font weight
    const weightContainer = createContainer('mb-3');
    const weightLabel = createLabel(this.editor.t('Font Weight'));
    const weightSelect = createSelectField(
      [
        { value: 'normal', label: 'Normal' },
        { value: 'bold', label: 'Bold' },
        { value: 'bolder', label: 'Bolder' },
        { value: 'lighter', label: 'Lighter' },
      ],
      this.options.fontWeight || 'normal',
      (value: string) => (this.options.fontWeight = value as any)
    );
    weightContainer.appendChild(weightLabel);
    weightContainer.appendChild(weightSelect);

    // Font style
    const styleContainer = createContainer('mb-3');
    const styleLabel = createLabel(this.editor.t('Font Style'));
    const styleSelect = createSelectField(
      [
        { value: 'normal', label: 'Normal' },
        { value: 'italic', label: 'Italic' },
      ],
      this.options.fontStyle || 'normal',
      (value: string) => (this.options.fontStyle = value as any)
    );
    styleContainer.appendChild(styleLabel);
    styleContainer.appendChild(styleSelect);

    // Text decoration
    const decorationContainer = createContainer('mb-3');
    const decorationLabel = createLabel(this.editor.t('Text Decoration'));
    const decorationSelect = createSelectField(
      [
        { value: 'none', label: 'None' },
        { value: 'underline', label: 'Underline' },
        { value: 'line-through', label: 'Strikethrough' },
      ],
      this.options.textDecoration || 'none',
      (value: string) => (this.options.textDecoration = value as any)
    );
    decorationContainer.appendChild(decorationLabel);
    decorationContainer.appendChild(decorationSelect);

    section.appendChild(title);
    section.appendChild(weightContainer);
    section.appendChild(styleContainer);
    section.appendChild(decorationContainer);

    return section;
  }

  private createAlignmentSection(): HTMLElement {
    const section = createContainer('alignment-section');
    const title = document.createElement('h3');
    title.textContent = this.editor.t('Alignment');
    title.className = 'text-lg font-semibold mb-3';

    // Horizontal alignment
    const horizontalContainer = createContainer('mb-3');
    const horizontalLabel = createLabel(this.editor.t('Horizontal Alignment'));
    const horizontalSelect = createSelectField(
      CELL_ALIGNMENT_OPTIONS.map((option) => ({ value: option.value, label: option.label })),
      this.options.textAlign || 'left',
      (value: string) => (this.options.textAlign = value as any)
    );
    horizontalContainer.appendChild(horizontalLabel);
    horizontalContainer.appendChild(horizontalSelect);

    // Vertical alignment
    const verticalContainer = createContainer('mb-3');
    const verticalLabel = createLabel(this.editor.t('Vertical Alignment'));
    const verticalSelect = createSelectField(
      VERTICAL_ALIGNMENT_OPTIONS.map((option) => ({ value: option.value, label: option.label })),
      this.options.verticalAlign || 'middle',
      (value: string) => (this.options.verticalAlign = value as any)
    );
    verticalContainer.appendChild(verticalLabel);
    verticalContainer.appendChild(verticalSelect);

    section.appendChild(title);
    section.appendChild(horizontalContainer);
    section.appendChild(verticalContainer);

    return section;
  }

  private createColorsSection(): HTMLElement {
    const section = createContainer('colors-section');
    const title = document.createElement('h3');
    title.textContent = this.editor.t('Colors');
    title.className = 'text-lg font-semibold mb-3';

    // Background color
    const bgContainer = createContainer('mb-3');
    const bgLabel = createLabel(this.editor.t('Background Color'));
    const bgInput = createInputField(
      'color',
      '',
      this.options.backgroundColor || '#ffffff',
      (value: string) => (this.options.backgroundColor = value)
    );
    bgContainer.appendChild(bgLabel);
    bgContainer.appendChild(bgInput);

    // Text color
    const textColorContainer = createContainer('mb-3');
    const textColorLabel = createLabel(this.editor.t('Text Color'));
    const textColorInput = createInputField(
      'color',
      '',
      this.options.textColor || '#000000',
      (value: string) => (this.options.textColor = value)
    );
    textColorContainer.appendChild(textColorLabel);
    textColorContainer.appendChild(textColorInput);

    section.appendChild(title);
    section.appendChild(bgContainer);
    section.appendChild(textColorContainer);

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

  private createDimensionsSection(): HTMLElement {
    const section = createContainer('dimensions-section');
    const title = document.createElement('h3');
    title.textContent = this.editor.t('Dimensions');
    title.className = 'text-lg font-semibold mb-3';

    // Width
    const widthContainer = createContainer('mb-3');
    const widthLabel = createLabel(this.editor.t('Width'));
    const widthInput = createInputField(
      'text',
      'e.g., 100px, 50%',
      this.options.width || '',
      (value: string) => (this.options.width = value)
    );
    widthContainer.appendChild(widthLabel);
    widthContainer.appendChild(widthInput);

    // Height
    const heightContainer = createContainer('mb-3');
    const heightLabel = createLabel(this.editor.t('Height'));
    const heightInput = createInputField(
      'text',
      'e.g., 50px',
      this.options.height || '',
      (value: string) => (this.options.height = value)
    );
    heightContainer.appendChild(heightLabel);
    heightContainer.appendChild(heightInput);

    // Padding
    const paddingContainer = createContainer('mb-3');
    const paddingLabel = createLabel(this.editor.t('Padding'));
    const paddingInput = createInputField(
      'text',
      'e.g., 8px',
      this.options.padding || '',
      (value: string) => (this.options.padding = value)
    );
    paddingContainer.appendChild(paddingLabel);
    paddingContainer.appendChild(paddingInput);

    section.appendChild(title);
    section.appendChild(widthContainer);
    section.appendChild(heightContainer);
    section.appendChild(paddingContainer);

    return section;
  }

  public show(cell: HTMLElement): void {
    this.activeCell = cell;
    this.loadCurrentOptions();
    this.popup.show();
  }

  private loadCurrentOptions(): void {
    if (!this.activeCell) return;

    this.options = {
      textAlign: (this.activeCell.style.textAlign as any) || 'left',
      verticalAlign: (this.activeCell.style.verticalAlign as any) || 'middle',
      backgroundColor: this.activeCell.style.backgroundColor || '#ffffff',
      textColor: this.activeCell.style.color || '#000000',
      fontWeight: (this.activeCell.style.fontWeight as any) || 'normal',
      fontStyle: (this.activeCell.style.fontStyle as any) || 'normal',
      textDecoration: (this.activeCell.style.textDecoration as any) || 'none',
      borderStyle: this.activeCell.style.borderStyle || 'solid',
      borderWidth: this.activeCell.style.borderWidth || '1px',
      borderColor: this.activeCell.style.borderColor || '#000000',
      padding: this.activeCell.style.padding || '8px',
      width: this.activeCell.style.width || '',
      height: this.activeCell.style.height || '',
    };
  }

  private applyFormatting(): void {
    if (!this.activeCell) return;

    Object.assign(this.activeCell.style, {
      textAlign: this.options.textAlign,
      verticalAlign: this.options.verticalAlign,
      backgroundColor: this.options.backgroundColor,
      color: this.options.textColor,
      fontWeight: this.options.fontWeight,
      fontStyle: this.options.fontStyle,
      textDecoration: this.options.textDecoration,
      border: `${this.options.borderWidth} ${this.options.borderStyle} ${this.options.borderColor}`,
      padding: this.options.padding,
      width: this.options.width,
      height: this.options.height,
    });

    this.popup.hide();
  }

  public destroy(): void {
    this.popup.destroy();
  }
}
