import './style.scss';
import './public.scss';

import type { HTMLEditor } from '../../core/HTMLEditor';
import { createToolbarButton } from '../ToolbarPlugin/utils';
import { PopupManager, type PopupItem } from '../../core/ui/PopupManager';
import { createContainer, createInputField, createButton } from '../../utils/helpers';
import { styleIcon } from '../../icons';
import { AVAILABLE_STYLES } from './constants';

export class BlockStylePlugin {
  name = 'block-style';
  private editor: HTMLEditor | null = null;
  private toolbarButton: HTMLElement | null = null;
  private popup: PopupManager | null = null;
  private selectedElement: HTMLElement | null = null;

  constructor() {}

  initialize(editor: HTMLEditor): void {
    this.editor = editor;
    this.popup = new PopupManager(editor, {
      title: editor.t('Block Style Editor'),
      className: 'block-style-editor',
      closeOnClickOutside: true,
      items: this.createPopupItems(),
      buttons: [
        {
          label: editor.t('Apply'),
          variant: 'primary',
          onClick: () => this.applyStyles(),
        },
        {
          label: editor.t('Cancel'),
          variant: 'secondary',
          onClick: () => this.popup?.hide(),
        },
      ],
    });

    this.addToolbarButton();
    this.editor.on('selectionchange', () => this.handleSelectionChange());
  }

  private addToolbarButton(): void {
    const toolbar = document.querySelector('.editor-toolbar');
    if (!toolbar) return;

    this.toolbarButton = createToolbarButton({
      icon: styleIcon,
      title: this.editor?.t('Block Style'),
      onClick: () => this.showPopup(),
    });

    toolbar.appendChild(this.toolbarButton);
  }

  private handleSelectionChange(): void {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const parentElement = range.commonAncestorContainer.parentElement;

    if (!this.editor) {
      return;
    }

    if (parentElement === this.editor?.getContainer()) {
      this.selectedElement = null;
      this.toolbarButton?.classList.remove('active');
      return;
    }

    if (parentElement && this.isBlockElement(parentElement)) {
      this.selectedElement = parentElement;
      this.toolbarButton?.classList.add('active');
    } else {
      this.selectedElement = null;
      this.toolbarButton?.classList.remove('active');
    }
  }

  private isBlockElement(element: HTMLElement): boolean {
    const blockElements = [
      'DIV',
      'P',
      'H1',
      'H2',
      'H3',
      'H4',
      'H5',
      'H6',
      'SECTION',
      'ARTICLE',
      'HEADER',
      'FOOTER',
      'NAV',
      'ASIDE',
      'MAIN',
      'FIGURE',
      'FIGCAPTION',
      'BLOCKQUOTE',
      'UL',
      'OL',
      'LI',
      'DL',
      'DT',
      'DD',
      'PRE',
      'HR',
      'ADDRESS',
      'TABLE',
      'THEAD',
      'TBODY',
      'TFOOT',
      'TR',
      'TH',
      'TD',
      'CAPTION',
      'FORM',
      'FIELDSET',
      'LEGEND',
      'DETAILS',
      'SUMMARY',
      'MENU',
      'DIALOG',
      'IFRAME',
      'CANVAS',
      'VIDEO',
      'AUDIO',
      'PICTURE',
      'SOURCE',
      'TRACK',
      'MAP',
      'OBJECT',
      'PARAM',
      'EMBED',
      'NOSCRIPT',
      'PROGRESS',
      'METER',
      'TIME',
      'MARK',
      'RUBY',
      'RT',
      'RP',
      'BDI',
      'BDO',
      'WBR',
      'INS',
      'DEL',
      'CODE',
      'KBD',
      'SAMP',
      'VAR',
      'CITE',
      'Q',
      'ABBR',
      'DFN',
      'SMALL',
      'STRONG',
      'EM',
      'I',
      'B',
      'U',
      'S',
      'STRIKE',
      'SUB',
      'SUP',
      'SPAN',
      'BR',
      'IMG',
      'A',
      'BUTTON',
      'INPUT',
      'TEXTAREA',
      'SELECT',
      'OPTION',
      'OPTGROUP',
      'LABEL',
      'OUTPUT',
      'DATALIST',
      'KEYGEN',
      'ISINDEX',
      'BASE',
      'LINK',
      'META',
      'STYLE',
      'SCRIPT',
      'TITLE',
      'HEAD',
      'BODY',
      'HTML',
    ];
    return blockElements.includes(element.tagName);
  }

  private createPopupItems(): PopupItem[] {
    return [
      {
        type: 'custom',
        id: 'style-editor',
        content: () => this.createStyleEditor(),
      },
      {
        type: 'custom',
        id: 'class-editor',
        content: () => this.createClassEditor(),
      },
    ];
  }

  private createStyleEditor(): HTMLElement {
    const container = createContainer('popup-item');
    const label = document.createElement('label');
    label.textContent = this.editor?.t('Inline Styles') || 'Inline Styles';
    container.appendChild(label);

    const styleList = createContainer('style-list');
    const styles = this.selectedElement?.getAttribute('style')?.split(';') || [];

    styles.forEach((style) => {
      if (style.trim()) {
        const [property, value] = style.split(':').map((s) => s.trim());
        if (property && value) {
          const styleItem = this.createStyleItem(property, value);
          styleList.appendChild(styleItem);
        }
      }
    });

    const addButton = createButton('Add Style', () => this.addStyle(styleList));
    addButton.className = 'add-button';

    container.appendChild(styleList);
    container.appendChild(addButton);

    return container;
  }

