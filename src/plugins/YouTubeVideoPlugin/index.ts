import { definePlugin, insertAtomAfter, attrString, h, iframe } from '@on-codemerge/sdk';
import type { WidgetContext, ViewSpec } from '@on-codemerge/sdk';
import { YouTubeVideoMenu, extractYouTubeVideoId } from './components/YouTubeVideoMenu';
import { editIcon, deleteIcon, linkIcon, youtubeIcon } from '../../icons';
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

function renderYouTube(attrs: Record<string, unknown>, wctx: WidgetContext): ViewSpec {
  const videoId = attrString(attrs.videoId, '');
  const resizer = wctx.scope.slot<Resizer>();

  return h(
    'div',
    {
      class: 'ocm-youtube-atom',
      on: {
        click: (e) => {
          const host = e.currentTarget as HTMLElement;
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
                  wctx.editor.ui.popup.open({
                    title: t('common.edit'),
                    className: 'youtube-video-menu',
                    closeOnClickOutside: true,
                    items: [
                      {
                        type: 'input',
                        id: 'youtube-url',
                        label: t('youtube.youtubeVideoUrl'),
                        placeholder: 'https://www.youtube.com/watch?v=...',
                        value: videoId ? `https://www.youtube.com/watch?v=${videoId}` : '',
                      },
                    ],
                    buttons: [
                      { label: t('common.cancel'), variant: 'secondary', onClick: () => {} },
                      {
                        label: t('common.save'),
                        variant: 'primary',
                        onClick: (values) => {
                          const id = extractYouTubeVideoId(String(values['youtube-url'] ?? ''));
                          if (!id) {
                            wctx.editor.notify(t('youtube.invalidYoutubeUrl'));
                            return false;
                          }
                          wctx.updateAttrs({ videoId: id });
                        },
                      },
                    ],
                  });
                },
              },
              {
                label: t('common.view'),
                icon: linkIcon,
                onClick: () => {
                  if (!videoId) {
                    return;
                  }
                  globalThis.open(
                    `https://www.youtube.com/watch?v=${videoId}`,
                    '_blank',
                    'noopener'
                  );
                },
              },
              { type: 'divider' },
              {
                label: t('common.delete'),
                icon: deleteIcon,
                variant: 'danger',
                onClick: () => {
                  removeAtomAt(wctx.path, (cmd) => wctx.editor.run(cmd as never));
                },
              },
            ],
            e.clientX,
            e.clientY
          );
        },
      },
    },
    iframe({
      class: 'max-w-full rounded-lg',
      src: `https://www.youtube.com/embed/${videoId}`,
      width: Number(attrs.width) || 800,
      height: Number(attrs.height) || 400,
      style: alignStyle(attrString(attrs.align, '')),
    })
  );
}

export function YouTubeVideoPlugin() {
  let openPicker: (() => void) | null = null;

  return definePlugin({
    name: 'youtube-video',
    commands: {
      insertYouTube: () => {
        openPicker?.();
        return null;
      },
    },
    hotkeys: [{ keys: 'Mod-Alt-y', command: 'insertYouTube', description: 'Insert YouTube video' }],
    nodes: [
      {
        name: 'youtube',
        group: 'atom',
        atom: true,
        attrs: { videoId: '', align: '', width: 800, height: 400 },
      },
    ],
    setup(ctx) {
      const editor = ctx.editor;
      const menu = new YouTubeVideoMenu(editor, ctx.scope);
      openPicker = () => {
        menu.show((videoUrl) => {
          const videoId = extractYouTubeVideoId(videoUrl);
          if (!videoId) {
            editor.notify(editor.t('youtube.invalidYoutubeUrl'));
            return;
          }
          editor.run(insertAtomAfter('youtube', { videoId, align: '', width: 800, height: 400 }));
        });
      };
      ctx.toolbar.add({
        id: 'youtube-video',
        icon: youtubeIcon,
        title: editor.t('youtube.insert'),
        menu: 'insert',
        order: 42,
        onClick: () => openPicker?.(),
      });
    },
    widgets: {
      youtube: { render: renderYouTube },
    },
  });
}
