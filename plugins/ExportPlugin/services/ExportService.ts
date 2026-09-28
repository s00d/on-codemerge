import {
  downloadBlob,
  composePublishedDocument,
  neededRuntimeIds,
  publishedCssHref,
  publishedJsHref,
} from '@on-codemerge/sdk';
import type { EditorAPI } from '@on-codemerge/sdk';

/**
 * Export formats from the live editor document.
 * Markdown uses JSON→MD (`editor.getMarkdown`); HTML/PDF use published document.
 */
export class ExportService {
  public export(editor: EditorAPI, format: string): void {
    switch (format) {
      case 'html': {
        downloadBlob(editor.getPublishedDocument(), 'document.html', 'text/html');
        break;
      }
      case 'markdown': {
        downloadBlob(editor.getMarkdown(), 'document.md', 'text/markdown');
        break;
      }
      case 'text': {
        downloadBlob(this.stripHtml(editor.getHTML()), 'document.txt', 'text/plain');
        break;
      }
      case 'pdf': {
        this.exportToPDF(editor.getPublishedDocument());
        break;
      }
      default: {
        throw new Error(`Unsupported format: ${format}`);
      }
    }
  }

  private stripHtml(html: string): string {
    return new DOMParser().parseFromString(html, 'text/html').body.textContent || '';
  }

  private exportToPDF(content: string): void {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      throw new Error('Failed to open print window');
    }

    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.print();
  }

  /** @deprecated Prefer `editor.getPublishedDocument()` — kept for tests. */
  formatHTML(html: string, jsHref: string | null = null): string {
    const needsJs = jsHref === null ? neededRuntimeIds(html).length > 0 : true;
    return composePublishedDocument({
      bodyHtml: html,
      cssHref: publishedCssHref(),
      jsHref: needsJs ? (jsHref ?? publishedJsHref()) : null,
    });
  }
}
