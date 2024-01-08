import type { EditorCore, IEditorModule } from "@/index";
import { DropdownMenu } from "@root/helpers/dropdownMenu";

export class ParagraphButton implements IEditorModule {
  private core: EditorCore | null = null;
  private dropdown: DropdownMenu | null = null;

  initialize(core: EditorCore): void {
    this.dropdown = new DropdownMenu(core, 'Paragraph');
    this.core = core;
    this.dropdown.addItem('Normal', () => this.insertParagraph('normal'));
    this.dropdown.addItem('Heading 1', () => this.insertParagraph('h1'));
    this.dropdown.addItem('Heading 2', () => this.insertParagraph('h2'));
    this.dropdown.addItem('Heading 3', () => this.insertParagraph('h3'));
    this.dropdown.addItem('Heading 4', () => this.insertParagraph('h4'));
    this.dropdown.addItem('Quote', () => this.insertParagraph('blockquote'));
    this.dropdown.addItem('Code', () => this.insertParagraph('code'));

    const toolbar = this.core?.toolbar.getToolbarElement();
    toolbar?.appendChild(this.dropdown.getButton());
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
}

export default ParagraphButton;
