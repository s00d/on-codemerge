import React, { useEffect, useRef, useState } from 'react';
import EditorCore from '../../../../src/index'; // Путь к вашему EditorCore

import styles from './styles.module.css';

import TextStylingButton from '../../../../packages/textStylingButton/src';
import TableButton from '../../../../packages/tableButton/src';
import UndoRedoButton from '../../../../packages/undoRedoButton/src';
import ListButton from '../../../../packages/listButton/src';
import AlignButton from '../../../../packages/alignButton/src';
import SpacerButton from '../../../../packages/spacerButton/src';
import TextDecorationButton from '../../../../packages/textDecorationButton/src';
import LinkAndVideo from '../../../../packages/linkAndVideoButton/src';
import TemplateButton from '../../../../packages/templateButton/src';
import BlockButton from '../../../../packages/blockButton/src';
import ImageButton from "../../../../packages/imageButton/src";
import CodeEditorButton from "../../../../packages/codeEditorButton/src";
import PreviewButton from "../../../../packages/previewButton/src";
import FullscreenButton from "../../../../packages/fullscreenButton/src";
import PrintButton from "../../../../packages/printButton/src";
import ParagraphButton from "../../../../packages/paragraphButton/src";
import HorizontalLineButton from "../../../../packages/horizontalLineButton/src";
import ClearStylesButton from "../../../../packages/clearStylesButton/src";
import MarkdownImportExportButton from "../../../../packages/markdownImportExportButton/src";
import ResizeEditorButton from "../../../../packages/resizeEditorButton/src";
import WordCountButton from "../../../../packages/wordCountButton/src";

export default function EditorComponent({ activePlugins, language }) {
  const editorContainerRef = useRef(null);
  const [editorContent, setEditorContent] = useState('');
  const [previewContent, setPreviewContent] = useState('');

  const allPlugins = {
    'UndoRedoButton': UndoRedoButton,
    'SpacerButton': SpacerButton,
    'BlockButton': BlockButton,
    'ParagraphButton': ParagraphButton,
    'TextDecorationButton': TextDecorationButton,
    'AlignButton': AlignButton,
    'TextStylingButton': TextStylingButton,
    'TableButton': TableButton,
    'ListButton': ListButton,
    'HorizontalLineButton': HorizontalLineButton,
    'ImageButton': ImageButton,
    'LinkAndVideo': LinkAndVideo,
    'CodeEditorButton': CodeEditorButton,
    'PreviewButton': PreviewButton,
    'TemplateButton': TemplateButton, // Обратите внимание, что для TemplateButton может потребоваться особая обработка из-за его параметров
    'FullscreenButton': FullscreenButton,
    'PrintButton': PrintButton,
    'ClearStylesButton': ClearStylesButton,
    'MarkdownImportExportButton': MarkdownImportExportButton,
    'ResizeEditorButton': ResizeEditorButton,
    'WordCountButton': WordCountButton,
  };


  useEffect(() => {
    if (editorContainerRef.current) {
      const registerPlugin = (Plugin, params = null) => {
        if (Plugin) editor.registerModule(new Plugin(params));
      };
      // Инициализация редактора
      const editor = new EditorCore(editorContainerRef.current);

      if (activePlugins && activePlugins.length > 0) {
        activePlugins.forEach(pluginName => {
          if (pluginName === 'TemplateButton') {
            registerPlugin(allPlugins[pluginName], {
              text: 'sssssss ssss ssss',
              html: 'aaaa bbbb cccc <span id="test" style="font-weight: bold;">dddd</span> eeeee ffffff',
              table: '<table class="on-codemerge-table"><thead><tr><th>Header 1</th><th>Header 2</th><th>Header 3</th></tr></thead><tbody><tr><td style="position: relative;">Row 1 Col 1<div class="on-codemerge-resizer"></div></td><td style="position: relative;">Row 1 Col 2<div class="on-codemerge-resizer"></div></td><td style="position: relative;">Row 1 Col 3<div class="on-codemerge-resizer"></div></td></tr><tr><td style="position: relative;">Row 2 Col 1<div class="on-codemerge-resizer"></div></td><td style="position: relative;">Row 2 Col 2<div class="on-codemerge-resizer"></div></td><td style="position: relative;">Row 2 Col 3<div class="on-codemerge-resizer"></div></td></tr><tr><td style="position: relative;">Row 3 Col 1<div class="on-codemerge-resizer"></div></td><td style="position: relative;">Row 3 Col 2<div class="on-codemerge-resizer"></div></td><td style="position: relative;">Row 3 Col 3<div class="on-codemerge-resizer"></div></td></tr></tbody></table>',
            });
          } else {
            registerPlugin(allPlugins[pluginName]);
          }
        });
      } else {
        // Если не переданы пропсы, регистрируем все плагины
        for (let i in allPlugins) {
          if (i === 'TemplateButton') {
            registerPlugin(allPlugins[i], {
              text: 'sssssss ssss ssss',
              html: 'aaaa bbbb cccc <span id="test" style="font-weight: bold;">dddd</span> eeeee ffffff',
              table: '<table class="on-codemerge-table"><thead><tr><th>Header 1</th><th>Header 2</th><th>Header 3</th></tr></thead><tbody><tr><td style="position: relative;">Row 1 Col 1<div class="on-codemerge-resizer"></div></td><td style="position: relative;">Row 1 Col 2<div class="on-codemerge-resizer"></div></td><td style="position: relative;">Row 1 Col 3<div class="on-codemerge-resizer"></div></td></tr><tr><td style="position: relative;">Row 2 Col 1<div class="on-codemerge-resizer"></div></td><td style="position: relative;">Row 2 Col 2<div class="on-codemerge-resizer"></div></td><td style="position: relative;">Row 2 Col 3<div class="on-codemerge-resizer"></div></td></tr><tr><td style="position: relative;">Row 3 Col 1<div class="on-codemerge-resizer"></div></td><td style="position: relative;">Row 3 Col 2<div class="on-codemerge-resizer"></div></td><td style="position: relative;">Row 3 Col 3<div class="on-codemerge-resizer"></div></td></tr></tbody></table>',
            });
          } else {
            registerPlugin(allPlugins[i])
          }
        }
      }

      if (language) {
        editor.i18n.setCurrentLanguage(language);
      }

      editor.subscribeToContentChange((newContent) => {
        editor.subscribeToContentChange((newContent) => {
          setEditorContent(newContent);
          setPreviewContent(newContent); // Или обработайте контент перед установкой
        });
      });

      return () => {
        // Очистка при размонтировании компонента
        editor.destroy?.();
      };
    }
  }, []);

  return (
    <div>
      <h1>on-CodeMerge</h1>
      <div>A WYSIWYG editor for on-codemerge is a user-friendly interface that allows users to edit and view their code in real time, exactly as it will appear in the final product. This intuitive tool for developers of all skill levels.</div>
      <hr/>
      <div ref={editorContainerRef} className={styles.editorBlock}>
        {/* Редактор будет инициализирован в этом div */}
      </div>
      <hr/>
      <div>
        Result:
        <div id="result">{editorContent}</div>
      </div>
      <hr/>
      <div>
        Preview:
        <div id="preview" dangerouslySetInnerHTML={{__html: previewContent}}/>
      </div>
    </div>
  );
}
