import {
  h1Icon,
  h2Icon,
  h3Icon,
  h4Icon,
  paragraphIcon,
  blockquoteIcon,
  preIcon,
  hrIcon,
} from '../../icons';

export type TypographyStyle = {
  value: string;
  /** i18n key under typography.* */
  labelKey: string;
  /** Sample text shown in the row (also i18n key) */
  sampleKey: string;
  /** Preview hint class on sample only (not the whole button) */
  sampleClass: string;
  icon: string;
  section: 'heading' | 'body' | 'insert';
};

export const TYPOGRAPHY_STYLES: TypographyStyle[] = [
  {
    value: 'h1',
    labelKey: 'typography.heading1',
    sampleKey: 'typography.sampleHeading1',
    sampleClass: 'typo-sample--h1',
    icon: h1Icon,
    section: 'heading',
  },
  {
    value: 'h2',
    labelKey: 'typography.heading2',
    sampleKey: 'typography.sampleHeading2',
    sampleClass: 'typo-sample--h2',
    icon: h2Icon,
    section: 'heading',
  },
  {
    value: 'h3',
    labelKey: 'typography.heading3',
    sampleKey: 'typography.sampleHeading3',
    sampleClass: 'typo-sample--h3',
    icon: h3Icon,
    section: 'heading',
  },
  {
    value: 'h4',
    labelKey: 'typography.heading4',
    sampleKey: 'typography.sampleHeading4',
    sampleClass: 'typo-sample--h4',
    icon: h4Icon,
    section: 'heading',
  },
  {
    value: 'paragraph',
    labelKey: 'typography.paragraph',
    sampleKey: 'typography.sampleParagraph',
    sampleClass: 'typo-sample--p',
    icon: paragraphIcon,
    section: 'body',
  },
  {
    value: 'blockquote',
    labelKey: 'typography.blockquote',
    sampleKey: 'typography.sampleBlockquote',
    sampleClass: 'typo-sample--quote',
    icon: blockquoteIcon,
    section: 'body',
  },
  {
    value: 'pre',
    labelKey: 'typography.preformatted',
    sampleKey: 'typography.samplePre',
    sampleClass: 'typo-sample--pre',
    icon: preIcon,
    section: 'body',
  },
  {
    value: 'hr',
    labelKey: 'typography.horizontalLine',
    sampleKey: 'typography.sampleHr',
    sampleClass: 'typo-sample--hr',
    icon: hrIcon,
    section: 'insert',
  },
];
