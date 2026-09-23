import './style.scss';

import { definePlugin, insertAtomAfter, core, foreign, h, mount } from '@on-codemerge/sdk';
import type { WidgetContext, ViewSpec } from '@on-codemerge/sdk';
import { BlockContextMenu } from './components/BlockContextMenu';
import { blockIcon } from '../../icons';
import { Resizer } from '../../utils/Resizer';
import type { BlockTree } from './paneTree';
import { layoutFromTree, leaf, serializeTree, treeFromAttrs } from './paneTree';

function paneLabel(path: number[]): string {
  if (path.length === 0) {
    return 'Block';
  }
  return `Pane ${path.map((i) => i + 1).join('.')}`;
}

function renderTree(tree: BlockTree, path: number[]): ViewSpec {
  if (tree.kind === 'leaf') {
    return h(
      'div',
      {
        class: 'block-pane editor-block',
        attrs: {
          'data-block-type': 'pane',
          'data-pane-path': path.join('.'),
        },
      },
      paneLabel(path.length === 0 ? [0] : path)
    );
  }
  const dirClass = tree.dir === 'row' ? 'horizontal' : 'vertical';
  return h(
    'div',
    {
      class: `block-container-inner block-split-panes split-nested split-${dirClass}`,
      attrs: {
        'data-direction': tree.dir === 'row' ? 'horizontal' : 'vertical',
        'data-pane-path': path.length > 0 ? path.join('.') : '',
      },
    },
    tree.children.map((child, i) => renderTree(child, [...path, i]))
  );
}

function renderBlock(attrs: Record<string, unknown>, wctx: WidgetContext): ViewSpec {
  return foreign((host, scope) => {
    const tree = treeFromAttrs(attrs);
    const layout = layoutFromTree(tree);
    const w = Number(attrs.width) || 0;
    const heightPx = Number(attrs.height) || 0;
    const splitClass =
      layout === 'row'
        ? ' split-container horizontal'
        : layout === 'column'
          ? ' split-container vertical'
          : '';
    host.className = `ocm-block-container editor-block layout-${layout}${splitClass}`;
    host.dataset.blockType = layout === 'stack' ? 'container' : 'split';
    if (layout === 'row' || layout === 'column') {
      host.dataset.direction = layout === 'row' ? 'horizontal' : 'vertical';
    } else {
      delete host.dataset.direction;
    }
    if (w > 0) {
      host.style.width = `${w}px`;
    }
    if (heightPx > 0) {
      host.style.minHeight = `${heightPx}px`;
    }

    const body =
      tree.kind === 'leaf'
        ? h(
            'div',
            {
              class: 'block-container-inner block-content',
              attrs: { 'data-placeholder': 'Block container' },
            },
            'Block container'
          )
        : renderTree(tree, []);

    const innerMount = mount(host, body);
    scope.own(innerMount);

    const resizer = scope.slot<Resizer>();
    // oxlint-disable-next-line typescript/strict-boolean-expressions -- non-null object guard
    const menu = wctx.editor ? scope.own(new BlockContextMenu(wctx.editor)) : null;

    scope.on(host, 'click', () => {
      resizer.replace(
        new Resizer(host, {
          aspect: 'free',
          onBlur: () => {
            resizer.clear();
          },
          onResizeEnd: () => {
            wctx.updateAttrs({ width: host.offsetWidth, height: host.offsetHeight });
          },
        })
      );
    });

    const openMenu = (e: MouseEvent, panePath: number[] | null) => {
      e.preventDefault();
      e.stopPropagation();
      menu?.show(host, e.clientX, e.clientY, panePath);
    };

    scope.on(host, 'contextmenu', (e) => {
      const target = e.target as Element | null;
      const pane = target?.closest<HTMLElement>('[data-pane-path]');
      if (pane && host.contains(pane) && pane.dataset.panePath !== undefined) {
        const raw = pane.dataset.panePath;
        const panePath =
          raw === ''
            ? []
            : raw
                .split('.')
                .map((n) => Number(n))
                .filter((n) => Number.isFinite(n));
        // Nested split wrappers use data-pane-path too — only leaf panes are `.block-pane`.
        if (pane.classList.contains('block-pane')) {
          openMenu(e, panePath);
          return;
        }
      }
      openMenu(e, null);
    });
  });
}

export function BlockPlugin() {
  return definePlugin({
    name: 'block',
    nodes: [
      {
        name: 'block_container',
        group: 'atom',
        atom: true,
        attrs: { layout: 'stack', tree: '', width: 0, height: 0 },
      },
    ],
    commands: {
      insertBlock: insertAtomAfter('block_container', {
        layout: 'stack',
        tree: serializeTree(leaf()),
      }),
      insertTextBlock: (state) => {
        const index = state.selection.anchor.path[0] + 1;
        return [
          {
            type: 'insert_node',
            path: [],
            index,
            node: core.createParagraph([core.createText('')]),
          },
        ];
      },
      insertContainer: insertAtomAfter('block_container', {
        layout: 'stack',
        tree: serializeTree(leaf()),
      }),
    },
    hotkeys: [
      { keys: 'Mod-Alt-n', command: 'insertBlock', description: 'Insert block' },
      { keys: 'Mod-Alt-t', command: 'insertTextBlock', description: 'Insert text block' },
      { keys: 'Mod-Alt-c', command: 'insertContainer', description: 'Insert container' },
    ],
    setup(ctx) {
      const editor = ctx.editor;
      const blockMenu = ctx.own(new BlockContextMenu(editor));

      ctx.toolbar.add({
        id: 'block',
        icon: blockIcon,
        title: editor.t('block.insert'),
        menu: 'insert',
        order: 25,
        onClick: () => editor.command('insertBlock'),
      });

      ctx.onDom('host', 'contextmenu', (e) => {
        const block = (e.target as Element).closest('.ocm-block-container, .html-editor-block');
        if (!(block instanceof HTMLElement)) {
          return;
        }
        const pane = (e.target as Element).closest<HTMLElement>('.block-pane[data-pane-path]');
        const panePath =
          pane && block.contains(pane) && pane.dataset.panePath
            ? pane.dataset.panePath
                .split('.')
                .map(Number)
                .filter((n) => Number.isFinite(n))
            : null;
        e.preventDefault();
        blockMenu.show(block, e.clientX, e.clientY, panePath);
      });
    },
    widgets: {
      block_container: { render: renderBlock },
    },
  });
}
