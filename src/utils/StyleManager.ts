interface Config {
  name: string;
  property: keyof CSSStyleDeclaration;
  enabledValue: string;
  isComplex?: boolean;
  append?: string;
}

const styleConfig: { [p: string]: Config } = {
  bold: {
    name: 'Bold',
    property: 'fontWeight',
    enabledValue: 'bold',
    append: 'textInline',
  },
  italic: {
    name: 'Italic',
    property: 'fontStyle',
    enabledValue: 'italic',
    append: 'textInline',
  },
  underline: {
    name: 'Underline',
    property: 'textDecoration',
    enabledValue: 'underline',
    append: 'textInline',
  },
  strikethrough: {
    name: 'Strikethrough',
    property: 'textDecoration',
    enabledValue: 'line-through',
    isComplex: true,
    append: 'textInline',
  },
  superscript: {
    name: 'Superscript',
    property: 'verticalAlign',
    enabledValue: 'sup',
  },
  subscript: {
    name: 'Subscript',
    property: 'verticalAlign',
    enabledValue: 'sub',
  },
  fontSize: {
    name: 'Font Size',
    property: 'fontSize',
    enabledValue: '',
  },
  fontFamily: {
    name: 'Font Family',
    property: 'fontFamily',
    enabledValue: '',
  },
  alignLeft: {
    name: 'Align Left',
    property: 'textAlign',
    enabledValue: 'left',
  },
  alignCenter: {
    name: 'Align Center',
    property: 'textAlign',
    enabledValue: 'center',
  },
  alignRight: {
    name: 'Align Right',
    property: 'textAlign',
    enabledValue: 'right',
  },
  alignJustify: {
    name: 'Align Justify',
    property: 'textAlign',
    enabledValue: 'justify',
  },
  lineHeight: {
    name: 'Line Height',
    property: 'lineHeight',
    enabledValue: '',
  },
  letterSpacing: {
    name: 'Letter Spacing',
    property: 'letterSpacing',
    enabledValue: '',
  },
  textTransform: {
    name: 'Text Transform',
    property: 'textTransform',
    enabledValue: 'uppercase',
  },
  textInline: {
    name: 'Text Inline',
    property: 'display',
    enabledValue: 'inline',
  },
  textBlock: {
    name: 'Text Inline',
    property: 'display',
    enabledValue: 'block',
  },
};

export class StyleManager {

  set(element: HTMLElement, styleCommand: string): void {
    const config = styleConfig[styleCommand];
    if (!config) {
      console.warn(`Style command ${styleCommand} not found in config.`);
      return;
    }

    if (config.isComplex) {
      this.setComplexStyle(element, config.property, config.enabledValue);
    } else {
      element.style[config.property as any] = config.enabledValue;
    }

    if(config.property === 'textAlign') {
      element.style.display = 'block'
    } else if (!element.style.display) {
      element.style.display = 'inline'
    }
  }

  remove(element: HTMLElement, styleCommand: string): void {
    const config = styleConfig[styleCommand];
    if (!config) {
      console.warn(`Style command ${styleCommand} not found in config.`);
      return;
    }

    if (config.isComplex) {
      this.removeComplexStyle(element, config.property, config.enabledValue);
    } else {

      element.style.removeProperty(config.property as string);
      if (element.style[config.property as any]) {
        if(config.property === 'textAlign') {
          element.style[config.property as any] = '';
          element.style.display = 'inline'
        } else {
          element.style[config.property as any] = 'normal';
        }
      }
    }
  }

  has(element: HTMLElement, styleCommand: string): boolean {
    const config = styleConfig[styleCommand];
    return config ? element.style[config.property as any] === config.enabledValue : false;
  }

  private setComplexStyle(element: HTMLElement, property: keyof CSSStyleDeclaration, value: string): void {
    const currentStyles = element.style[property]?.toString().split(' ');
    if (currentStyles && !currentStyles.includes(value)) {
      currentStyles.push(value);
      element.style[property as any] = currentStyles.join(' ').trim();
    }
  }

  private removeComplexStyle(element: HTMLElement, property: keyof CSSStyleDeclaration, value: string): void {
    const currentStyles = element.style[property]?.toString().split(' ').filter((style) => style !== value);
    if (currentStyles) {
      element.style[property as any] = currentStyles.join(' ').trim();
    }
  }
}
