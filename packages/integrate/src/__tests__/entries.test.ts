import { beforeEach, describe, expect, it, vi } from 'vitest';
import { editorSpies, mockOnCodemergeModule } from './helpers/editorSpies';

vi.mock('on-codemerge', () => mockOnCodemergeModule());

describe('entries', () => {
  beforeEach(() => {
    editorSpies.reset();
  });

  it('index exports host API', async () => {
    const mod = await import('../index');
    const host = mod.createEditorHost(document.createElement('div'), { value: '<p>i</p>' });
    expect(editorSpies.setHTML).toHaveBeenCalledWith('<p>i</p>');
    host.destroy();
  });

  it('protocol / element / styles load', async () => {
    const protocol = await import('../protocol');
    const element = await import('../element');
    await import('../styles');
    expect(typeof protocol.bindPersistence).toBe('function');
    expect(typeof element.defineOcmEditor).toBe('function');
  });
});
