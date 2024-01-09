export interface Config {
  name: string,
  property: keyof CSSStyleDeclaration,
  enabledValue: string,
  disabledValue?: string,
  isComplex?: boolean
}

export type StyleConfig = { [p: string]: Config };

export class StyleManager {
  private styleConfig: StyleConfig;
  constructor(styleConfig: StyleConfig) {
    this.styleConfig = styleConfig;
  }
  set(element: HTMLElement, styleCommand: string) {
    const config = this.styleConfig[styleCommand];
    if (config) {
      if (config.isComplex) {
        this.setComplexStyle(element, config.property, config.enabledValue);
      } else {
        element.style[config.property as any] = config.enabledValue;
      }
    }
  }

  remove(element: HTMLElement, styleCommand: string) {
    const config = this.styleConfig[styleCommand];
    if (config) {
      if (config.isComplex) {
        this.removeComplexStyle(element, config.property, config.enabledValue);
      } else if(config.disabledValue) {
        element.style[config.property as any] = config.disabledValue;
      } else {
        // @ts-ignore
        element.style[config.property as any] = null;
        // element.style.removeProperty(config.property as string);
      }
    }
  }

  has(element: HTMLElement, styleCommand: string) {
    const config = this.styleConfig[styleCommand];
    return config && element.style[config.property as any] === config.enabledValue;
  }

  private setComplexStyle(element: HTMLElement, property: keyof CSSStyleDeclaration, value: string) {
    const currentStyles = element.style[property]?.toString().split(' ');
    if (currentStyles && !currentStyles.includes(value)) {
      currentStyles.push(value);
      element.style[property as any] = currentStyles.join(' ').trim();
    }
  }

  private removeComplexStyle(element: HTMLElement, property: keyof CSSStyleDeclaration, value: string) {
    const currentStyles = element.style[property]?.toString().split(' ').filter(style => style !== value);
    if(currentStyles) {
      element.style[property as any] = currentStyles.join(' ').trim();
    }
  }
}
