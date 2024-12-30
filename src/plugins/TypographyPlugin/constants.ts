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

export const TYPOGRAPHY_STYLES = [
  {
    value: 'h1',
    label: 'Heading 1',
    preview: 'text-3xl font-bold h-12',
    icon: h1Icon,
  },
  {
    value: 'h2',
    label: 'Heading 2',
    preview: 'text-2xl font-bold',
    icon: h2Icon,
  },
  {
    value: 'h3',
    label: 'Heading 3',
    preview: 'text-xl font-bold',
    icon: h3Icon,
  },
  {
    value: 'h4',
    label: 'Heading 4',
    preview: 'text-lg font-bold',
    icon: h4Icon,
  },
  {
    value: 'paragraph',
    label: 'Paragraph',
    preview: 'text-base',
    icon: paragraphIcon,
  },
  {
    value: 'blockquote',
    label: 'Blockquote',
    preview: 'text-lg italic',
    icon: blockquoteIcon,
  },
  {
    value: 'pre',
    label: 'Preformatted',
    preview: 'font-mono text-sm',
    icon: preIcon,
  },
  {
    value: 'hr',
    label: 'Horizontal Line',
    preview: 'text-gray-500',
    icon: hrIcon,
  },
];
