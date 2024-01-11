import { DropdownMenu } from "../../../helpers/dropdownMenu";
import { layers } from "../../../src/icons";
import type { IEditorModule, Observer, EditorCoreInterface } from "../../../src/types";

export class TemplateButton implements IEditorModule, Observer {
  private core: EditorCoreInterface | null = null;
  private readonly templates: {[key: string]: string};
  private dropdown: DropdownMenu | null = null;

  constructor(templates: {[key: string]: string}) {
    this.templates = templates;
  }

  initialize(core: EditorCoreInterface): void {
    this.dropdown = new DropdownMenu(core, layers, 'Template')
    this.core = core;

    for (const i in this.templates) {
      this.dropdown.addItem(i, () => {
        this.core?.insertHTMLIntoEditor(core.contentCleanup(this.templates[i]));
        this.core?.moveCursorToStart();
      })
    }
    const toolbar = this.core?.toolbar.getToolbarElement();
    toolbar?.appendChild(this.dropdown.getButton());

    core.i18n.addObserver(this);
  }

  update(): void {
    this.dropdown?.setTitle(this.core!.i18n.translate('Template'))
  }

  destroy(): void {
    // Remove any event listeners or perform other cleanup as needed
    if (this.dropdown) {
      this.dropdown.destroy();
      this.dropdown = null;
    }
  }
}

export default TemplateButton;
