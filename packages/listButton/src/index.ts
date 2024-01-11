import { DropdownMenu } from "../../../helpers/dropdownMenu";
import { list } from "../../../src/icons";
import type { IEditorModule, Observer, EditorCoreInterface } from "../../../src/types";

export class ListButton implements IEditorModule, Observer {
  private core: EditorCoreInterface | null = null;
  private last = 1;
  private dropdown: DropdownMenu | null = null;

  initialize(core: EditorCoreInterface): void {
    this.dropdown = new DropdownMenu(core, list, 'List items')
    this.core = core;

    const toolbar = this.core?.toolbar.getToolbarElement();
    toolbar?.appendChild(this.dropdown.getButton());

    core.i18n.addObserver(this);
  }

  update(): void {
    this.dropdown?.setTitle(this.core!.i18n.translate('List items'))
    this.dropdown?.clearItems()
    this.dropdown?.addItem(this.core!.i18n.translate('Dot'), () => this.createList())
    this.dropdown?.addItem(this.core!.i18n.translate('Numbered'), () => this.createNumberedList())
    this.dropdown?.addItem(this.core!.i18n.translate('Todo'), () => this.createTodoList())
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
    this.core.moveCursorToStart()
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
    this.core.moveCursorToStart();
  }

  private createTodoList(): void {
    if (!this.core) return;

    this.core.saveCurrentSelection();

    const div = document.createElement('div');
    div.classList.add('on-codemerge-list');

    const li = this.createTodoListItem();
    div.appendChild(li);

    this.core.insertHTMLIntoEditor(div);
    this.core.moveCursorToStart()
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

  destroy(): void {
    // Cleanup any resources or event listeners here
    if (this.dropdown) {
      this.dropdown.destroy();
      this.dropdown = null;
    }
    this.core = null;
  }
}

export default ListButton;
