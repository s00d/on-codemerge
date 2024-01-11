import type { EditorState } from "./EditorState";
import type { I18n } from "./i18n";
import type Toolbar from "./toolbar";
import type Editor from "./editor";
import type Footer from "./footer";
import type EventManager from "./EventManager";

export type Hook = (data?: string) => void

export interface Languages {
  [key: string]: LanguagePack;
}

export interface LanguagePack {
  [key: string]: string;
}

export interface Observer {
  update: (lang: string, languages: LanguagePack) => void;
}

export interface I18nInterface {
  currentLang: string;

  addObserver(observer: Observer): void;
  notifyObservers(): void;
  loadLanguage(lang: string): Promise<void>;
  setCurrentLanguage(lang: string): Promise<void>;
  merge(newTranslations: LanguagePack): void;
  translate(key: string): string;
}

export interface EditorCoreInterface {
  state: EditorState;
  eventManager: EventManager;
  modules: IEditorModule[];
  appElement: HTMLElement;
  generalElement: HTMLElement;
  i18n: I18n;
  toolbar: Toolbar;
  editor: Editor;
  footer: Footer;
  history: string[];
  currentSelectionRange: Range | null;

  // Method signatures
  saveCurrentSelection(): void;
  getCurrentSelection(): Range | null;
  restoreCurrentSelection(): void;
  moveCursorToStart(): void;
  moveCursorToEnd(): void;
  moveCursorAfterElement(element: HTMLElement | DocumentFragment): void;
  insertHTMLIntoEditor(htmlContent: HTMLElement | DocumentFragment | string): void;
  undo(): void;
  redo(): void;
  isUndo(): boolean;
  isRedo(): boolean;
  registerModule(module: IEditorModule): void;
  getContent(): string;
  setContent(newContent: string): void;
  contentCleanup(newContent: string): string;
  setContentCleanup(newContent: string): void;
  subscribeToContentChange(callback: Hook): void;
  destroy(): void;
}

export interface IEditorModule {
  initialize(core: EditorCoreInterface): void;
  destroy(): void;
  // Другие необходимые методы и свойства
}

export default EditorCoreInterface;
