import type { EditorCore, IEditorModule } from "@/index";
import { DropdownMenu } from "@root/helpers/dropdownMenu";
import { DomUtils } from "@root/helpers/DomUtils";
import type { StyleConfig } from "@root/helpers/StyleManager";
import { StyleManager } from "@root/helpers/StyleManager";
import type from "../../../icons/type.svg";

const styleConfig: StyleConfig = {
  'bold': {
    name: 'Bold',
    property: 'fontWeight',
    enabledValue: 'bold',
  },
  'italic': {
    name: 'Italic',
    property: 'fontStyle',
    enabledValue: 'italic',
  },
  'underline': {
    name: 'Underline',
    property: 'textDecoration',
    enabledValue: 'underline',
    isComplex: true
  },
  'strikeThrough': {
    name: 'Strike Through',
    property: 'textDecoration',
    enabledValue: 'line-through',
    isComplex: true
  },
  'superscript': {
    name: 'Superscript',
    property: 'verticalAlign',
    enabledValue: 'super',
  },
  'subscript': {
    name: 'Sub',
    property: 'verticalAlign',
    enabledValue: 'sub',
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
    this.dropdown = new DropdownMenu(core, type, 'Styling')
    for (const i in styleConfig) {
      this.createButton(core, styleConfig[i].name, i);
    }

    core.toolbar.addHtmlItem(this.dropdown.getButton());
  }

  private createButton(core: EditorCore, title: string, styleCommand: string): void {
    this.dropdown?.addItem(title, () => {
      core.restoreCurrentSelection();

      const selection = window.getSelection();
      if(!selection) return;

      const nodesToStyle = this.domUtils.getSelectedRoot(selection) ?? [];

      nodesToStyle.forEach(node => {
        const isFormatted = this.domUtils.isStyleApplied(
          node as HTMLElement,
          selection.rangeCount > 0 ? selection.getRangeAt(0) : document.createRange(),
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

      const editor = core.editor.getEditorElement();
      if(editor) core.setContent(editor.innerHTML); // Обновить состояние редактора
    });
  }
}

export default TextStylingButton;
