import type { IEditorModule, Observer, EditorCoreInterface } from "../../../src/types";

export class WordCountButton implements IEditorModule, Observer {
  private core: EditorCoreInterface | null = null;
  private wordsDiv: HTMLDivElement | null = null;
  private charDiv: HTMLDivElement | null = null;
  initialize(core: EditorCoreInterface): void {
    this.core = core

    this.wordsDiv = document.createElement('div');
    this.wordsDiv.style.paddingRight = '10px'
    this.charDiv = document.createElement('div');
    this.charDiv.style.paddingRight = '10px'

    core.footer.addHtmlItem(this.wordsDiv)
    core.footer.addHtmlItem(this.charDiv)

    this.updateCount();
    core.subscribeToContentChange(() => {
      this.updateCount();
    });

    core.i18n.addObserver(this);
  }

  update(): void {
    this.updateCount()
  }

  updateCount() {
    if(!this.core) return;
    const editorContent = this.core.editor.getEditorElement()?.innerText || '';
    const wordCount = this.countWords(editorContent);
    const charCount = editorContent.length;

    if(this.wordsDiv) this.wordsDiv.innerText = this.core!.i18n.translate('Words') + ': ' + wordCount
    if(this.charDiv) this.charDiv.innerText = this.core!.i18n.translate('Chars') + ': ' + charCount
  }

  private countWords(text: string): number {
    // Split the text by spaces and count the non-empty elements
    return text.split(/\s+/).filter((word) => word.length > 0).length;
  }

  destroy(): void {
    if(this.wordsDiv) this.wordsDiv.remove();
    if(this.charDiv) this.charDiv.remove();

  }
}

export default WordCountButton;
