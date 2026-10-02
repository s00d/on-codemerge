import type { CalendarDoc, CalendarEvent, CalendarRRule } from '../types';
import {
  coerceCalendarDoc,
  emptyCalendarDoc,
  emptyEvent,
  emptyLayer,
  newId,
} from '../drivers/defaults';

function foldIcs(line: string): string {
  if (line.length <= 75) {
    return line;
  }
  const parts: string[] = [];
  let rest = line;
  parts.push(rest.slice(0, 75));
  rest = rest.slice(75);
  while (rest.length > 0) {
    parts.push(` ${rest.slice(0, 74)}`);
    rest = rest.slice(74);
  }
  return parts.join('\r\n');
}

function escapeText(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

function unescapeText(s: string): string {
  return s.replace(/\\n/gi, '\n').replace(/\\,/g, ',').replace(/\\;/g, ';').replace(/\\\\/g, '\\');
}

/** `YYYYMMDD` or `YYYYMMDDTHHMMSS` → our start/end form. */
function fromIcsDate(raw: string, allDay: boolean): string {
  const m = /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})Z?)?/.exec(raw);
  if (!m) {
    return raw;
  }
  const date = `${m[1]}-${m[2]}-${m[3]}`;
  if (allDay || !m[4]) {
    return date;
  }
  return `${date}T${m[4]}:${m[5]}`;
}

function toIcsDate(iso: string, allDay: boolean): string {
  const d = iso.slice(0, 10).replaceAll('-', '');
  if (allDay || !iso.includes('T')) {
    return d;
  }
  const t = iso.slice(11, 16).replace(':', '');
  return `${d}T${t}00`;
}

function formatRrule(rule: CalendarRRule): string {
  const parts = [`FREQ=${rule.freq.toUpperCase()}`, `INTERVAL=${rule.interval}`];
  if (rule.until) {
    parts.push(`UNTIL=${toIcsDate(rule.until, true)}`);
  }
  if (rule.count !== undefined) {
    parts.push(`COUNT=${rule.count}`);
  }
  if (rule.byweekday !== undefined && rule.byweekday.length > 0) {
    const map = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'] as const;
    parts.push(`BYDAY=${rule.byweekday.map((i) => map[i] ?? 'MO').join(',')}`);
  }
  return parts.join(';');
}

function parseRrule(raw: string): CalendarRRule | undefined {
  const map: Record<string, string> = {};
  for (const part of raw.split(';')) {
    const [k, v] = part.split('=');
    if (k && v) {
      map[k.toUpperCase()] = v;
    }
  }
  const freq = map.FREQ?.toLowerCase();
  if (freq !== 'daily' && freq !== 'weekly' && freq !== 'monthly' && freq !== 'yearly') {
    return undefined;
  }
  const interval = Number(map.INTERVAL ?? '1') || 1;
  const rule: CalendarRRule = { freq, interval };
  if (map.UNTIL) {
    rule.until = fromIcsDate(map.UNTIL, true);
  }
  if (map.COUNT) {
    rule.count = Number(map.COUNT) || undefined;
  }
  if (map.BYDAY) {
    const dayMap: Record<string, number> = {
      MO: 0,
      TU: 1,
      WE: 2,
      TH: 3,
      FR: 4,
      SA: 5,
      SU: 6,
    };
    rule.byweekday = map.BYDAY.split(',')
      .map((d) => dayMap[d.replace(/^-?\d+/, '')] ?? -1)
      .filter((n) => n >= 0);
  }
  return rule;
}

