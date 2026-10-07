/**
 * Nuxt: wrap in `<ClientOnly>`. Re-exports the Vue adapter.
 */
export { CodeMergeEditor, default } from '@codemerge/integrate/vue';

export function clientOnlyHint(): string {
  return 'Wrap CodeMergeEditor in <ClientOnly> (Nuxt) so SSR never mounts the editor.';
}
