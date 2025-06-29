export class LocaleManager {
  private currentLocale: string = 'en'; // Текущая локаль по умолчанию
  private locales: Record<string, Record<string, string>> = {}; // Словарь локалей
  private fallbackLocale: string = 'en'; // Локаль по умолчанию, если перевод не найден

  constructor(defaultLocale: string = 'en') {
    this.currentLocale = defaultLocale;
    this.fallbackLocale = defaultLocale;
  }

  /**
   * Инициализирует менеджер локализации
   */
  public async initialize(): Promise<void> {
    await this.loadLocale(this.currentLocale);
  }

  /**
   * Асинхронно загружает локаль из файла через динамический импорт
   * @param locale - Код локали (например, 'en', 'ru')
   */
  public async loadLocale(locale: string): Promise<void> {
    try {
      const translations = await import(`./locales/${locale}.json`);
      this.locales[locale] = translations.default;
      console.log(
        `Loaded locale "${locale}" with ${Object.keys(translations.default).length} translations`
      );
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
    // Проверяем, загружена ли текущая локаль
    if (!this.locales[this.currentLocale]) {
      console.warn(`Locale "${this.currentLocale}" is not loaded yet. Returning key: "${key}"`);
      return key;
    }

    const currentTranslation = this.locales[this.currentLocale]?.[key];
    const fallbackTranslation = this.locales[this.fallbackLocale]?.[key];

    // Если перевод не найден ни в текущей локали, ни в fallback, выводим предупреждение
    if (!currentTranslation && !fallbackTranslation) {
      console.warn(
        `Translation key "${key}" not found in locale "${this.currentLocale}" and fallback locale "${this.fallbackLocale}"`
      );
    }

    const translation = currentTranslation || fallbackTranslation || key;
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

  /**
   * Проверяет, готов ли менеджер локализации
   */
  public isReady(): boolean {
    return !!this.locales[this.currentLocale];
  }

  /**
   * Возвращает все доступные языки (жестко прописанные, чтобы не сканировать файловую систему)
   */
  public getAvailableLocales(): string[] {
    return [
      'en',
      'ru',
      'de',
      'fr',
      'es',
      'it',
      'pt',
      'pl',
      'cs',
      'nl',
      'tr',
      'ja',
      'ko',
      'zh',
      'ar',
      'hi',
      'vi',
      'th',
      'id',
    ];
  }

  /**
   * Возвращает короткое обозначение локали (например, EN, RU)
   */
  public static getLocaleLabel(locale: string): string {
    const map: Record<string, string> = {
      en: 'EN',
      ru: 'RU',
      de: 'DE',
      fr: 'FR',
      es: 'ES',
      it: 'IT',
      pt: 'PT',
      pl: 'PL',
      cs: 'CS',
      nl: 'NL',
      tr: 'TR',
      ja: 'JA',
      ko: 'KO',
      zh: 'ZH',
      ar: 'AR',
      hi: 'HI',
      vi: 'VI',
      th: 'TH',
      id: 'ID',
    };
    return map[locale] || locale.toUpperCase();
  }
}
