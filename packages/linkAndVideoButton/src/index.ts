import {EditorCore, IEditorModule} from "@/index";
import {Modal} from "@root/helpers/modal";

export class LinkAndVideoPlugin implements IEditorModule {
  private links: Map<string, HTMLElement>  = new Map();
  private core: EditorCore | undefined;
  private modal: Modal;

  constructor() {
    this.modal = new Modal();
  }

  initialize(core: EditorCore): void {
    this.core = core;
    this.createButton(core, 'Insert Link', () => this.insertLink(core));
    this.createButton(core, 'Insert Video', () => this.insertVideo(core));


    core.subscribeToContentChange((newContent: string) => {
      const editor = core.editor.getEditorElement();
      if (!editor) return;

      editor.querySelectorAll('a, iframe').forEach((element: any) => {
        const url = element.tagName === 'A' ? element.getAttribute('href') : element.getAttribute('src');
        const isUrl = element.tagName === 'A';

        let blockId = element.id;
        if (!blockId || blockId === '' || !blockId.startsWith('block-')) {
          element.id = blockId = 'link-' + Math.random().toString(36).substring(2, 11)
        }

        if (!this.links.has(blockId)) {
          this.links.set(blockId, element);

          if(isUrl) {
            element.addEventListener('click', () => this.showEditLink(element))
          } else {
            element.addEventListener('click', () => this.showEditVideo(element))
          }
        }
      });
    });
  }

  private showEditLink(element: any) {
    this.modal.open([
      { label: "href", value: element.href, type: 'text' },
      { label: "text", value: element.text, type: 'text' },
    ], (data) => {
      console.log("Modal closed with data:", data);


      element.href = data.href;
      element.textContent = data.text || data.url;

      const editor = this.core?.editor.getEditorElement();
      if(editor) this.core?.setContent(editor?.innerHTML)
    });

  }

  private showEditVideo(element: any) {
    this.modal.open([
      { label: "src", value: element.src, type: 'text' },
    ], (data) => {

      console.log("Modal closed with data:", data);

      element.src = data.src;

      const editor = this.core?.editor.getEditorElement();
      if(editor) this.core?.setContent(editor?.innerHTML)
    });
  }

  private createButton(core: EditorCore, title: string, action: () => void): void {
    const button = document.createElement('button');
    button.classList.add('on-codemerge-button');
    button.textContent = title;
    button.addEventListener('click', action);

    const toolbar = core.toolbar.getToolbarElement();
    if (toolbar) toolbar.appendChild(button);
  }

  private insertLink(core: EditorCore): void {
    core.saveCurrentSelection();

    this.modal.open([
      { label: "href", value: '', type: 'text' },
      { label: "text", value: '', type: 'text' },
    ], (data) => {
      console.log("Modal closed with data:", data);

      core.restoreCurrentSelection();
      const link = document.createElement('a');
      link.href = data.href.toString();
      link.target = '_blank';
      link.textContent = (data.text || data.href).toString(); // Используем URL в качестве текста, если текст не задан

      link.addEventListener('click', (e) => {
        this.showEditLink(e.target)
      })
      core.insertHTMLIntoEditor(link);
      this.links.set(link.id, link);

      const editor = this.core?.editor.getEditorElement();
      if(editor) this.core?.setContent(editor?.innerHTML)
    });
  }

  private insertVideo(core: EditorCore): void {
    core.saveCurrentSelection();

    this.modal.open([
      { label: "src", value: '', type: 'text' },
    ], (data) => {
      console.log("Modal closed with data:", data);

      core.restoreCurrentSelection();
      const iframe = document.createElement('iframe');
      iframe.src = data.src.toString();
      iframe.id = 'link-' + Math.random().toString(36).substring(2, 11)
      iframe.frameBorder = '0';
      iframe.allowFullscreen = true;
      iframe.width = '560'; // Установите желаемую ширину
      iframe.height = '315'; // Установите желаемую высоту

      iframe.addEventListener('click', (e) => {
        this.showEditVideo(iframe)
      })
      core.insertHTMLIntoEditor(iframe);
      this.links.set(iframe.id, iframe);

      const editor = this.core?.editor.getEditorElement();
      if(editor) this.core?.setContent(editor?.innerHTML)
    });
  }
}

export default LinkAndVideoPlugin;
