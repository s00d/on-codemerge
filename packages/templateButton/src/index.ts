import { EditorCore, IEditorModule } from "@/index";
import {DropdownMenu} from "@root/helpers/dropdownMenu";

export class TemplateButtonPlugin implements IEditorModule {
  private core: EditorCore | null = null;
  private readonly templates: {[key: string]: string};
  private dropdown: DropdownMenu;

  constructor(templates: {[key: string]: string}) {
    this.templates = templates;
    this.dropdown = new DropdownMenu('Choose Template')
  }

  initialize(core: EditorCore): void {
    this.core = core;

    for (const i in this.templates) {
      this.dropdown.addItem(i, () => {
        this.core?.insertHTMLIntoEditor(this.templates[i]);
        this.core?.moveCursorToStartOfInsertedContent();
      })
    }
    const toolbar = this.core?.toolbar.getToolbarElement();
    toolbar?.appendChild(this.dropdown.getButton());

  }
}

export default TemplateButtonPlugin;
