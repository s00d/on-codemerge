import './style.scss';

import {
  definePlugin,
  insertAtomAfter,
  attrString,
  h,
  img,
  pluginToolbarPlacement,
} from '@on-codemerge/sdk';
import type { WidgetContext, ViewSpec, EditorAPI, PluginToolbarOpts } from '@on-codemerge/sdk';
import type { UploadConfig } from '../FileUploadPlugin/config/UploadConfig';
import { ImageInsertModal } from './components/ImageInsertModal';
import { copyIcon, editIcon, deleteIcon, imageIcon, uploadIcon } from '@ocm/wysiwyg/icons';
import { Resizer } from '@ocm/wysiwyg/utils/Resizer';
import { atomAlignStyle } from '@ocm/wysiwyg/utils/atomAlign';
import { removeAtomAt } from '@ocm/wysiwyg/utils/atomPath';

export type ImagePluginOptions = Partial<UploadConfig> & PluginToolbarOpts;

function alignStyle(align: string): Record<string, string> {
  if (align === 'left') {
    return { float: 'left', marginRight: '1rem', display: '', marginLeft: '' };
  }
  if (align === 'right') {
    return { float: 'right', marginLeft: '1rem', display: '', marginRight: '' };
  }
  if (align === 'center' || align === 'justify') {
    return atomAlignStyle('center');
  }
  return {};
}

function dimPx(v: unknown): string | undefined {
  const n = typeof v === 'number' ? v : Number(v);
  if (!Number.isFinite(n) || n <= 0) {
    return undefined;
  }
  return `${Math.round(n)}px`;
}

function renderImage(
  attrs: Record<string, unknown>,
  wctx: WidgetContext,
  modal: ImageInsertModal | null
): ViewSpec {
  const align = attrString(attrs.align, '');
  const src = attrString(attrs.src, '');
  const alt = attrString(attrs.alt, '');
  const width = dimPx(attrs.width);
  const height = dimPx(attrs.height);
  const resizer = wctx.scope.slot<Resizer>();

  const openMenu = (x: number, y: number) => {
    const t = (k: string) => wctx.editor.t(k) || k;
    wctx.openMenu(
      [
        {
          label: t('common.edit'),
          icon: editIcon,
          onClick: () => {
            modal?.show(
              (result) => {
                wctx.updateAttrs(result);
              },
              {
                src,
                alt,
                align,
                width: Number(attrs.width) || 0,
                height: Number(attrs.height) || 0,
              }
            );
          },
        },
        {
          label: t('common.copy'),
          icon: copyIcon,
          onClick: () => {
            if (!src || src.startsWith('data:')) {
              wctx.editor.notify(t('common.copied'));
              return;
            }
            void (async () => {
              try {
                await navigator.clipboard.writeText(src);
                wctx.editor.notify(t('common.copied'));
              } catch {
                /* clipboard unavailable */
              }
            })();
          },
        },
        {
          label: t('image.changeSource'),
          icon: uploadIcon,
          onClick: () => {
            modal?.show(
              (result) => {
                wctx.updateAttrs(result);
              },
              { alt, align }
            );
          },
        },
        { type: 'divider' },
        {
          label: t('common.delete'),
          icon: deleteIcon,
          variant: 'danger',
          onClick: () => {
            removeAtomAt(wctx.path, (cmd) => wctx.editor.run(cmd));
          },
        },
      ],
      x,
      y
    );
  };

  return h(
    'div',
    {
      class: 'ocm-image-atom',
      on: {
        click: (e) => {
          const host = e.currentTarget;
          if (!(host instanceof HTMLElement)) {
            return;
          }
          resizer.replace(
            new Resizer(host, {
              aspect: 'lock',
              onBlur: () => {
                resizer.clear();
              },
              onResizeEnd: () => {
                const nextW = host.offsetWidth;
                const nextH = host.offsetHeight;
                if (nextW > 0 && nextH > 0) {
                  wctx.updateAttrs({ width: nextW, height: nextH });
                }
              },
            })
          );
        },
        contextmenu: (e) => {
          e.preventDefault();
          e.stopPropagation();
          openMenu(e.clientX, e.clientY);
        },
      },
    },
    img({
      class: 'max-w-full h-auto rounded-lg',
      src,
      alt,
      style: {
        ...(width ? { width } : {}),
        ...(height ? { height } : {}),
        ...alignStyle(align),
      },
    })
  );
}

function insertResult(
  editor: EditorAPI,
  result: {
    src: string;
    alt: string;
    align: string;
    width: number;
    height: number;
  }
): void {
  editor.run(
    insertAtomAfter('image', {
      src: result.src,
      alt: result.alt,
      align: result.align,
      width: result.width,
      height: result.height,
    })
  );
}

export function ImagePlugin(opts: ImagePluginOptions = {}) {
  const { menu, group, order, ...uploadConfig } = opts;
  const toolbarOpts: PluginToolbarOpts = {
    ...(menu !== undefined ? { menu } : {}),
    ...(group !== undefined ? { group } : {}),
    ...(order !== undefined ? { order } : {}),
  };

  let openPicker: ((seed?: { file?: File | null }) => void) | null = null;
  let modalRef: ImageInsertModal | null = null;

  return definePlugin({
    name: 'image',
    commands: {
      insertImage: () => {
        openPicker?.();
        return null;
      },
    },
    hotkeys: [{ keys: 'Mod-Alt-i', command: 'insertImage', description: 'Insert image' }],
    nodes: [
      {
        name: 'image',
        group: 'atom',
        atom: true,
        attrs: { src: '', alt: '', align: '', width: 0, height: 0 },
      },
    ],
    setup(ctx) {
      const editor = ctx.editor;
      const modal = new ImageInsertModal(editor, uploadConfig, ctx.scope);
      modalRef = modal;
      openPicker = (seed = {}) => {
        modal.show((result) => {
          insertResult(editor, result);
        }, seed);
      };
      ctx.toolbar.add({
        id: 'image',
        icon: imageIcon,
        title: () => editor.t('image.insert'),
        ...pluginToolbarPlacement({ menu: 'insert', order: 40 }, toolbarOpts),
        onClick: () => openPicker?.(),
      });

      ctx.onDom('host', 'drop', (e) => {
        const file = e.dataTransfer?.files?.[0];
        if (!file || !file.type.startsWith('image/')) {
          return;
        }
        e.preventDefault();
        openPicker?.({ file });
      });

      ctx.own({
        destroy: () => {
          modalRef = null;
          openPicker = null;
        },
      });
    },
    widgets: {
      image: {
        render: (attrs, wctx) => renderImage(attrs, wctx, modalRef),
      },
    },
  });
}
