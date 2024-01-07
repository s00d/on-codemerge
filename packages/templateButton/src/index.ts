import { EditorCore, IEditorModule } from "@/index";

export class TemplateButtonPlugin implements IEditorModule {
  private core: EditorCore | null = null;
  private templates: {[key: string]: string};

  constructor(templates: {[key: string]: string}) {
    this.templates = templates;
  }

  initialize(core: EditorCore): void {
    this.core = core;
    this.createTemplateButton(core);
  }

  private createTemplateButton(core: EditorCore): void {
    const button = document.createElement('button');
    button.textContent = 'Choose Template';
    button.classList.add('on-codemerge-button');

    const toolbar = this.core?.toolbar.getToolbarElement();
    toolbar?.appendChild(button);

    const dropdown = this.createDropdown(core);
    toolbar?.appendChild(dropdown); // Добавляем выпадающий список в тулбар, а не в кнопку

    button.addEventListener('click', () => {
      core.saveCurrentSelection();
      const rect = button.getBoundingClientRect();
      dropdown.style.left = `${rect.left}px`;
      dropdown.style.top = `${rect.bottom}px`;
      dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
    });

    // Обработчик клика вне списка и кнопки для его закрытия
    document.addEventListener('click', (event) => {
      if (!button.contains(event.target as Node) && !dropdown.contains(event.target as Node)) {
        dropdown.style.display = 'none';
      }
    });
  }

  private createDropdown(core: EditorCore): HTMLElement {
    const dropdown = document.createElement('div');
    dropdown.classList.add('dropdown-content');
    dropdown.style.position = 'absolute';
    dropdown.style.display = 'none';
    dropdown.style.border = '1px solid #dcdcdc';
    dropdown.style.backgroundColor = '#fff';
    dropdown.style.boxShadow = '0 8px 16px 0 rgba(0,0,0,0.2)';
    dropdown.style.zIndex = '1';
    dropdown.style.maxHeight = '200px';
    dropdown.style.overflowY = 'auto';

    // Добавление элементов шаблонов в выпадающий список
    for (const i in this.templates) {
      const templateOption = document.createElement('div');
      templateOption.style.padding = '10px 16px';
      templateOption.style.cursor = 'pointer';
      templateOption.style.border = '1px solid #dcdcdc';
      templateOption.textContent = i;
      templateOption.addEventListener('click', () => {
        core.insertHTMLIntoEditor(this.templates[i]);
        dropdown.style.display = 'none';
      });
      dropdown.appendChild(templateOption);
    }
    return dropdown;
  }
}

export default TemplateButtonPlugin;
