// Copies CHANGELOG.md from the repository root into content/ (gitignored), adds frontmatter
// and points links to other repository files at GitHub.
import { readFileSync, writeFileSync } from 'node:fs';

const root = new URL('../../', import.meta.url);
const content = new URL('../content/', import.meta.url);
const repo = 'https://github.com/s00d/on-codemerge/blob/main/';

let body = readFileSync(new URL('CHANGELOG.md', root), 'utf8');
// The page title comes from frontmatter; drop the file's own `# Heading`.
body = body.replace(/^# .*\n/, '');
body = body.replace(/\]\((?!https?:|#|\/)([^)]+)\)/g, (_, target) => `](${repo}${target})`);
const fm = [
  'title: "Changelog"',
  'description: "All notable changes to on-codemerge and the @codemerge/* packages."',
].join('\n');
writeFileSync(
  new URL('9.changelog.md', content),
  `---\n${fm}\n---\n\n<!-- Generated from CHANGELOG.md by docs/scripts/sync.mjs. Edit the original. -->\n\n${body}`
);
console.log('synced CHANGELOG.md -> docs/content/9.changelog.md');
