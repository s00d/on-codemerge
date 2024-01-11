import { DropdownMenu } from "../../../helpers/dropdownMenu";
import type { IEditorModule, Observer, EditorCoreInterface } from "../../../src/types";

export class ParagraphButton implements IEditorModule, Observer {
  private core: EditorCoreInterface | null = null;
  private dropdown: DropdownMenu | null = null;

  initialize(core: EditorCoreInterface): void {
    this.dropdown = new DropdownMenu(core, '¶ ', 'Paragraph');
    this.core = core;


    const toolbar = this.core?.toolbar.getToolbarElement();
    toolbar?.appendChild(this.dropdown.getButton());

    core.i18n.addObserver(this);
  }

  update(): void {
    this.dropdown?.setTitle(this.core!.i18n.translate('Paragraph'));
    this.dropdown?.clearItems();
    this.dropdown?.addItem(this.core!.i18n.translate('Normal'), () => this.insertParagraph('normal'));
    this.dropdown?.addItem(this.core!.i18n.translate('Heading 1'), () => this.insertParagraph('h1'));
    this.dropdown?.addItem(this.core!.i18n.translate('Heading 2'), () => this.insertParagraph('h2'));
    this.dropdown?.addItem(this.core!.i18n.translate('Heading 3'), () => this.insertParagraph('h3'));
    this.dropdown?.addItem(this.core!.i18n.translate('Heading 4'), () => this.insertParagraph('h4'));
    this.dropdown?.addItem(this.core!.i18n.translate('Quote'), () => this.insertParagraph('blockquote'));
    this.dropdown?.addItem(this.core!.i18n.translate('Code'), () => this.insertParagraph('code'));
  }


  private insertParagraph(style: string): void {
    if (!this.core) return;

    const editor = this.core.editor.getEditorElement();
    if (!editor) return;

    let p;
    switch (style) {
      case 'h1':
      case 'h2':
      case 'h3':
      case 'h4':
        p = document.createElement(style);
        p.textContent = `Heading ${style.charAt(1)}`;
        break;
      case 'blockquote':
        p = document.createElement('blockquote');
        p.textContent = 'Quote here...';
        break;
      case 'code':
        p = document.createElement('pre');
        p.innerHTML = '<code>Your code here...</code>';
        break;
      default:
        p = document.createElement('p');
        p.textContent = 'Your text here...';
    }


    if (style.startsWith('h')) {
      p.style.fontSize = `${2 - 0.25 * (parseInt(style.charAt(1)) - 1)}em`;
    }

    this.core.insertHTMLIntoEditor(p);
    this.core.setContent(editor.innerHTML);
  }

  destroy(): void {
    // Cleanup any resources or event listeners here
    if (this.dropdown) {
      this.dropdown.destroy();
      this.dropdown = null;
    }
    this.core = null;
  }
}

export default ParagraphButton;
