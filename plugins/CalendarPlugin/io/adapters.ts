import type { DocNode } from '@codemerge/kernel';
import { nextId } from '@codemerge/kernel';
import type { CalendarDoc } from '../types';
import { isCalendarDoc } from '../types';
import { coerceCalendarDoc, emptyCalendarDoc } from '../drivers/defaults';

export function toEditorDoc(calendar: DocNode): DocNode {
  if (calendar.type !== 'calendar') {
    throw new TypeError('toEditorDoc expects type "calendar"');
  }
  return {
    type: 'doc',
    id: nextId('doc'),
    content: [calendar],
  };
}

export function isCalendarEditorDoc(doc: DocNode): boolean {
  return (
    doc.type === 'doc' && (doc.content?.length ?? 0) === 1 && doc.content![0]?.type === 'calendar'
  );
}

export function resolveCalendarNode(doc: DocNode): DocNode {
  if (doc.type === 'calendar') {
    return doc;
  }
  if (doc.type === 'doc') {
    const child = doc.content?.[0];
    if (child?.type === 'calendar') {
      return child;
    }
  }
  throw new TypeError('Expected doc→calendar SoT');
}

export function payloadFromDoc(doc: DocNode): CalendarDoc {
  const node = resolveCalendarNode(doc);
  const payload = node.attrs?.payload;
  if (isCalendarDoc(payload)) {
    return payload;
  }
  return coerceCalendarDoc(payload);
}

export function emptyEditorDoc(payload?: CalendarDoc): DocNode {
  const doc = payload ?? emptyCalendarDoc();
  return toEditorDoc({
    type: 'calendar',
    id: nextId('calendar'),
    attrs: {
      title: doc.title,
      payload: doc,
      align: '',
    },
  });
}

export function docFromPayload(payload: CalendarDoc): DocNode {
  return emptyEditorDoc(payload);
}
