import type { EditorCore, IEditorModule } from "@/index";
import { DropdownMenu } from "@root/helpers/dropdownMenu";

export class TextStylingButton implements IEditorModule {
  private dropdown: DropdownMenu|null = null;

  initialize(core: EditorCore): void {
    this.dropdown = new DropdownMenu(core, 'Text Styling')
    this.createButton(core, 'Bold', 'bold');
    this.createButton(core, 'Italic', 'italic');
    this.createButton(core, 'Underline', 'underline');
    this.createButton(core, 'StrikeThrough', 'strikeThrough');
    this.createButton(core, 'Superscript', 'superscript');
    this.createButton(core, 'Subscript', 'subscript');

    core.popup.addHtmlItem(this.dropdown.getButton());
  }

  private createButton(core: EditorCore, title: string, styleCommand: string): void {
    this.dropdown?.addItem(title, () => {
      core.restoreCurrentSelection();
      const selection = window.getSelection();

      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);

        // Получение самых глубоких узлов в выделении
        let deepestNodes = this.getDeepestNodes(range);

        deepestNodes = deepestNodes.map(node => {
          if (node.nodeType === Node.TEXT_NODE && node.parentNode) {
            const span = document.createElement('span');
            span.classList.add('mod');
            span.textContent = node.nodeValue;
            node.parentNode.replaceChild(span, node);
            return span; // Возвращаем новый span элемент для дальнейшей обработки
          }
          return node;
        });

        deepestNodes.forEach(node => {
          const isAlreadyFormatted = this.isStyleApplied(node as HTMLElement, range, styleCommand)
          if (isAlreadyFormatted) {
            this.removeStyleFromDeepestNodes(node, styleCommand);
          } else {
            this.applyStyleToDeepestNodes(node, styleCommand, true);
          }
        })

        core.appElement.focus();
      }

      core.popup.hide();

      const editor = core.editor.getEditorElement();
      if(editor) core.setContent(editor.innerHTML); // Обновить состояние редактора
    });
  }


  private isStyleApplied(spanElements: HTMLElement, range: Range, styleCommand: string): boolean {
    if (!range.collapsed) {
      if (this.checkStyle(spanElements, styleCommand)) {
        return true;
      }
    }
    return false;
  }

  private getDeepestNodes(range: Range): Node[] {
    const deepestNodes: Node[] = [];
    if (!range.collapsed) {
      const startContainer = range.startContainer;
      const endContainer = range.endContainer;

      // Если начальный и конечный контейнеры совпадают и являются текстовым узлом, добавляем его напрямую
      if (startContainer === endContainer && startContainer.nodeType === Node.TEXT_NODE) {
        const parent = startContainer.parentElement;
        if (parent && parent.nodeType === Node.ELEMENT_NODE && parent.classList.contains('mod')) {
          // Если родитель текстового узла - фрагмент, то добавляем его вместо текстового узла
          deepestNodes.push(parent);
        } else {
          deepestNodes.push(startContainer);
        }
        return deepestNodes;
      }

      const treeWalker = document.createTreeWalker(
        range.commonAncestorContainer,
        NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
        null
      );

      let currentNode = treeWalker.nextNode();
      while (currentNode) {

        if (currentNode.nodeType === Node.TEXT_NODE) {
          if (range.comparePoint(currentNode, range.START_TO_START) >= 0) {
            if (range.comparePoint(currentNode, range.END_TO_END) <= 0) {
              const parent = currentNode.parentElement;
              if (parent && parent.nodeType === Node.ELEMENT_NODE && parent.classList.contains('mod')) {
                // Если родитель текстового узла - фрагмент, то добавляем его вместо текстового узла
                deepestNodes.push(parent);
              } else {
                deepestNodes.push(currentNode);
              }
            }
          }
        }

        currentNode = treeWalker.nextNode();
      }
    }

    return deepestNodes;
  }

  private applyStyleToDeepestNodes(node: Node, styleCommand: string, apply: boolean) {
    const fragment = document.createDocumentFragment();

    if (node.nodeType === Node.TEXT_NODE) {
      const span = document.createElement('span');
      this.setStyle(span, styleCommand, apply);
      fragment.appendChild(span);
      span.appendChild(node);
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as HTMLElement;
      if (this.checkStyle(element, styleCommand) !== apply) {
        this.setStyle(element, styleCommand, apply);
      }
    }

    node?.parentNode?.insertBefore(fragment, node);
  }

  private removeStyleFromDeepestNodes(node: Node, styleCommand: string) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as HTMLElement;
      if (element.tagName === 'SPAN' && this.checkStyle(element, styleCommand)) {
        this.removeStyle(element, styleCommand);

        if (!element.getAttribute('style')) {
          const fragment = document.createDocumentFragment();
          while (element.firstChild) {
            fragment.appendChild(element.firstChild);
          }
          element.parentNode?.replaceChild(fragment, element);
        }
      }
    }
  }


  private setStyle(element: HTMLElement, styleCommand: string, apply: boolean) {
    switch (styleCommand) {
      case 'bold':
        element.style.fontWeight = apply ? 'bold' : 'normal';
        break;
      case 'italic':
        element.style.fontStyle = apply ? 'italic' : 'normal';
        break;
      case 'underline':
        element.style.textDecoration = apply ? 'underline' : 'none';
        break;
      case 'strikeThrough':
        element.style.textDecoration = apply ? 'line-through' : 'none';
        break;
      case 'superscript':
        element.style.verticalAlign = apply ? 'super' : 'baseline';
        break;
      case 'subscript':
        element.style.verticalAlign = apply ? 'sub' : 'baseline';
        break;
      // Добавить другие стили по необходимости
    }
  }

  private checkStyle(element: HTMLElement, styleCommand: string): boolean {
    switch (styleCommand) {
      case 'bold':
        return element.style.fontWeight === 'bold';
      case 'italic':
        return element.style.fontStyle === 'italic';
      case 'underline':
        return element.style.textDecoration.includes('underline');
      case 'strikeThrough':
        return element.style.textDecoration.includes('line-through');
      case 'superscript':
        return element.style.verticalAlign === 'super';
      case 'subscript':
        return element.style.verticalAlign === 'sub';
      // Добавить проверки для других стилей
      default:
        return false;
    }
  }

  private removeStyle(element: HTMLElement, styleCommand: string) {
    switch (styleCommand) {
      case 'bold':
        element.style.fontWeight = '';
        break;
      case 'italic':
        element.style.fontStyle = '';
        break;
      case 'underline':
        element.style.textDecoration = element.style.textDecoration.replace('underline', '').trim();
        break;
      case 'strikeThrough':
        element.style.textDecoration = element.style.textDecoration.replace('line-through', '').trim();
        break;
      case 'superscript':
      case 'subscript':
        element.style.verticalAlign = '';
        break;
      // Удаление других стилей
    }
  }
}

export default TextStylingButton;
