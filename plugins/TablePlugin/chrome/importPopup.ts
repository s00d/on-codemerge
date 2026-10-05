import type { EditorAPI } from '@codemerge/sdk';
import type { LazyTableConfig } from '../io/fetchMatrix';
import { assertSafeLazyUrl, fetchLazyMatrix } from '../io/fetchMatrix';

/** Shared URL/format import popup for atom lazy + workspace import. */
export function openMatrixImportPopup(
  editor: EditorAPI,
  opts: {
    mode: 'insert' | 'edit' | 'workspace';
    initial?: Partial<LazyTableConfig>;
    onMatrix: (matrix: string[][], hasHeader: boolean, config: LazyTableConfig) => void;
    onInsertShell?: (config: LazyTableConfig) => void;
  }
): void {
  const initial = opts.initial ?? {};
  const title =
    opts.mode === 'insert'
      ? editor.t('table.lazyTable')
      : opts.mode === 'edit'
        ? editor.t('table.editLazy')
        : editor.t('table.importTable');
  editor.ui.popup.open({
    title,
    items: [
      { type: 'url', id: 'url', label: editor.t('common.dataUrl'), value: initial.url ?? '' },
      {
        type: 'list',
        id: 'format',
        label: editor.t('common.format'),
        options: ['json', 'csv'],
        value: initial.format ?? 'json',
      },
      {
        type: 'checkbox',
        id: 'header',
        label: editor.t('table.includeHeaderRow'),
        value: initial.headers !== false,
      },
      {
        type: 'input',
        id: 'delimiter',
        label: editor.t('table.csvDelimiter2'),
        value: initial.delimiter ?? ',',
      },
    ],
    buttons: [
      {
        label: editor.t('common.load'),
        variant: 'primary',
        onClick: (v) => {
          const draft: LazyTableConfig = {
            url: String(v.url ?? '').trim(),
            format: v.format === 'csv' ? 'csv' : 'json',
            headers: Boolean(v.header),
            delimiter: String(v.delimiter ?? ',') || ',',
          };
          if (!draft.url) {
            editor.notify(editor.t('common.dataUrlIsRequired'));
            return true;
          }
          void (async () => {
            try {
              const safe = assertSafeLazyUrl(draft.url);
              const config: LazyTableConfig = { ...draft, url: safe.href };
              if (opts.mode === 'insert' && opts.onInsertShell) {
                opts.onInsertShell(config);
                return;
              }
              const { matrix, hasHeader } = await fetchLazyMatrix(config);
              opts.onMatrix(matrix, hasHeader, config);
              editor.notify(editor.t('table.lazyTableLoaded'));
            } catch (error) {
              const msg = error instanceof Error ? error.message : String(error);
              editor.notify(msg);
            }
          })();
          return true;
        },
      },
    ],
  });
}
