import { downloadBlob } from '@codemerge/sdk';
import type { EditorAPI } from '@codemerge/sdk';

const PRINT_FALLBACK_MS = 3000;

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
    // Wait for external CSS / images; fallback in case `load` never fires.
    let printed = false;
    const print = () => {
      if (printed) {
        return;
      }
      printed = true;
      clearTimeout(fallback);
      printWindow.focus();
      printWindow.print();
    };
    const fallback = setTimeout(print, PRINT_FALLBACK_MS);
    if (printWindow.document.readyState === 'complete') {
      print();
    } else {
      printWindow.addEventListener('load', print, { once: true });
    }
  }
}
