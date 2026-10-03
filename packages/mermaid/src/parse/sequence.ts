import { eqIgnoreCase, restTrim, skipWs, startsWithWord, takeArrow, takeId } from '../scan';
import type {
  ParseDiagnostic,
  SequenceArrow,
  SequenceIR,
  SequenceItem,
  SequenceParticipant,
} from '../types';
import { normalizeLabel } from './label';

function arrowFromToken(token: string): SequenceArrow {
  switch (token) {
    case '->>':
      return 'solid-arrow';
    case '-->>':
      return 'dotted-arrow';
    case '->':
      return 'solid-open';
    case '-->':
      return 'dotted-open';
    case '-x':
      return 'solid-cross';
    case '--x':
      return 'dotted-cross';
    case '-)':
      return 'solid-open';
    case '--)':
      return 'dotted-open';
    default:
      return token.includes('--') || token.includes('.') ? 'dotted-arrow' : 'solid-arrow';
  }
}

function isDashed(arrow: SequenceArrow): boolean {
  return arrow.startsWith('dotted');
}

/** Participant ref: optional `()` activation wrapper around id (`()John` / `John()`). */
function takeParticipantRef(s: string, i: number): { value: string; next: number } | null {
  i = skipWs(s, i);
  if (s.startsWith('()', i)) {
    i += 2;
  }
  const id = takeId(s, i);
  if (id === null) {
    return null;
  }
  let next = skipWs(s, id.next);
  if (s.startsWith('()', next)) {
    next += 2;
  }
  return { value: id.value, next };
}

