import { maximize } from "../../../src/icons";
import type { IEditorModule, Observer, EditorCoreInterface } from "../../../src/types";

export class FullscreenButton implements IEditorModule, Observer {
  private core: EditorCoreInterface | null = null;
  private button: HTMLDivElement | null = null;

  initialize(core: EditorCoreInterface): void {
    this.core = core;

    // Добавляем кнопку для переключения полноэкранного режима
    this.button = core.toolbar.addButtonIcon('Fullscreen', maximize, this.toggleFullscreen.bind(this));
    core.i18n.addObserver(this);
  }

  update(): void {
    if(this.button) this.button.title = this.core!.i18n.translate('Fullscreen');
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

  destroy(): void {
    // You can perform any necessary cleanup here
    this.core = null;
    this.button?.removeEventListener('click', this.toggleFullscreen)
    this.button = null;
  }
}

export default FullscreenButton;
