import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { editorSpies, mockOnCodemergeModule } from './helpers/editorSpies';

vi.mock('on-codemerge', () => mockOnCodemergeModule());

describe('OcmEditorElement', () => {
  beforeEach(() => {
    editorSpies.reset();
  });

  afterEach(() => {
    document.body.replaceChildren();
  });

  it('mounts, emits, configure remounts', async () => {
    const { OcmEditorElement } = await import('../element');
    const el = new OcmEditorElement();
    el.setAttribute('value', '<p>a</p>');
    const ready = vi.fn();
    el.addEventListener('ready', ready);
    document.body.append(el);
    expect(ready).toHaveBeenCalledWith(expect.anything());
    expect(editorSpies.setHTML).toHaveBeenCalledWith('<p>a</p>');
    editorSpies.destroy.mockClear();
    el.configure({ pack: 'default', locale: 'ru' });
    expect(editorSpies.destroy).toHaveBeenCalledWith();
    expect(editorSpies.constructOpts).toStrictEqual(
      expect.objectContaining({
        locale: 'ru',
        plugins: [expect.objectContaining({ name: 'default' })],
      })
    );
  });
});
