import type { EditorAPI } from '@on-codemerge/sdk';
import type { Viewport } from '../types';
import type { ViewportManager } from '../services/ViewportManager';

export class SetViewportCommand {
  private viewport: Viewport = 'responsive';

  constructor(private readonly editor: EditorAPI) {}

  setViewport(viewport: Viewport): void {
    this.viewport = viewport;
  }

  execute(): void {
    const mgr = (this.editor.host as HTMLElement & { __ocmViewportManager?: ViewportManager })
      .__ocmViewportManager;
    if (mgr) {
      mgr.setViewport(this.editor.host, this.viewport);
      return;
    }
    this.editor.host.style.maxWidth =
      this.viewport === 'responsive'
        ? '100%'
        : this.viewport === 'mobile'
          ? '320px'
          : this.viewport === 'tablet'
            ? '768px'
            : '1024px';
    this.editor.host.style.margin = '0 auto';
  }
}
