import { EditorCore, IEditorModule } from "@/index";
import { BlockManager } from "./BlockManager";

export class BlockButton implements IEditorModule {
  private core: EditorCore | null = null;
  private blockManagerMap: Map<string, BlockManager> = new Map();

  initialize(core: EditorCore): void {
    this.core = core;
    core.toolbar.addButton('Block', () => this.createBlock())

    this.core.subscribeToContentChange((newContent: string) => {
      this.reloadBlocks(core);
    });
  }

  private reloadBlocks(core: EditorCore): void {
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

  // Другие методы плагина...
}

export default BlockButton;
