import { Editor, createDefaultPlugins } from './app';

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

  editor.setText(`{
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
}`);

  Object.assign(globalThis, { editor });
});
