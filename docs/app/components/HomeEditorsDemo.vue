<script setup lang="ts">
import type { TabsItem } from '@nuxt/ui';
import EditorComponent from './content/EditorComponent.vue';
import JsonEditorComponent from './content/JsonEditorComponent.vue';
import MarkdownEditorComponent from './content/MarkdownEditorComponent.vue';
import CodeEditorComponent from './content/CodeEditorComponent.vue';
import FormsEditorComponent from './content/FormsEditorComponent.vue';
import ChartsEditorComponent from './content/ChartsEditorComponent.vue';
import CalendarEditorComponent from './content/CalendarEditorComponent.vue';
import TablesEditorComponent from './content/TablesEditorComponent.vue';

const tabs: TabsItem[] = [
  { value: 'wysiwyg', label: 'WYSIWYG', icon: 'i-lucide-pilcrow' },
  { value: 'wysiwyg-page', label: 'Page', icon: 'i-lucide-file-text' },
  { value: 'json', label: 'JSON', icon: 'i-lucide-braces' },
  { value: 'markdown', label: 'Markdown', icon: 'i-lucide-hash' },
  { value: 'code', label: 'Code', icon: 'i-lucide-code' },
  { value: 'forms', label: 'Forms', icon: 'i-lucide-text-cursor-input' },
  { value: 'charts', label: 'Charts', icon: 'i-lucide-chart-column' },
  { value: 'calendar', label: 'Calendar', icon: 'i-lucide-calendar' },
  { value: 'tables', label: 'Tables', icon: 'i-lucide-sheet' },
];
const TAB_IDS = new Set(tabs.map((t) => String(t.value)));

/** Parse `#charts` / `#wysiwyg-page` (also `#demo-charts`, legacy `#wysiwyg/page`). */
function parseDemoHash(hash: string): string {
  let raw = hash.replace(/^#/, '').trim().toLowerCase();
  if (raw.startsWith('demo-') || raw.startsWith('demo=')) {
    raw = raw.slice(5);
  }
  if (raw === 'wysiwyg/page') {
    raw = 'wysiwyg-page';
  }
  return TAB_IDS.has(raw) ? raw : 'wysiwyg';
}

const active = ref('wysiwyg');
const ready = ref(false);

const syncFromHash = (): void => {
  active.value = parseDemoHash(location.hash);
};

watch(active, (id) => {
  const next = `#${id}`;
  if (ready.value && location.hash !== next) {
    history.replaceState(history.state, '', `${location.pathname}${location.search}${next}`);
  }
});

onMounted(() => {
  syncFromHash();
  ready.value = true;
  window.addEventListener('hashchange', syncFromHash);
});
onBeforeUnmount(() => {
  window.removeEventListener('hashchange', syncFromHash);
});
</script>

<template>
  <div class="flex min-w-0 flex-col gap-3">
    <UTabs v-model="active" :items="tabs" :content="false" variant="pill" class="w-full" />

    <div class="min-h-48 min-w-0">
      <template v-if="ready">
        <EditorComponent
          v-if="active === 'wysiwyg' || active === 'wysiwyg-page'"
          :key="active"
          :chrome="active === 'wysiwyg-page' ? 'page' : 'bar'"
        />
        <JsonEditorComponent v-else-if="active === 'json'" key="json" />
        <MarkdownEditorComponent v-else-if="active === 'markdown'" key="markdown" />
        <CodeEditorComponent v-else-if="active === 'code'" key="code" />
        <FormsEditorComponent v-else-if="active === 'forms'" key="forms" />
        <ChartsEditorComponent v-else-if="active === 'charts'" key="charts" />
        <CalendarEditorComponent v-else-if="active === 'calendar'" key="calendar" />
        <TablesEditorComponent v-else-if="active === 'tables'" key="tables" />
      </template>
    </div>

    <p class="text-sm text-muted">
      Product details and launch snippets:
      <ULink to="/getting-started/editors" class="text-primary">Editors</ULink>
    </p>
  </div>
</template>
