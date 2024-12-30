// Virtual DOM node representation
export interface VirtualNode {
  type: string;
  props: Record<string, any>;
  children: (VirtualNode | string)[];
}

export function createElement(
  type: string,
  props: Record<string, any> = {},
  ...children: (VirtualNode | string)[]
): VirtualNode {
  return { type, props, children };
}
