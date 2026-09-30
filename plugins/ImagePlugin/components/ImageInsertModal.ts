import { PopupController, foreign, h, mount, pickFile } from '@on-codemerge/sdk';
import type { DisposableScope, EditorAPI, ViewSpec } from '@on-codemerge/sdk';
import type { UploadConfig } from '../../FileUploadPlugin/config/UploadConfig';
import { defaultConfig } from '../../FileUploadPlugin/config/UploadConfig';
import {
  formatFileSize,
  listMedia,
  uploadMedia,
  deleteMedia,
} from '../../FileUploadPlugin/services/mediaApi';
import type { MediaListItem } from '../../FileUploadPlugin/services/mediaApi';
import { mediaGalleryView } from '../../FileUploadPlugin/components/MediaGallery';
import { imageCropperView } from './ImageCropper';
import type { ImageCropperApi } from './ImageCropper';
import type { AspectPreset } from '../utils/cropMath';
import { blobToDataUrl, cropImageToBlob, rotateImageDataUrl } from '../widgets/cropExport';

export type ImageInsertResult = {
  src: string;
  alt: string;
  align: string;
  width: number;
  height: number;
};

export type ImageInsertSeed = {
  src?: string;
  alt?: string;
  align?: string;
  width?: number;
  height?: number;
  file?: File | null;
};

type Step = 'source' | 'edit';

export class ImageInsertModal {
  private readonly editor: EditorAPI;
  private readonly popups: PopupController;
  private readonly config: UploadConfig;
  private onInsert: ((result: ImageInsertResult) => void) | null = null;

  constructor(editor: EditorAPI, config: Partial<UploadConfig>, scope: DisposableScope) {
    this.editor = editor;
    this.popups = new PopupController((o) => editor.ui.popup.open(o), scope);
    this.config = {
      ...defaultConfig,
      ...config,
      endpoints: { ...defaultConfig.endpoints, ...config.endpoints },
    };
  }

  private t(k: string): string {
    return this.editor.t(k) || k;
  }

  private get listUrl(): string | undefined {
    const url = this.config.endpoints?.list?.trim();
    return url || undefined;
  }

  private get uploadUrl(): string | undefined {
    const url = this.config.endpoints?.upload?.trim();
    return url && this.config.useEmulation !== true ? url : undefined;
  }

  private get deleteUrl(): string | undefined {
    const url = this.config.endpoints?.delete?.trim();
    return url || undefined;
  }

