export class LocaleManager {
  private currentLocale: string = 'en'; // Текущая локаль по умолчанию
  private locales: Record<string, Record<string, string>> = {}; // Словарь локалей
  private fallbackLocale: string = 'en'; // Локаль по умолчанию, если перевод не найден

  constructor(defaultLocale: string = 'en') {
    this.currentLocale = defaultLocale;
    this.fallbackLocale = defaultLocale;
    this.loadLocale(defaultLocale); // Загружаем локаль по умолчанию
  }

  /**
   * Асинхронно загружает локаль из файла через динамический импорт
   * @param locale - Код локали (например, 'en', 'ru')
   */
  public async loadLocale(locale: string): Promise<void> {
    try {
      const translations = await import(`./locales/${locale}.json`);
      this.locales[locale] = translations.default;
    } catch (error) {
      console.error(`Error loading locale "${locale}":`, error);
      if (!this.locales[this.fallbackLocale]) {
        await this.loadLocale(this.fallbackLocale);
      }
    }
  }

  /**
   * Устанавливает текущую локаль и загружает её, если она ещё не загружена
   * @param locale - Код локали (например, 'en', 'ru')
   */
  public async setLocale(locale: string): Promise<void> {
    if (!this.locales[locale]) {
      await this.loadLocale(locale);
    }
    if (this.locales[locale]) {
      this.currentLocale = locale;
    } else {
      console.warn(`Locale "${locale}" is not loaded.`);
    }
  }

  /**
   * Возвращает текущую локаль
   */
  public getCurrentLocale(): string {
    return this.currentLocale;
  }

  /**
   * Получает перевод по ключу
   * @param key - Ключ перевода
   * @param params - Параметры для подстановки в перевод (опционально)
   */
  public translate(key: string, params: Record<string, string> = {}): string {
    const translation =
      this.locales[this.currentLocale]?.[key] || this.locales[this.fallbackLocale]?.[key] || key;
    return Object.keys(params).reduce((acc, paramKey) => {
      return acc.replace(new RegExp(`{{${paramKey}}}`, 'g'), params[paramKey]);
    }, translation);
  }

  /**
   * Возвращает все загруженные локали
   */
  public getLoadedLocales(): string[] {
    return Object.keys(this.locales);
  }
}
