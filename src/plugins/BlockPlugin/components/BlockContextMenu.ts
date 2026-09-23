import {
  splitVerticalIcon,
  splitHorizontalIcon,
  moveIcon,
  duplicateIcon,
  deleteIcon,
  insertIcon,
  textIcon,
  blockIcon,
} from '../../../icons';
import type { EditorAPI, MenuItem } from '@on-codemerge/sdk';
import { insertAtomAfter, core } from '@on-codemerge/sdk';
import { pathFromEl, removeAtomAt } from '../../../utils/atomPath';
import { layoutFromTree, leaf, serializeTree, split, splitAt, treeFromAttrs } from '../paneTree';

export class BlockContextMenu {
  private readonly editor: EditorAPI;
  private activeBlock: HTMLElement | null = null;
  /** Path into attrs.tree children; null = operate on whole block root. */
  private activePanePath: number[] | null = null;

  constructor(editor: EditorAPI) {
    this.editor = editor;
  }

  private handleAction(action: string): void {
    if (!this.activeBlock) {
      return;
    }
    const path = pathFromEl(this.activeBlock);
    const index = path?.[0] ?? this.editor.getSelection().anchor.path[0];

    switch (action) {
      case 'insert-text': {
        this.editor.run(() => [
          {
            type: 'insert_node',
            path: [],
            index: index + 1,
            node: core.createParagraph([core.createText('')]),
          },
        ]);
        break;
      }
      case 'insert-container': {
        this.editor.run(
          insertAtomAfter('block_container', { layout: 'stack', tree: serializeTree(leaf()) })
        );
        break;
      }
      case 'insert-split-row': {
        this.editor.run(
          insertAtomAfter('block_container', {
            layout: 'row',
            tree: serializeTree(split('row', [leaf(), leaf()])),
          })
        );
        break;
      }
      case 'insert-split-column': {
        this.editor.run(
          insertAtomAfter('block_container', {
            layout: 'column',
            tree: serializeTree(split('column', [leaf(), leaf()])),
          })
        );
        break;
      }
      case 'split-horizontal': {
        this.applySplit('row');
        break;
      }
      case 'split-vertical': {
        this.applySplit('column');
        break;
      }
      case 'duplicate': {
        this.editor.run(() => {
          const doc = this.editor.getJSON().doc;
          const block = doc.content?.[index];
          if (!block) {
            return null;
          }
          return [
            {
              type: 'insert_node',
              path: [],
              index: index + 1,
              node: core.cloneNode(block),
            },
          ];
        });
        break;
      }
      case 'delete': {
        removeAtomAt(this.activeBlock, (cmd) => this.editor.run(cmd));
        break;
      }
      case 'move-up': {
        if (index > 0) {
          this.editor.run(() => {
            const doc = this.editor.getJSON().doc;
            const block = doc.content?.[index];
            if (!block) {
              return null;
            }
            return [
              { type: 'remove_node', path: [], index },
              { type: 'insert_node', path: [], index: index - 1, node: core.cloneNode(block) },
            ];
          });
        }
        break;
      }
      case 'move-down': {
        this.editor.run(() => {
          const doc = this.editor.getJSON().doc;
          const block = doc.content?.[index];
          if (!block || index >= (doc.content?.length ?? 0) - 1) {
            return null;
          }
          return [
            { type: 'remove_node', path: [], index },
            { type: 'insert_node', path: [], index: index + 1, node: core.cloneNode(block) },
          ];
        });
        break;
      }
      default: {
        break;
      }
    }
  }

  /** Nest / extend the pane tree at the active pane (or root). Never wipe existing panes. */
  private applySplit(dir: 'row' | 'column'): void {
    if (!this.activeBlock) {
      return;
    }
    const blockPath = pathFromEl(this.activeBlock);
    if (!blockPath) {
      return;
    }
    const panePath = this.activePanePath ?? [];
    this.editor.run(() => {
      const doc = this.editor.getJSON().doc;
      const node = core.getNodeAt(doc, blockPath);
      if (node === null || node === undefined || node.type !== 'block_container') {
        return null;
      }
      const prev = treeFromAttrs(node.attrs ?? {});
      const next = splitAt(prev, panePath, dir);
      return [
        {
          type: 'set_attrs',
          path: blockPath,
          attrs: {
            tree: serializeTree(next),
            layout: layoutFromTree(next),
          },
        },
      ];
    });
  }

  public show(block: HTMLElement, x: number, y: number, panePath: number[] | null = null): void {
    this.activeBlock = block;
    this.activePanePath = panePath;
    const t = (k: string) => this.editor.t(k) || k;
    const items: MenuItem[] = [
      {
        label: t('common.insert'),
        icon: insertIcon,
        subMenu: [
          {
            label: t('block.textBlock'),
            icon: textIcon,
            onClick: () => {
              this.handleAction('insert-text');
            },
          },
          {
            label: t('block.containerBlock'),
            icon: blockIcon,
            onClick: () => {
              this.handleAction('insert-container');
            },
          },
          {
            label: t('Horizontal Split'),
            icon: splitHorizontalIcon,
            onClick: () => {
              this.handleAction('insert-split-row');
            },
          },
          {
            label: t('Vertical Split'),
            icon: splitVerticalIcon,
            onClick: () => {
              this.handleAction('insert-split-column');
            },
          },
        ],
      },
      {
        label: t('block.split'),
        icon: splitHorizontalIcon,
        subMenu: [
          {
            label: t('block.horizontally'),
            icon: splitHorizontalIcon,
            onClick: () => {
              this.handleAction('split-horizontal');
            },
          },
          {
            label: t('block.vertically'),
            icon: splitVerticalIcon,
            onClick: () => {
              this.handleAction('split-vertical');
            },
          },
        ],
      },
      {
        label: t('common.move'),
        icon: moveIcon,
        subMenu: [
          {
            label: t('common.up'),
            icon: moveIcon,
            onClick: () => {
              this.handleAction('move-up');
            },
          },
          {
            label: t('common.down'),
            icon: moveIcon,
            onClick: () => {
              this.handleAction('move-down');
            },
          },
        ],
      },
      {
        label: t('common.duplicate'),
        icon: duplicateIcon,
        onClick: () => {
          this.handleAction('duplicate');
        },
      },
      { type: 'divider' },
      {
        label: t('common.delete'),
        icon: deleteIcon,
        variant: 'danger',
        onClick: () => {
          this.handleAction('delete');
        },
      },
    ];
    this.editor.ui.menu.open(items, x, y);
  }

  public destroy(): void {
    this.activeBlock = null;
    this.activePanePath = null;
    this.editor.ui.menu.hide();
  }
}
