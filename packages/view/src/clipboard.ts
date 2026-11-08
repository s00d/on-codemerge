/** Copy plain text to the system clipboard. Returns false if unavailable or denied. */
export async function copyText(text: string): Promise<boolean> {
  if (typeof navigator === 'undefined') {
    return false;
  }
  const clipboard = navigator.clipboard;
  if (clipboard === undefined || typeof clipboard.writeText !== 'function') {
    return false;
  }
  try {
    await clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/** Copy a binary blob (e.g. `image/png`) to the system clipboard. Returns false if unsupported or denied. */
export async function copyBlob(blob: Blob): Promise<boolean> {
  if (typeof navigator === 'undefined' || typeof ClipboardItem === 'undefined') {
    return false;
  }
  const clipboard = navigator.clipboard;
  if (clipboard === undefined || typeof clipboard.write !== 'function') {
    return false;
  }
  try {
    await clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
    return true;
  } catch {
    return false;
  }
}

/** Read plain text from the system clipboard. Returns null if unavailable or denied. */
export async function readClipboardText(): Promise<string | null> {
  if (typeof navigator === 'undefined') {
    return null;
  }
  const clipboard = navigator.clipboard;
  if (clipboard === undefined || typeof clipboard.readText !== 'function') {
    return null;
  }
  try {
    return await clipboard.readText();
  } catch {
    return null;
  }
}
