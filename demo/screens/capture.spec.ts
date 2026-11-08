/**
 * README screenshots: every editor, light + dark, from the real stand build.
 * Run: `pnpm screenshots` (writes screens/out/*.png; `screens/to-webp.sh` → ../branding/screenshots).
 */
import { mkdirSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

const OUT = new URL('./out/', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

type Editorish = { setHTML?(html: string): void; setText?(text: string): void };

const WYSIWYG_HTML = `
<h1>Quarterly product review</h1>
<p>One <strong>JSON document</strong>, many surfaces. Marks like <em>italic</em>, <u>underline</u>,
<s>strike</s> and <code>inline code</code> stay structured — HTML and Markdown are only import/export.</p>
<blockquote><p>Plugins register into a core-owned toolbar, menus and popups.</p></blockquote>
<h2>Highlights</h2>
<ul><li>Eight editors on one kernel</li><li>Real-time collaboration with server-side rebase</li><li>Published pages with a tiny runtime</li></ul>
<table class="html-editor-table html-editor-table--sheet"><thead>
<tr><th>Surface</th><th>Import</th><th>Status</th></tr></thead><tbody>
<tr><td>WYSIWYG</td><td>on-codemerge</td><td>stable</td></tr>
<tr><td>Markdown</td><td>on-codemerge/markdown</td><td>stable</td></tr>
<tr><td>Tables</td><td>on-codemerge/tables</td><td>stable</td></tr>
</tbody></table>`;

const MARKDOWN = `# Release notes

Edit on the **left**, preview on the right — callouts, tables and diagrams render live.

:::info Tip
Use **Insert → Callout** or *Turn into* to change the block type.
:::

| Package | Version |
| --- | --- |
| on-codemerge | 2.9 |
| @codemerge/sdk | 2.9 |

\`\`\`mermaid
flowchart LR
  Source --> Kernel --> Preview
\`\`\`
`;

const CODE = `// Structural highlight: comments, strings, numbers, keywords
import { Editor, createDefaultPlugins } from 'on-codemerge';

const host = document.getElementById('editor');
const editor = new Editor(host, { plugins: createDefaultPlugins() });

editor.setHTML('<h1>Hello</h1><p>Edit me.</p>');
console.log(editor.getJSON().content.length, 'blocks');
`;

const JSON_DOC = JSON.stringify(
  {
    name: 'on-codemerge',
    version: '2.9.1',
    editors: ['wysiwyg', 'json', 'markdown', 'code', 'forms', 'charts', 'calendar', 'tables'],
    collaboration: {
      server: '@codemerge/collaboration-server',
      roles: ['read', 'comment', 'write'],
    },
    published: true,
  },
  null,
  2
);

const CHARTS = JSON.stringify({
  chartType: 'bar',
  title: 'Monthly active editors',
  width: 800,
  height: 400,
  showLegend: true,
  showGrid: true,
  mode: 'default',
  orientation: 'vertical',
  xAxisLabel: '',
  yAxisLabel: '',
  align: '',
  data: [
    {
      name: '2025',
      color: '#0ea5e9',
      data: [
        { label: 'Jan', value: 120 },
        { label: 'Feb', value: 140 },
        { label: 'Mar', value: 165 },
        { label: 'Apr', value: 190 },
      ],
    },
    {
      name: '2026',
      color: '#14b8a6',
      data: [
        { label: 'Jan', value: 180 },
        { label: 'Feb', value: 210 },
        { label: 'Mar', value: 260 },
        { label: 'Apr', value: 310 },
      ],
    },
  ],
});

const TABLES = JSON.stringify({
  version: 2,
  columns: [
    { id: 'task', title: 'Task', type: 'text', width: 260 },
    { id: 'owner', title: 'Owner', type: 'text', width: 140 },
    { id: 'points', title: 'Points', type: 'number', width: 100 },
  ],
  rows: [
    { id: 'r1', cells: { task: 'Dark theme audit', owner: 'Design', points: 5 } },
    { id: 'r2', cells: { task: 'Consumer tsc gate', owner: 'Platform', points: 3 } },
    { id: 'r3', cells: { task: 'Nuxt docs site', owner: 'Docs', points: 8 } },
    { id: 'r4', cells: { task: 'Collab reconnect rebase', owner: 'Realtime', points: 13 } },
  ],
});

const SHOTS: { mode: string; payload?: string }[] = [
  { mode: 'wysiwyg', payload: WYSIWYG_HTML },
  { mode: 'markdown', payload: MARKDOWN },
  { mode: 'charts', payload: CHARTS },
  { mode: 'tables', payload: TABLES },
  { mode: 'forms' },
  { mode: 'calendar' },
  { mode: 'json', payload: JSON_DOC },
  { mode: 'code', payload: CODE },
];

async function setTheme(page: Page, dark: boolean): Promise<void> {
  await page.evaluate((on) => {
    document.documentElement.classList.toggle('dark', on);
  }, dark);
  // Chart/mermaid images repaint on the class flip.
  await page.waitForTimeout(400);
}

test.use({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 });

for (const shot of SHOTS) {
  test(`screenshot ${shot.mode}`, async ({ page }) => {
    await page.goto('/');
    await page.getByTestId(`mode-${shot.mode}`).click();
    await expect(page.getByTestId('editor-host').locator(':scope > *').first()).toBeVisible({
      timeout: 15_000,
    });
    if (shot.payload !== undefined) {
      await page.evaluate(
        ({ mode, payload }) => {
          const ed = (globalThis as unknown as { editor: Editorish }).editor;
          if (mode === 'wysiwyg') {
            ed.setHTML?.(payload);
          } else {
            ed.setText?.(payload);
          }
        },
        { mode: shot.mode, payload: shot.payload }
      );
    }
    await page.waitForTimeout(800);
    const host = page.getByTestId('editor-host');
    for (const dark of [false, true]) {
      await setTheme(page, dark);
      await host.screenshot({ path: `${OUT}${shot.mode}-${dark ? 'dark' : 'light'}.png` });
    }
  });
}
