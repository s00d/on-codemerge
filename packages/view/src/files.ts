import { h } from './h';
import { createPortal, renderDetached } from './mount';

/** Click a temporary download anchor via portal. */
export function downloadUrl(url: string, filename: string): void {
  const { el, destroy } = renderDetached(
    h('a', {
      attrs: { href: url, download: filename },
      style: { display: 'none' },
    })
  );
  const portal = createPortal(null, { to: 'body', className: 'ocm-portal-host--transient' });
  portal.el.append(el);
  if (el instanceof HTMLAnchorElement) {
    el.click();
  }
  el.remove();
  destroy();
  portal.destroy();
}

/** Blob → object URL → downloadUrl. */
export function downloadBlob(content: BlobPart, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  downloadUrl(url, filename);
  URL.revokeObjectURL(url);
}

/** Hidden file picker via portal. */
export function pickFile(
  opts: {
    accept?: string;
    multiple?: boolean;
  } = {}
): Promise<FileList | null> {
  return new Promise((resolve) => {
    const portal = createPortal(null, { to: 'body', className: 'ocm-portal-host--transient' });
    const { el, destroy } = renderDetached(
      h('input', {
        attrs: {
          type: 'file',
          accept: opts.accept,
          multiple: opts.multiple ? true : undefined,
        },
        style: { display: 'none' },
        on: {
          change: (e) => {
            const t = e.target;
            resolve(t instanceof HTMLInputElement ? t.files : null);
            el.remove();
            destroy();
            portal.destroy();
          },
        },
      })
    );
    portal.el.append(el);
    if (el instanceof HTMLInputElement) {
      el.click();
    }
  });
}
