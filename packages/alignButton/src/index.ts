import type { EditorCore } from "@/index";
import { DropdownMenu } from "../../../helpers/dropdownMenu";
import type { StyleConfig } from "../../../helpers/StyleManager";
import { StyleManager } from "../../../helpers/StyleManager";
import { DomUtils } from "../../../helpers/DomUtils";
import { alignCenter } from "../../../src/icons";
import type { IEditorModule } from "@/types";

const styleConfig: StyleConfig = {
  'textAlign': {
    name: 'Text Align',
    property: 'textAlign',
    enabledValue: 'left', // Значения определяются динамически
  },
  'display': {
    name: 'Display',
    property: 'display',
    enabledValue: 'block', // Значения определяются динамически
  }
  // Добавьте здесь другие стили для шрифтов и размеров
};

export class AlignButton implements IEditorModule {
  private dropdown: DropdownMenu|null = null;
  private domUtils: DomUtils;
  private styleManager: StyleManager;

  constructor() {
    this.domUtils = new DomUtils();
    this.styleManager = new StyleManager(styleConfig);
  }
  initialize(core: EditorCore): void {
    // const icon = alignCenter.toSvg({  width: '16px', height: '16px', class: 'on-codemerge-icon', 'stroke-width': 3 });
    this.dropdown = new DropdownMenu(core, alignCenter, 'Align')
    const alignButtons = [
      { align: 'left', text: 'Left' },
      { align: 'right', text: 'Right' },
      { align: 'center', text: 'Center' },
      { align: 'justify', text: 'Justify' }
    ];

    alignButtons.forEach(({ align, text }) => {
      this.dropdown?.addItem(text, () => {
        core.restoreCurrentSelection()
        styleConfig['textAlign'].enabledValue = align

        this.setStyle('textAlign');

        core.appElement.focus();

        const editor = core.editor.getEditorElement();
        if(editor) core.setContent(editor.innerHTML); // Обновить состояние редактора
      })
    });

    core.toolbar.addHtmlItem(this.dropdown.getButton());
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
        this.domUtils.removeStyleFromDeepestNodes(
          node,
          'display',
          this.styleManager.remove.bind(this.styleManager)
        );
      } else {
        this.domUtils.applyStyleToDeepestNodes(
          node,
          command,
          this.styleManager.set.bind(this.styleManager)
        );
        this.domUtils.removeStyleFromDeepestNodes(
          node,
          'display',
          this.styleManager.set.bind(this.styleManager)
        );
      }
    })
  }
}

export default AlignButton;
