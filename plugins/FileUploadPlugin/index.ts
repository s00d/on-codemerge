import { wirePluginLocales } from '@codemerge/editor';
import pluginLocaleEn from './i18n/locales/en.json';

import {
  definePlugin,
  insertAtomAfter,
  attrString,
  h,
  pluginToolbarPlacement,
} from '@codemerge/sdk';
import type { PluginToolbarOpts, ViewSpec } from '@codemerge/sdk';
import { FileUploader } from './services/FileUploader';
import { FileUploadMenu } from './components/FileUploadMenu';
import type { UploadConfig } from './config/UploadConfig';
import { uploadIcon, fileIcon } from '@ocm/wysiwyg/icons';

const pluginLocaleModules = import.meta.glob<{ default: Record<string, unknown> }>([
  './i18n/locales/*.json',
  '!./i18n/locales/en.json',
]);

function renderFile(attrs: Record<string, unknown>): ViewSpec {
  const label = `${attrString(attrs.name, 'file')} (${attrString(attrs.sizeLabel, '')})`;
  return h(
    'div',
    { class: 'ocm-file-atom', attrs: { 'data-node': 'file' } },
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

export function FileUploadPlugin(config: Partial<UploadConfig> & PluginToolbarOpts = {}) {
  const { menu, group, order, ...uploadConfig } = config;
  const toolbarOpts: PluginToolbarOpts = {
    ...(menu !== undefined ? { menu } : {}),
    ...(group !== undefined ? { group } : {}),
    ...(order !== undefined ? { order } : {}),
  };
  const uploader = new FileUploader(uploadConfig);
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
      ctx.disposable(
        wirePluginLocales(ctx.editor, pluginLocaleEn, pluginLocaleModules, './i18n/locales')
      );
      const editor = ctx.editor;
      const picker = new FileUploadMenu(
        editor,
        uploader,
        uploadConfig,
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
        picker.show();
      };

      ctx.toolbar.add({
        id: 'file-upload',
        icon: uploadIcon,
        title: () => editor.t('fileUpload.title'),
        ...pluginToolbarPlacement({ menu: 'insert', order: 43 }, toolbarOpts),
        onClick: () => {
          picker.show();
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
      file: { render: (attrs) => renderFile(attrs) },
    },
    publish: {
      node: 'file',
      render: (attrs) => renderFile(attrs),
    },
  });
}
