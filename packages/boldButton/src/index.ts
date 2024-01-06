// import { EditorCore, IEditorModule } from "../../../src";
//
// export class BoldButtonPlugin implements IEditorModule {
//   initialize(core: EditorCore): void {
//     const createBoldButton = () => {
//       const button = document.createElement('button');
//       button.classList.add('on-codemerge-button');
//       button.textContent = 'Bold';
//       button.addEventListener('click', () => {
//         const selection = window.getSelection();
//         if (selection && selection.rangeCount > 0) {
//           const range = selection.getRangeAt(0);
//           const selectedNode = range.commonAncestorContainer;
//
//           // Проверяем, является ли родительский элемент span с классом 'custom-bold'
//           if (selectedNode.nodeType === 3 && selectedNode.parentNode instanceof HTMLElement && selectedNode.parentNode.classList.contains('bold')) {
//             // Удалить класс 'custom-bold', оставить текст без span
//             const parent = selectedNode.parentNode;
//             if (parent.parentNode) {
//               while (parent.firstChild) {
//                 parent.parentNode.insertBefore(parent.firstChild, parent);
//               }
//               parent.parentNode.removeChild(parent);
//             }
//           } else {
//             // Применить класс 'custom-bold', добавить span
//             const span = document.createElement('span');
//             span.classList.add('bold');
//             span.appendChild(range.extractContents());
//             range.insertNode(span);
//           }
//
//           // Снимаем выделение
//           selection.removeAllRanges();
//         }
//
//         core.appElement.focus();
//       });
//       return button;
//     };
//
//     const buttonForToolbar = createBoldButton();
//     const buttonForPopup = createBoldButton();
//
//     // Получаем панель инструментов и попап
//     const toolbar = core.toolbar.getToolbarElement();
//     const popup = core.popup.getPopupElement();
//
//     // Добавляем кнопку на панель инструментов и в попап
//     if(toolbar) toolbar.appendChild(buttonForToolbar);
//     if(popup) popup.appendChild(buttonForPopup);
//   }
// }
//
// export default BoldButtonPlugin;

import { EditorCore, IEditorModule } from "../../../src";

export class BoldButtonPlugin implements IEditorModule {
  initialize(core: EditorCore): void {
    const createBoldButton = () => {
      const button = document.createElement('button');
      button.classList.add('on-codemerge-button');
      button.textContent = 'Bold';
      button.addEventListener('click', () => {
        const selection = window.getSelection();
        const range = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;

        // Применяем жирное форматирование
        document.execCommand('bold', false);

        // Восстанавливаем выделение и фокус
        if (selection && range) {
          selection!.removeAllRanges();
          selection!.addRange(range);
        }

        // Возвращаем фокус в редактируемый элемент
        core.appElement.focus();

        // Снимаем выделение (жирное форматирование) для последующего текста
        document.execCommand('bold', false);

        core.popup.hidePopup();
      });
      return button;
    };

    const buttonForToolbar = createBoldButton();
    const buttonForPopup = createBoldButton();

    // Получаем панель инструментов и попап
    const toolbar = core.toolbar.getToolbarElement();
    const popup = core.popup.getPopupElement();

    // Добавляем кнопку на панель инструментов и в попап
    if(toolbar) toolbar.appendChild(buttonForToolbar);
    if(popup) popup.appendChild(buttonForPopup);
  }
}

export default BoldButtonPlugin;