  public show(onInsert: (result: ImageInsertResult) => void, seed: ImageInsertSeed = {}): void {
    this.onInsert = onInsert;
    const hasGallery = Boolean(this.listUrl);
    let step: Step = seed.src || seed.file ? 'edit' : 'source';
    let tab: 'upload' | 'gallery' = 'upload';
    let stagedSrc = seed.src ?? '';
    let stagedMime = 'image/png';
    let stagedName = seed.alt || seed.file?.name || 'image';
    let alt = seed.alt ?? '';
    let align = seed.align ?? '';
    let width = Number(seed.width) || 0;
    let height = Number(seed.height) || 0;
    let aspect: AspectPreset = 'free';
    let cropApi: ImageCropperApi | null = null;
    let outMime = stagedMime === 'image/jpeg' ? 'image/jpeg' : 'image/png';
    let quality = 92;
    let lockSize = true;
    let error = '';
    let busy = false;
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

    const stageFile = async (file: File): Promise<void> => {
      error = '';
      if (file.size > maxSize) {
        error = this.t('image.fileTooLarge');
        paint();
        return;
      }
      if (!file.type.startsWith('image/')) {
        error = this.t('image.invalidType');
        paint();
        return;
      }
      const dataUrl = await readAsDataUrl(file);
      stagedSrc = dataUrl;
      stagedMime = file.type || 'image/png';
      stagedName = file.name;
      outMime =
        stagedMime === 'image/jpeg' || stagedMime === 'image/webp' ? stagedMime : 'image/png';
      if (!alt) {
        alt = file.name.replace(/\.[^.]+$/, '');
      }
      // Fresh bitmap → re-seed display size from crop onReady.
      width = 0;
      height = 0;
      step = 'edit';
      cropApi = null;
      paint();
    };

    const stageUrl = (item: MediaListItem): void => {
      error = '';
      stagedSrc = item.url;
      stagedMime = item.mime || 'image/png';
      stagedName = item.name;
      outMime =
        stagedMime === 'image/jpeg' || stagedMime === 'image/webp' ? stagedMime : 'image/png';
      if (!alt) {
        alt = item.name.replace(/\.[^.]+$/, '');
      }
      width = 0;
      height = 0;
      step = 'edit';
      cropApi = null;
      paint();
    };

    const loadGallery = async (force = false): Promise<void> => {
      if (!this.listUrl) {
        return;
      }
      if (galleryLoaded && !force) {
        return;
      }
      galleryError = '';
      galleryLoaded = false;
      paint();
      try {
        galleryItems = await listMedia(this.listUrl, this.config.headers);
        galleryLoaded = true;
      } catch (err) {
        galleryError = err instanceof Error ? err.message : this.t('image.galleryFailed');
        galleryLoaded = true;
      }
      paint();
    };

    const insert = async (): Promise<void> => {
      if (busy || !cropApi) {
        return;
      }
      const imageEl = cropApi.getImage();
      const crop = cropApi.getCrop();
      if (!imageEl) {
        error = this.t('image.failedToUploadImage');
        paint();
        return;
      }
      busy = true;
      error = '';
      paint();
      try {
        const blob = await cropImageToBlob(imageEl, crop, outMime, quality / 100);
        let src: string;
        if (this.uploadUrl) {
          const uploaded = await uploadMedia(
            this.uploadUrl,
            blob,
            this.config.headers,
            stagedName.replace(/\.[^.]+$/, '') + extForMime(blob.type || outMime)
          );
          src = uploaded.url;
        } else {
          src = await blobToDataUrl(blob);
        }
        const cropW = Math.max(1, Math.round(crop.w));
        const cropH = Math.max(1, Math.round(crop.h));
        const outW = width > 0 ? Math.round(width) : cropW;
        const outH =
          height > 0 ? Math.round(height) : lockSize ? Math.round(outW * (cropH / cropW)) : cropH;
        this.onInsert?.({
          src,
          alt: alt.trim(),
          align,
          width: outW,
          height: outH,
        });
        this.popups.close();
      } catch (err) {
        console.error(err);
        error = err instanceof Error ? err.message : this.t('image.failedToUploadImage');
        busy = false;
        paint();
      }
    };

    const sourcePane = (): ViewSpec => {
      const uploadPane = h('div', { class: 'flex flex-col gap-3' }, [
        h(
          'div',
          {
            class:
              'rounded-xl border-2 border-dashed border-ocm-border bg-ocm-surface-muted/40 px-6 py-10 text-center transition-colors',
            on: {
              dragover: (e) => {
                e.preventDefault();
                const el = e.currentTarget;
                if (el instanceof HTMLElement) {
                  el.classList.add('border-sky-500', 'bg-sky-50');
                }
              },
              dragleave: (e) => {
                const el = e.currentTarget;
                if (el instanceof HTMLElement) {
                  el.classList.remove('border-sky-500', 'bg-sky-50');
                }
              },
              drop: (e) => {
                e.preventDefault();
                const el = e.currentTarget;
                if (el instanceof HTMLElement) {
                  el.classList.remove('border-sky-500', 'bg-sky-50');
                }
                const file = e.dataTransfer?.files?.[0];
                if (file) {
                  void stageFile(file);
                }
              },
            },
          },
          [
            h('p', { class: 'text-sm text-ocm-text' }, this.t('common.dragAndDropYourFileHereOr')),
            h(
              'button',
              {
                class:
                  'mt-3 rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700',
                attrs: { type: 'button' },
                on: {
                  click: () => {
                    void (async () => {
                      const files = await pickFile({ accept: 'image/*' });
                      const file = files?.[0];
                      if (file) {
                        await stageFile(file);
                      }
                    })();
                  },
                },
              },
              this.t('table.browse')
            ),
            h(
              'p',
              { class: 'mt-2 text-xs text-ocm-text-muted' },
              `${this.t('common.maximumFileSize')}${formatFileSize(maxSize)}`
            ),
          ]
        ),
      ]);

      if (!hasGallery) {
        return uploadPane;
      }

      const galleryPane = mediaGalleryView({
        mode: 'grid',
        items: galleryItems,
        loading: !galleryLoaded && !galleryError,
        error: galleryError,
        formatSize: formatFileSize,
        labels: {
          search: this.t('common.search'),
          searchPlaceholder: this.t('image.gallerySearchPlaceholder'),
          refresh: this.t('image.galleryRefresh'),
          loading: this.t('image.galleryLoading'),
          empty: this.t('image.galleryEmpty'),
          noMatches: this.t('image.galleryNoMatches'),
          failed: this.t('image.galleryFailed'),
          results: this.t('image.galleryResults'),
          insert: this.t('image.insertConfirm'),
          delete: this.t('common.delete'),
          deleteConfirm: this.t('image.galleryDeleteConfirm'),
          deleting: this.t('image.galleryDeleting'),
        },
        onSelect: (item) => {
          stageUrl(item);
        },
        onRefresh: () => {
          void loadGallery(true);
        },
        ...(this.deleteUrl
          ? {
              onDelete: async (item) => {
                try {
                  await deleteMedia(this.deleteUrl!, item.id, this.config.headers);
                  galleryItems = galleryItems.filter((x) => x.id !== item.id);
                  paint();
                } catch (err) {
                  galleryError =
                    err instanceof Error ? err.message : this.t('image.galleryDeleteFailed');
                  paint();
                  throw err;
                }
              },
            }
          : {}),
      });

      return h('div', { class: 'flex flex-col gap-3' }, [
        h(
          'div',
          {
            class: 'flex gap-1 rounded-xl border border-ocm-border bg-ocm-surface-muted/50 p-1',
          },
          [
            tabBtn('upload', this.t('image.tabUpload'), tab === 'upload', () => {
              tab = 'upload';
              paint();
            }),
            tabBtn('gallery', this.t('image.tabGallery'), tab === 'gallery', () => {
              tab = 'gallery';
              paint();
              void loadGallery();
            }),
          ]
        ),
        tab === 'gallery' ? galleryPane : uploadPane,
      ]);
    };

    const cropRatio = (): number => {
      const c = cropApi?.getCrop();
      if (c && c.h > 0) {
        return c.w / c.h;
      }
      return 1;
    };

    /** Write W/H into inputs without remounting the cropper (avoids onReady loops). */
    const applyDimInputs = (): void => {
      if (!rootHost) {
        return;
      }
      const wInput = rootHost.querySelector<HTMLInputElement>('input[data-ocm-dim="width"]');
      const hInput = rootHost.querySelector<HTMLInputElement>('input[data-ocm-dim="height"]');
      if (wInput) {
        wInput.value = width > 0 ? String(width) : '';
      }
      if (hInput) {
        hInput.value = height > 0 ? String(height) : '';
      }
    };

    /**
     * Seed / refresh display size from the crop rect.
     * `force` — always overwrite from crop (crop drag, aspect, rotate).
     * Otherwise only fill empty fields (initial load / edit seed).
     */
    const syncDimsFromCrop = (force = false): void => {
      const c = cropApi?.getCrop();
      if (!c || c.w <= 0 || c.h <= 0) {
        return;
      }
      if (force) {
        width = Math.round(c.w);
        height = Math.round(c.h);
        return;
      }
      if (width <= 0) {
        width = Math.round(c.w);
      }
      if (height <= 0) {
        height = lockSize && width > 0 ? Math.round(width * (c.h / c.w)) : Math.round(c.h);
      }
    };

    const rotate = (degrees: 90 | -90): void => {
      if (!stagedSrc || busy) {
        return;
      }
      void (async () => {
        try {
          stagedSrc = await rotateImageDataUrl(stagedSrc, degrees);
          stagedMime = 'image/png';
          if (outMime !== 'image/jpeg') {
            outMime = 'image/png';
          }
          cropApi = null;
          // Force re-seed size from the rotated bitmap on next onReady.
          width = 0;
          height = 0;
          error = '';
          paint();
        } catch (err) {
          error = err instanceof Error ? err.message : this.t('image.rotateFailed');
          paint();
        }
      })();
    };

    const editPane = (): ViewSpec => {
      const presets: AspectPreset[] = ['free', '1:1', '16:9', '4:3'];
      return h('div', { class: 'flex flex-col gap-4' }, [
        h('div', { class: 'flex flex-wrap items-center gap-2' }, [
          h(
            'button',
            {
              class: 'text-sm text-sky-600 hover:underline',
              attrs: { type: 'button' },
              on: {
                click: () => {
                  step = 'source';
                  paint();
                },
              },
            },
            `← ${this.t('image.changeSource')}`
          ),
          h('div', { class: 'flex gap-1' }, [
            h(
              'button',
              {
                class:
                  'rounded-md border border-ocm-border px-2 py-1 text-[11px] text-ocm-text-muted hover:bg-ocm-surface-muted',
                attrs: { type: 'button', title: this.t('image.rotateLeft') },
                on: { click: () => rotate(-90) },
              },
              '↺ 90°'
            ),
            h(
              'button',
              {
                class:
                  'rounded-md border border-ocm-border px-2 py-1 text-[11px] text-ocm-text-muted hover:bg-ocm-surface-muted',
                attrs: { type: 'button', title: this.t('image.rotateRight') },
                on: { click: () => rotate(90) },
              },
              '↻ 90°'
            ),
          ]),
          h(
            'div',
            { class: 'ml-auto flex flex-wrap gap-1' },
            presets.map((p) =>
              h(
                'button',
                {
                  class: `rounded-md border px-2 py-1 text-[11px] ${
                    aspect === p
                      ? 'border-sky-500 bg-sky-50 text-sky-700'
                      : 'border-ocm-border text-ocm-text-muted hover:bg-ocm-surface-muted'
                  }`,
                  attrs: { type: 'button' },
                  on: {
                    click: () => {
                      aspect = p;
                      cropApi?.setAspect(p);
                      syncDimsFromCrop(true);
                      paint();
                    },
                  },
                },
                p === 'free' ? this.t('image.aspectFree') : p
              )
            )
          ),
        ]),
        imageCropperView({
          src: stagedSrc,
          onReady: (api) => {
            cropApi = api;
            api.setAspect(aspect);
            // Aspect may shrink the crop — force seed when fields were empty.
            syncDimsFromCrop(width <= 0 || height <= 0);
            applyDimInputs();
          },
          onCropChange: () => {
            // Keep display size in sync with the exported crop pixels.
            syncDimsFromCrop(true);
            applyDimInputs();
          },
        }),
        h('div', { class: 'grid grid-cols-1 gap-3 sm:grid-cols-2' }, [
          field(this.t('common.altText'), () =>
            h('input', {
              class: 'w-full rounded-lg border border-ocm-border bg-ocm-surface px-3 py-2 text-sm',
              attrs: { type: 'text', value: alt },
              on: {
                input: (e) => {
                  const el = e.target;
                  if (el instanceof HTMLInputElement) {
                    alt = el.value;
                  }
                },
              },
            })
          ),
          field(this.t('image.align'), () =>
            h(
              'select',
              {
                class:
                  'w-full rounded-lg border border-ocm-border bg-ocm-surface px-3 py-2 text-sm',
                props: { value: align },
                on: {
                  change: (e) => {
                    const el = e.target;
                    if (el instanceof HTMLSelectElement) {
                      align = el.value;
                    }
                  },
                },
              },
              [
                h('option', { attrs: { value: '' } }, this.t('image.alignNone')),
                h('option', { attrs: { value: 'left' } }, this.t('common.alignLeft')),
                h('option', { attrs: { value: 'center' } }, this.t('common.alignCenter')),
                h('option', { attrs: { value: 'right' } }, this.t('common.alignRight')),
              ]
            )
          ),
          field(this.t('common.width'), () =>
            h('input', {
              class: 'w-full rounded-lg border border-ocm-border bg-ocm-surface px-3 py-2 text-sm',
              attrs: {
                type: 'number',
                min: '1',
                value: String(width || ''),
                'data-ocm-dim': 'width',
              },
              on: {
                input: (e) => {
                  const el = e.target;
                  if (el instanceof HTMLInputElement) {
                    width = Math.max(0, Number(el.value) || 0);
                    if (lockSize && width > 0) {
                      const ratio = cropRatio();
                      height = Math.max(1, Math.round(width / ratio));
                      applyDimInputs();
                    }
                  }
                },
              },
            })
          ),
          field(this.t('common.height'), () =>
            h('input', {
              class: 'w-full rounded-lg border border-ocm-border bg-ocm-surface px-3 py-2 text-sm',
              attrs: {
                type: 'number',
                min: '1',
                value: String(height || ''),
                'data-ocm-dim': 'height',
                ...(lockSize ? { disabled: 'true' } : {}),
              },
              on: {
                input: (e) => {
                  const el = e.target;
                  if (el instanceof HTMLInputElement) {
                    height = Math.max(0, Number(el.value) || 0);
                  }
                },
              },
            })
          ),
          h(
            'label',
            { class: 'flex items-center gap-2 text-xs text-ocm-text-muted sm:col-span-2' },
            [
              h('input', {
                attrs: { type: 'checkbox', ...(lockSize ? { checked: 'true' } : {}) },
                on: {
                  change: (e) => {
                    const el = e.target;
                    if (el instanceof HTMLInputElement) {
                      lockSize = el.checked;
                      if (lockSize && width > 0) {
                        height = Math.max(1, Math.round(width / cropRatio()));
                        applyDimInputs();
                      } else {
                        paint();
                      }
                    }
                  },
                },
              }),
              this.t('image.lockSizeAspect'),
            ]
          ),
          field(this.t('image.outputFormat'), () =>
            h(
              'select',
              {
                class:
                  'w-full rounded-lg border border-ocm-border bg-ocm-surface px-3 py-2 text-sm',
                props: { value: outMime },
                on: {
                  change: (e) => {
                    const el = e.target;
                    if (el instanceof HTMLSelectElement) {
                      outMime = el.value;
                      paint();
                    }
                  },
                },
              },
              [
                h('option', { attrs: { value: 'image/png' } }, 'PNG'),
                h('option', { attrs: { value: 'image/jpeg' } }, 'JPEG'),
                h('option', { attrs: { value: 'image/webp' } }, 'WebP'),
              ]
            )
          ),
          outMime === 'image/png'
            ? h('div', {})
            : field(`${this.t('image.quality')} (${quality}%)`, () =>
                h('input', {
                  class: 'w-full accent-sky-600',
                  attrs: {
                    type: 'range',
                    min: '40',
                    max: '100',
                    step: '1',
                    value: String(quality),
                  },
                  on: {
                    input: (e) => {
                      const el = e.target;
                      if (el instanceof HTMLInputElement) {
                        quality = Number(el.value) || 92;
                        paint();
                      }
                    },
                  },
                })
              ),
        ]),
      ]);
    };

    const body = (): ViewSpec =>
      h('div', { class: 'flex flex-col gap-3 p-1' }, [
        error ? h('p', { class: 'text-sm text-red-600' }, error) : null,
        step === 'edit' && stagedSrc ? editPane() : sourcePane(),
      ]);

    this.popups.open({
      title: this.t('image.insert'),
      className: 'image-insert-modal',
      size: 'lg',
      closeOnClickOutside: false,
      items: [
        {
          type: 'view',
          id: 'image-insert-body',
          view: () =>
            foreign((host, scope) => {
              rootHost = host;
              host.className = 'image-insert-modal__body';
              mount(host, body());
              scope.disposable(() => {
                rootHost = null;
              });
              if (seed.file) {
                void stageFile(seed.file);
              } else if (hasGallery && tab === 'gallery') {
                void loadGallery();
              }
            }),
        },
      ],
      buttons: [
        {
          label: this.t('common.cancel'),
          variant: 'secondary',
          onClick: () => {},
        },
        {
          label: busy ? this.t('image.inserting') : this.t('image.insertConfirm'),
          variant: 'primary',
          onClick: () => {
            if (step !== 'edit') {
              error = this.t('image.pickFirst');
              paint();
              return true;
            }
            void insert();
            return true; // keep open until insert() closes
          },
        },
      ],
    });
  }
}

function tabBtn(_id: string, label: string, active: boolean, onClick: () => void): ViewSpec {
  return h(
    'button',
    {
      class: `flex-1 rounded-lg px-3 py-2 text-sm font-medium transition ${
        active
          ? 'bg-ocm-surface text-ocm-text shadow-sm'
          : 'text-ocm-text-muted hover:text-ocm-text'
      }`,
      attrs: { type: 'button', ...(active ? { 'aria-current': 'page' } : {}) },
      on: { click: onClick },
    },
    label
  );
}

function field(label: string, control: () => ViewSpec): ViewSpec {
  return h('label', { class: 'flex flex-col gap-1 text-xs text-ocm-text-muted' }, [
    h('span', {}, label),
    control(),
  ]);
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read file'));
      }
    });
    reader.addEventListener('error', () => {
      reject(reader.error ?? new Error('Failed to read file'));
    });
    reader.readAsDataURL(file);
  });
}

function extForMime(mime: string): string {
  if (mime === 'image/jpeg') {
    return '.jpg';
  }
  if (mime === 'image/webp') {
    return '.webp';
  }
  if (mime === 'image/gif') {
    return '.gif';
  }
  return '.png';
}
