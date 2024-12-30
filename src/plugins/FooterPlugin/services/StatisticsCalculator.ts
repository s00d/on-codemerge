export interface Statistics {
  characters: number;
  charactersNoSpaces: number;
  words: number;
  sentences: number;
  paragraphs: number;
  readingTime: number;
}

export class StatisticsCalculator {
  private readonly WORDS_PER_MINUTE = 200;

  public calculate(content: string): Statistics {
    const text = this.stripHTML(content);
    const words = this.countWords(text);
    const characters = text.length;
    const charactersNoSpaces = text.replace(/\s/g, '').length;
    const sentences = this.countSentences(text);
    const paragraphs = this.countParagraphs(content);
    const readingTime = Math.max(1, Math.ceil(words / this.WORDS_PER_MINUTE));

    return {
      characters,
      charactersNoSpaces,
      words,
      sentences,
      paragraphs,
      readingTime,
    };
  }

  private stripHTML(html: string): string {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  }

  private countWords(text: string): number {
    return text
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0).length;
  }

  private countSentences(text: string): number {
    return text.split(/[.!?]+/).filter((sentence) => sentence.trim().length > 0).length;
  }

  private countParagraphs(html: string): number {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.querySelectorAll('p, div:not(.editor-toolbar)').length || 1;
  }
}
