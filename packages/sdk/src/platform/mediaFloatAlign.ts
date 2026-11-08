import { atomAlignStyle } from './atomAlign';

/**
 * Float / margin align for media atoms (image, video, youtube, pdf).
 * Left/right reset centre's display + opposite margin so in-place patches don't keep stale keys.
 */
export function mediaFloatAlign(align: string): Record<string, string> {
  if (align === 'left') {
    return { float: 'left', marginRight: '1rem', display: '', marginLeft: '' };
  }
  if (align === 'right') {
    return { float: 'right', marginLeft: '1rem', display: '', marginRight: '' };
  }
  if (align === 'center' || align === 'justify') {
    return atomAlignStyle('center');
  }
  return {};
}
