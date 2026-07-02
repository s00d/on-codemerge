import { formatDebugMapToString } from '../services/TextFormatter/FormatDebugMap';
import { EditorFixture } from './helpers/EditorFixture';
import { ALIGN_CLASS_MAP } from './helpers/formatScenarios';

describe('TextFormatter debug map', () => {
  let fixture: EditorFixture;

  afterEach(() => {
    fixture?.destroy();
  });

  it('creates debug map when enableFormatDebug is true', () => {
    fixture = EditorFixture.create('Line one<div>Line two</div>', true);
    fixture.selection.selectByText('two', 'div');
    const map = fixture.toggleWithDebug('bold');

    expect(map).not.toBeNull();
    expect(map!.command).toBe('bold');
    expect(map!.htmlBefore).toContain('Line two');
    expect(map!.htmlAfter).toContain('format-bold');
    expect(map!.pipeline.length).toBeGreaterThan(0);
    expect(map!.domTree.length).toBeGreaterThan(0);
    expect(map!.selection.text).toBe('two');
  });

  it('does not create map when debug is disabled', () => {
    fixture = EditorFixture.create('Hello world');
    fixture.selection.selectByText('world');
    fixture.toggle('bold');
    expect(fixture.getDebugMap()).toBeNull();
  });

  it('formatDebugMapToString produces readable output', () => {
    fixture = EditorFixture.create('Line one<div>Line two</div>', true);
    fixture.selection.selectByText('two', 'div');
    const map = fixture.toggleWithDebug('bold')!;
    const text = formatDebugMapToString(map);

    expect(text).toContain('Format Debug Map');
    expect(text).toContain('bold');
    expect(text).toContain('Pipeline');
    expect(text).toContain('DOM Tree');
  });

  it('partial bold on line 2 pipeline uses collectTextNodes', () => {
    fixture = EditorFixture.create('Line one<div>Line two</div>', true);
    fixture.selection.selectByText('two', 'div');
    const map = fixture.toggleWithDebug('bold')!;

    const stepNames = map.pipeline.map((s) => s.step);
    expect(stepNames).toContain('collectTextNodes');
    expect(map.action).toBe('apply');
  });

  it('partial remove bold pipeline traces formatting parent', () => {
    fixture = EditorFixture.create('Hello <span class="format-bold">beautiful world</span>', true);
    fixture.selection.selectByText('world');
    const map = fixture.toggleWithDebug('bold')!;

    expect(map.action).toBe('remove');
    const steps = map.pipeline.map((s) => s.step);
    expect(steps.some((s) => s.includes('isolate') || s.includes('formattingParent'))).toBe(true);
  });

  it('nested italic partial pipeline snapshot', () => {
    fixture = EditorFixture.create(
      '<span class="format-bold"><span class="format-italic">Hello world</span></span>',
      true
    );
    fixture.selection.selectByText('Hello');
    const map = fixture.toggleWithDebug('italic')!;
    expect(map.action).toBe('remove');
    expect(formatDebugMapToString(map)).toMatchSnapshot();
  });

  it('partial line2 bold snapshot', () => {
    fixture = EditorFixture.create('Line one<div>Line two</div>', true);
    fixture.selection.selectByText('two', 'div');
    const map = fixture.toggleWithDebug('bold')!;
    expect(formatDebugMapToString(map)).toMatchSnapshot();
  });
});

describe('TextFormatter align regression', () => {
  let fixture: EditorFixture;

  afterEach(() => {
    fixture?.destroy();
  });

  it('alignCenter on line 1 plain text does not style editor container', () => {
    fixture = EditorFixture.create('Line one<div>Line two</div>');
    fixture.selection.selectByText('one');
    fixture.toggle('alignCenter');

    expect(fixture.container.classList.contains(ALIGN_CLASS_MAP.alignCenter)).toBe(false);
  });

  it('alignCenter on line 2 in div styles only that div', () => {
    fixture = EditorFixture.create('Line one<div>Line two</div>');
    fixture.selection.selectByText('two', 'div');
    fixture.toggle('alignCenter');

    const div = fixture.container.querySelector('div')!;
    expect(div.classList.contains(ALIGN_CLASS_MAP.alignCenter)).toBe(true);
    expect(fixture.container.classList.contains(ALIGN_CLASS_MAP.alignCenter)).toBe(false);
  });

  it('alignCenter debug map records block elements', () => {
    fixture = EditorFixture.create('Line one<div>Line two</div>', true);
    fixture.selection.selectByText('Line two', 'div');
    const map = fixture.toggleWithDebug('alignCenter')!;

    expect(map.pipeline.some((s) => s.step === 'findBlockElements')).toBe(true);
    expect(map.action).toBe('apply');
  });

  it('alignLeft on two-div layout targets selected div only', () => {
    fixture = EditorFixture.create('<div>Line one</div><div>Line two</div>');
    fixture.selection.selectByText('two', 'div:last-child');
    fixture.toggle('alignLeft');

    const divs = fixture.container.querySelectorAll('div');
    expect(divs[0].classList.contains(ALIGN_CLASS_MAP.alignLeft)).toBe(false);
    expect(divs[1].classList.contains(ALIGN_CLASS_MAP.alignLeft)).toBe(true);
  });
});
