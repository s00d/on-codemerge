import { describe, expect, it } from 'vitest';
import type { EditorAPI } from '@codemerge/sdk';
import { TimerManager } from '../services/TimerManager';
import { localDateInputValue } from '../components/TimerForm';

const editorStub = { t: (k: string) => k, getLocale: () => 'en' } as unknown as EditorAPI;

describe('TimerManager', () => {
  it('export → import keeps a real Date target', () => {
    const manager = new TimerManager(editorStub);
    const target = new Date(Date.now() + 3_600_000);
    const created = manager.createTimer({ title: 'T', targetDate: target, targetTime: '12:00' });
    const imported = manager.importTimer(manager.exportTimer(created.id));
    expect(imported.targetDate).toBeInstanceOf(Date);
    expect(imported.targetDate.getTime()).toBe(target.getTime());
    expect(manager.getTimeLeft(imported).isExpired).toBe(false);
  });

  it('edit form date uses the local calendar day', () => {
    expect(localDateInputValue(new Date(2026, 0, 2, 0, 30))).toBe('2026-01-02');
  });
});
