<template>
  <div>
    <h1 v-if="showDescription">Charts Editor</h1>
    <p v-if="showDescription">
      Standalone chart studio — type, options, data table, live preview. Persist via
      <code>getText</code> / <code>setText</code> (chart attrs JSON).
    </p>
    <hr />
    <div ref="editorContainer" class="editorBlock" />
    <hr />
    <div>
      Live preview (rendered chart):
      <div ref="previewHost" class="preview" />
    </div>
    <hr />
    <div>
      Chart JSON (<code>getText()</code>):
      <pre class="result">{{ textContent }}</pre>
    </div>
  </div>
</template>

<script>
import { Editor, createDefaultPlugins, normalizeChartAttrs } from '../../apps/charts/src/app';
import { renderChart } from '@ocm/charts-plugin/drivers/renderChart';
import { optionsFromAttrs } from '@ocm/charts-plugin/utils/options';
import {
  parseChartMode,
  parseChartOrientation,
  parseChartType,
} from '@ocm/charts-plugin/utils/validation';

const DEMO_CHART = `{
  "chartType": "bar",
  "title": "Sales",
  "width": 800,
  "height": 400,
  "showLegend": true,
  "showGrid": true,
  "mode": "default",
  "orientation": "vertical",
  "xAxisLabel": "",
  "yAxisLabel": "",
  "align": "",
  "data": [
    {
      "name": "Series 1",
      "data": [
        { "label": "Jan", "value": 120 },
        { "label": "Feb", "value": 90 },
        { "label": "Mar", "value": 150 }
      ]
    }
  ]
}`;

export default {
  beforeUnmount() {
    this.editor?.destroy();
  },
  data() {
    return { textContent: '', editor: null };
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
      const host = this.$refs.previewHost;
      if (!(host instanceof HTMLElement)) {
        return;
      }
      host.replaceChildren();
      try {
        const attrs = normalizeChartAttrs(JSON.parse(this.textContent || '{}'));
        const img = renderChart(
          parseChartType(attrs.chartType),
          attrs.data,
          optionsFromAttrs({
            ...attrs,
            width: Math.min(attrs.width || 640, 640),
            height: Math.min(attrs.height || 320, 320),
            mode: parseChartMode(attrs.mode),
            orientation: parseChartOrientation(attrs.orientation),
          }),
          editor
        );
        img.style.maxWidth = '100%';
        img.style.height = 'auto';
        host.append(img);
      } catch (err) {
        host.textContent = err instanceof Error ? err.message : 'Invalid chart JSON';
      }
    };
    editor.on('docChanged', sync);
    editor.setText(DEMO_CHART);
    sync();
    this.editor = editor;
  },
  props: {
    showDescription: { default: true, type: Boolean },
    chrome: { default: 'bar', type: String },
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

.editorBlock :deep(.ocm-shell-content),
.editorBlock :deep(.chart-ws-root) {
  flex: 1 1 0;
  min-height: 0;
  overflow: hidden;
}
.preview {
  display: flex;
  min-height: 200px;
  align-items: center;
  justify-content: center;
  padding: 12px;
  border: 1px solid var(--color-ocm-border, #ddd);
  border-radius: 8px;
  background: var(--color-ocm-surface-muted, #f4f4f5);
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
