import type { EditorCore } from "@/index";
import type { IEditorModule } from "@/types";

export class WordCountButton implements IEditorModule {
  private core: EditorCore | null = null;
  private wordsDiv: HTMLDivElement | null = null;
  private charDiv: HTMLDivElement | null = null;
  initialize(core: EditorCore): void {
    this.core = core

    this.wordsDiv = document.createElement('div');
    this.wordsDiv.style.paddingRight = '10px'
    this.charDiv = document.createElement('div');
    this.charDiv.style.paddingRight = '10px'

    core.footer.addHtmlItem(this.wordsDiv)
    core.footer.addHtmlItem(this.charDiv)

    this.update();
    core.subscribeToContentChange(() => {
      this.update();
    });
  }

  update() {
    if(!this.core) return;
    const editorContent = this.core.editor.getEditorElement()?.innerText || '';
    const wordCount = this.countWords(editorContent);
    const charCount = editorContent.length;

    if(this.wordsDiv) this.wordsDiv.innerText = 'Words: ' + wordCount
    if(this.charDiv) this.charDiv.innerText = 'Chars: ' + charCount
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
