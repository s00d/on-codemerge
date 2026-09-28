import type { DocNode } from '@on-codemerge/kernel';

export interface Statistics {
  characters: number;
  charactersNoSpaces: number;
  words: number;
  sentences: number;
  paragraphs: number;
  readingTime: number;
}

/** Stats from the document model (JSON), not HTML scraping. */
export class StatisticsCalculator {
  private readonly WORDS_PER_MINUTE = 200;

  public calculateFromDoc(doc: DocNode): Statistics {
    const text = this.collectText(doc).trim();
    const words = this.countWords(text);
    const characters = text.length;
    const charactersNoSpaces = text.replaceAll(/\s/g, '').length;
    const sentences = this.countSentences(text);
    const paragraphs = this.countBlockParagraphs(doc);
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

  private collectText(node: DocNode): string {
    if (node.type === 'text') {
      return node.text ?? '';
    }
    if (node.type === 'code_block' || node.type === 'codeBlock') {
      return typeof node.attrs?.code === 'string' ? node.attrs.code : '';
    }
    const parts = (node.content ?? []).map((c) => this.collectText(c));
    const joined = parts.join(node.type === 'paragraph' || node.type === 'heading' ? '' : ' ');
    if (node.type === 'paragraph' || node.type === 'heading' || node.type === 'listItem') {
      return `${joined}\n`;
    }
    return joined;
  }

  private countBlockParagraphs(doc: DocNode): number {
    let n = 0;
    const walk = (node: DocNode) => {
      if (
        node.type === 'paragraph' ||
        node.type === 'heading' ||
        node.type === 'code_block' ||
        node.type === 'codeBlock'
      ) {
        n += 1;
        return;
      }
      for (const c of node.content ?? []) {
        walk(c);
      }
    };
    walk(doc);
    return n;
  }

  private countWords(text: string): number {
    if (!text) {
      return 0;
    }
    return text.split(/\s+/).filter(Boolean).length;
  }

  private countSentences(text: string): number {
    return text.split(/[.!?]+/).filter((p) => p.trim().length > 0).length;
  }
}
