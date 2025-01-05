<template>
  <div>
    <h1>on-CodeMerge</h1>
    <div>
      A WYSIWYG editor for on-codemerge is a user-friendly interface that allows users to edit and
      view their code in real time, exactly as it will appear in the final product. This intuitive
      tool for developers of all skill levels.
    </div>
    <hr />
    <div ref="editorContainer" class="editorBlock">
      <!-- Редактор будет инициализирован в этом div -->
    </div>
    <hr />
    <div>
      Result:
      <div id="result">{{ editorContent }}</div>
    </div>
    <hr />
    <div>
      Preview:
      <div id="preview" v-html="previewContent" />
    </div>
  </div>
</template>

<script>
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
} from '../../src/app';

export default {
  props: {
    activePlugins: {
      type: Array,
      default: () => [],
    },
    language: {
      type: String,
      default: '',
    },
  },
  data() {
    return {
      editorContent: '',
      previewContent: '',
    };
  },
  mounted() {
    if (this.$refs.editorContainer) {
      const editor = new HTMLEditor(this.$refs.editorContainer);

      if (this.language) {
        editor.setLocale(this.language);
      }

      // Список всех плагинов
      const allPlugins = {
        ToolbarPlugin,
        HistoryPlugin,
        AlignmentPlugin,
        ToolbarDividerPlugin,
        FontPlugin,
        TablePlugin,
        ImagePlugin,
        BlockPlugin,
        HTMLViewerPlugin,
        CodeBlockPlugin,
        TemplatesPlugin,
        ExportPlugin,
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
        CollaborationPlugin,
        FormBuilderPlugin,
      };

      // Если activePlugins пустой, регистрируем все плагины
      const pluginsToUse = this.activePlugins.length === 0
        ? Object.keys(allPlugins)
        : this.activePlugins;

      // Регистрация плагинов
      pluginsToUse.forEach((pluginName) => {
        if (allPlugins[pluginName]) {
          editor.use(new allPlugins[pluginName]());
        } else {
          console.warn(`Плагин "${pluginName}" не найден.`);
        }
      });

      // Подписка на изменения контента
      editor.subscribeToContentChange((newContent) => {
        this.editorContent = newContent;
        this.previewContent = newContent;
      });

      editor.setHtml('awfa waw awf awf aw&nbsp; <table class="html-editor-table"> <tbody> <tr> <td contenteditable="true">Cell 1 - 1 </td> <td contenteditable="true">Cell 1 - 2 </td> </tr> </tbody> </table> <br class="">\n')
    }
  },
};
</script>

<style scoped>
.editorBlock {
  border: 1px solid #ccc;
  padding: 10px;
  min-height: 200px;
}
</style>
<style>
.html-editor-table {
  display: table !important;
  border-collapse: separate !important;
  margin: 0 !important;
  overflow-x: visible !important;
  width: 100% !important;
}
</style>

