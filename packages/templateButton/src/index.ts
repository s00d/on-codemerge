import type { EditorCore } from "@/index";
import { DropdownMenu } from "../../../helpers/dropdownMenu";
import { layers } from "../../../src/icons";
import type { IEditorModule } from "@/types";

export class TemplateButton implements IEditorModule {
  private core: EditorCore | null = null;
  private readonly templates: {[key: string]: string};
  private dropdown: DropdownMenu | null = null;

  constructor(templates: {[key: string]: string}) {
    this.templates = templates;
  }

  initialize(core: EditorCore): void {
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

  }
}

export default TemplateButton;
