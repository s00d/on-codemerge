export class StyleManager {
  // Добавление или обновление стилей
  updateStyle(styleId: string, className: string, styles: {[key: string]: string}) {
    let styleElement = document.getElementById(styleId);
    const cssString = this.generateCssString(className, styles);

    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = styleId;
      // @ts-ignore
      styleElement.type = "text/css";
      document.head.appendChild(styleElement);
    }

    styleElement.innerHTML = cssString;
  }

  // Генерация строки CSS
  generateCssString(className: string, styles: {[key: string]: string}) {
    const styleString = Object.entries(styles).map(([key, value]) => `${key}: ${value};`).join(' ');
    return `${className} { ${styleString} }`;
  }

  // Проверка наличия стиля
  hasStyle(styleId: string) {
    return !!document.getElementById(styleId);
  }

  // Удаление стиля
  removeStyle(styleId: string) {
    const styleElement = document.getElementById(styleId);
    if (styleElement) {
      styleElement.remove();
    }
  }
}

