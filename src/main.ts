import {
  HTMLEditor,
  ToolbarPlugin,
  ToolbarDividerPlugin,
  TablePlugin,
  ImagePlugin,
  BlockPlugin,
  HTMLViewerPlugin,
  CodeBlockPlugin,
  TemplatesPlugin,
  ExportPlugin,
  HistoryPlugin,
  ChartsPlugin,
  ShortcutsPlugin,
  ColorPlugin,
  TypographyPlugin,
  ListsPlugin,
  CommentsPlugin,
  FootnotesPlugin,
  FooterPlugin,
  ResponsivePlugin,
  LinkPlugin,
  VideoPlugin,
  YouTubeVideoPlugin,
  FileUploadPlugin,
  FontPlugin,
  AlignmentPlugin,
  CollaborationPlugin,
  FormBuilderPlugin,
  SpellCheckerPlugin,
  BlockStylePlugin,
  AIAssistantPlugin,
  CalendarPlugin,
  TimerPlugin,
  PDFEmbedPlugin,
  MentionsPlugin,
  TrackChangesPlugin,
  AnchorLinkPlugin,
} from './app';
import { MathPlugin } from './plugins/MathPlugin';
import { LanguagePlugin } from './plugins/LanguagePlugin';

document.addEventListener('DOMContentLoaded', async () => {
  const editorElement = document.getElementById('editor');
  if (editorElement) {
    const editor = new HTMLEditor(editorElement);

    // await editor.setLocale('ru');

    // Initialize all plugins
    editor.use(new ToolbarPlugin());

    editor.use(new HistoryPlugin());
    editor.use(new ToolbarDividerPlugin());
    editor.use(new AlignmentPlugin());
    editor.use(new ToolbarDividerPlugin());
    editor.use(new FontPlugin());
    editor.use(new ToolbarDividerPlugin());

    editor.use(new TablePlugin());
    editor.use(new ImagePlugin());
    editor.use(new BlockPlugin());
    editor.use(new HTMLViewerPlugin());
    editor.use(new CodeBlockPlugin());
    editor.use(new TemplatesPlugin());
    editor.use(new ExportPlugin());
    editor.use(new ChartsPlugin());
    editor.use(new ColorPlugin());
    editor.use(new TypographyPlugin());
    editor.use(new ListsPlugin());
    editor.use(new CommentsPlugin());
    editor.use(new FootnotesPlugin());
    editor.use(new FooterPlugin());
    editor.use(new ResponsivePlugin());
    editor.use(new LinkPlugin());
    editor.use(new VideoPlugin());
    editor.use(new YouTubeVideoPlugin());
    editor.use(new ShortcutsPlugin());
    editor.use(new FormBuilderPlugin());
    editor.use(new SpellCheckerPlugin());
    editor.use(new BlockStylePlugin());
    editor.use(new MathPlugin());
    editor.use(new AIAssistantPlugin());
    editor.use(new CalendarPlugin());
    editor.use(new TimerPlugin());
    editor.use(new PDFEmbedPlugin());
    editor.use(
      new MentionsPlugin([
        { id: '1', label: 'Alice' },
        { id: '2', label: 'Bob' },
        { id: '3', label: 'Charlie' },
      ])
    );
    editor.use(new TrackChangesPlugin());
    editor.use(new AnchorLinkPlugin());
    editor.use(
      new CollaborationPlugin({
        serverUrl: 'ws://localhost:8080',
        autoStart: true,
      })
    );
    editor.use(
      new FileUploadPlugin({
        // Configure with emulation by default
        useEmulation: true,
        maxFileSize: 10 * 1024 * 1024, // 10MB
        allowedTypes: ['*/*'], // Allow all file types
      })
    );
    editor.use(new LanguagePlugin());

    // Создаем элементы для вывода HTML и превью
    const resultContainer = document.createElement('div');
    resultContainer.innerHTML = `
      <hr />
      <div>
        <h3>Result:</h3>
        <div id="result" class="result"></div>
      </div>
      <hr />
      <div>
        <h3>Preview:</h3>
        <div id="preview" class="preview"></div>
      </div>
    `;
    editorElement.parentNode?.insertBefore(resultContainer, editorElement.nextSibling);

    // Получаем элементы для вывода
    const resultElement = document.getElementById('result');
    const previewElement = document.getElementById('preview');

    // Подписка на изменения контента
    editor.subscribeToContentChange((newContent) => {
      if (resultElement) {
        resultElement.textContent = newContent;
      }
      if (previewElement) {
        previewElement.innerHTML = newContent;
      }
    });

    editor.setHtml(
      '<div>1111\n' +
        '</div>\n' +
        '<div class="responsive-table html-editor-table">\n' +
        '  <div class="table-header-row">\n' +
        '    <div class="table-header-cell" contenteditable="true">Заголовок 1</div>\n' +
        '    <div class="table-header-cell" contenteditable="true">Заголовок 2</div>\n' +
        '    <div class="table-header-cell" contenteditable="true">Заголовок 3</div>\n' +
        '    <div class="table-header-cell" contenteditable="true">Заголовок 4</div>\n' +
        '    <div class="table-header-cell" contenteditable="true">Заголовок 5</div>\n' +
        '    <div class="table-header-cell" contenteditable="true">Заголовок 6</div>\n' +
        '  </div>\n' +
        '  <div class="table-row">\n' +
        '    <div class="table-cell" contenteditable="true" data-label="Заголовок 1">Cell 1 - 1</div>\n' +
        '    <div class="table-cell" contenteditable="true" data-label="Заголовок 2">Cell 1 - 2</div>\n' +
        '    <div class="table-cell" contenteditable="true" data-label="Заголовок 3">Cell 1 - 3</div>\n' +
        '    <div class="table-cell" contenteditable="true" data-label="Заголовок 4">Cell 1 - 4</div>\n' +
        '    <div class="table-cell" contenteditable="true" data-label="Заголовок 5">Cell 1 - 5</div>\n' +
        '    <div class="table-cell" contenteditable="true" data-label="Заголовок 6">Cell 1 - 6</div>\n' +
        '  </div>\n' +
        '  <div class="table-row">\n' +
        '    <div class="table-cell" contenteditable="true" data-label="Заголовок 1">Cell 2 - 1</div>\n' +
        '    <div class="table-cell" contenteditable="true" data-label="Заголовок 2">Cell 2 - 2</div>\n' +
        '    <div class="table-cell" contenteditable="true" data-label="Заголовок 3">Cell 2 - 3</div>\n' +
        '    <div class="table-cell" contenteditable="true" data-label="Заголовок 4">Cell 2 - 4</div>\n' +
        '    <div class="table-cell" contenteditable="true" data-label="Заголовок 5">Cell 2 - 5</div>\n' +
        '    <div class="table-cell" contenteditable="true" data-label="Заголовок 6">Cell 2 - 6</div>\n' +
        '  </div>\n' +
        '  <div class="table-row">\n' +
        '    <div class="table-cell" contenteditable="true" data-label="Заголовок 1">Cell 3 - 1</div>\n' +
        '    <div class="table-cell" contenteditable="true" data-label="Заголовок 2">Cell 3 - 2</div>\n' +
        '    <div class="table-cell" contenteditable="true" data-label="Заголовок 3">Cell 3 - 3</div>\n' +
        '    <div class="table-cell" contenteditable="true" data-label="Заголовок 4">Cell 3 - 4</div>\n' +
        '    <div class="table-cell" contenteditable="true" data-label="Заголовок 5">Cell 3 - 5</div>\n' +
        '    <div class="table-cell" contenteditable="true" data-label="Заголовок 6">Cell 3 - 6</div>\n' +
        '  </div>\n' +
        '  <div class="table-row">\n' +
        '    <div class="table-cell" contenteditable="true" data-label="Заголовок 1">Cell 4 - 1</div>\n' +
        '    <div class="table-cell" contenteditable="true" data-label="Заголовок 2">Cell 4 - 2</div>\n' +
        '    <div class="table-cell" contenteditable="true" data-label="Заголовок 3">Cell 4 - 3</div>\n' +
        '    <div class="table-cell" contenteditable="true" data-label="Заголовок 4">Cell 4 - 4</div>\n' +
        '    <div class="table-cell" contenteditable="true" data-label="Заголовок 5">Cell 4 - 5</div>\n' +
        '    <div class="table-cell" contenteditable="true" data-label="Заголовок 6">Cell 4 - 6</div>\n' +
        '  </div>\n' +
        '</div>\n' +
        '<br>'
    );
  }
});
