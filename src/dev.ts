import { EditorCore } from '@/index';
import { TextStylingPlugin } from '../packages/textStylingButton/src';
import { TableButtonPlugin } from '../packages/tableButton/src';
import { UndoRedoButtonPlugin } from '../packages/undoRedoButton/src';
import { ListButtonPlugin } from '../packages/listButton/src';
import { AlignButtonPlugin } from '../packages/alignButton/src';
import { SpacerButtonPlugin } from '../packages/spacerButton/src';
import { TextDecorationButtonPlugin } from '../packages/textDecorationButton/src';
import { LinkAndVideoPlugin } from '../packages/linkAndVideoButton/src';
import { TemplateButtonPlugin } from '../packages/templateButton/src';
import { BlockButtonPlugin } from '../packages/blockButton/src';
import { ImageButtonPlugin } from "@root/packages/imageButton/src";
import { CodeEditorPlugin } from "@root/packages/codeEditorButton/src";
import { PreviewPlugin } from "@root/packages/previewButton/src";

document.addEventListener('DOMContentLoaded', () => {
  const appElement = document.getElementById('app');
  if (appElement) {
    const editor = new EditorCore(appElement);
    editor.registerModule(new UndoRedoButtonPlugin);
    editor.registerModule(new BlockButtonPlugin);
    editor.registerModule(new SpacerButtonPlugin);
    editor.registerModule(new TextDecorationButtonPlugin);
    editor.registerModule(new AlignButtonPlugin);
    editor.registerModule(new TextStylingPlugin);
    editor.registerModule(new TableButtonPlugin);
    editor.registerModule(new ListButtonPlugin);
    editor.registerModule(new ImageButtonPlugin);
    editor.registerModule(new SpacerButtonPlugin);
    editor.registerModule(new LinkAndVideoPlugin);
    editor.registerModule(new SpacerButtonPlugin);
    editor.registerModule(new CodeEditorPlugin);
    editor.registerModule(new PreviewPlugin);
    editor.registerModule(new TemplateButtonPlugin({
      test: 'sssssss ssss ssss',
      html: '<table class="on-codemerge-table"><thead><tr><th>Header 1</th><th>Header 2</th><th>Header 3</th></tr></thead><tbody><tr><td style="position: relative;">Row 1 Col 1<div class="on-codemerge-resizer"></div></td><td style="position: relative;">Row 1 Col 2<div class="on-codemerge-resizer"></div></td><td style="position: relative;">Row 1 Col 3<div class="on-codemerge-resizer"></div></td></tr><tr><td style="position: relative;">Row 2 Col 1<div class="on-codemerge-resizer"></div></td><td style="position: relative;">Row 2 Col 2<div class="on-codemerge-resizer"></div></td><td style="position: relative;">Row 2 Col 3<div class="on-codemerge-resizer"></div></td></tr><tr><td style="position: relative;">Row 3 Col 1<div class="on-codemerge-resizer"></div></td><td style="position: relative;">Row 3 Col 2<div class="on-codemerge-resizer"></div></td><td style="position: relative;">Row 3 Col 3<div class="on-codemerge-resizer"></div></td></tr></tbody></table>',
    }));

    editor.subscribeToContentChange((newContent: string) => {

      const resultElement = document.getElementById('result');
      if (resultElement) resultElement.innerText = newContent;
      // console.log(newContent)

      const previewElement = document.getElementById('preview');
      if (previewElement) previewElement.innerHTML = newContent;
    });

    // editor.setContent("\n" +
    //     "<table class=\"on-codemerge-table\"><thead><tr><th>Header 1</th><th>Header 2</th><th>Header 3</th></tr></thead><tbody><tr><td style=\"position: relative;\">Row 1 Col 1<div class=\"on-codemerge-resizer\"></div></td><td style=\"position: relative;\">Row 1 Col 2<div class=\"on-codemerge-resizer\"></div></td><td style=\"position: relative;\">Row 1 Col 3<div class=\"on-codemerge-resizer\"></div></td></tr><tr><td style=\"position: relative;\">Row 2 Col 1<div class=\"on-codemerge-resizer\"></div></td><td style=\"position: relative;\">Row 2 Col 2<div class=\"on-codemerge-resizer\"></div></td><td style=\"position: relative;\">Row 2 Col 3<div class=\"on-codemerge-resizer\"></div></td></tr><tr><td style=\"position: relative;\">Row 3 Col 1<div class=\"on-codemerge-resizer\"></div></td><td style=\"position: relative;\">Row 3 Col 2<div class=\"on-codemerge-resizer\"></div></td><td style=\"position: relative;\">Row 3 Col 3<div class=\"on-codemerge-resizer\"></div></td></tr></tbody></table>")
  }
});
