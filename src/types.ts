import type { EditorCore } from "@/index";

export type Hook = (data?: string) => void

export interface IEditorModule {
  initialize(core: EditorCore): void;
  // Другие необходимые методы и свойства
}
