import { DropdownMenu } from "../../../helpers/dropdownMenu";
import { DomUtils } from "../../../helpers/DomUtils";
import type { StyleConfig } from "../../../helpers/StyleManager";
import { StyleManager } from "../../../helpers/StyleManager";
import { type } from "../../../src/icons";
import type { IEditorModule, Observer, EditorCoreInterface } from "../../../src/types";

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
    name: 'Subscript',
    property: 'verticalAlign',
    enabledValue: 'sub',
  },
};


export class TextStylingButton implements IEditorModule, Observer {
  private core: EditorCoreInterface|null = null;
  private dropdown: DropdownMenu|null = null;
  private domUtils: DomUtils;
  private styleManager: StyleManager;

  constructor() {
    this.domUtils = new DomUtils
    this.styleManager = new StyleManager(styleConfig);
  }

  initialize(core: EditorCoreInterface): void {
    this.core = core;
    this.dropdown = new DropdownMenu(core, type, 'Styling', () => {
      this.createButtons();
    })

    core.toolbar.addHtmlItem(this.dropdown.getButton());

    core.i18n.addObserver(this);
  }

  update(): void {
    this.dropdown?.setTitle(this.core!.i18n.translate('Styling'))

    styleConfig.bold.name = this.core!.i18n.translate('Bold')
    styleConfig.italic.name = this.core!.i18n.translate('Italic')
    styleConfig.underline.name = this.core!.i18n.translate('Underline')
    styleConfig.strikeThrough.name = this.core!.i18n.translate('Strike Through')
    styleConfig.superscript.name = this.core!.i18n.translate('Superscript')
    styleConfig.subscript.name = this.core!.i18n.translate('Subscript')
  }

  private createButtons() {
    if(!this.core) return;
    this.dropdown?.clearItems();
    for (const i in styleConfig) {
      this.createButton(this.core, styleConfig[i].name, i);
    }
  }

  private createButton(core: EditorCoreInterface, title: string, styleCommand: string): void {
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

  destroy(): void {
    // Cleanup tasks as needed
    this.dropdown?.destroy();
    this.dropdown = null;
  }
}

export default TextStylingButton;
