export interface Footnote {
  id: string;
  content: string;
}

export class FootnoteManager {
  private footnotes: Map<string, Footnote> = new Map();

  public createFootnote(content: string): Footnote {
    const id = crypto.randomUUID();
    const footnote = { id, content };
    this.footnotes.set(id, footnote);
    return footnote;
  }

  public updateFootnote(id: string, content: string): void {
    const footnote = this.footnotes.get(id);
    if (footnote) {
      footnote.content = content;
    }
  }

  public getFootnote(id: string): Footnote | undefined {
    return this.footnotes.get(id);
  }

  public getAllFootnotes(): Footnote[] {
    return Array.from(this.footnotes.values());
  }

  public getFootnoteNumber(id: string): number {
    const footnotes = Array.from(this.footnotes.keys());
    return footnotes.indexOf(id) + 1;
  }

  public deleteFootnote(id: string): void {
    this.footnotes.delete(id);
  }

  public destroy(): void {
    this.footnotes.clear(); // Очищаем все сноски
  }
}
