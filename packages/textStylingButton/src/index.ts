import type { EditorCore, IEditorModule } from "@/index";
import { DropdownMenu } from "@root/helpers/dropdownMenu";
import { DomUtils } from "@root/helpers/DomUtils";
import type { StyleConfig } from "@root/helpers/StyleManager";
import { StyleManager } from "@root/helpers/StyleManager";
import feather from "feather-icons";

const styleConfig: StyleConfig = {
  'bold': {
    name: 'Bold',
    property: 'fontWeight',
    enabledValue: 'bold',
    disabledValue: 'normal'
  },
  'italic': {
    name: 'Italic',
    property: 'fontStyle',
    enabledValue: 'italic',
    disabledValue: 'normal'
  },
  'underline': {
    name: 'Underline',
    property: 'textDecoration',
    enabledValue: 'underline',
    disabledValue: 'none',
    isComplex: true
  },
  'strikeThrough': {
    name: 'Strike Through',
    property: 'textDecoration',
    enabledValue: 'line-through',
    disabledValue: 'none',
    isComplex: true
  },
  'superscript': {
    name: 'Superscript',
    property: 'verticalAlign',
    enabledValue: 'super',
    disabledValue: 'baseline'
  },
  'subscript': {
    name: 'Sub',
    property: 'verticalAlign',
    enabledValue: 'sub',
    disabledValue: 'baseline'
  },
};


export class TextStylingButton implements IEditorModule {
  private dropdown: DropdownMenu|null = null;
  private domUtils: DomUtils;
  private styleManager: StyleManager;

  constructor() {
    this.domUtils = new DomUtils
    this.styleManager = new StyleManager(styleConfig);
  }

  initialize(core: EditorCore): void {
    const icon = feather.icons.type.toSvg({  width: '16px', height: '16px', class: 'on-codemerge-icon', 'stroke-width': 3 });
    this.dropdown = new DropdownMenu(core, icon, 'Styling')
    for (const i in styleConfig) {
      this.createButton(core, styleConfig[i].name, i);
    }

    core.popup.addHtmlItem(this.dropdown.getButton());
  }

  private createButton(core: EditorCore, title: string, styleCommand: string): void {
    this.dropdown?.addItem(title, () => {
      core.restoreCurrentSelection();
      const selection = window.getSelection();

      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);

        // Получение самых глубоких узлов в выделении
        const deepestNodes = this.domUtils.getDeepestNodes(range);

        deepestNodes.forEach(node => {
          const isFormatted = this.domUtils.isStyleApplied(
            node as HTMLElement,
            range,
            styleCommand,
            this.styleManager.has.bind(this.styleManager)
          )
          if (isFormatted) {
            this.domUtils.removeStyleFromDeepestNodes(
              node,
              styleCommand,
              this.styleManager.remove.bind(this.styleManager)
            );
          } else {
            this.domUtils.applyStyleToDeepestNodes(
              node,
              styleCommand,
              this.styleManager.set.bind(this.styleManager)
            );
          }
        })

        core.appElement.focus();
      }

      core.popup.hide();

      const editor = core.editor.getEditorElement();
      if(editor) core.setContent(editor.innerHTML); // Обновить состояние редактора
    });
  }
}

export default TextStylingButton;
