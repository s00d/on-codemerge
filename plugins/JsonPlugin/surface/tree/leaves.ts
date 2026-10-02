import type { DocNode } from '@codemerge/kernel';
import { h } from '@codemerge/sdk';
import type { ViewSpec } from '@codemerge/sdk';
import { getDriver, isJsonLeafType } from '../../drivers';
import type { TreeHandlers } from './types';

export function leafValueView(node: DocNode, path: number[], handlers: TreeHandlers): ViewSpec {
  if (!isJsonLeafType(node.type)) {
    return h('span', null, '');
  }
  const view = getDriver(node.type).leafView;
  if (!view) {
    return h('span', null, '');
  }
  return view(node, path, handlers);
}
