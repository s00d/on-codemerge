import './style.scss';

import { definePlugin, insertAtomAfter, attrString, h, iframe } from '@on-codemerge/sdk';
import type { WidgetContext, ViewSpec, EditorAPI } from '@on-codemerge/sdk';
import { editIcon, deleteIcon, linkIcon, pdfIcon } from '../../icons';
import { Resizer } from '../../utils/Resizer';
import { atomAlignStyle } from '../../utils/atomAlign';
import { removeAtomAt } from '../../utils/atomPath';

function openPdfProps(
  editor: EditorAPI,
  attrs: Record<string, unknown>,
  updateAttrs: (partial: Record<string, unknown>) => void
): void {
  const t = (k: string) => editor.t(k) || k;
  editor.ui.popup.open({
    title: t('common.edit'),
    className: 'pdf-embed-popup',
    closeOnClickOutside: true,
    items: [
      {
        type: 'input',
        id: 'pdf-url',
        label: t('pdf.pdfUrl'),
        placeholder: 'https://example.com/file.pdf',
        value: attrString(attrs.url, ''),
      },
      {
        type: 'number',
        id: 'pdf-width',
        label: t('common.width'),
        value: Number(attrs.width) || 800,
      },
      {
        type: 'number',
        id: 'pdf-height',
        label: t('common.height'),
        value: Number(attrs.height) || 600,
      },
    ],
    buttons: [
      { label: t('common.cancel'), variant: 'secondary', onClick: () => {} },
      {
        label: t('common.save'),
        variant: 'primary',
        onClick: (values) => {
          const url = String(values['pdf-url'] ?? '').trim();
          if (!url) {
            editor.notify(t('pdf.pdfUrlIsRequired'));
            return false;
          }
          updateAttrs({
            url,
            width: Number(values['pdf-width']) || 800,
            height: Number(values['pdf-height']) || 600,
          });
          return true;
        },
      },
    ],
  });
}

function renderPdf(attrs: Record<string, unknown>, wctx: WidgetContext): ViewSpec {
  const resizer = wctx.scope.slot<Resizer>();
  const align = attrString(attrs.align, '');
  const url = attrString(attrs.url, '');

  return h(
    'div',
    {
      class: 'pdf-embed-container my-4 ocm-pdf-atom',
      style: {
        width: `${Number(attrs.width) || 800}px`,
        height: `${Number(attrs.height) || 600}px`,
        ...atomAlignStyle(align),
      },
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
                  openPdfProps(wctx.editor, attrs, (partial) => {
                    wctx.updateAttrs(partial);
                  });
                },
              },
              {
                label: t('common.view'),
                icon: linkIcon,
                onClick: () => {
                  if (!url) {
                    return;
                  }
                  globalThis.open(url, '_blank', 'noopener');
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
    iframe({
      class: 'pdf-embed-frame',
      src: url,
      width: '100%',
      height: '100%',
      attrs: { loading: 'lazy' },
    })
  );
}

export function PDFEmbedPlugin() {
  let openPicker: (() => void) | null = null;

  return definePlugin({
    name: 'pdf-embed',
    commands: {
      insertPdf: () => {
        openPicker?.();
        return null;
      },
    },
    hotkeys: [{ keys: 'Mod-Alt-p', command: 'insertPdf', description: 'Insert PDF' }],
    nodes: [
      {
        name: 'pdf',
        group: 'atom',
        atom: true,
        attrs: { url: '', width: 800, height: 600, align: '' },
      },
    ],
    setup(ctx) {
      const editor = ctx.editor;
      openPicker = () => {
        ctx.popup.open({
          title: editor.t('pdf.insertPdf'),
          className: 'pdf-embed-popup',
          closeOnClickOutside: true,
          items: [
            {
              type: 'input',
              id: 'pdf-url',
              label: editor.t('pdf.pdfUrl'),
              placeholder: 'https://example.com/file.pdf',
              value: '',
            },
            {
              type: 'number',
              id: 'pdf-width',
              label: editor.t('common.width'),
              value: 800,
            },
            {
              type: 'number',
              id: 'pdf-height',
              label: editor.t('common.height'),
              value: 600,
            },
          ],
          buttons: [
            {
              label: editor.t('common.cancel'),
              variant: 'secondary',
              onClick: () => {},
            },
            {
              label: editor.t('common.insert'),
              variant: 'primary',
              onClick: (values) => {
                const url = String(values['pdf-url'] ?? '').trim();
                if (!url) {
                  editor.notify(editor.t('pdf.pdfUrlIsRequired'));
                  return;
                }
                editor.run(
                  insertAtomAfter('pdf', {
                    url,
                    width: Number(values['pdf-width']) || 800,
                    height: Number(values['pdf-height']) || 600,
                    align: '',
                  })
                );
              },
            },
          ],
        });
      };
      ctx.toolbar.add({
        id: 'pdf-embed',
        icon: pdfIcon,
        title: () => editor.t('pdf.insertPdf'),
        menu: 'insert',
        order: 44,
        onClick: () => openPicker?.(),
      });
    },
    widgets: {
      pdf: { render: renderPdf },
    },
  });
}
