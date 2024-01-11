import { DropdownMenu } from "../../../helpers/dropdownMenu";
import type { StyleConfig } from "../../../helpers/StyleManager";
import { StyleManager } from "../../../helpers/StyleManager";
import { DomUtils } from "../../../helpers/DomUtils";
import { alignCenter } from "../../../src/icons";
import type { IEditorModule, Observer, EditorCoreInterface } from "../../../src/types";


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

export class AlignButton implements IEditorModule, Observer {
  private dropdown: DropdownMenu|null = null;
  private domUtils: DomUtils;
  private styleManager: StyleManager;
  private core: EditorCoreInterface|null = null;

  constructor() {
    this.domUtils = new DomUtils();
    this.styleManager = new StyleManager(styleConfig);
  }
  initialize(core: EditorCoreInterface): void {
    this.core = core;
    this.dropdown = new DropdownMenu(this.core, alignCenter);
    if(this.dropdown) this.core.toolbar.addHtmlItem(this.dropdown.getButton());

    core.i18n.addObserver(this);
  }

  update(): void {
    if(!this.core) return;
    styleConfig.textAlign.name = this.core.i18n.translate('Text Align');
    styleConfig.display.name = this.core.i18n.translate('Display');

    this.dropdown?.setTitle(this.core.i18n.translate('Align'));

    this.dropdown?.clearItems();

    const alignButtons = [
      { align: 'left', text: this.core.i18n.translate('Left') },
      { align: 'right', text: this.core.i18n.translate('Right') },
      { align: 'center', text: this.core.i18n.translate('Center') },
      { align: 'justify', text: this.core.i18n.translate('Justify') }
    ];

    alignButtons.forEach(({ align, text }) => {
      this.dropdown?.addItem(text, () => {
        this.core!.restoreCurrentSelection()
        styleConfig['textAlign'].enabledValue = align

        this.setStyle('textAlign');

        this.core!.appElement.focus();

        const editor = this.core!.editor.getEditorElement();
        if(editor) this.core!.setContent(editor.innerHTML); // Обновить состояние редактора
      })
    });

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

  public destroy(): void {
    // Очистите ресурсы или выполняйте другие необходимые действия при уничтожении модуля
    this.dropdown?.destroy();
    this.dropdown = null;
    // @ts-ignore
    this.domUtils = null;
    // @ts-ignore
    this.styleManager = null;
  }
}

export default AlignButton;
