import { copyIcon, editIcon, deleteIcon } from '../../../icons';
import type { EditorAPI } from '@on-codemerge/sdk';
import type { MathMenu } from './MathMenu';
import { pathFromEl, removeAtomAt } from '../../../utils/atomPath';

export class MathContextMenu {
  private atomHost: HTMLElement | null = null;
  private mathContainer: HTMLElement | null = null;
  private readonly editor: EditorAPI;

  constructor(
    editor: EditorAPI,
    private readonly mathMenu: MathMenu
  ) {
    this.editor = editor;
  }

  public show(atomHost: HTMLElement, mathContainer: HTMLElement, x: number, y: number): void {
    this.atomHost = atomHost;
    this.mathContainer = mathContainer;
    const shell = atomHost.closest<HTMLElement>('[data-ocm-atom="1"]') ?? atomHost;
    const t = (k: string) => this.editor.t(k) || k;
    this.editor.ui.menu.open(
      [
        {
          label: t('common.edit'),
          icon: editIcon,
          onClick: () => {
            if (!this.atomHost || !this.mathContainer) {
              return;
            }
            this.mathMenu.edit(this.atomHost, this.mathContainer);
          },
        },
        {
          label: t('common.copy'),
          icon: copyIcon,
          onClick: () => {
            const expr = this.mathContainer?.dataset.mathExpression ?? '';
            if (!expr) {
              return;
            }
            void (async () => {
              try {
                await navigator.clipboard.writeText(expr);
                this.editor.notify(t('common.copied'));
              } catch {
                /* clipboard unavailable */
              }
            })();
          },
        },
        { type: 'divider' },
        {
          label: t('common.delete'),
          icon: deleteIcon,
          variant: 'danger',
          onClick: () => {
            removeAtomAt(pathFromEl(shell) ?? shell, (cmd) => this.editor.run(cmd));
          },
        },
      ],
      x,
      y
    );
  }

  public destroy(): void {
    this.editor.ui.menu.hide();
  }
}
