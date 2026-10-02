import { Editor, createDefaultPlugins } from './app';

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

document.addEventListener('DOMContentLoaded', () => {
  const appDiv = document.querySelector('#app');
  if (!(appDiv instanceof HTMLElement)) {
    return;
  }

  const editor = new Editor(appDiv, {
    chrome: 'bar',
    history: { maxDepth: 100, mergeWindowMs: 500 },
    plugins: createDefaultPlugins(),
  });

  const today = new Date();
  const cursor = `${today.getFullYear()}-${pad2(today.getMonth() + 1)}-${pad2(today.getDate())}`;

  editor.setText(`{
  "title": "Team calendar",
  "tz": "UTC",
  "view": "month",
  "cursor": "${cursor}",
  "calendars": [
    { "id": "main", "title": "Work", "color": "#3b82f6", "visible": true }
  ],
  "events": [
    {
      "id": "demo-1",
      "calendarId": "main",
      "title": "Standup",
      "start": "${cursor}T09:00",
      "end": "${cursor}T09:30",
      "allDay": false
    },
    {
      "id": "demo-2",
      "calendarId": "main",
      "title": "All-hands",
      "start": "${cursor}",
      "end": "${cursor}",
      "allDay": true
    }
  ]
}`);

  Object.assign(globalThis, { editor });
});
