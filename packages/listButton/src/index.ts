import { EditorCore, IEditorModule } from "@/index";
import {DropdownMenu} from "@root/helpers/dropdownMenu";
export class ListButton implements IEditorModule {
  private core: EditorCore | null = null;
  private last = 1;
  private dropdown: DropdownMenu;

  constructor() {
    this.dropdown = new DropdownMenu('List items')
  }

  initialize(core: EditorCore): void {
    this.core = core;
    this.dropdown.addItem('Dot', () => this.createList())
    this.dropdown.addItem('Numbered', () => this.createNumberedList());
    this.dropdown.addItem('Todo', () => this.createTodoList())

    const toolbar = this.core?.toolbar.getToolbarElement();
    toolbar?.appendChild(this.dropdown.getButton());
  }

  private createList(): void {
    if (!this.core) return;

    this.core.saveCurrentSelection();

    const ul = document.createElement('ul');
    ul.classList.add('on-codemerge-list');
    for (let i = 0; i < 3; i++) {
      const li = document.createElement('li');
      li.textContent = `Item ${i + 1}`;
      li.contentEditable = 'true';
      ul.appendChild(li);
    }

    this.core.insertHTMLIntoEditor(ul);
    this.core.moveCursorToStartOfInsertedContent()
  }

  private createNumberedList(): void {
    if (!this.core) return;

    this.core.saveCurrentSelection();

    const ol = document.createElement('ol');
    ol.classList.add('on-codemerge-list');
    for (let i = 0; i < 3; i++) {
      const li = document.createElement('li');
      li.textContent = `Item ${i + 1}`;
      li.contentEditable = 'true';
      ol.appendChild(li);
    }

    this.core.insertHTMLIntoEditor(ol);
    this.core.moveCursorToStartOfInsertedContent();
  }

  private createTodoList(): void {
    if (!this.core) return;

    this.core.saveCurrentSelection();

    const div = document.createElement('div');
    div.classList.add('on-codemerge-list');

    const li = this.createTodoListItem();
    div.appendChild(li);

    this.core.insertHTMLIntoEditor(div);
    this.core.moveCursorToStartOfInsertedContent()
  }

  private createTodoListItem(): HTMLElement {
    const div = document.createElement('div');

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = `todo-item-${this.last}`;
    checkbox.classList.add('todo-checkbox');

    const label = document.createElement('label');
    label.htmlFor = `todo-item-${this.last}`;
    label.textContent = `Todo Item ${this.last}`;

    this.last++;

    div.appendChild(checkbox);
    div.appendChild(label);

    return div;
  }


}

export default ListButton;
