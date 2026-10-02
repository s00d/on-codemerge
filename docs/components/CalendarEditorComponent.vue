<template>
  <div>
    <h1 v-if="showDescription">Calendar Editor</h1>
    <p v-if="showDescription">
      Standalone calendar studio — layers, month/week/day/year/agenda, event inspector. Persist via
      <code>getText</code> / <code>setText</code> (CalendarDoc JSON).
    </p>
    <hr />
    <div ref="editorContainer" class="editorBlock" />
    <hr />
    <div>
      Live preview (atom widget):
      <div ref="previewHost" class="preview" />
    </div>
    <hr />
    <div>
      CalendarDoc JSON (<code>getText()</code>):
      <pre class="result">{{ textContent }}</pre>
    </div>
  </div>
</template>

<script>
import { h, mount } from '@codemerge/sdk';
import {
  Editor,
  createDefaultPlugins,
  coerceCalendarDoc,
  isCalendarDoc,
  renderView,
} from '../../apps/calendar/src/app';

const today = new Date();
const pad = (n) => String(n).padStart(2, '0');
const cursor = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;

const DEMO = `{
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
    }
  ]
}`;

export default {
  beforeUnmount() {
    this.previewMount?.destroy();
    this.editor?.destroy();
  },
  data() {
    return { textContent: '', editor: null, previewMount: null };
  },
  mounted() {
    if (!this.$refs.editorContainer) {
      return;
    }
    const editor = new Editor(this.$refs.editorContainer, {
      chrome: this.chrome,
      plugins: createDefaultPlugins(),
    });
    const sync = () => {
      this.textContent = editor.getText();
      this.previewMount?.destroy();
      this.previewMount = null;
      const host = this.$refs.previewHost;
      if (!(host instanceof HTMLElement)) {
        return;
      }
      try {
        const parsed = JSON.parse(this.textContent || '{}');
        const doc = isCalendarDoc(parsed) ? parsed : coerceCalendarDoc(parsed);
        const viewCtx = {
          i18n: { t: (k) => editor.t(k) || k },
          selectedEventId: null,
          onSelectEvent: () => {},
          onSelectDay: () => {},
          onChangeView: () => {},
        };
        this.previewMount = mount(
          host,
          h(
            'div',
            { class: 'calendar-widget ocm-calendar-atom' },
            h(
              'div',
              { class: 'calendar-header' },
              h('div', { class: 'calendar-title' }, doc.title)
            ),
            h(
              'div',
              { class: 'calendar-body' },
              doc.events.length === 0
                ? h(
                    'div',
                    { class: 'calendar-empty' },
                    editor.t('calendar.noEvents') || 'No events'
                  )
                : renderView(doc, viewCtx)
            )
          )
        );
      } catch {
        host.replaceChildren();
        host.textContent = 'Invalid JSON';
      }
    };
    editor.on('docChanged', sync);
    editor.setText(DEMO);
    sync();
    this.editor = editor;
  },
  props: {
    showDescription: { type: Boolean, default: true },
    chrome: { type: String, default: 'bar' },
  },
};
</script>

<style scoped>
.editorBlock {
  display: flex;
  flex-direction: column;
  height: 560px;
  max-height: 75vh;
  min-height: 400px;
  border: 1px solid var(--color-ocm-border, #ddd);
  border-radius: 8px;
  overflow: hidden;
}
.preview {
  min-height: 200px;
  max-width: 28rem;
  padding: 12px;
  border: 1px solid var(--color-ocm-border, #ddd);
  border-radius: 8px;
  background: var(--color-ocm-surface, #fff);
  overflow: auto;
}
.result {
  max-height: 300px;
  overflow: auto;
  font-size: 12px;
  border: 1px solid var(--color-ocm-border, #ddd);
  padding: 10px;
  white-space: pre-wrap;
}
</style>
