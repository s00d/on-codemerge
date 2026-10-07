import {
  createEditorHost as createEditorHostImpl,
  mountCodeMergeEditor as mountCodeMergeEditorImpl,
} from '@codemerge/integrate';
import type { ChromeMode, DocFormat, EditorHostHandle, HostOptions } from '@codemerge/integrate';
import '@codemerge/integrate/styles';

export const createEditorHost = createEditorHostImpl;
export const mountCodeMergeEditor = mountCodeMergeEditorImpl;
export type { ChromeMode, DocFormat, EditorHostHandle, HostOptions };
