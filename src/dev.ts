import { EditorCore } from '@/index';
import { TextStylingButton } from '../packages/textStylingButton/src';
import { TableButton } from '../packages/tableButton/src';
import { UndoRedoButton } from '../packages/undoRedoButton/src';
import { ListButton } from '../packages/listButton/src';
import { AlignButton } from '../packages/alignButton/src';
import { SpacerButton } from '../packages/spacerButton/src';
import { TextDecorationButton } from '../packages/textDecorationButton/src';
import { LinkAndVideo } from '../packages/linkAndVideoButton/src';
import { TemplateButton } from '../packages/templateButton/src';
import { BlockButton } from '../packages/blockButton/src';
import { ImageButton } from "@root/packages/imageButton/src";
import { CodeEditorButton } from "@root/packages/codeEditorButton/src";
import { PreviewButton } from "@root/packages/previewButton/src";
import { FullscreenButton } from "@root/packages/fullscreenButton/src";
import { PrintButton } from "@root/packages/printButton/src";
import { ParagraphButton } from "@root/packages/paragraphButton/src";
import { HorizontalLineButton } from "@root/packages/horizontalLineButton/src";

document.addEventListener('DOMContentLoaded', () => {
  const appElement = document.getElementById('app');
  if (appElement) {
    const editor = new EditorCore(appElement);
    editor.registerModule(new UndoRedoButton);
    editor.registerModule(new BlockButton);
    editor.registerModule(new SpacerButton);
    editor.registerModule(new ParagraphButton);
    editor.registerModule(new SpacerButton);
    editor.registerModule(new TextDecorationButton);
    editor.registerModule(new AlignButton);
    editor.registerModule(new TextStylingButton);
    editor.registerModule(new TableButton);
    editor.registerModule(new ListButton);
    editor.registerModule(new HorizontalLineButton);
    editor.registerModule(new SpacerButton);
    editor.registerModule(new ImageButton);
    editor.registerModule(new LinkAndVideo);
    editor.registerModule(new SpacerButton);
    editor.registerModule(new CodeEditorButton);
    editor.registerModule(new PreviewButton);
    editor.registerModule(new TemplateButton({
      test: 'sssssss ssss ssss',
      html: '<table class="on-codemerge-table"><thead><tr><th>Header 1</th><th>Header 2</th><th>Header 3</th></tr></thead><tbody><tr><td style="position: relative;">Row 1 Col 1<div class="on-codemerge-resizer"></div></td><td style="position: relative;">Row 1 Col 2<div class="on-codemerge-resizer"></div></td><td style="position: relative;">Row 1 Col 3<div class="on-codemerge-resizer"></div></td></tr><tr><td style="position: relative;">Row 2 Col 1<div class="on-codemerge-resizer"></div></td><td style="position: relative;">Row 2 Col 2<div class="on-codemerge-resizer"></div></td><td style="position: relative;">Row 2 Col 3<div class="on-codemerge-resizer"></div></td></tr><tr><td style="position: relative;">Row 3 Col 1<div class="on-codemerge-resizer"></div></td><td style="position: relative;">Row 3 Col 2<div class="on-codemerge-resizer"></div></td><td style="position: relative;">Row 3 Col 3<div class="on-codemerge-resizer"></div></td></tr></tbody></table>',
    }));
    editor.registerModule(new FullscreenButton);
    editor.registerModule(new PrintButton);

    editor.subscribeToContentChange((newContent?: string) => {

      const resultElement = document.getElementById('result');
      if (resultElement && newContent) resultElement.innerText = newContent;
      // console.log(newContent)

      const previewElement = document.getElementById('preview');
      if (previewElement && newContent) previewElement.innerHTML = newContent;
    });

    // editor.setContent("\n" +
    //     "<table class=\"on-codemerge-table\"><thead><tr><th>Header 1</th><th>Header 2</th><th>Header 3</th></tr></thead><tbody><tr><td style=\"position: relative;\">Row 1 Col 1<div class=\"on-codemerge-resizer\"></div></td><td style=\"position: relative;\">Row 1 Col 2<div class=\"on-codemerge-resizer\"></div></td><td style=\"position: relative;\">Row 1 Col 3<div class=\"on-codemerge-resizer\"></div></td></tr><tr><td style=\"position: relative;\">Row 2 Col 1<div class=\"on-codemerge-resizer\"></div></td><td style=\"position: relative;\">Row 2 Col 2<div class=\"on-codemerge-resizer\"></div></td><td style=\"position: relative;\">Row 2 Col 3<div class=\"on-codemerge-resizer\"></div></td></tr><tr><td style=\"position: relative;\">Row 3 Col 1<div class=\"on-codemerge-resizer\"></div></td><td style=\"position: relative;\">Row 3 Col 2<div class=\"on-codemerge-resizer\"></div></td><td style=\"position: relative;\">Row 3 Col 3<div class=\"on-codemerge-resizer\"></div></td></tr></tbody></table>")
  }
});
