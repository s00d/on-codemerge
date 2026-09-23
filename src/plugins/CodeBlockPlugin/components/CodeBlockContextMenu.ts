import { copyIcon, editIcon, deleteIcon } from '../../../icons';
import type { EditorAPI } from '@on-codemerge/sdk';
import { pathFromEl, removeAtomAt } from '../../../utils/atomPath';

export class CodeBlockContextMenu {
  private activeBlock: HTMLElement | null = null;
  private readonly editor: EditorAPI;

  constructor(
    editor: EditorAPI,
    private readonly onEdit: (block: HTMLElement) => void
  ) {
    this.editor = editor;
  }

  public show(block: HTMLElement, x: number, y: number): void {
    this.activeBlock = block;
    const t = (k: string) => this.editor.t(k) || k;
    const shell = block.closest<HTMLElement>('[data-ocm-atom="1"]') ?? block;
    this.editor.ui.menu.open(
      [
        {
          label: t('common.edit'),
          icon: editIcon,
          onClick: () => {
            if (this.activeBlock) {
              this.onEdit(this.activeBlock);
            }
          },
        },
        {
          label: t('common.copy'),
          icon: copyIcon,
          onClick: () => {
            const code = this.activeBlock?.querySelector('code');
            if (code) {
              void (async () => {
                try {
                  await navigator.clipboard.writeText(code.textContent || '');
                  this.editor.notify(t('common.copied'));
                } catch {
                  /* clipboard unavailable */
                }
              })();
            }
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
    this.activeBlock = null;
    this.editor.ui.menu.hide();
  }
}
