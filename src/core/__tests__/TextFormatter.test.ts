import { EditorFixture } from './helpers/EditorFixture';
import { DOM_LAYOUTS, type DomLayoutKey } from './helpers/domLayouts';

describe('TextFormatter', () => {
  let fixture: EditorFixture;

  afterEach(() => {
    fixture?.destroy();
  });

  describe('Basic Style Application', () => {
    beforeEach(() => {
      fixture = EditorFixture.create();
    });

    it('should apply bold to a simple text selection', () => {
      fixture.container.innerHTML = 'Hello world';
      fixture.selection.selectInContainer(6, 11);
      fixture.toggle('bold');
      expect(fixture.html).toBe('Hello <span class="format-bold">world</span>');
    });

    it('should apply italic across multiple nodes', () => {
      fixture.container.innerHTML = 'one <b>two</b> three';
      fixture.selection.selectInContainer(2, 12);
      fixture.toggle('italic');
      const html = fixture.html;
      expect(html).toContain('format-italic');
      expect(html).toContain('two');
      expect(html).toContain('e');
      expect(html).toContain('thr');
    });
  });

  describe('Style Removal', () => {
    beforeEach(() => {
      fixture = EditorFixture.create();
    });

    it('should remove bold from a fully selected styled element', () => {
      fixture.container.innerHTML = 'Hello <span class="format-bold">world</span>';
      fixture.selection.selectByText('world');
      fixture.toggle('bold');
      expect(fixture.html).toBe('Hello world');
    });

    it('should remove bold when cursor is inside a styled element', () => {
      fixture.container.innerHTML = 'Hello <span class="format-bold">world</span>';
      fixture.selection.setCursor('span', 2);
      fixture.toggle('bold');
      expect(fixture.html).toBe('Hello world');
    });

    it('should remove bold from a partially selected styled element', () => {
      fixture.container.innerHTML = 'Hello <span class="format-bold">beautiful world</span>';
      fixture.selection.selectByText('world');
      fixture.toggle('bold');
      expect(fixture.html).toBe(
        'Hello <span class="format-bold">beautiful </span>world'
      );
    });
  });

  describe('Mixed and Nested Styles', () => {
    beforeEach(() => {
      fixture = EditorFixture.create();
    });

    it('should add italic to part of bold text', () => {
      fixture.container.innerHTML = '<span class="format-bold">Hello world</span>';
      fixture.selection.selectByText('world');
      fixture.toggle('italic');
      expect(fixture.html).toBe(
        '<span class="format-bold">Hello <span class="format-italic">world</span></span>'
      );
    });

    it('should remove italic from bold+italic text', () => {
      fixture.container.innerHTML =
        '<span class="format-bold"><span class="format-italic">Hello world</span></span>';
      fixture.selection.selectByText('Hello');
      fixture.toggle('italic');
      expect(fixture.html).toBe(
        '<span class="format-bold">Hello<span class="format-italic"> world</span></span>'
      );
    });
  });

  describe('hasClass State Detection', () => {
    beforeEach(() => {
      fixture = EditorFixture.create();
    });

    it('should return true when bold element is fully selected', () => {
      fixture.container.innerHTML = '<span class="format-bold">Hello</span>';
      fixture.selection.selectByText('Hello');
      expect(fixture.hasClass('bold')).toBe(true);
    });

    it('should return false when selection contains mixed styles', () => {
      fixture.container.innerHTML = '<span class="format-bold">Hello</span> world';
      fixture.selection.selectInContainer(0, 11);
      expect(fixture.hasClass('bold')).toBe(false);
    });

    it('should return true when collapsed cursor is inside bold text', () => {
      fixture.container.innerHTML = '<span class="format-bold">Hello</span> world';
      fixture.selection.setCursor('.format-bold', 2);
      expect(fixture.hasClass('bold')).toBe(true);
    });

    it('should return false when collapsed cursor is outside bold text', () => {
      fixture.container.innerHTML = '<span class="format-bold">Hello</span> world';
      fixture.selection.setCursorInContainer(8);
      expect(fixture.hasClass('bold')).toBe(false);
    });

    it('should return true for nested bold when cursor is inside inner italic', () => {
      fixture.container.innerHTML =
        '<span class="format-bold"><span class="format-italic">Hi</span></span>';
      fixture.selection.setCursor('.format-italic', 1);
      expect(fixture.hasClass('bold')).toBe(true);
      expect(fixture.hasClass('italic')).toBe(true);
    });
  });

  describe('Issue #6: multi-line formatting', () => {
    const layoutKeys = Object.keys(DOM_LAYOUTS) as DomLayoutKey[];

    describe.each(layoutKeys)('layout: %s', (layoutKey) => {
      const layout = DOM_LAYOUTS[layoutKey];

      beforeEach(() => {
        fixture = EditorFixture.create(layout.html);
      });

      it('bold partial word on line 1', () => {
        if (layoutKey === 'line1Bold' || layoutKey === 'preformattedNested') {
          fixture.selection.selectByText('two', 'div');
          fixture.toggle('bold');
          expect(fixture.normalizedHtml()).toContain('<span class="format-bold">two</span>');
          return;
        }

        const word = layout.line1Selector ? 'one' : 'Line';
        const parent = layout.line1Selector;
        if (parent) {
          fixture.selection.selectByText(word, parent);
        } else {
          fixture.selection.selectByText(word);
        }
        fixture.toggle('bold');
        const html = fixture.normalizedHtml();
        expect(html).toContain(`<span class="format-bold">${word}</span>`);
      });

      it('bold partial word on line 2', () => {
        const word = layout.line2Selector ? 'two' : 'Line two';
        const parent = layout.line2Selector;
        if (parent) {
          fixture.selection.selectByText(word, parent);
        } else {
          fixture.selection.selectByText(word, undefined);
        }
        fixture.toggle('bold');
        const html = fixture.normalizedHtml();
        expect(html).toContain('format-bold');
        expect(html).not.toMatch(/<div class="format-bold">/);
      });

      it('italic partial word on line 2', () => {
        const parent = layout.line2Selector;
        if (parent) {
          fixture.selection.selectByText('two', parent);
        } else {
          fixture.selection.selectByText('two');
        }
        fixture.toggle('italic');
        const html = fixture.normalizedHtml();
        expect(html).toContain('<span class="format-italic">two</span>');
      });

      it('bold whole word on line 2 via selectByText', () => {
        const parent = layout.line2Selector;
        if (parent) {
          fixture.selection.selectByText('Line two', parent);
        } else {
          fixture.selection.selectByText('Line two');
        }
        fixture.toggle('bold');
        const html = fixture.normalizedHtml();
        expect(html).toContain('<span class="format-bold">Line two</span>');
      });
    });

    it('bold partial word on br-separated line 2 does not style line 1', () => {
      fixture = EditorFixture.create('Line one<br>Line two');
      fixture.selection.selectByText('two');
      fixture.toggle('bold');
      expect(fixture.normalizedHtml()).toBe(
        'Line one<br>Line <span class="format-bold">two</span>'
      );
    });

    it('bold partial word on div-wrapped line 2 does not style whole div', () => {
      fixture = EditorFixture.create('Line one<div>Line two</div>');
      fixture.selection.selectByText('two', 'div');
      fixture.toggle('bold');
      const html = fixture.normalizedHtml();
      expect(html).toContain('<span class="format-bold">two</span>');
      expect(html).not.toContain('<div class="format-bold">');
    });

    it('bold on line 1 then line 2 independently', () => {
      fixture = EditorFixture.create('<div>Line one</div><div>Line two</div>');
      fixture.selection.selectByText('one', 'div:first-child');
      fixture.toggle('bold');
      fixture.selection.selectByText('two', 'div:last-child');
      fixture.toggle('bold');
      expect(fixture.normalizedHtml()).toBe(
        '<div>Line <span class="format-bold">one</span></div><div>Line <span class="format-bold">two</span></div>'
      );
    });
  });

  describe('Toggle on/off multi-line', () => {
    beforeEach(() => {
      fixture = EditorFixture.create('Line one<div>Line two</div>');
    });

    it('apply bold then remove on line 2 partial', () => {
      fixture.selection.selectByText('two', 'div');
      fixture.toggle('bold');
      fixture.selection.selectByText('two', 'div');
      fixture.toggle('bold');
      expect(fixture.normalizedHtml()).toBe('Line one<div>Line two</div>');
    });

    it('apply bold on line 2 then hasClass true for selection', () => {
      fixture.selection.selectByText('Line', 'div');
      fixture.toggle('bold');
      fixture.selection.selectByText('Line', 'div');
      expect(fixture.hasClass('bold')).toBe(true);
    });
  });

  describe('Other inline styles multi-line', () => {
    beforeEach(() => {
      fixture = EditorFixture.create('Line one<div>Line two</div>');
    });

    it('underline partial word on line 2', () => {
      fixture.selection.selectByText('two', 'div');
      fixture.toggle('underline');
      expect(fixture.normalizedHtml()).toContain('<span class="format-underline">two</span>');
    });

    it('strikethrough partial word on line 2', () => {
      fixture.selection.selectByText('two', 'div');
      fixture.toggle('strikethrough');
      expect(fixture.normalizedHtml()).toContain('<span class="format-strikethrough">two</span>');
    });

    it('italic partial word on line 1 plain text', () => {
      fixture.selection.selectByText('one');
      fixture.toggle('italic');
      expect(fixture.normalizedHtml()).toContain('<span class="format-italic">one</span>');
    });
  });

  describe('Cross-line selection', () => {
    beforeEach(() => {
      fixture = EditorFixture.create();
    });

    it('bold selection spanning br only styles selected text', () => {
      fixture.container.innerHTML = 'Line one<br>Line two';
      const start = fixture.container.textContent!.indexOf('one');
      const end = fixture.container.textContent!.indexOf('Line two') + 4;
      fixture.selection.selectInContainer(start, end);
      fixture.toggle('bold');
      const html = fixture.normalizedHtml();
      expect(html).toContain('format-bold');
      expect(html).not.toContain('<span class="format-bold">Line one<br>Line two</span>');
    });
  });

  describe('Collapsed cursor toggle', () => {
    beforeEach(() => {
      fixture = EditorFixture.create('Line one<div>Line two</div>');
    });

    it('toggle bold with cursor inside word on line 2', () => {
      const div = fixture.container.querySelector('div')!;
      const textNode = div.firstChild!;
      const offset = 'Line two'.indexOf('tw');
      const selection = window.getSelection()!;
      const range = document.createRange();
      range.setStart(textNode, offset);
      range.setEnd(textNode, offset);
      selection.removeAllRanges();
      selection.addRange(range);
      fixture.toggle('bold');
      expect(fixture.normalizedHtml()).toMatch(/format-bold/);
    });
  });
});
