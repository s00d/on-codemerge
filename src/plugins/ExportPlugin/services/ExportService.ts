import { htmlToMarkdown } from '../utils/converter';

export class ExportService {
  public export(content: string, format: string): void {
    let exportContent: string;
    let filename: string;
    let mimeType: string;

    switch (format) {
      case 'html':
        exportContent = this.formatHTML(content);
        filename = 'document.html';
        mimeType = 'text/html';
        break;
      case 'markdown':
        exportContent = htmlToMarkdown(content);
        filename = 'document.md';
        mimeType = 'text/markdown';
        break;
      case 'text':
        exportContent = this.stripTags(content);
        filename = 'document.txt';
        mimeType = 'text/plain';
        break;
      default:
        throw new Error(`Unsupported format: ${format}`);
    }

    this.downloadFile(exportContent, filename, mimeType);
  }

  private formatHTML(html: string): string {
    const doctype = '<!DOCTYPE html>\n';
    const wrapper = `<html>\n<head>\n<meta charset="UTF-8">\n</head>\n<body>\n${html}\n</body>\n</html>`;
    return doctype + this.prettifyHTML(wrapper);
  }

  private prettifyHTML(html: string): string {
    let formatted = '';
    let indent = 0;

    html.split(/>\s*</).forEach((element) => {
      if (element.match(/^\/\w/)) indent--;
      formatted += '\n' + '  '.repeat(indent) + '<' + element + '>';
      if (element.match(/^<?\w[^>]*[^\/]$/) && !element.startsWith('input')) indent++;
    });

    return formatted.substring(1);
  }

  private stripTags(html: string): string {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  }

  private downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
