import { PopupController, foreign, h, mount, pickFile } from '@codemerge/sdk';
import type { DisposableScope, EditorAPI, ViewSpec } from '@codemerge/sdk';

import type { FileUploader, UploadedFile } from '../services/FileUploader';
import type { UploadConfig } from '../config/UploadConfig';
import { defaultConfig } from '../config/UploadConfig';
import type { MediaListItem } from '../services/mediaApi';
import { mediaGalleryView } from './MediaGallery';
import { uploadMessageIcon } from '@codemerge/sdk/icons';

type Step = 'source' | 'staged';

/** File upload modal — upload staging + optional gallery when `endpoints.list` is set. */
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

  private t(k: string): string {
    return this.editor.t(k) || k;
  }

  public show(): void {
    const hasGallery = Boolean(this.uploader.listUrl);
    let tab: 'upload' | 'gallery' = 'upload';
    let step: Step = 'source';
    let staged: File | null = null;
    let error = '';
    let busy = false;
    let progress = 0;
    let galleryItems: MediaListItem[] = [];
    let galleryLoaded = false;
    let galleryError = '';
    let rootHost: HTMLElement | null = null;

    const maxSize = this.config.maxFileSize ?? defaultConfig.maxFileSize!;

    const paint = (): void => {
      if (!rootHost) {
        return;
      }
      mount(rootHost, body());
    };

    const stageFile = (file: File): void => {
      error = '';
      if (file.size > maxSize) {
        error = this.t('fileUpload.fileTooLarge');
        paint();
        return;
      }
      staged = file;
      step = 'staged';
      progress = 0;
      paint();
    };

    const loadGallery = async (force = false): Promise<void> => {
      if (!hasGallery) {
        return;
      }
      if (galleryLoaded && !force) {
        return;
      }
      galleryError = '';
      galleryLoaded = false;
      paint();
      try {
        galleryItems = await this.uploader.listFiles();
        galleryLoaded = true;
      } catch (err) {
        galleryError = err instanceof Error ? err.message : this.t('fileUpload.galleryFailed');
        galleryLoaded = true;
      }
      paint();
    };

    const insertUploaded = (file: UploadedFile): void => {
      this.onUpload?.({ id: file.id, name: file.name, size: file.size });
      this.popups.close();
    };

    const confirmUpload = async (): Promise<void> => {
      if (!staged || busy) {
        return;
      }
      busy = true;
      error = '';
      progress = 8;
      paint();
      const tick = globalThis.setInterval(() => {
        progress = Math.min(90, progress + 7);
        paint();
      }, 80);
      try {
        const uploaded = await this.uploader.uploadFile(staged);
        clearInterval(tick);
        progress = 100;
        paint();
        insertUploaded(uploaded);
      } catch (err) {
        clearInterval(tick);
        console.error(err);
        busy = false;
        progress = 0;
        error = err instanceof Error ? err.message : this.t('fileUpload.uploadFailed');
        paint();
      }
    };

    const insertGalleryItem = (item: MediaListItem): void => {
      this.onUpload?.({
        id: item.id,
        name: item.name,
        size: item.size ?? 0,
      });
      this.popups.close();
    };

    const uploadPane = (): ViewSpec => {
      if (step === 'staged' && staged) {
        return h('div', { class: 'flex flex-col gap-3' }, [
          h('div', { class: 'rounded-xl border border-ocm-border bg-ocm-surface-muted/40 p-4' }, [
            h('p', { class: 'text-sm font-medium text-ocm-text' }, staged.name),
            h(
              'p',
              { class: 'mt-1 text-xs text-ocm-text-muted' },
              `${this.uploader.formatFileSize(staged.size)}${staged.type ? ` · ${staged.type}` : ''}`
            ),
            busy
              ? h('div', { class: 'mt-3' }, [
                  h('div', { class: 'h-2 overflow-hidden rounded-full bg-zinc-200' }, [
                    h('div', {
                      class: 'h-full bg-sky-500 transition-all',
                      style: { width: `${progress}%` },
                    }),
                  ]),
                  h(
                    'p',
                    { class: 'mt-2 text-xs text-ocm-text-muted' },
                    `${this.t('fileUpload.uploading')} ${staged.name}…`
                  ),
                ])
              : null,
          ]),
          h('div', { class: 'flex flex-wrap gap-2' }, [
            h(
              'button',
              {
                class:
                  'rounded-lg border border-ocm-border px-3 py-1.5 text-sm hover:bg-ocm-surface-muted',
                attrs: { type: 'button', ...(busy ? { disabled: 'true' } : {}) },
                on: {
                  click: () => {
                    staged = null;
                    step = 'source';
                    paint();
                  },
                },
              },
              this.t('fileUpload.changeFile')
            ),
            h(
              'button',
              {
                class:
                  'rounded-lg bg-sky-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-50',
                attrs: { type: 'button', ...(busy ? { disabled: 'true' } : {}) },
                on: {
                  click: () => {
                    void confirmUpload();
                  },
                },
              },
              busy ? this.t('fileUpload.uploading') : this.t('fileUpload.confirmUpload')
            ),
          ]),
        ]);
      }

      return h('div', { class: 'flex flex-col gap-3' }, [
        h(
          'div',
          {
            class:
              'upload-area rounded-xl border-2 border-dashed border-ocm-border p-8 text-center',
            on: {
              dragover: (e) => {
                e.preventDefault();
                const areaEl = e.currentTarget;
                if (areaEl instanceof HTMLElement) {
                  areaEl.classList.add('border-sky-500');
                }
              },
              dragleave: (e) => {
                const areaEl = e.currentTarget;
                if (areaEl instanceof HTMLElement) {
                  areaEl.classList.remove('border-sky-500');
                }
              },
              drop: (e) => {
                e.preventDefault();
                const areaEl = e.currentTarget;
                if (areaEl instanceof HTMLElement) {
                  areaEl.classList.remove('border-sky-500');
                }
                const file = e.dataTransfer?.files?.[0];
                if (file) {
                  stageFile(file);
                }
              },
            },
          },
          [
            h('div', { props: { innerHTML: uploadMessageIcon } }),
            h('p', { class: 'mt-2 text-sm text-ocm-text-muted' }, [
              `${this.t('common.dragAndDropYourFileHereOr')} `,
              h(
                'button',
                {
                  class: 'text-sky-600 hover:underline',
                  attrs: { type: 'button' },
                  on: {
                    click: () => {
                      void (async () => {
                        const files = await pickFile({
                          accept: (this.config.allowedTypes ?? ['*/*']).join(','),
                        });
                        const file = files?.[0];
                        if (file) {
                          stageFile(file);
                        }
                      })();
                    },
                  },
                },
                this.t('fileUpload.browse')
              ),
            ]),
            h(
              'p',
              { class: 'mt-1 text-xs text-ocm-text-muted' },
              `${this.t('common.maximumFileSize')}${this.uploader.formatFileSize(maxSize)}`
            ),
          ]
        ),
      ]);
    };

    const galleryPane = (): ViewSpec =>
      mediaGalleryView({
        mode: 'list',
        items: galleryItems,
        loading: !galleryLoaded && !galleryError,
        error: galleryError,
        formatSize: (n) => this.uploader.formatFileSize(n),
        labels: {
          search: this.t('common.search'),
          searchPlaceholder: this.t('fileUpload.gallerySearchPlaceholder'),
          refresh: this.t('fileUpload.galleryRefresh'),
          loading: this.t('fileUpload.galleryLoading'),
          empty: this.t('fileUpload.galleryEmpty'),
          noMatches: this.t('fileUpload.galleryNoMatches'),
          failed: this.t('fileUpload.galleryFailed'),
          results: this.t('fileUpload.galleryResults'),
          insert: this.t('fileUpload.insert'),
          delete: this.t('common.delete'),
          deleteConfirm: this.t('fileUpload.galleryDeleteConfirm'),
          deleting: this.t('fileUpload.galleryDeleting'),
        },
        onSelect: (item) => {
          insertGalleryItem(item);
        },
        onRefresh: () => {
          void loadGallery(true);
        },
        ...(this.uploader.deleteUrl
          ? {
              onDelete: async (item) => {
                try {
                  await this.uploader.deleteListedFile(item.id);
                  galleryItems = galleryItems.filter((x) => x.id !== item.id);
                  paint();
                } catch (err) {
                  galleryError =
                    err instanceof Error ? err.message : this.t('fileUpload.galleryDeleteFailed');
                  paint();
                  throw err;
                }
              },
            }
          : {}),
      });

    const body = (): ViewSpec => {
      const panes = !hasGallery
        ? uploadPane()
        : h('div', { class: 'flex flex-col gap-3' }, [
            h(
              'div',
              {
                class: 'flex gap-1 rounded-xl border border-ocm-border bg-ocm-surface-muted/50 p-1',
              },
              [
                h(
                  'button',
                  {
                    class: `flex-1 rounded-lg px-3 py-2 text-sm font-medium transition ${
                      tab === 'upload'
                        ? 'bg-ocm-surface text-ocm-text shadow-sm'
                        : 'text-ocm-text-muted hover:text-ocm-text'
                    }`,
                    attrs: {
                      type: 'button',
                      ...(tab === 'upload' ? { 'aria-current': 'page' } : {}),
                    },
                    on: {
                      click: () => {
                        tab = 'upload';
                        paint();
                      },
                    },
                  },
                  this.t('fileUpload.tabUpload')
                ),
                h(
                  'button',
                  {
                    class: `flex-1 rounded-lg px-3 py-2 text-sm font-medium transition ${
                      tab === 'gallery'
                        ? 'bg-ocm-surface text-ocm-text shadow-sm'
                        : 'text-ocm-text-muted hover:text-ocm-text'
                    }`,
                    attrs: {
                      type: 'button',
                      ...(tab === 'gallery' ? { 'aria-current': 'page' } : {}),
                    },
                    on: {
                      click: () => {
                        tab = 'gallery';
                        paint();
                        void loadGallery();
                      },
                    },
                  },
                  this.t('fileUpload.tabGallery')
                ),
              ]
            ),
            tab === 'gallery' ? galleryPane() : uploadPane(),
          ]);

      return h('div', { class: 'flex flex-col gap-3 p-1' }, [
        error ? h('p', { class: 'text-sm text-red-600' }, error) : null,
        panes,
      ]);
    };

    this.popups.open({
      title: this.t('fileUpload.title'),
      className: 'file-upload-menu',
      size: 'lg',
      closeOnClickOutside: !busy,
      items: [
        {
          type: 'view',
          id: 'upload-content',
          view: () =>
            foreign((host, scope) => {
              rootHost = host;
              host.className = 'file-upload-body p-1';
              mount(host, body());
              scope.disposable(() => {
                rootHost = null;
              });
            }),
        },
      ],
      buttons: [
        {
          label: this.t('common.cancel'),
          variant: 'secondary',
          onClick: () => {},
        },
      ],
    });
  }
}
