/**
 * Block-level alignment for atom boxes (math, chart, pdf).
 * Same idea as ImagePlugin: margin auto / float on the sized element.
 */
export function atomAlignStyle(align: string): Record<string, string> {
  if (align === 'left') {
    return { marginLeft: '0', marginRight: 'auto', display: 'block', float: '' };
  }
  if (align === 'right') {
    return { marginLeft: 'auto', marginRight: '0', display: 'block', float: '' };
  }
  if (align === 'center' || align === 'justify') {
    return { marginLeft: 'auto', marginRight: 'auto', display: 'block', float: '' };
  }
  return {};
}
