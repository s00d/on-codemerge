import type { EditorCore, IEditorModule } from "@/index";
import { DropdownMenu } from "@root/helpers/dropdownMenu";
import feather from "feather-icons";

export class TemplateButton implements IEditorModule {
  private core: EditorCore | null = null;
  private readonly templates: {[key: string]: string};
  private dropdown: DropdownMenu | null = null;

  constructor(templates: {[key: string]: string}) {
    this.templates = templates;
  }

  initialize(core: EditorCore): void {
    const icon = feather.icons.layers.toSvg({  width: '16px', height: '16px', class: 'on-codemerge-icon', 'stroke-width': 3 });
    this.dropdown = new DropdownMenu(core, icon, 'Template')
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
