import type { EditorCore, IEditorModule } from "@/index";

export class FullscreenButton implements IEditorModule {
  private core: EditorCore | null = null;

  initialize(core: EditorCore): void {
    this.core = core;

    // Добавляем кнопку для переключения полноэкранного режима
    core.toolbar.addButton('Fullscreen', () => this.toggleFullscreen());
  }

  private toggleFullscreen(): void {
    if (!this.core) return;

    const editorElement = this.core.generalElement;
    if (!editorElement) return;

    if (!document.fullscreenElement) {
      this.enterFullscreen(editorElement);
    } else {
      this.exitFullscreen();
    }

  }

  private enterFullscreen(editorElement: HTMLElement): void {
    editorElement.style.backgroundColor = 'white';
    if (editorElement.requestFullscreen) {
      editorElement.requestFullscreen().catch(err => {
        alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
      });
    }
  }

  private exitFullscreen(): void {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  }
}

export default FullscreenButton;
