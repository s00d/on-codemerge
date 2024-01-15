import type { I18nInterface, LanguagePack, Languages, Observer, EditorCoreInterface } from "./types";

export class I18n implements I18nInterface {
  private languages: Languages = {};
  public currentLang: string;
  private core: EditorCoreInterface;
  private observers: Observer[] = [];

  constructor(core: EditorCoreInterface, locale: string = 'en') {
    this.core = core;
    this.currentLang = locale;
  }

  addObserver(observer: Observer): void {
    this.observers.push(observer);
  }

  private notifyObservers(): void {
    this.observers.forEach(observer => observer.update(this.currentLang, this.languages[this.currentLang]));
  }

  async loadLanguage(lang: string): Promise<void> {
    if (!this.languages[lang]) {
      try {
        const messages = await import(`../locales/${lang}.json`);
        this.languages[lang] = messages.default;
        this.notifyObservers();
        this.core.eventManager.publish('languageLoaded', lang);
      } catch (error) {
        console.error(`Could not load language: ${lang}`, error);
      }
    }
  }

  async setCurrentLanguage(lang: string): Promise<void> {
    this.currentLang = lang;
    await this.loadLanguage(lang);
  }

  merge(newTranslations: LanguagePack): void {
    const currentLanguageTranslations = this.languages[this.currentLang];
    if (currentLanguageTranslations) {
      this.languages[this.currentLang] = {
        ...currentLanguageTranslations,
        ...newTranslations
      };
      this.notifyObservers();
      this.core.eventManager.publish('translationsMerged', this.currentLang);
    }
  }

  translate(key: string): string {
    return this.languages[this.currentLang]?.[key] || key;
  }
}
