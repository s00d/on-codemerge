export class HTMLHighlighter {
  private colors = {
    tag: '#22863a',
    attr: '#6f42c1',
    string: '#032f62',
    comment: '#6a737d',
  };

  public highlight(element: Element): void {
    const html = element.textContent || '';
    element.innerHTML = this.highlightHTML(this.escapeHtml(html));
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  private highlightHTML(html: string): string {
    return (
      html
        // Comments
        .replace(
          /(&lt;!--[\s\S]*?--&gt;)/g,
          `<span style="color: ${this.colors.comment}">$1</span>`
        )
        // Opening tags with attributes
        .replace(/(&lt;\/?[a-zA-Z0-9-]+)(\s+[^&]*?)(\/?&gt;)/g, (_match, tag, attrs, end) => {
          const highlightedAttrs = attrs.replace(
            /([a-zA-Z-]+)=(&quot;.*?&quot;|&#039;.*?&#039;)/g,
            `<span style="color: ${this.colors.attr}">$1</span>=<span style="color: ${this.colors.string}">$2</span>`
          );
          return `<span style="color: ${this.colors.tag}">${tag}</span>${highlightedAttrs}<span style="color: ${this.colors.tag}">${end}</span>`;
        })
        // Self-closing tags without attributes
        .replace(
          /(&lt;\/?[a-zA-Z0-9-]+\/?&gt;)/g,
          `<span style="color: ${this.colors.tag}">$1</span>`
        )
    );
  }
}
