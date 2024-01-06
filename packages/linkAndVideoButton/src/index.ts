import {EditorCore, IEditorModule} from "@/index";

export class LinkAndVideoPlugin implements IEditorModule {
  private links: Map<string, HTMLElement>  = new Map();
  initialize(core: EditorCore): void {
    this.createButton(core, 'Insert Link', () => this.insertLink(core));
    this.createButton(core, 'Insert Video', () => this.insertVideo(core));

    const css = `
.modal {
  position: fixed;
  z-index: 1;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  overflow: auto;
  background-color: rgba(0, 0, 0, 0.4);
  padding-top: 60px;
}
.modal-content {
  background-color: #fefefe;
  margin: 5% auto;
  padding: 20px;
  border: 1px solid #888;
  width: 70%;
}
.close {
  color: #aaa;
  float: right;
  font-size: 28px;
  font-weight: bold;
}
.close:hover,
.close:focus {
  color: black;
  text-decoration: none;
  cursor: pointer;
}
`;

    const styleSheet = document.createElement("style");
    styleSheet.type = "text/css";
    styleSheet.innerText = css;
    document.head.appendChild(styleSheet);

    core.subscribeToContentChange((newContent: string) => {
      const editor = core.editor.getEditorElement();
      if (!editor) return;

      editor.querySelectorAll('a, iframe').forEach((element: any) => {
        const url = element.tagName === 'A' ? element.getAttribute('href') : element.getAttribute('src');
        const isUrl = element.tagName === 'A';

        console.log(url, this.links.has(url))

        // if (!this.links.has(url)) {
        //   this.links.set(element, element);
        //
        //   if(isUrl) {
        //     element.addEventListener('click', () => {
        //       this.createModal((url, text) => {
        //         element.src = url;
        //       }, element.src)
        //     })
        //   } else {
        //     element.addEventListener('click', () => {
        //       this.createModal((url, text) => {
        //         element.href = url;
        //         element.textContent = text || url;
        //       }, element.href, element.textContent?.toString())
        //     })
        //   }
        // }
      });
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
    this.createModal((url, text) => {
      core.restoreCurrentSelection();
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.textContent = text || url; // Используем URL в качестве текста, если текст не задан

      link.addEventListener('click', (e) => {
        this.createModal((url, text) => {
          link.href = url;
          link.textContent = text || url;
          this.links.set(url, link);
        }, link.href, link.textContent?.toString())
      })
      this.insertHTMLIntoEditor(core, link);
      this.links.set(url, link);
    });
  }

  private insertVideo(core: EditorCore): void {
    core.saveCurrentSelection();
    this.createModal((url, text) => {
      core.restoreCurrentSelection();
      const iframe = document.createElement('iframe');
      iframe.src = url;
      iframe.frameBorder = '0';
      iframe.allowFullscreen = true;
      iframe.width = '560'; // Установите желаемую ширину
      iframe.height = '315'; // Установите желаемую высоту

      iframe.addEventListener('click', (e) => {
        this.createModal((url, text) => {
          iframe.src = url;
          this.links.set(url, iframe);
        }, iframe.src)
      })
      this.insertHTMLIntoEditor(core, iframe);
      this.links.set(url, iframe);
    });
  }

  private insertHTMLIntoEditor(core: EditorCore, html: HTMLElement): void {
    const editor = core.editor.getEditorElement();
    const selection = window.getSelection();

    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      let container = range.commonAncestorContainer;

      while (container && container !== editor) {
        if (!container.parentNode) {
          editor?.appendChild(html);
          return;
        }
        container = container.parentNode;
      }

      if (container) {
        range.deleteContents(); // Удаляем текущее содержимое в выделенном диапазоне
        range.insertNode(html); // Вставляем таблицу в выделенный диапазон
      }
      selection.removeAllRanges();
    } else if (editor) {
      // Если нет выделения, вставляем контент в конец редактора
      editor.appendChild(html);
    }

    // Обновляем содержимое редактора
    if (core && editor) core.setContent(editor.innerHTML);
  }

  createModal(callback: (url: string, text: string) => void, url = '', text = '') {
    // Создаем элементы модального окна
    const modal = document.createElement('div');
    modal.className = 'modal';

    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';

    const closeButton = document.createElement('span');
    closeButton.className = 'close';
    closeButton.innerHTML = '&times;';
    closeButton.onclick = () => modal.style.display = 'none';

    const urlInput = document.createElement('input');
    urlInput.id = 'modal-url';
    urlInput.value = url;
    urlInput.placeholder = 'URL';

    const textInput = document.createElement('input');
    textInput.id = 'modal-text';
    textInput.value = text;
    textInput.placeholder = 'Text';

    const submitButton = document.createElement('button');
    submitButton.innerText = 'Insert';
    submitButton.onclick = () => {
      // Логика вставки ссылки/видео
      const url = urlInput.value;
      const text = textInput.value;

      callback(url, text)
      // ... Вставка контента ...
      modal.remove();
    };

    // Добавление элементов в модальное окно
    modalContent.appendChild(closeButton);
    modalContent.appendChild(urlInput);
    modalContent.appendChild(textInput);
    modalContent.appendChild(submitButton);
    modal.appendChild(modalContent);

    // Добавление модального окна в DOM
    document.body.appendChild(modal);

    return modal;
  }
}

export default LinkAndVideoPlugin;
