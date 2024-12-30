export function htmlToMarkdown(html: string): string {
  const div = document.createElement('div');
  div.innerHTML = html;

  return convertNodeToMarkdown(div);
}

function convertNodeToMarkdown(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent || '';
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return '';
  }

  const element = node as HTMLElement | HTMLTableElement;

  // Convert children first
  const childrenMd = Array.from(element.childNodes)
    .map((child) => convertNodeToMarkdown(child))
    .join('');

  switch (element.tagName.toLowerCase()) {
    case 'h1':
      return `# ${childrenMd}\n\n`;
    case 'h2':
      return `## ${childrenMd}\n\n`;
    case 'h3':
      return `### ${childrenMd}\n\n`;
    case 'h4':
      return `#### ${childrenMd}\n\n`;
    case 'h5':
      return `##### ${childrenMd}\n\n`;
    case 'h6':
      return `###### ${childrenMd}\n\n`;
    case 'p':
      return `${childrenMd}\n\n`;
    case 'strong':
    case 'b':
      return `**${childrenMd}**`;
    case 'em':
    case 'i':
      return `*${childrenMd}*`;
    case 'a':
      const hrefLink = element.getAttribute('href');
      return `[${childrenMd}](${hrefLink})`;
    case 'img':
      const srcLink = element.getAttribute('src');
      const altLink = element.getAttribute('alt') || '';
      return `![${altLink}](${srcLink})`;
    case 'ul':
      return element.childNodes.length
        ? Array.from(element.childNodes)
            .map((child) => convertNodeToMarkdown(child))
            .join('') + '\n'
        : '';
    case 'ol':
      let index = 1;
      return element.childNodes.length
        ? Array.from(element.childNodes)
            .map((child) => {
              if (child.nodeType === Node.ELEMENT_NODE && child.nodeName.toLowerCase() === 'li') {
                return `${index++}. ${convertNodeToMarkdown(child)}\n`;
              }
              return convertNodeToMarkdown(child);
            })
            .join('') + '\n'
        : '';
    case 'li':
      return `- ${childrenMd}\n`;
    case 'pre':
      if (element.querySelector('code')) {
        const code = element.querySelector('code');
        const language = code?.className?.replace('language-', '') || '';
        return `\`\`\`${language}\n${code?.textContent || ''}\n\`\`\`\n\n`;
      }
      return `\`\`\`\n${childrenMd}\n\`\`\`\n\n`;
    case 'code':
      return element.parentElement?.tagName.toLowerCase() === 'pre'
        ? childrenMd
        : `\`${childrenMd}\``;
    case 'blockquote':
      return `> ${childrenMd}\n\n`;
    case 'hr':
      return '---\n\n';
    case 'br':
      return '\n';
    case 'table':
      return convertTableToMarkdown(element as HTMLTableElement);
    default:
      return childrenMd;
  }
}

function convertTableToMarkdown(table: HTMLTableElement): string {
  const rows = Array.from(table.rows);
  if (!rows.length) return '';

  const columnCount = Math.max(...rows.map((row) => row.cells.length));
  if (!columnCount) return '';

  // Generate header row
  const headerRow = rows[0];
  let markdown =
    '| ' +
    Array.from(headerRow.cells)
      .map((cell) => cell.textContent?.trim() || '')
      .join(' | ') +
    ' |\n';

  // Generate separator row
  markdown += '|' + ' --- |'.repeat(columnCount) + '\n';

  // Generate data rows
  for (let i = 1; i < rows.length; i++) {
    markdown +=
      '| ' +
      Array.from(rows[i].cells)
        .map((cell) => cell.textContent?.trim() || '')
        .join(' | ') +
      ' |\n';
  }

  return markdown + '\n';
}
