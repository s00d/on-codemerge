import { EditorCore, IEditorModule } from "@/index";
import ListManager from './ListManager';
export class ListButtonPlugin implements IEditorModule {
  private core: EditorCore | null = null;
  private listManagerMap: Map<HTMLUListElement | HTMLOListElement, ListManager> = new Map();

  initialize(core: EditorCore): void {
    this.core = core;
    this.createListButton();
  }

  private createListButton(): void {
    const button = document.createElement('button');
    button.textContent = 'Create List';
    button.classList.add('on-codemerge-button');
    button.addEventListener('click', () => this.createList());
    const toolbar = this.core?.toolbar.getToolbarElement();
    toolbar?.appendChild(button);
  }

  private createList(): void {
    if (!this.core) return;

    const ul = document.createElement('ul');
    ul.classList.add('on-codemerge-list')
    for (let i = 0; i < 3; i++) {
      const li = document.createElement('li');
      li.textContent = `Item ${i + 1}`;
      li.contentEditable = 'true';
      ul.appendChild(li);
    }

    const editor = this.core?.editor.getEditorElement();
    editor?.appendChild(ul);
    this.core?.setContent(editor?.innerHTML || '');

    const listManager = new ListManager(ul, this.core);
    this.listManagerMap.set(ul, listManager);
  }
}

export default ListButtonPlugin;
