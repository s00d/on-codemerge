interface Config {
  name: string;
  className: string;
  block?: boolean;
}

const styleConfig: { [p: string]: Config } = {
  bold: {
    name: 'Bold',
    className: 'format-bold',
  },
  italic: {
    name: 'Italic',
    className: 'format-italic',
  },
  underline: {
    name: 'Underline',
    className: 'format-underline',
  },
  strikethrough: {
    name: 'Strikethrough',
    className: 'format-strikethrough',
  },
  superscript: {
    name: 'Superscript',
    className: 'format-superscript',
  },
  subscript: {
    name: 'Subscript',
    className: 'format-subscript',
  },
  fontSize: {
    name: 'Font Size',
    className: 'format-font-size',
  },
  fontFamily: {
    name: 'Font Family',
    className: 'format-font-family',
  },
  alignLeft: {
    name: 'Align Left',
    className: 'format-align-left',
    block: true,
  },
  alignCenter: {
    name: 'Align Center',
    className: 'format-align-center',
    block: true,
  },
  alignRight: {
    name: 'Align Right',
    className: 'format-align-right',
    block: true,
  },
  alignJustify: {
    name: 'Align Justify',
    className: 'format-align-justify',
    block: true,
  },
  lineHeight: {
    name: 'Line Height',
    className: 'format-line-height',
  },
  letterSpacing: {
    name: 'Letter Spacing',
    className: 'format-letter-spacing',
  },
  textTransform: {
    name: 'Text Transform',
    className: 'format-text-transform',
  },
  textInline: {
    name: 'Text Inline',
    className: 'format-text-inline',
  },
  textBlock: {
    name: 'Text Block',
    className: 'format-text-block',
  },
};

export class StyleManager {
  set(element: HTMLElement, styleCommand: string): void {
    const config = styleConfig[styleCommand];
    if (config.block) {
      element.classList.remove(
        'format-align-left',
        'format-align-center',
        'format-align-right',
        'format-align-justify'
      );
      element.classList.add('format-text-block');
    }
    element.classList.add(config.className);
  }

  remove(element: HTMLElement, styleCommand: string): void {
    const config = styleConfig[styleCommand];
    element.classList.remove(config.className);
    if (config.block) {
      element.classList.remove(
        'format-align-left',
        'format-align-center',
        'format-align-right',
        'format-align-justify'
      );
      element.classList.remove('format-text-block');
    }
  }

  has(element: HTMLElement, styleCommand: string): boolean {
    const config = styleConfig[styleCommand];
    return element.classList.contains(config.className);
  }
}
