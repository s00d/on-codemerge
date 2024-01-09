import type { EditorCore, IEditorModule } from "@/index";
import feather from "feather-icons";

export class FullscreenButton implements IEditorModule {
  private core: EditorCore | null = null;

  initialize(core: EditorCore): void {
    this.core = core;

    // Добавляем кнопку для переключения полноэкранного режима
    const icon = feather.icons.maximize.toSvg({  width: '16px', height: '16px', class: 'on-codemerge-icon', 'stroke-width': 3 });
    core.toolbar.addButtonIcon('Fullscreen', icon, () => this.toggleFullscreen());
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
