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
} from './app';

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

    editor.setHtml(
      '<div>1111\n' +
        '</div>\n' +
        '<table class="html-editor-table">\n' +
        '  <tbody>\n' +
        '    <tr>\n' +
        '      <td contenteditable="true">Cell 1 - 1\n' +
        '      </td>\n' +
        '      <td contenteditable="true">Cell 1 - 2\n' +
        '      </td>\n' +
        '      <td contenteditable="true">Cell 1 - 3\n' +
        '      </td>\n' +
        '      <td contenteditable="true">Cell 1 - 4\n' +
        '      </td>\n' +
        '      <td contenteditable="true">Cell 1 - 5\n' +
        '      </td>\n' +
        '      <td contenteditable="true">Cell 1 - 6\n' +
        '      </td>\n' +
        '    </tr>\n' +
        '    <tr>\n' +
        '      <td contenteditable="true">Cell 2 - 1\n' +
        '      </td>\n' +
        '      <td contenteditable="true">Cell 2 - 2\n' +
        '      </td>\n' +
        '      <td contenteditable="true">Cell 2 - 3\n' +
        '      </td>\n' +
        '      <td contenteditable="true">Cell 2 - 4\n' +
        '      </td>\n' +
        '      <td contenteditable="true">Cell 2 - 5\n' +
        '      </td>\n' +
        '      <td contenteditable="true">Cell 2 - 6\n' +
        '      </td>\n' +
        '    </tr>\n' +
        '    <tr>\n' +
        '      <td contenteditable="true">Cell 3 - 1\n' +
        '      </td>\n' +
        '      <td contenteditable="true">Cell 3 - 2\n' +
        '      </td>\n' +
        '      <td contenteditable="true">Cell 3 - 3\n' +
        '      </td>\n' +
        '      <td contenteditable="true">Cell 3 - 4\n' +
        '      </td>\n' +
        '      <td contenteditable="true">Cell 3 - 5\n' +
        '      </td>\n' +
        '      <td contenteditable="true">Cell 3 - 6\n' +
        '      </td>\n' +
        '    </tr>\n' +
        '    <tr>\n' +
        '      <td contenteditable="true">Cell 4 - 1\n' +
        '      </td>\n' +
        '      <td contenteditable="true">Cell 4 - 2\n' +
        '      </td>\n' +
        '      <td contenteditable="true">Cell 4 - 3\n' +
        '      </td>\n' +
        '      <td contenteditable="true">Cell 4 - 4\n' +
        '      </td>\n' +
        '      <td contenteditable="true">Cell 4 - 5\n' +
        '      </td>\n' +
        '      <td contenteditable="true">Cell 4 - 6\n' +
        '      </td>\n' +
        '    </tr>\n' +
        '  </tbody>\n' +
        '</table>\n' +
        '<br>'
    );
  }
});
