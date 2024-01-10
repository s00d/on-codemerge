import type { EditorCore } from "@/index";
import { Modal } from "../../../helpers/modal";

import { link, video } from "../../../src/icons";
import type { IEditorModule } from "@/types";

export class LinkAndVideo implements IEditorModule {
  private links: Map<string, HTMLElement>  = new Map();
  private core: EditorCore | undefined;
  private modal: Modal | undefined;


  initialize(core: EditorCore): void {
    this.core = core;
    this.modal = new Modal(core);
    core.toolbar.addButtonIcon('Link', link, () => this.insertLink(core));
    core.toolbar.addButtonIcon('Video', video, () => this.insertVideo(core));

    core.subscribeToContentChange(() => {
      const editor = core.editor.getEditorElement();
      if (!editor) return;

      editor.querySelectorAll('a, iframe').forEach((element: any) => {
        const isUrl = element.tagName === 'A';

        let blockId = element.id;

        if (!blockId || blockId === '' || !blockId.startsWith('link-')) {
          element.id = blockId = 'link-' + Math.random().toString(36).substring(2, 11)
        }

        if (!this.links.has(blockId)) {
          this.links.set(blockId, element);

          if(isUrl) {
            element.addEventListener('click', () => this.showEditLink(element))
          } else {
            element.addEventListener('click', () => this.showEditVideo(element))
          }
          const editor = core.editor.getEditorElement();
          if(editor) core.setContent(editor.innerHTML)
        }
      });
    });
  }

  private showEditLink(element: any) {
    this.modal?.open([
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
    this.modal?.open([
      { label: "src", value: element.src, type: 'text' },
    ], (data) => {

      console.log("Modal closed with data:", data);

      element.src = data.src;

      const editor = this.core?.editor.getEditorElement();
      if(editor) this.core?.setContent(editor?.innerHTML)
    });
  }

  private insertLink(core: EditorCore): void {
    core.saveCurrentSelection();

    this.modal?.open([
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

    this.modal?.open([
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

      iframe.addEventListener('click', () => {
        this.showEditVideo(iframe)
      })
      core.insertHTMLIntoEditor(iframe);
      this.links.set(iframe.id, iframe);

      const editor = this.core?.editor.getEditorElement();
      if(editor) this.core?.setContent(editor?.innerHTML)
    });
  }
}

export default LinkAndVideo;