  private createStyleItem(property: string, value: string): HTMLElement {
    const styleItem = createContainer('style-item');

    // Выпадающий список для выбора свойства
    const propertySelect = document.createElement('select');
    propertySelect.className = 'style-property-select';

    // Добавляем варианты свойств
    Object.keys(AVAILABLE_STYLES).forEach((prop) => {
      const option = document.createElement('option');
      option.value = prop;
      option.textContent = prop;
      option.selected = prop === property;
      propertySelect.appendChild(option);
    });

    // Выпадающий список для выбора значения
    const valueSelect = document.createElement('select');
    valueSelect.className = 'style-value-select';

    // Обновляем значения при изменении свойства
    propertySelect.addEventListener('change', () => {
      this.updateValueSelect(valueSelect, propertySelect.value);
    });

    // Инициализируем значения для выбранного свойства
    this.updateValueSelect(valueSelect, propertySelect.value, value);

    // Кнопка удаления
    const removeButton = createButton('×', () => styleItem.remove());
    removeButton.className = 'remove-button';

    // Добавляем элементы в контейнер
    styleItem.appendChild(propertySelect);
    styleItem.appendChild(valueSelect);
    styleItem.appendChild(removeButton);

    return styleItem;
  }

  /**
   * Обновляет выпадающий список значений в зависимости от выбранного свойства.
   */
  private updateValueSelect(
    valueSelect: HTMLSelectElement,
    property: string,
    selectedValue: string = ''
  ): void {
    // Очищаем текущие значения
    valueSelect.innerHTML = '';

    // Добавляем варианты значений для выбранного свойства
    const values = AVAILABLE_STYLES[property] || [];
    values.forEach((val) => {
      const option = document.createElement('option');
      option.value = val;
      option.textContent = val;
      option.selected = val === selectedValue;
      valueSelect.appendChild(option);
    });
  }

  private addStyle(styleList: HTMLElement): void {
    const styleItem = this.createStyleItem('', '');
    styleList.appendChild(styleItem);
  }

  private createClassEditor(): HTMLElement {
    const container = createContainer('popup-item');
    const label = document.createElement('label');
    label.textContent = this.editor?.t('CSS Classes') || 'CSS Classes';
    container.appendChild(label);

    const classList = createContainer('class-list');
    const classes = this.selectedElement?.getAttribute('class')?.split(' ') || [];

    classes.forEach((cls) => {
      if (cls.trim()) {
        const classItem = this.createClassItem(cls);
        classList.appendChild(classItem);
      }
    });

    const addButton = createButton('Add Class', () => this.addClass(classList));
    addButton.className = 'add-button';

    container.appendChild(classList);
    container.appendChild(addButton);

    return container;
  }

  private createClassItem(cls: string): HTMLElement {
    const classItem = createContainer('class-item');
    const classInput = createInputField('text', 'Enter class (e.g., my-class)', cls);
    classInput.className = 'class-input';

    const removeButton = createButton('×', () => classItem.remove());
    removeButton.className = 'remove-button';

    classItem.appendChild(classInput);
    classItem.appendChild(removeButton);

    return classItem;
  }

  private addClass(classList: HTMLElement): void {
    const classItem = this.createClassItem('');
    classList.appendChild(classItem);
  }

  private showPopup(): void {
    if (!this.selectedElement || !this.popup) return;

    // Создаем общий контейнер
    const container = document.createElement('div');

    // Создаем блоки для стилей и классов
    const styleEditor = this.createStyleEditor();
    const classEditor = this.createClassEditor();

    // Добавляем блоки в контейнер
    container.appendChild(styleEditor);
    container.appendChild(classEditor);

    // Передаем контейнер в модальное окно
    this.popup.setContent(container);

    // Показываем модальное окно
    this.popup.show();
  }

  private applyStyles(): void {
    if (!this.selectedElement || !this.popup) return;

    this.editor?.ensureEditorFocus();

    const styleList = this.popup.getElement()?.querySelector('.style-list');
    const classList = this.popup.getElement()?.querySelector('.class-list');

    if (styleList) {
      const styles = Array.from(styleList.querySelectorAll('.style-item'))
        .map((item) => {
          const propertySelect = item.querySelector('.style-property-select') as HTMLSelectElement;
          const valueSelect = item.querySelector('.style-value-select') as HTMLSelectElement;
          const property = propertySelect.value.trim();
          const value = valueSelect.value.trim();
          return property && value ? `${property}: ${value}` : '';
        })
        .filter((style) => style)
        .join('; ');

      this.selectedElement.setAttribute('style', styles);
    }

    if (classList) {
      const classes = Array.from(classList.querySelectorAll('.class-input'))
        .map((input) => (input as HTMLInputElement).value.trim())
        .filter((cls) => cls)
        .join(' ');

      this.selectedElement.setAttribute('class', classes);
    }

    this.popup.hide();
  }

  destroy(): void {
    this.toolbarButton?.remove();
    this.toolbarButton = null;

    this.editor?.off('selectionchange');

    this.popup?.destroy();
    this.popup = null;

    this.editor = null;
  }
}
