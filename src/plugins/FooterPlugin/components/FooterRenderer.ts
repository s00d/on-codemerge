import type { Statistics } from '../services/StatisticsCalculator';
import type { HTMLEditor } from '../../../core/HTMLEditor.ts';

export class FooterRenderer {
  private editor: HTMLEditor;
  private element: HTMLElement | null = null;
  private stats: { [key: string]: HTMLElement } = {};

  constructor(editor: HTMLEditor) {
    this.editor = editor; // Получаем LocaleManager из editor
  }

  public createElement(): HTMLElement {
    // Основной контейнер
    this.element = document.createElement('div');
    this.element.className = 'editor-footer';

    // Контейнер для статистики
    const footerContent = document.createElement('div');
    footerContent.className =
      'flex items-center justify-between px-4 py-2 bg-gray-50 border-t border-gray-200 text-sm text-gray-600';

    // Левая часть (слова и символы)
    const leftSection = document.createElement('div');
    leftSection.className = 'flex items-center gap-4';

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
    const rightSection = document.createElement('div');
    rightSection.className = 'flex items-center gap-4';

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

    rightSection.appendChild(sentencesStat);
    rightSection.appendChild(paragraphsStat);
    rightSection.appendChild(readingTimeStat);

    // Сборка структуры
    footerContent.appendChild(leftSection);
    footerContent.appendChild(rightSection);
    this.element.appendChild(footerContent);

    // Кэширование элементов статистики
    this.stats = {
      words: this.element.querySelector('.stat-words')!,
      characters: this.element.querySelector('.stat-characters')!,
      charactersNoSpaces: this.element.querySelector('.stat-characters-no-spaces')!,
      sentences: this.element.querySelector('.stat-sentences')!,
      paragraphs: this.element.querySelector('.stat-paragraphs')!,
      readingTime: this.element.querySelector('.stat-reading-time')!,
    };

    return this.element;
  }

  private createStatElement(label: string, className: string, suffix: string = ''): HTMLElement {
    const container = document.createElement('div');

    const labelElement = document.createElement('span');
    labelElement.textContent = `${label}: `;

    const valueElement = document.createElement('span');
    valueElement.className = `${className} font-medium`;
    valueElement.textContent = '0';

    container.appendChild(labelElement);
    container.appendChild(valueElement);

    if (suffix) {
      const suffixElement = document.createElement('span');
      suffixElement.textContent = ` ${suffix}`;
      container.appendChild(suffixElement);
    }

    return container;
  }

  public update(stats: Statistics): void {
    if (!this.element) return;

    this.stats.words.textContent = stats.words.toLocaleString();
    this.stats.characters.textContent = stats.characters.toLocaleString();
    this.stats.charactersNoSpaces.textContent = stats.charactersNoSpaces.toLocaleString();
    this.stats.sentences.textContent = stats.sentences.toLocaleString();
    this.stats.paragraphs.textContent = stats.paragraphs.toLocaleString();
    this.stats.readingTime.textContent = stats.readingTime.toString();
  }
}
