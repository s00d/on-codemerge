import type { FormattingOptions } from '../types';

export class HTMLFormatter {
  private defaultOptions: FormattingOptions = {
    indentSize: 2,
    maxLineLength: 80,
  };

  constructor(private options: Partial<FormattingOptions> = {}) {
    this.options = { ...this.defaultOptions, ...options };
  }

  public format(html: string): string {
    let formatted = '';
    let indent = 0;
    const { indentSize } = { ...this.defaultOptions, ...this.options };

    // Удаляем все элементы с классом resize-handle
    html = html.replace(/<[^>]*class="[^"]*\bresize-handle\b[^"]*"[^>]*>.*?<\/[^>]*>/g, '');
    html = html.replace(/<[^>]*class="[^"]*\bresize-handle\b[^"]*"[^>]*\/?>/g, '');

    // Удаляем атрибуты contenteditable="true" и class="selected"
    html = html.replace(/\s*draggable="true"\s*/g, ' ');
    html = html.replace(/\s*contenteditable="true"\s*/g, ' ');
    html = html.replace(/\sselected\s*/g, ' ');
    html = html.replace(/\shover\s*/g, ' ');
    html = html.replace(/\bdragging\b/g, '');

    // Очищаем лишние пробелы в class атрибутах
    html = html.replace(/class="\s+([^"]*)\s+"/g, 'class="$1"');
    html = html.replace(/class="\s+([^"]*)"/g, 'class="$1"');
    html = html.replace(/class="([^"]*)\s+"/g, 'class="$1"');

    // Удаляем style="position: relative;" из всех элементов
    html = html.replace(/(<[^>]*)\s*style="position:\s*relative;"\s*/g, '$1');

    // Разделяем по тегам, сохраняя атрибуты с символами > или <
    const parts = html.split(/(<[^>]+>)/g).filter(Boolean);

    parts.forEach((part) => {
      if (!part.trim()) return;

      // Обрабатываем закрывающие теги
      if (part.match(/^<\//)) {
        indent = Math.max(0, indent - 1);
      }

      // Добавляем отформатированный элемент с правильным отступом
      if (part.startsWith('<')) {
        formatted += '\n' + ' '.repeat(indent * indentSize) + part;
      } else {
        formatted += part;
      }

      // Увеличиваем отступ для открывающих тегов, которые не самозакрывающиеся и не void-элементы
      if (part.match(/^<[^/][^>]*[^/]>$/) && !this.isVoidElement(part)) {
        indent = Math.max(0, indent + 1);
      }
    });

    return formatted.trim();
  }

  private isVoidElement(tag: string): boolean {
    const match = tag.match(/<([a-zA-Z0-9-]+)/);
    if (!match) return false;

    const voidElements = [
      'area',
      'base',
      'br',
      'col',
      'embed',
      'hr',
      'img',
      'input',
      'link',
      'meta',
      'param',
      'source',
      'track',
      'wbr',
    ];
    return voidElements.includes(match[1].toLowerCase());
  }
}
