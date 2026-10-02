import { describe, expect, it } from 'vitest';
import { allJsonLeafTypes, getDriver } from '../drivers';
import { applyTransaction, createState, runCommand } from '@codemerge/kernel';
import { changeType } from '../commands/jsonCommands';
import { docToValue, toEditorDoc, valueToDoc } from '../io';

describe('json drivers.coerce', () => {
  it('fromType × toType always yields a value encodable for target', () => {
    const samples: Record<string, unknown> = {
      jsonString: '12',
      jsonNumber: 7,
      jsonBoolean: true,
      jsonNull: null,
      jsonArray: [1, 'a'],
      jsonObject: { x: 1 },
    };
    for (const from of allJsonLeafTypes()) {
      const source = samples[from];
      for (const to of allJsonLeafTypes()) {
        const coerced = getDriver(to).coerce(source);
        // Round-trip through encode via changeType path semantics
        if (to === 'jsonString') {
          expect(typeof coerced).toBe('string');
        } else if (to === 'jsonNumber') {
          expect(typeof coerced).toBe('number');
          expect(Number.isFinite(coerced as number)).toBe(true);
        } else if (to === 'jsonBoolean') {
          expect(typeof coerced).toBe('boolean');
        } else if (to === 'jsonNull') {
          expect(coerced).toBeNull();
        } else if (to === 'jsonArray') {
          expect(Array.isArray(coerced)).toBe(true);
        } else if (to === 'jsonObject') {
          expect(coerced).not.toBeNull();
          expect(typeof coerced).toBe('object');
          expect(Array.isArray(coerced)).toBe(false);
        }
      }
    }
  });

  it('string "12" → number keeps 12; truthy number → boolean true', () => {
    expect(getDriver('jsonNumber').coerce('12')).toBe(12);
    expect(getDriver('jsonBoolean').coerce(1)).toBe(true);
    expect(getDriver('jsonBoolean').coerce(0)).toBe(false);
    expect(getDriver('jsonString').coerce(42)).toBe('42');
  });

  it('changeType uses coerce (preserves when possible)', () => {
    let state = createState(toEditorDoc(valueToDoc({ n: 1, s: '12' })));
    // property n value path
    const nPath = [0, 0, 0, 0];
    state = applyTransaction(state, runCommand(state, changeType(nPath, 'jsonBoolean'))!).state;
    expect(docToValue(state.doc)).toStrictEqual({ n: true, s: '12' });

    const sPath = [0, 0, 1, 0];
    state = applyTransaction(state, runCommand(state, changeType(sPath, 'jsonNumber'))!).state;
    expect(docToValue(state.doc)).toStrictEqual({ n: true, s: 12 });
  });
});
