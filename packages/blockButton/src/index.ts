import { BlockManager } from "./BlockManager";
import { columns } from "../../../src/icons";
import type { IEditorModule, Observer, EditorCoreInterface } from "../../../src/types";

export class BlockButton implements IEditorModule, Observer {
  private core: EditorCoreInterface | null = null;
  private blockManagerMap: Map<string, BlockManager> = new Map();
  private button: HTMLDivElement|null = null;

  initialize(core: EditorCoreInterface): void {
    this.core = core;
    this.button = this.core!.toolbar.addButtonIcon('Block', columns, this.createBlock.bind(this))
    this.core!.subscribeToContentChange(() => {
      this.reloadBlocks(this.core!);
    });

    core.i18n.addObserver(this);
  }

  update(): void {
    if(this.button) this.button.title = this.core!.i18n.translate('Block');
  }

  private reloadBlocks(core: EditorCoreInterface): void {
    const editor = core.editor.getEditorElement();
    if (!editor) return;

    const blocks = editor.querySelectorAll('.editor-block');
    blocks.forEach((element: Element) => {
      const block = element as HTMLElement;
      let blockId = block.id;
      if (!blockId || blockId === '' || !blockId.startsWith('block-')) {
        block.id = blockId = 'block-' + Math.random().toString(36).substring(2, 11)
      }

      if (blockId && !this.blockManagerMap.has(blockId)) { // Проверка по идентификатору
        const blockManager = new BlockManager(
          block,
          core,
          () => {
            if (editor) core.setContent(editor.innerHTML);
          }
        );
        this.blockManagerMap.set(blockId, blockManager); // Сохраняем по идентификатору
        blockManager.attachEventsToExistingResizers();
      }
    });
  }

  private createBlock(): void {
    if (!this.core) return;

    const block = document.createElement('div');
    block.classList.add('editor-block');
    block.style.border = '1px solid #ccc';
    // block.style.margin = '10px 0';
    // block.contentEditable = 'true';
    block.id = 'block-' + Math.random().toString(36).substr(2, 9);
    block.addEventListener('dragover', (e) => e.preventDefault());
    block.addEventListener('drop', this.handleDrop.bind(this));
    block.id = 'block-' + Math.random().toString(36).substring(2, 11);

    const editor = this.core.editor.getEditorElement();
    const blockManager = new BlockManager(block, this.core, () => {
      if(editor) this.core?.setContent(editor.innerHTML)
    });

    this.blockManagerMap.set(block.id, blockManager);

    this.core.insertHTMLIntoEditor(block)

    blockManager.recreateResizers();
    blockManager.updateSectionSizes();
  }

  private handleDrop(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer) {
      const editor = this.core?.editor?.getEditorElement();
      if(!editor) return
      const data = event.dataTransfer.getData('text/plain');
      const draggedElement = document.getElementById(data);
      if (draggedElement && event.target instanceof HTMLElement) {
        event.target.insertAdjacentElement('beforebegin', draggedElement);
        this.core?.setContent(editor.innerHTML);
      }
    }
  }

  public destroy(): void {
    // Очистите ресурсы или выполняйте другие необходимые действия при уничтожении модуля
    this.core = null;
    this.button?.removeEventListener('click', this.createBlock)
    this.button = null;
    this.blockManagerMap.forEach((manager) => {
      manager.destroy();
    });
    this.blockManagerMap.clear();
  }
}

export default BlockButton;
