import type { EditorCore } from "@/index";
import type { StyleConfig } from "../../../helpers/StyleManager";
import { StyleManager } from "../../../helpers/StyleManager";
import { DomUtils } from "../../../helpers/DomUtils";
import type { IEditorModule } from "@/types";

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

export class TextDecorationButton implements IEditorModule {
  private domUtils: DomUtils;
  private styleManager: StyleManager;
  private fonts: string[] = ['Arial', 'Courier New', 'Georgia', 'Times New Roman', 'Verdana'];

  constructor(fonts?: string[]) {
    this.domUtils = new DomUtils();
    this.styleManager = new StyleManager(styleConfig);
    if(fonts) this.fonts = fonts;
  }

  initialize(core: EditorCore): void {
    this.createButton(core, 'Text Color', 'foreColor');
    this.createButton(core, 'Background Color', 'backColor');

    this.createFontPicker(core, 'Font');
    this.createInputPicker(core, 'Font Size', 'fontSize');
    this.createInputPicker(core, 'Line Height', 'lineHeight');
  }

  private createButton(core: EditorCore, title: string, command: string): void {
    const input = document.createElement('input');
    input.type = 'color';
    input.style.height = '36px';
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

  private createFontPicker(core: EditorCore, title: string): void {
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
  }

  private createInputPicker(core: EditorCore, title: string, command: string): void {
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
  }
}

export default TextDecorationButton;
