import type { StyleConfig } from "../../../helpers/StyleManager";
import { StyleManager } from "../../../helpers/StyleManager";
import { DomUtils } from "../../../helpers/DomUtils";
import type { IEditorModule, Observer, EditorCoreInterface } from "../../../src/types";

const styleConfig: StyleConfig = {
  'foreColor': {
    name: 'Text Color',
    property: 'color',
    enabledValue: '#000000',
    disabledValue: '#000000',
  },
  'backColor': {
    name: 'Background Color',
    property: 'backgroundColor',
    enabledValue: '#000000',
    disabledValue: '#000000',
  },
  'fontFamily': {
    name: 'Font',
    property: 'fontFamily',
    enabledValue: 'Arial', // Значения определяются динамически
    disabledValue: 'Arial',
  },
  'fontSize': {
    name: 'Font Size',
    property: 'fontSize',
    enabledValue: '16px', // Значения определяются динамически
    disabledValue: '16px',
  },
  'lineHeight': {
    name: 'Line Height',
    property: 'lineHeight',
    enabledValue: '1px', // Значения определяются динамически
  },
  'textAlign': {
    name: 'Text Align',
    property: 'textAlign',
    enabledValue: 'left', // Значения определяются динамически
  }
  // Добавьте здесь другие стили для шрифтов и размеров
};

export class TextDecorationButton implements IEditorModule, Observer {
  private core: EditorCoreInterface | null = null;
  private domUtils: DomUtils;
  private styleManager: StyleManager;
  private inputElements: HTMLElement[] = [];
  private fonts: string[] = ['Arial', 'Courier New', 'Georgia', 'Times New Roman', 'Verdana'];
  private textColorButton: HTMLInputElement | null = null;
  private backgroundColorButton: HTMLInputElement | null = null;
  private fontPicker: HTMLSelectElement | null = null;
  private fontSizePicker: HTMLSelectElement | null = null;
  private lineHeightPicker: HTMLSelectElement | null = null;

  constructor(fonts?: string[]) {
    this.domUtils = new DomUtils();
    this.styleManager = new StyleManager(styleConfig);
    if(fonts) this.fonts = fonts;
  }

  initialize(core: EditorCoreInterface): void {
    this.core = core;
    this.textColorButton = this.createButton(core, 'Text Color', 'foreColor');
    this.backgroundColorButton = this.createButton(core, 'Background Color', 'backColor');

    this.fontPicker = this.createFontPicker(core, 'Font');
    this.fontSizePicker = this.createInputPicker(core, 'Font Size', 'fontSize');
    this.lineHeightPicker = this.createInputPicker(core, 'Line Height', 'lineHeight');

    core.i18n.addObserver(this);
  }

  update(): void {
    if(this.textColorButton) this.textColorButton.title = this.core!.i18n.translate('Text Color');
    if(this.backgroundColorButton) this.backgroundColorButton.title = this.core!.i18n.translate('Background Color');

    if(this.fontPicker) this.fontPicker.title = this.core!.i18n.translate('Font');
    if(this.fontSizePicker) this.fontSizePicker.title = this.core!.i18n.translate('Font Size');
    if(this.lineHeightPicker) this.lineHeightPicker.title = this.core!.i18n.translate('Line Height');
  }

  private createButton(core: EditorCoreInterface, title: string, command: string) {
    const input = document.createElement('input');
    input.type = 'color';
    input.style.height = '36px';
    input.style.minWidth = '36px';
    input.style.width = '36px';
    input.title = title;
    input.addEventListener('input', (e) => {
      styleConfig[command].enabledValue = (e.target as HTMLInputElement).value
      const selection = window.getSelection();
      if(!selection) return;

      const nodesToStyle = this.domUtils.getSelectedRoot(selection) ?? [];

      nodesToStyle.forEach(node => {
        const isFormatted = this.domUtils.isStyleApplied(
          node as HTMLElement,
          selection.rangeCount > 0 ? selection.getRangeAt(0) : document.createRange(),
          command,
          this.styleManager.has.bind(this.styleManager)
        )

        if (isFormatted) {
          this.domUtils.removeStyleFromDeepestNodes(
            node,
            command,
            this.styleManager.remove.bind(this.styleManager)
          );
        } else {
          this.domUtils.applyStyleToDeepestNodes(
            node,
            command,
            this.styleManager.set.bind(this.styleManager)
          );
        }
      })

      const editor = core.editor.getEditorElement();
      if(editor) core.setContent(editor.innerHTML); // Обновить состояние редактора

      // core.saveCurrentSelection();
      core.appElement.focus();
    });

    core.toolbar.addHtmlItem(input);
    this.inputElements.push(input);

    return input;
  }

  private setStyle(command: string) {
    const selection = window.getSelection();
    if(!selection) return;

    const nodesToStyle = this.domUtils.getSelectedRoot(selection) ?? [];

    nodesToStyle.forEach(node => {
      const isFormatted = this.domUtils.isStyleApplied(
        node as HTMLElement,
        selection.rangeCount > 0 ? selection.getRangeAt(0) : document.createRange(),
        command,
        this.styleManager.has.bind(this.styleManager)
      )
      if (isFormatted) {
        this.domUtils.removeStyleFromDeepestNodes(
          node,
          command,
          this.styleManager.remove.bind(this.styleManager)
        );
      } else {
        this.domUtils.applyStyleToDeepestNodes(
          node,
          command,
          this.styleManager.set.bind(this.styleManager)
        );
      }
    })
  }

  private createFontPicker(core: EditorCoreInterface, title: string) {
    const select = document.createElement('select');
    select.title = title;
    select.style.height = '35px';
    this.fonts.forEach(font => {
      const option = document.createElement('option');
      option.value = font;
      option.textContent = font;
      select.appendChild(option);
    });
    select.addEventListener('change', (e) => {
      const command = 'fontFamily';
      styleConfig[command].enabledValue = (e.target as HTMLInputElement).value

      this.setStyle(command);

      core.appElement.focus();

      const editor = core.editor.getEditorElement();
      if(editor) core.setContent(editor.innerHTML); // Обновить состояние редактора

    });

    core.toolbar.addHtmlItem(select);
    this.inputElements.push(select);

    return select;
  }

  private createInputPicker(core: EditorCoreInterface, title: string, command: string) {
    const select = document.createElement('select');
    select.title = title;
    select.style.height = '35px';
    select.value = ''

    // Заполняем выпадающий список значениями от 10 до 50
    for (let i = 10; i <= 50; i++) {
      const option = document.createElement('option');
      option.value = `${i}px`;
      option.textContent = `${i}px`;
      select.appendChild(option);
    }

    select.addEventListener('change', (e) => {
      core.restoreCurrentSelection()
      styleConfig[command].enabledValue = (e.target as HTMLSelectElement).value

      this.setStyle(command);

      core.appElement.focus();

      const editor = core.editor.getEditorElement();
      if(editor) core.setContent(editor.innerHTML); // Обновить состояние редактора
    });

    core.toolbar.addHtmlItem(select);
    this.inputElements.push(select);
    return select;
  }

  destroy(): void {
    // @ts-ignore
    this.domUtils = null
    // @ts-ignore
    this.styleManager = null

    this.core = null

    this.inputElements.forEach((input) => {
      input.remove();
    });
    this.inputElements = [];
  }
}

export default TextDecorationButton;
