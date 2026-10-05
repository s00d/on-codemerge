import { atomAlignStyle } from './atomAlign';

/** Float / margin align for media atoms (video, youtube, pdf). */
export function mediaFloatAlign(align: string): Record<string, string> {
  if (align === 'left') {
    return { float: 'left', marginRight: '1rem' };
  }
  if (align === 'right') {
    return { float: 'right', marginLeft: '1rem' };
  }
  if (align === 'center' || align === 'justify') {
    return atomAlignStyle('center');
  }
  return {};
}
