import { PopupController, foreign, h, mount } from '@on-codemerge/sdk';
import type { DisposableScope, EditorAPI, ViewSpec } from '@on-codemerge/sdk';
import type { FileUploader } from '../services/FileUploader';
import type { UploadConfig } from '../config/UploadConfig';
import { uploadMessageIcon } from '../../../icons';

/** File upload — ViewSpec shell; file input + progress mutations in foreign. */
export class FileUploadMenu {
  private readonly editor: EditorAPI;
  private readonly popups: PopupController;
  private readonly uploader: FileUploader;
  private readonly config: Partial<UploadConfig>;
  private readonly onUpload: ((file: { id: string; name: string; size: number }) => void) | null;

  constructor(
    editor: EditorAPI,
    uploader: FileUploader,
    config: Partial<UploadConfig>,
    onUpload: (file: { id: string; name: string; size: number }) => void,
    scope: DisposableScope
  ) {
    this.editor = editor;
    this.popups = new PopupController((o) => editor.ui.popup.open(o), scope);
    this.uploader = uploader;
    this.config = config;
    this.onUpload = onUpload;
  }

  private body(): ViewSpec {
    const maxSize = this.uploader.formatFileSize(this.config.maxFileSize ?? 10 * 1024 * 1024);
    const t = (k: string) => this.editor.t(k) || k;

    return foreign((host, scope) => {
      host.className = 'p-4';
      let fill: HTMLElement | null = null;
      let message: HTMLElement | null = null;
      let progress: HTMLElement | null = null;
      let filename: HTMLElement | null = null;
      let fileInput: HTMLInputElement | null = null;

      const start = async (file: File) => {
        const max = this.config.maxFileSize ?? 10 * 1024 * 1024;
        if (file.size > max) {
          this.editor.notify(t('File size exceeds limit'));
          return;
        }
        message?.classList.add('hidden');
        progress?.classList.remove('hidden');
        if (filename) {
          filename.textContent = `${t('fileUpload.uploading')} ${file.name}...`;
        }
        let pct = 0;
        const tick = globalThis.setInterval(() => {
          pct = Math.min(95, pct + 5);
          if (fill) {
            fill.style.width = `${pct}%`;
          }
        }, 50);
        scope.disposable(() => {
          clearInterval(tick);
        });
        try {
          const uploaded = await this.uploader.uploadFile(file);
          clearInterval(tick);
          if (fill) {
            fill.style.width = '100%';
          }
          this.onUpload?.(uploaded);
          this.popups.close();
        } catch (error) {
          clearInterval(tick);
          message?.classList.remove('hidden');
          progress?.classList.add('hidden');
          if (fill) {
            fill.style.width = '0%';
          }
          console.error(error);
          this.editor.notify(t('Upload failed'));
        }
      };

      const shell = mount(
        host,
        h('div', { class: 'upload-root' }, [
          h(
            'div',
            {
              class:
                'upload-area border-2 border-dashed border-gray-300 rounded-lg p-8 text-center',
              ref: 'area',
              on: {
                dragover: (e) => {
                  e.preventDefault();
                  const areaEl = e.currentTarget;
                  if (areaEl instanceof HTMLElement) {
                    areaEl.classList.add('drag-over');
                  }
                },
                dragleave: (e) => {
                  const areaEl = e.currentTarget;
                  if (areaEl instanceof HTMLElement) {
                    areaEl.classList.remove('drag-over');
                  }
                },
                drop: (e) => {
                  e.preventDefault();
                  const areaEl = e.currentTarget;
                  if (areaEl instanceof HTMLElement) {
                    areaEl.classList.remove('drag-over');
                  }
                  const file = e.dataTransfer?.files?.[0];
                  if (file) {
                    void start(file);
                  }
                },
              },
            },
            [
              h('div', { class: 'upload-message', ref: 'message' }, [
                h('div', { props: { innerHTML: uploadMessageIcon } }),
                h('p', { class: 'mt-2 text-sm text-gray-600' }, [
                  `${t('common.dragAndDropYourFileHereOr')} `,
                  h(
                    'button',
                    {
                      class: 'browse-button text-blue-500 hover:text-blue-700',
                      attrs: { type: 'button' },
                      on: { click: () => fileInput?.click() },
                    },
                    t('table.browse')
                  ),
                ]),
                h(
                  'p',
                  { class: 'mt-1 text-xs text-gray-500' },
                  `${t('common.maximumFileSize')}${maxSize}`
                ),
              ]),
              h('div', { class: 'upload-progress hidden', ref: 'progress' }, [
                h('div', { class: 'progress-bar h-2 bg-gray-200 rounded-full overflow-hidden' }, [
                  h('div', {
                    class: 'progress-fill h-full bg-blue-500 transition-all duration-300',
                    style: { width: '0%' },
                    ref: 'fill',
                  }),
                ]),
                h('p', { class: 'mt-2 text-sm text-gray-600', ref: 'filename' }),
              ]),
            ]
          ),
          h('input', {
            class: 'hidden',
            attrs: { type: 'file' },
            ref: 'fileInput',
            on: {
              change: (e) => {
                const input = e.target;
                if (!(input instanceof HTMLInputElement)) {
                  return;
                }
                const file = input.files?.[0];
                if (file) {
                  void start(file);
                  input.value = '';
                }
              },
            },
          }),
        ])
      );

      message = shell.refs.message ?? null;
      progress = shell.refs.progress ?? null;
      fill = shell.refs.fill ?? null;
      filename = shell.refs.filename ?? null;
      fileInput = shell.refs.fileInput instanceof HTMLInputElement ? shell.refs.fileInput : null;
      scope.own(shell);
    });
  }

  public show(): void {
    this.popups.open({
      title: this.editor.t('fileUpload.title'),
      className: 'file-upload-menu',
      closeOnClickOutside: true,
      items: [
        {
          type: 'view',
          id: 'upload-content',
          view: () => h('div', { class: 'file-upload-body' }, this.body()),
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
