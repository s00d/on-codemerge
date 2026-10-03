import type { SequenceIR, SequenceMessage, SequenceNote } from '../types';

export function seqMessages(ir: SequenceIR): SequenceMessage[] {
  const out: SequenceMessage[] = [];
  for (const item of ir.items) {
    if (item.kind === 'message') {
      out.push(item);
    }
  }
  return out;
}

export function seqNotes(ir: SequenceIR): SequenceNote[] {
  const out: SequenceNote[] = [];
  for (const item of ir.items) {
    if (item.kind === 'note') {
      out.push(item);
    }
  }
  return out;
}
