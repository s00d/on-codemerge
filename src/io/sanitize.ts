import DOMPurify from 'dompurify';

/**
 * Sanitize HTML before import/paste.
 */
export function sanitizeHTML(dirty: string): string {
  if (globalThis.window === undefined) {
    return dirty
      .replaceAll(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
      .replaceAll(/\son\w+="[^"]*"/gi, '')
      .replaceAll(/\son\w+='[^']*'/gi, '');
  }
  return DOMPurify.sanitize(dirty, { USE_PROFILES: { html: true } });
}
