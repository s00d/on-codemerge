export interface DriverOptions {
  model: string; // Модель
  temperature?: number; // Температура
  maxTokens?: number; // Максимальное количество токенов
  topP?: number; // Top-p sampling
}

export interface OptionDescription {
  type: 'list' | 'number' | 'input' | 'checkbox'; // Тип поля (выпадающий список, число, текст, чекбокс)
  label: string; // Название параметра
  options?: string[]; // Опции для выпадающего списка
  default?: string | number | boolean; // Значение по умолчанию
  min?: number;
  max?: number;
}

// Тип для описания всех параметров драйвера
export interface OptionsDescription {
  [key: string]: OptionDescription;
}

export interface AIDriver<OptionsType> {
  /**
   * Генерирует текст на основе промта и опций.
   * @param prompt - Текст запроса.
   * @param options - Параметры для генерации текста.
   * @returns Сгенерированный текст.
   */
  generateText(prompt: string, options?: OptionsType): Promise<string>;

  /**
   * Возвращает описание параметров для драйвера.
   * @returns Объект с описанием параметров.
   */
  getOptionsDescription(): OptionsDescription;
}
