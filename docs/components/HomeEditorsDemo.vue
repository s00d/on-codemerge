<template>
  <div class="home-editors">
    <div class="home-editors__tabs" role="tablist" aria-label="Editor products">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        type="button"
        role="tab"
        class="home-editors__tab"
        :class="{ 'is-active': active === tab.id }"
        :aria-selected="active === tab.id ? 'true' : 'false'"
        @click="selectTab(tab.id)"
      >
        {{ tab.label }}
      </button>
    </div>

    <div class="home-editors__panel">
      <EditorComponent
        v-if="active === 'wysiwyg' || active === 'wysiwyg-page'"
        :key="active"
        :chrome="active === 'wysiwyg-page' ? 'page' : 'bar'"
        :showDescription="false"
        :showResults="false"
      />
      <JsonEditorComponent v-else-if="active === 'json'" :key="'json'" :showDescription="false" />
      <MarkdownEditorComponent
        v-else-if="active === 'markdown'"
        :key="'markdown'"
        :showDescription="false"
      />
      <CodeEditorComponent v-else-if="active === 'code'" :key="'code'" :showDescription="false" />
      <FormsEditorComponent
        v-else-if="active === 'forms'"
        :key="'forms'"
        :showDescription="false"
      />
      <ChartsEditorComponent
        v-else-if="active === 'charts'"
        :key="'charts'"
        :showDescription="false"
      />
      <CalendarEditorComponent
        v-else-if="active === 'calendar'"
        :key="'calendar'"
        :showDescription="false"
      />
      <TablesEditorComponent
        v-else-if="active === 'tables'"
        :key="'tables'"
        :showDescription="false"
      />
    </div>

    <p class="home-editors__hint">
      Product details and launch snippets:
      <a :href="editorsHref">Editors</a>
    </p>
  </div>
</template>

<script>
import { withBase } from 'vitepress';
import EditorComponent from './EditorComponent.vue';
import JsonEditorComponent from './JsonEditorComponent.vue';
import MarkdownEditorComponent from './MarkdownEditorComponent.vue';
import CodeEditorComponent from './CodeEditorComponent.vue';
import FormsEditorComponent from './FormsEditorComponent.vue';
import ChartsEditorComponent from './ChartsEditorComponent.vue';
import CalendarEditorComponent from './CalendarEditorComponent.vue';
import TablesEditorComponent from './TablesEditorComponent.vue';

const tabs = [
  { id: 'wysiwyg', label: 'WYSIWYG' },
  { id: 'wysiwyg-page', label: 'Page' },
  { id: 'json', label: 'JSON' },
  { id: 'markdown', label: 'Markdown' },
  { id: 'code', label: 'Code' },
  { id: 'forms', label: 'Forms' },
  { id: 'charts', label: 'Charts' },
  { id: 'calendar', label: 'Calendar' },
  { id: 'tables', label: 'Tables' },
];

const TAB_IDS = new Set(tabs.map((t) => t.id));

/** Parse `#charts` / `#wysiwyg-page` (also `#demo-charts`, legacy `#wysiwyg/page`). */
function parseDemoHash(hash) {
  let raw = (hash || '').replace(/^#/, '').trim().toLowerCase();
  if (raw.startsWith('demo-')) {
    raw = raw.slice(5);
  } else if (raw.startsWith('demo=')) {
    raw = raw.slice(5);
  }
  if (raw === 'wysiwyg/page') {
    raw = 'wysiwyg-page';
  }
  if (!TAB_IDS.has(raw)) {
    return 'wysiwyg';
  }
  return raw;
}

export default {
  components: {
    EditorComponent,
    JsonEditorComponent,
    MarkdownEditorComponent,
    CodeEditorComponent,
    FormsEditorComponent,
    ChartsEditorComponent,
    CalendarEditorComponent,
    TablesEditorComponent,
  },
  data() {
    return {
      tabs,
      active: parseDemoHash(typeof location !== 'undefined' ? location.hash : ''),
      editorsHref: withBase('/guide/editors'),
    };
  },
  mounted() {
    if (location.hash) {
      this.syncFromHash();
    }
    this.onHashChange = () => {
      this.syncFromHash();
    };
    window.addEventListener('hashchange', this.onHashChange);
  },
  beforeUnmount() {
    window.removeEventListener('hashchange', this.onHashChange);
  },
  methods: {
    syncFromHash() {
      this.active = parseDemoHash(location.hash);
    },
    writeHash() {
      const next = `#${this.active}`;
      if (location.hash !== next) {
        history.replaceState(null, '', `${location.pathname}${location.search}${next}`);
      }
    },
    selectTab(id) {
      if (!TAB_IDS.has(id)) {
        return;
      }
      this.active = id;
      this.writeHash();
    },
  },
};
</script>

<style scoped>
.home-editors {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin: 1.25rem 0 2rem;
}

.home-editors__tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  padding: 0.35rem;
  border: 1px solid var(--vp-c-divider, #e4e4e7);
  border-radius: 0.5rem;
  background: var(--vp-c-bg-soft, #f4f4f5);
}

.home-editors__tab {
  flex: 1 1 auto;
  min-width: 4.5rem;
  padding: 0.4rem 0.65rem;
  border: 0;
  border-radius: 0.35rem;
  background: transparent;
  color: var(--vp-c-text-2, #52525b);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
}

.home-editors__tab.is-active {
  background: var(--vp-c-bg, #fff);
  color: var(--vp-c-text-1, #18181b);
  box-shadow: 0 1px 2px rgb(0 0 0 / 8%);
}

.home-editors__panel {
  min-height: 12rem;
  min-width: 0;
}

.home-editors__hint {
  margin: 0;
  font-size: 0.875rem;
  color: var(--vp-c-text-2, #52525b);
}
</style>
