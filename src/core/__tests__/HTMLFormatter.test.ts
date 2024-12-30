import { HTMLFormatter } from '../services/HTMLFormatter';

describe('HTMLFormatter', () => {
  let formatter: HTMLFormatter;

  beforeEach(() => {
    formatter = new HTMLFormatter();
  });

  it('should format simple HTML correctly', () => {
    const html = '<div><p>Hello</p></div>';
    const formatted = formatter.format(html);
    expect(formatted).toMatchSnapshot();
  });

  it('should handle self-closing tags correctly', () => {
    const html = '<img src="image.jpg" /><br />';
    const formatted = formatter.format(html);
    expect(formatted).toMatchSnapshot();
  });

  it('should handle nested tags correctly', () => {
    const html = '<div><div><p>Nested</p></div></div>';
    const formatted = formatter.format(html);
    expect(formatted).toMatchSnapshot();
  });

  it('should handle void elements correctly', () => {
    const html = '<input type="text" /><br />';
    const formatted = formatter.format(html);
    expect(formatted).toMatchSnapshot();
  });

  it('should handle mixed content correctly', () => {
    const html = '<div><p>Hello</p><img src="image.jpg" /></div>';
    const formatted = formatter.format(html);
    expect(formatted).toMatchSnapshot();
  });

  it('should handle custom indentation size', () => {
    const customFormatter = new HTMLFormatter({ indentSize: 4 });
    const html = '<div><p>Hello</p></div>';
    const formatted = customFormatter.format(html);
    expect(formatted).toMatchSnapshot();
  });
});
