import { EditorCore, IEditorModule } from "@/index";
import ListManager from './ListManager';
export class ListButtonPlugin implements IEditorModule {
  private core: EditorCore | null = null;
  private listManagerMap: Map<HTMLUListElement | HTMLOListElement, ListManager> = new Map();

  initialize(core: EditorCore): void {
    this.core = core;
    core.toolbar.addButton('Create List', () => this.createList())
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
  }
}

export default ListButtonPlugin;
