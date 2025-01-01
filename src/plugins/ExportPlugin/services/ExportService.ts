import { htmlToMarkdown } from '../utils/converter';
import { createContainer, createLink } from '../../../utils/helpers.ts';

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
        this.downloadFile(exportContent, filename, mimeType);
        break;
      case 'markdown':
        exportContent = htmlToMarkdown(content);
        filename = 'document.md';
        mimeType = 'text/markdown';
        this.downloadFile(exportContent, filename, mimeType);
        break;
      case 'text':
        exportContent = this.stripTags(content);
        filename = 'document.txt';
        mimeType = 'text/plain';
        this.downloadFile(exportContent, filename, mimeType);
        break;
      case 'pdf':
        this.exportToPDF(content);
        break;
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  private exportToPDF(content: string): void {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      throw new Error('Failed to open print window');
    }

    const htmlContent = this.formatHTML(content);

    printWindow.document.write(`
    <html>
      <head>
        <title>Document</title>
        <style>
          @media print {
            body { margin: 0; padding: 0; }
            /* Добавьте свои стили для печати */
          }
        </style>
      </head>
      <body>
        ${htmlContent}
      </body>
    </html>
  `);

    printWindow.document.close();
    printWindow.print();
  }

  private formatHTML(html: string): string {
    const doctype = '<!DOCTYPE html>\n';
    const cssFiles = [
      'https://cdn.jsdelivr.net/npm/on-codemerge/dist/index.css',
      'https://cdn.jsdelivr.net/npm/on-codemerge/dist/plugins/BlockPlugin/public.css',
      'https://cdn.jsdelivr.net/npm/on-codemerge/dist/plugins/ChartsPlugin/public.css',
      'https://cdn.jsdelivr.net/npm/on-codemerge/dist/plugins/CodeBlockPlugin/public.css',
      'https://cdn.jsdelivr.net/npm/on-codemerge/dist/plugins/CollaborationPlugin/public.css',
      'https://cdn.jsdelivr.net/npm/on-codemerge/dist/plugins/ColorPlugin/public.css',
      'https://cdn.jsdelivr.net/npm/on-codemerge/dist/plugins/CommentsPlugin/public.css',
      'https://cdn.jsdelivr.net/npm/on-codemerge/dist/plugins/ExportPlugin/public.css',
      'https://cdn.jsdelivr.net/npm/on-codemerge/dist/plugins/FileUploadPlugin/public.css',
      'https://cdn.jsdelivr.net/npm/on-codemerge/dist/plugins/FooterPlugin/public.css',
      'https://cdn.jsdelivr.net/npm/on-codemerge/dist/plugins/FootnotesPlugin/public.css',
      'https://cdn.jsdelivr.net/npm/on-codemerge/dist/plugins/HistoryPlugin/public.css',
      'https://cdn.jsdelivr.net/npm/on-codemerge/dist/plugins/HTMLViewerPlugin/public.css',
      'https://cdn.jsdelivr.net/npm/on-codemerge/dist/plugins/ImagePlugin/public.css',
      'https://cdn.jsdelivr.net/npm/on-codemerge/dist/plugins/LinkPlugin/public.css',
      'https://cdn.jsdelivr.net/npm/on-codemerge/dist/plugins/ListsPlugin/public.css',
      'https://cdn.jsdelivr.net/npm/on-codemerge/dist/plugins/ResponsivePlugin/public.css',
      'https://cdn.jsdelivr.net/npm/on-codemerge/dist/plugins/ShortcutsPlugin/public.css',
      'https://cdn.jsdelivr.net/npm/on-codemerge/dist/plugins/TablePlugin/public.css',
      'https://cdn.jsdelivr.net/npm/on-codemerge/dist/plugins/TemplatesPlugin/public.css',
      'https://cdn.jsdelivr.net/npm/on-codemerge/dist/plugins/ToolbarDividerPlugin/public.css',
      'https://cdn.jsdelivr.net/npm/on-codemerge/dist/plugins/ToolbarPlugin/public.css',
      'https://cdn.jsdelivr.net/npm/on-codemerge/dist/plugins/TypographyPlugin/public.css',
      'https://cdn.jsdelivr.net/npm/on-codemerge/dist/plugins/VideoPlugin/public.css',
      'https://cdn.jsdelivr.net/npm/on-codemerge/dist/plugins/YouTubeVideoPlugin/public.css',
      'https://cdn.jsdelivr.net/npm/on-codemerge/dist/plugins/AlignmentPlugin/public.css',
      'https://cdn.jsdelivr.net/npm/on-codemerge/dist/plugins/FormBuilderPlugin/public.css',
    ];

    const cssLinks = cssFiles.map((file) => `<link rel="stylesheet" href="${file}">`).join('\n');

    const wrapper = `
    <html>
      <head>
        <meta charset="UTF-8">
        ${cssLinks}
      </head>
      <body>
        ${html}
      </body>
    </html>
  `;
    return doctype + this.prettifyHTML(wrapper);
  }

  private prettifyHTML(html: string): string {
    let formatted = '';
    let indent = 0;

    // Разделяем HTML на строки
    const lines = html.split('\n');

    lines.forEach((line) => {
      // Уменьшаем отступ для закрывающих тегов
      if (line.match(/^\s*<\/\w/)) indent--;

      // Добавляем отступ и строку
      formatted += '  '.repeat(indent) + line.trim() + '\n';

      // Увеличиваем отступ для открывающих тегов
      if (line.match(/^\s*<\w[^>]*[^\/]$/) && !line.startsWith('<input')) indent++;
    });

    return formatted.trim(); // Убираем лишние пробелы в начале и конце
  }

  private stripTags(html: string): string {
    const tmp = createContainer();
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  }

  private downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = createLink('', url);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
