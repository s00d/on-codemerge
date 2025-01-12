import type { Statistics } from '../services/StatisticsCalculator';
import type { HTMLEditor } from '../../../core/HTMLEditor.ts';
import { createContainer, createSpan } from '../../../utils/helpers.ts';

export class FooterRenderer {
  private editor: HTMLEditor;
  private element: HTMLElement | null = null;
  private stats: { [key: string]: HTMLElement } = {};

  constructor(editor: HTMLEditor) {
    this.editor = editor; // Получаем LocaleManager из editor
  }

  public createElement(): HTMLElement {
    this.element = createContainer('editor-footer');
    const footerContent = createContainer('editor-footer-block');
    const leftSection = createContainer('flex items-center gap-4');
    const wordsStat = this.createStatElement(
      this.editor.t('Words'), // Переводим текст
      'stat-words'
    );
    const charactersStat = this.createStatElement(
      this.editor.t('Characters'), // Переводим текст
      'stat-characters'
    );
    const charactersNoSpacesStat = this.createStatElement(
      this.editor.t('Characters (without spaces)'), // Переводим текст
      'stat-characters-no-spaces'
    );

    leftSection.appendChild(wordsStat);
    leftSection.appendChild(charactersStat);
    leftSection.appendChild(charactersNoSpacesStat);

    // Правая часть (предложения, абзацы и время чтения)
    const rightSection = createContainer('flex items-center gap-4');
    const sentencesStat = this.createStatElement(
      this.editor.t('Sentences'), // Переводим текст
      'stat-sentences'
    );
    const paragraphsStat = this.createStatElement(
      this.editor.t('Paragraphs'), // Переводим текст
      'stat-paragraphs'
    );
    const readingTimeStat = this.createStatElement(
      this.editor.t('Reading time'), // Переводим текст
      'stat-reading-time',
      this.editor.t('min') // Переводим суффикс
    );

    const collaborationStatus = createContainer('collaboration-status');

    rightSection.appendChild(collaborationStatus);
    rightSection.appendChild(sentencesStat);
    rightSection.appendChild(paragraphsStat);
    rightSection.appendChild(readingTimeStat);

    // Сборка структуры
    footerContent.appendChild(leftSection);
    footerContent.appendChild(rightSection);
    this.element.appendChild(footerContent);

    // Кэширование элементов статистики
    this.stats = {
      words: wordsStat,
      characters: charactersStat,
      charactersNoSpaces: charactersNoSpacesStat,
      sentences: sentencesStat,
      paragraphs: paragraphsStat,
      readingTime: readingTimeStat,
    };

    return this.element;
  }

  private createStatElement(label: string, className: string, suffix: string = ''): HTMLElement {
    const container = createContainer();

    const labelElement = createSpan('', `${label}: `);
    labelElement.textContent = `${label}: `;

    const valueElement = createSpan('', `${className} font-medium`);
    valueElement.textContent = '0';

    container.appendChild(labelElement);
    container.appendChild(valueElement);

    if (suffix) {
      const suffixElement = createSpan('', ` ${suffix}`);
      container.appendChild(suffixElement);
    }

    return container;
  }

  public update(stats: Statistics): void {
    if (!this.element) return;

    this.stats.words.textContent = this.editor.t('Words') + ': ' + stats.words.toLocaleString();
    this.stats.characters.textContent =
      this.editor.t('Characters') + ': ' + stats.characters.toLocaleString();
    this.stats.charactersNoSpaces.textContent =
      this.editor.t('Characters (without spaces)') +
      ': ' +
      stats.charactersNoSpaces.toLocaleString();
    this.stats.sentences.textContent =
      this.editor.t('Sentences') + ': ' + stats.sentences.toLocaleString();
    this.stats.paragraphs.textContent =
      this.editor.t('Paragraphs') + ': ' + stats.paragraphs.toLocaleString();
    this.stats.readingTime.textContent =
      this.editor.t('Reading time') + ': ' + stats.readingTime.toString();
  }
}
