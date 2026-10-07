import { createEditorHost as createEditorHostImpl } from '@codemerge/integrate';
import type { ChromeMode, DocFormat, EditorHostHandle, HostOptions } from '@codemerge/integrate';
import '@codemerge/integrate/styles';

export const createEditorHost = createEditorHostImpl;
export type { ChromeMode, DocFormat, EditorHostHandle, HostOptions };
