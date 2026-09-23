import './style.scss';

import { definePlugin, insertAtomAfter, attrString, h } from '@on-codemerge/sdk';
import type { WidgetContext, ViewSpec } from '@on-codemerge/sdk';
import { FileUploader } from './services/FileUploader';
import { FileUploadMenu } from './components/FileUploadMenu';
import type { UploadConfig } from './config/UploadConfig';
import { uploadIcon, fileIcon } from '../../icons';

function renderFile(attrs: Record<string, unknown>, _wctx: WidgetContext): ViewSpec {
  const label = `${attrString(attrs.name, 'file')} (${attrString(attrs.sizeLabel, '')})`;
  return h(
    'div',
    { class: 'ocm-file-atom' },
    h(
      'a',
      {
        class: 'file-link',
        attrs: {
          href: '#',
          'data-file-id': attrString(attrs.fileId, ''),
        },
      },
      h('span', { props: { innerHTML: fileIcon } }),
      ` ${label}`
    )
  );
}

export function FileUploadPlugin(config: Partial<UploadConfig> = {}) {
  const uploader = new FileUploader(config);
  let openPicker: (() => void) | null = null;

  return definePlugin({
    name: 'file-upload',
    commands: {
      insertFile: () => {
        openPicker?.();
        return null;
      },
    },
    hotkeys: [{ keys: 'Mod-Alt-u', command: 'insertFile', description: 'Upload file' }],
    nodes: [
      {
        name: 'file',
        group: 'atom',
        atom: true,
        attrs: { fileId: '', name: '', size: 0, sizeLabel: '' },
      },
    ],
    setup(ctx) {
      const editor = ctx.editor;
      const menu = new FileUploadMenu(
        editor,
        uploader,
        config,
        (file) => {
          editor.run(
            insertAtomAfter('file', {
              fileId: file.id,
              name: file.name,
              size: file.size,
              sizeLabel: uploader.formatFileSize(file.size),
            })
          );
        },
        ctx.scope
      );
      openPicker = () => {
        menu.show();
      };

      ctx.toolbar.add({
        id: 'file-upload',
        icon: uploadIcon,
        title: editor.t('fileUpload.title'),
        menu: 'insert',
        order: 43,
        onClick: () => {
          menu.show();
        },
      });

      ctx.onDom('host', 'click', (e) => {
        const target = e.target;
        if (!(target instanceof Element)) {
          return;
        }
        const fileLink = target.closest('.file-link');
        if (!(fileLink instanceof HTMLElement)) {
          return;
        }
        const fileId = fileLink.dataset.fileId;
        if (!fileId) {
          return;
        }
        e.preventDefault();
        ctx.defer(async () => {
          try {
            await uploader.downloadFile(fileId);
          } catch (error) {
            console.error('Download failed:', error);
          }
        });
      });
    },
    widgets: {
      file: { render: renderFile },
    },
  });
}
