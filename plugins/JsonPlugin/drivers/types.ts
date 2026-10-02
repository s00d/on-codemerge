import type { DocNode } from '@codemerge/kernel';
import type { ViewSpec } from '@codemerge/sdk';
import type { JsonLeafType } from '../commands/types';
import type { TreeHandlers } from '../surface/tree/types';

export type JsonValueDriver = {
  readonly type: JsonLeafType;
  readonly label: string;
  defaults: () => unknown;
  /** Best-effort convert `from` into a value valid for this type. */
  coerce: (from: unknown) => unknown;
  /** Scalar leaf editor; object/array use branch chrome. */
  leafView: ((node: DocNode, path: number[], handlers: TreeHandlers) => ViewSpec) | null;
};

export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
