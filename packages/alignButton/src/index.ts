import type { EditorCore, IEditorModule } from "@/index";
import { DropdownMenu } from "@root/helpers/dropdownMenu";
import type { StyleConfig } from "@root/helpers/StyleManager";
import { StyleManager } from "@root/helpers/StyleManager";
import { DomUtils } from "@root/helpers/DomUtils";
import feather from "feather-icons";


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
    const icon = feather.icons["align-center"].toSvg({  width: '16px', height: '16px', class: 'on-codemerge-icon', 'stroke-width': 3 });
    this.dropdown = new DropdownMenu(core, icon, 'Align')
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
        core.popup.hide();

        const editor = core.editor.getEditorElement();
        if(editor) core.setContent(editor.innerHTML); // Обновить состояние редактора
      })
    });

    core.popup.addHtmlItem(this.dropdown?.getButton());
  }

  private setStyle(command: string) {
    const selection = window.getSelection();

    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);

      // Получение самых глубоких узлов в выделении
      const deepestNodes = this.domUtils.getDeepestNodes(range);

      deepestNodes.forEach(node => {
        const isFormatted = this.domUtils.isStyleApplied(
          node as HTMLElement,
          range,
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
}

export default AlignButton;
