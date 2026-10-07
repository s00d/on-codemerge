/**
 * Next.js helper: load the React adapter only on the client.
 *
 * ```ts
 * import { createCodeMergeEditor } from '@codemerge/integrate/next';
 * const Editor = createCodeMergeEditor(() => import('@codemerge/integrate/react'));
 * ```
 */
export function createCodeMergeEditor(
  loader: () => Promise<{ CodeMergeEditor: unknown }>,
  dynamicFn?: (loader: () => Promise<unknown>, opts: { ssr: false }) => unknown
): unknown {
  if (typeof dynamicFn === 'function') {
    return dynamicFn(
      async () => {
        const mod = await loader();
        return { default: mod.CodeMergeEditor };
      },
      { ssr: false }
    );
  }
  return {
    loader: async () => {
      const mod = await loader();
      return mod.CodeMergeEditor;
    },
    ssr: false as const,
  };
}

export type { ChromeMode, DocFormat, EditorHostHandle, HostOptions } from '@codemerge/integrate';
