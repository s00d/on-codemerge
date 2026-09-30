import type { Command, DocNode } from '@codemerge/kernel';
import { createParagraph, createText, nextId } from '@codemerge/kernel';
import { asAttr } from '@ocm/wysiwyg/utils/asAttr';

function appendBlock(node: DocNode): Command {
  return (state) => {
    const index = state.doc.content?.length ?? 0;
    return [{ type: 'insert_node', path: [], index, node }];
  };
}

export function insertMdHeading(level: number): Command {
  const lv = Math.min(6, Math.max(1, level));
  return appendBlock({
    type: 'heading',
    id: nextId('h'),
    attrs: { level: lv },
    content: [createText('Heading')],
  });
}

export function insertMdQuote(): Command {
  return appendBlock({
    type: 'blockquote',
    id: nextId('bq'),
    content: [createParagraph([createText('Quote')])],
  });
}

export function insertMdBullet(): Command {
  return appendBlock({
    type: 'bulletList',
    id: nextId('ul'),
    content: [
      {
        type: 'listItem',
        id: nextId('li'),
        content: [createParagraph([createText('Item')])],
      },
    ],
  });
}

export function insertMdCodeBlock(): Command {
  return appendBlock({
    type: 'code_block',
    id: nextId('code'),
    attrs: { language: 'plaintext', code: 'code' },
    content: [],
  });
}

export function insertMdMermaid(source = 'flowchart LR\n  A-->B'): Command {
  return appendBlock({
    type: 'mermaid',
    id: nextId('mmd'),
    attrs: { source },
    content: [],
  });
}

export function insertMdCallout(
  variant: string,
  title = '',
  actions: { label: string; href: string }[] = [{ label: 'Action', href: '#' }]
): Command {
  return appendBlock({
    type: 'callout',
    id: nextId('callout'),
    attrs: {
      variant: variant.toLowerCase(),
      title: title || variant,
      actions,
    },
    content: [createParagraph([createText('Your message here.')])],
  });
}

/** Change variant on the first callout in the doc (toolbar Turn into). */
export function setFirstCalloutVariant(variant: string): Command {
  const next = variant.toLowerCase();
  return (state) => {
    const kids = state.doc.content ?? [];
    for (let i = 0; i < kids.length; i += 1) {
      const node = kids[i];
      if (node?.type !== 'callout') {
        continue;
      }
      const cur = asAttr(node.attrs?.variant).toLowerCase();
      if (cur === next) {
        return [];
      }
      return [
        {
          type: 'set_attrs',
          path: [i],
          attrs: { variant: next },
          replace: false,
        },
      ];
    }
    return null;
  };
}
