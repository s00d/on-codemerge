import { asAttr } from '../../utils/asAttr';

import { definePlugin, insertAtomAfter, attrString, h, video } from '@on-codemerge/sdk';
import type { WidgetContext, ViewSpec, EditorAPI } from '@on-codemerge/sdk';
import { VideoUploader } from './services/VideoUploader';
import { editIcon, deleteIcon, uploadIcon, videoIcon } from '../../icons';
import { Resizer } from '../../utils/Resizer';
import { atomAlignStyle } from '../../utils/atomAlign';
import { removeAtomAt } from '../../utils/atomPath';

function alignStyle(align: string): Record<string, string> {
  if (align === 'left') {
    return { float: 'left', marginRight: '1rem' };
  }
  if (align === 'right') {
    return { float: 'right', marginLeft: '1rem' };
  }
  if (align === 'center' || align === 'justify') {
    return atomAlignStyle('center');
  }
  return {};
}

function openVideoProps(
  editor: EditorAPI,
  attrs: Record<string, unknown>,
  updateAttrs: (partial: Record<string, unknown>) => void
): void {
  const t = (k: string) => editor.t(k) || k;
  const src = attrString(attrs.src, '');
  const isData = src.startsWith('data:');
  editor.ui.popup.open({
    title: t('common.edit'),
    className: 'video-props-popup',
    size: 'md',
    closeOnClickOutside: true,
    items: [
      {
        type: 'input',
        id: 'src',
        label: t('common.url'),
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
          updateAttrs({
            ...(nextSrc ? { src: nextSrc } : {}),
            width: Number(values.width) || 0,
            height: Number(values.height) || 0,
          });
        },
      },
    ],
  });
}

function renderVideo(attrs: Record<string, unknown>, wctx: WidgetContext): ViewSpec {
  const resizer = wctx.scope.slot<Resizer>();

  return h(
    'div',
    {
      class: 'ocm-video-atom',
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
          const t = (k: string) => wctx.editor.t(k) || k;
          wctx.openMenu(
            [
              {
                label: t('common.edit'),
                icon: editIcon,
                onClick: () => {
                  openVideoProps(wctx.editor, attrs, (partial) => {
                    wctx.updateAttrs(partial);
                  });
                },
              },
              {
                label: t('fileUpload.title'),
                icon: uploadIcon,
                onClick: () => {
                  void (async () => {
                    const uploader = new VideoUploader();
                    try {
                      const file = await uploader.selectFile();
                      if (!file) {
                        return;
                      }
                      const dataUrl = await uploader.readFileAsDataUrl(file);
                      wctx.updateAttrs({ src: dataUrl });
                    } catch {
                      wctx.editor.notify(t('video.failedToUploadVideo'));
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
            e.clientX,
            e.clientY
          );
        },
      },
    },
    video({
      class: 'max-w-full rounded-lg',
      src: attrString(attrs.src, ''),
      controls: true,
      style: {
        ...(asAttr(attrs.width) === '' ? {} : { width: `${asAttr(attrs.width)}px` }),
        ...alignStyle(attrString(attrs.align, '')),
      },
    })
  );
}

async function pickAndInsert(editor: EditorAPI, uploader: VideoUploader): Promise<void> {
  try {
    const file = await uploader.selectFile();
    if (!file) {
      return;
    }
    const dataUrl = await uploader.readFileAsDataUrl(file);
    editor.run(insertAtomAfter('video', { src: dataUrl, align: '' }));
  } catch (error) {
    console.error('Failed to upload video:', error);
    editor.notify(editor.t('video.failedToUploadVideo'));
  }
}

export function VideoPlugin() {
  const uploader = new VideoUploader();
  let openPicker: (() => void) | null = null;

  return definePlugin({
    name: 'video',
    commands: {
      insertVideo: () => {
        openPicker?.();
        return null;
      },
    },
    hotkeys: [{ keys: 'Mod-Alt-v', command: 'insertVideo', description: 'Insert video' }],
    nodes: [
      {
        name: 'video',
        group: 'atom',
        atom: true,
        attrs: { src: '', align: '', width: 0, height: 0 },
      },
    ],
    setup(ctx) {
      const editor = ctx.editor;
      openPicker = () => {
        ctx.defer(() => pickAndInsert(editor, uploader));
      };
      ctx.toolbar.add({
        id: 'video',
        icon: videoIcon,
        title: editor.t('video.insert'),
        menu: 'insert',
        order: 41,
        onClick: () => openPicker?.(),
      });
      ctx.onDom('host', 'drop', (e) => {
        const file = e.dataTransfer?.files?.[0];
        if (!file || !file.type.startsWith('video/')) {
          return;
        }
        e.preventDefault();
        ctx.defer(async () => {
          const dataUrl = await uploader.readFileAsDataUrl(file);
          editor.run(insertAtomAfter('video', { src: dataUrl, align: '' }));
        });
      });
    },
    widgets: {
      video: { render: renderVideo },
    },
  });
}
