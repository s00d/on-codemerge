import { PopupController, h } from '@on-codemerge/sdk';
import type { DisposableScope, EditorAPI, ViewSpec } from '@on-codemerge/sdk';
import { ExportService } from '../services/ExportService';
import { htmlIcon, markdownIcon, textIcon, pdfIcon } from '../../../icons';

export class ExportMenu {
  private readonly editor: EditorAPI;
  private readonly popups: PopupController;
  private readonly exportService = new ExportService();

  constructor(editor: EditorAPI, scope: DisposableScope) {
    this.editor = editor;
    this.popups = new PopupController((o) => editor.ui.popup.open(o), scope);
  }

  private formatsView(): ViewSpec {
    const formats: { id: string; label: string; icon: string }[] = [
      { id: 'html', label: this.editor.t('export.htmlFile'), icon: htmlIcon },
      {
        id: 'markdown',
        label: this.editor.t('export.markdownFile'),
        icon: markdownIcon,
      },
      { id: 'text', label: this.editor.t('export.plainText'), icon: textIcon },
      { id: 'pdf', label: this.editor.t('export.printPdfFile') || 'Print / PDF', icon: pdfIcon },
    ];
    return h(
      'div',
      { class: 'export-formats' },
      ...formats.map((f) =>
        h(
          'button',
          {
            class: 'export-format-btn',
            attrs: { type: 'button' },
            on: {
              click: () => {
                this.exportService.export(this.editor, f.id);
                this.popups.close();
              },
            },
          },
          h('span', {
            props: { innerHTML: f.icon },
            class: 'export-format-icon',
          }),
          f.label
        )
      )
    );
  }

  show(): void {
    this.popups.open({
      title: this.editor.t('export.title'),
      className: 'export-menu',
      closeOnClickOutside: true,
      items: [
        {
          type: 'view',
          id: 'export-formats',
          view: () => this.formatsView(),
        },
      ],
      buttons: [
        {
          label: this.editor.t('common.cancel'),
          variant: 'secondary',
          onClick: () => {},
        },
      ],
    });
  }
}
