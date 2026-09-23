import './style.scss';

import { definePlugin, insertAtomAfter, attrString, h, img } from '@on-codemerge/sdk';
import type { WidgetContext, ViewSpec, EditorAPI } from '@on-codemerge/sdk';
import { ImageUploader } from './services/ImageUploader';
import { copyIcon, editIcon, deleteIcon, imageIcon, uploadIcon } from '../../icons';
import { Resizer } from '../../utils/Resizer';
import { asAttr } from '../../utils/asAttr';
import { atomAlignStyle } from '../../utils/atomAlign';
import { removeAtomAt } from '../../utils/atomPath';

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

function openImageProps(
  editor: EditorAPI,
  attrs: Record<string, unknown>,
  updateAttrs: (partial: Record<string, unknown>) => void
): void {
  const t = (k: string) => editor.t(k) || k;
  const src = attrString(attrs.src, '');
  const isData = src.startsWith('data:');
  editor.ui.popup.open({
    title: t('common.edit'),
    className: 'image-props-popup',
    size: 'md',
    closeOnClickOutside: true,
    items: [
      {
        type: 'input',
        id: 'alt',
        label: t('common.title'),
        placeholder: 'Alt text',
        value: attrString(attrs.alt, ''),
      },
      {
        type: 'input',
        id: 'src',
        label: t('image.imageUrl'),
        placeholder: 'https://…',
        value: isData ? '' : src,
      },
      {
        type: 'number',
        id: 'width',
        label: t('common.width'),
        value: Number(attrs.width) || 0,
      },
      {
        type: 'number',
        id: 'height',
        label: t('common.height'),
        value: Number(attrs.height) || 0,
      },
    ],
    buttons: [
      { label: t('common.cancel'), variant: 'secondary', onClick: () => {} },
      {
        label: t('common.save'),
        variant: 'primary',
        onClick: (values) => {
          const nextSrc = String(values.src ?? '').trim();
          const width = Number(values.width) || 0;
          const height = Number(values.height) || 0;
          updateAttrs({
            alt: String(values.alt ?? ''),
            ...(nextSrc ? { src: nextSrc } : {}),
            width,
            height,
          });
        },
      },
    ],
  });
}

function renderImage(attrs: Record<string, unknown>, wctx: WidgetContext): ViewSpec {
  const align = attrString(attrs.align, '');
  const src = attrString(attrs.src, '');
  const alt = attrString(attrs.alt, '');
  const widthStr = asAttr(attrs.width);
  const heightStr = asAttr(attrs.height);
  const width = widthStr === '' ? undefined : `${widthStr}px`;
  const height = heightStr === '' ? undefined : `${heightStr}px`;
  const resizer = wctx.scope.slot<Resizer>();

  const openMenu = (x: number, y: number) => {
    const t = (k: string) => wctx.editor.t(k) || k;
    wctx.openMenu(
      [
        {
          label: t('common.edit'),
          icon: editIcon,
          onClick: () => {
            openImageProps(wctx.editor, attrs, (partial) => {
              wctx.updateAttrs(partial);
            });
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
          label: t('fileUpload.title'),
          icon: uploadIcon,
          onClick: () => {
            void (async () => {
              const uploader = new ImageUploader();
              try {
                const file = await uploader.selectFile();
                if (!file) {
                  return;
                }
                const dataUrl = await uploader.readFileAsDataUrl(file);
                wctx.updateAttrs({ src: dataUrl, alt: file.name });
              } catch {
                wctx.editor.notify(t('image.failedToUploadImage'));
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
                wctx.updateAttrs({ width: host.offsetWidth, height: host.offsetHeight });
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

async function pickAndInsert(editor: EditorAPI, uploader: ImageUploader): Promise<void> {
  try {
    const file = await uploader.selectFile();
    if (!file) {
      return;
    }
    const dataUrl = await uploader.readFileAsDataUrl(file);
    editor.run(insertAtomAfter('image', { src: dataUrl, align: '', alt: file.name }));
  } catch (error) {
    console.error('Failed to upload image:', error);
    editor.notify(editor.t('image.failedToUploadImage'));
  }
}

export function ImagePlugin() {
  const uploader = new ImageUploader();
  let openPicker: (() => void) | null = null;

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
      openPicker = () => {
        ctx.defer(() => pickAndInsert(editor, uploader));
      };
      ctx.toolbar.add({
        id: 'image',
        icon: imageIcon,
        title: () => editor.t('image.insert'),
        menu: 'insert',
        order: 40,
        onClick: () => openPicker?.(),
      });

      ctx.onDom('host', 'drop', (e) => {
        const file = e.dataTransfer?.files?.[0];
        if (!file || !file.type.startsWith('image/')) {
          return;
        }
        e.preventDefault();
        ctx.defer(async () => {
          const dataUrl = await uploader.readFileAsDataUrl(file);
          editor.run(insertAtomAfter('image', { src: dataUrl, align: '', alt: file.name }));
        });
      });
    },
    widgets: {
      image: { render: renderImage },
    },
  });
}