export function parseSequence(source: string): { ir: SequenceIR; diagnostics: ParseDiagnostic[] } {
  const diagnostics: ParseDiagnostic[] = [];
  const participants = new Map<string, SequenceParticipant>();
  const items: SequenceItem[] = [];

  const ensure = (id: string, label = id): void => {
    if (!participants.has(id)) {
      participants.set(id, { id, label });
    }
  };

  for (const raw of source.split('\n')) {
    const line = raw.trim();
    if (line === '' || line.startsWith('%%') || eqIgnoreCase(line, 'sequenceDiagram')) {
      continue;
    }

    // create participant X / create actor X as Y
    if (startsWithWord(line, 'create')) {
      let i = skipWs(line, 'create'.length);
      if (startsWithWord(line.slice(i), 'participant') || startsWithWord(line.slice(i), 'actor')) {
        const keyword = startsWithWord(line.slice(i), 'participant') ? 'participant' : 'actor';
        i = skipWs(line, i + keyword.length);
        const idTok = takeId(line, i);
        if (idTok === null) {
          diagnostics.push({ severity: 'warning', message: `Skipping unrecognized line: ${line}` });
          continue;
        }
        i = skipWs(line, idTok.next);
        let label = idTok.value;
        if (startsWithWord(line.slice(i), 'as')) {
          label = restTrim(line, i + 2).trim();
        }
        ensure(idTok.value, label);
        continue;
      }
      diagnostics.push({ severity: 'warning', message: `Unsupported sequence syntax: ${line}` });
      continue;
    }

    if (startsWithWord(line, 'participant') || startsWithWord(line, 'actor')) {
      const keyword = startsWithWord(line, 'participant') ? 'participant' : 'actor';
      let i = keyword.length;
      const idTok = takeId(line, i);
      if (idTok === null) {
        diagnostics.push({ severity: 'warning', message: `Skipping unrecognized line: ${line}` });
        continue;
      }
      i = skipWs(line, idTok.next);
      let label = idTok.value;
      if (startsWithWord(line.slice(i), 'as')) {
        label = restTrim(line, i + 2).trim();
      }
      ensure(idTok.value, label);
      continue;
    }

    // Block / control syntax — warn, don't crash (messages inside still parse on their lines).
    if (
      startsWithWord(line, 'alt') ||
      startsWithWord(line, 'else') ||
      startsWithWord(line, 'option') ||
      startsWithWord(line, 'loop') ||
      startsWithWord(line, 'opt') ||
      startsWithWord(line, 'par') ||
      startsWithWord(line, 'and') ||
      startsWithWord(line, 'critical') ||
      startsWithWord(line, 'break') ||
      startsWithWord(line, 'rect') ||
      startsWithWord(line, 'box') ||
      startsWithWord(line, 'destroy') ||
      startsWithWord(line, 'link') ||
      startsWithWord(line, 'links') ||
      eqIgnoreCase(line, 'end') ||
      startsWithWord(line, 'autonumber') ||
      startsWithWord(line, 'activate') ||
      startsWithWord(line, 'deactivate')
    ) {
      diagnostics.push({ severity: 'warning', message: `Unsupported sequence syntax: ${line}` });
      continue;
    }

    if (startsWithWord(line, 'Note')) {
      const lower = line.toLowerCase();
      // Note over A[,B]: text — accept as right note on first participant.
      if (lower.includes(' over ')) {
        const overIdx = lower.indexOf(' over ');
        let i = skipWs(line, overIdx + ' over '.length);
        const who = takeParticipantRef(line, i);
        if (who === null) {
          diagnostics.push({
            severity: 'warning',
            message: `Unsupported sequence syntax: ${line}`,
          });
          continue;
        }
        i = who.next;
        // skip optional ,Other
        i = skipWs(line, i);
        if (line[i] === ',') {
          const other = takeParticipantRef(line, i + 1);
          if (other !== null) {
            i = other.next;
            ensure(other.value);
          }
        }
        i = skipWs(line, i);
        if (line[i] !== ':') {
          diagnostics.push({
            severity: 'warning',
            message: `Unsupported sequence syntax: ${line}`,
          });
          continue;
        }
        const label = normalizeLabel(restTrim(line, i + 1).trim());
        ensure(who.value);
        items.push({ kind: 'note', participant: who.value, label, side: 'right' });
        continue;
      }
      let side: 'left' | 'right' = 'left';
      let i = 4;
      i = skipWs(line, i);
      if (lower.startsWith('right', i)) {
        side = 'right';
        i += 5;
      } else if (lower.startsWith('left', i)) {
        side = 'left';
        i += 4;
      }
      i = skipWs(line, i);
      if (lower.startsWith('of', i)) {
        i += 2;
      }
      const who = takeId(line, i);
      if (who === null) {
        diagnostics.push({ severity: 'warning', message: `Skipping unrecognized line: ${line}` });
        continue;
      }
      let j = skipWs(line, who.next);
      if (line[j] !== ':') {
        diagnostics.push({ severity: 'warning', message: `Skipping unrecognized line: ${line}` });
        continue;
      }
      const label = normalizeLabel(restTrim(line, j + 1).trim());
      ensure(who.value);
      items.push({ kind: 'note', participant: who.value, label, side });
      continue;
    }

    const from = takeParticipantRef(line, 0);
    if (from === null) {
      diagnostics.push({ severity: 'warning', message: `Skipping unrecognized line: ${line}` });
      continue;
    }
    const arrowTok = takeArrow(line, from.next);
    if (arrowTok === null) {
      diagnostics.push({ severity: 'warning', message: `Skipping unrecognized line: ${line}` });
      continue;
    }
    // Mermaid activate/deactivate shorthand: Alice->>+Bob / Bob-->>-Alice (ignore, keep message).
    let afterArrow = skipWs(line, arrowTok.next);
    if (line[afterArrow] === '+' || line[afterArrow] === '-') {
      afterArrow += 1;
    }
    const to = takeParticipantRef(line, afterArrow);
    if (to === null) {
      diagnostics.push({ severity: 'warning', message: `Skipping unrecognized line: ${line}` });
      continue;
    }
    let i = skipWs(line, to.next);
    if (line[i] !== ':') {
      diagnostics.push({ severity: 'warning', message: `Skipping unrecognized line: ${line}` });
      continue;
    }
    const label = normalizeLabel(restTrim(line, i + 1).trim());
    ensure(from.value);
    ensure(to.value);
    const arrow = arrowFromToken(arrowTok.value);
    items.push({
      kind: 'message',
      from: from.value,
      to: to.value,
      label,
      arrow,
      dashed: isDashed(arrow),
    });
  }

  return {
    ir: {
      type: 'sequence',
      participants: [...participants.values()],
      items,
    },
    diagnostics,
  };
}
