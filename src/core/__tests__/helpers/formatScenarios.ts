export const INLINE_FORMAT_STYLES = ['bold', 'italic'] as const;
export type InlineFormatStyle = (typeof INLINE_FORMAT_STYLES)[number];

export const STYLE_CLASS_MAP: Record<InlineFormatStyle, string> = {
  bold: 'format-bold',
  italic: 'format-italic',
};

export const BLOCK_ALIGN_STYLES = ['alignCenter', 'alignLeft'] as const;
export type BlockAlignStyle = (typeof BLOCK_ALIGN_STYLES)[number];

export const ALIGN_CLASS_MAP: Record<BlockAlignStyle, string> = {
  alignCenter: 'format-align-center',
  alignLeft: 'format-align-left',
};