/** Thin VCALENDAR/VEVENT serializer (subset). */
export function serializeIcs(doc: CalendarDoc): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//on-codemerge//Calendar//EN',
    `X-WR-CALNAME:${escapeText(doc.title)}`,
  ];
  for (const event of doc.events) {
    const vevent = ['BEGIN:VEVENT', `UID:${event.id}`, `SUMMARY:${escapeText(event.title)}`];
    if (event.allDay) {
      vevent.push(
        `DTSTART;VALUE=DATE:${toIcsDate(event.start, true)}`,
        `DTEND;VALUE=DATE:${toIcsDate(event.end, true)}`
      );
    } else {
      vevent.push(
        `DTSTART:${toIcsDate(event.start, false)}`,
        `DTEND:${toIcsDate(event.end, false)}`
      );
    }
    if (event.description) {
      vevent.push(`DESCRIPTION:${escapeText(event.description)}`);
    }
    if (event.location) {
      vevent.push(`LOCATION:${escapeText(event.location)}`);
    }
    if (event.rrule) {
      vevent.push(`RRULE:${formatRrule(event.rrule)}`);
    }
    vevent.push('END:VEVENT');
    lines.push(...vevent);
  }
  lines.push('END:VCALENDAR');
  return `${lines.map(foldIcs).join('\r\n')}\r\n`;
}

/** Thin ICS parser → CalendarDoc (single layer). */
export function parseIcs(text: string): CalendarDoc {
  const unfolded = text.replace(/\r\n[ \t]/g, '').replace(/\n[ \t]/g, '');
  const lines = unfolded.split(/\r?\n/);
  const events: CalendarEvent[] = [];
  let calName = 'Calendar';
  let cur: (Partial<CalendarEvent> & { allDay?: boolean }) | null = null;

  for (const line of lines) {
    const upper = line.toUpperCase();
    if (upper.startsWith('X-WR-CALNAME:')) {
      calName = unescapeText(line.slice(line.indexOf(':') + 1));
      continue;
    }
    if (upper === 'BEGIN:VEVENT') {
      cur = { allDay: false };
      continue;
    }
    if (upper === 'END:VEVENT' && cur) {
      const start = cur.start ?? '';
      const end = cur.end ?? start;
      if (start) {
        events.push(
          emptyEvent('main', {
            id: cur.id ?? newId('evt'),
            title: cur.title ?? 'Event',
            start,
            end,
            allDay: Boolean(cur.allDay),
            description: cur.description,
            location: cur.location,
            rrule: cur.rrule,
          })
        );
      }
      cur = null;
      continue;
    }
    if (!cur) {
      continue;
    }
    const colon = line.indexOf(':');
    if (colon < 0) {
      continue;
    }
    const keyPart = line.slice(0, colon);
    const value = line.slice(colon + 1);
    const key = (keyPart.split(';')[0] ?? '').toUpperCase();
    if (key === 'UID') {
      cur.id = value;
    } else if (key === 'SUMMARY') {
      cur.title = unescapeText(value);
    } else if (key === 'DESCRIPTION') {
      cur.description = unescapeText(value);
    } else if (key === 'LOCATION') {
      cur.location = unescapeText(value);
    } else if (key === 'DTSTART') {
      const allDay = keyPart.includes('VALUE=DATE') || !value.includes('T');
      cur.allDay = allDay;
      cur.start = fromIcsDate(value, allDay);
    } else if (key === 'DTEND') {
      const allDay = keyPart.includes('VALUE=DATE') || !value.includes('T');
      cur.end = fromIcsDate(value, allDay);
    } else if (key === 'RRULE') {
      cur.rrule = parseRrule(value);
    }
  }

  const layer = emptyLayer({ id: 'main', title: calName });
  return emptyCalendarDoc({
    title: calName,
    calendars: [layer],
    events: events.map((e) => ({ ...e, calendarId: layer.id })),
  });
}

export function importCalendarText(text: string): CalendarDoc {
  const trimmed = text.trim();
  if (trimmed.toUpperCase().includes('BEGIN:VCALENDAR')) {
    return parseIcs(trimmed);
  }
  try {
    return coerceCalendarDoc(JSON.parse(trimmed));
  } catch {
    return emptyCalendarDoc();
  }
}
