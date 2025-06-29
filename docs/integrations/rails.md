---
sidebar_position: 12
---

# Rails

Welcome to the Ruby on Rails-specific documentation for **On-Codemerge**, a dynamic web editor designed for seamless integration with Ruby on Rails.

## Getting Started with Ruby on Rails

To use On-Codemerge in your Ruby on Rails project, install the package:

```bash
npm install on-codemerge
```

or

```bash
yarn add on-codemerge
```

## Ruby on Rails Integration Example

### Webpacker Integration (Rails 6+)

1. **Create a JavaScript Pack**:

```javascript title="app/javascript/packs/editor.js"
import { HTMLEditor, ToolbarPlugin, AlignmentPlugin } from 'on-codemerge';
import 'on-codemerge/public.css';
import 'on-codemerge/index.css';
import 'on-codemerge/plugins/ToolbarPlugin/style.css';
import 'on-codemerge/plugins/AlignmentPlugin/public.css';
import 'on-codemerge/plugins/AlignmentPlugin/style.css';

class RailsEditor {
  constructor() {
    this.editor = null;
    this.init();
  }

  async init() {
    const editorElement = document.getElementById('editor');
    if (!editorElement) return;

    // Initialize editor
    this.editor = new HTMLEditor(editorElement);

    // Set locale
    await this.editor.setLocale('ru');

    // Register plugins
    this.editor.use(new ToolbarPlugin());
    this.editor.use(new AlignmentPlugin());

    // Subscribe to content changes
    this.editor.subscribeToContentChange((newContent) => {
      this.updateHiddenField(newContent);
      console.log('Content changed:', newContent);
    });

    // Set initial content
    const initialContent = document.getElementById('initial-content')?.textContent || 'Welcome to On-Codemerge with Rails!';
    this.editor.setHtml(initialContent);
  }

  updateHiddenField(content) {
    const hiddenField = document.getElementById('editor-content');
    if (hiddenField) {
      hiddenField.value = content;
    }
  }

  getContent() {
    return this.editor ? this.editor.getHtml() : '';
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new RailsEditor();
});
```

2. **Include the Pack in Your View**:

```erb title="app/views/layouts/application.html.erb"
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rails On-Codemerge App</title>
  <%= csrf_meta_tags %>
  <%= csp_meta_tag %>
  <%= stylesheet_link_tag 'application', media: 'all', 'data-turbolinks-track': 'reload' %>
  <%= javascript_pack_tag 'editor', 'data-turbolinks-track': 'reload' %>
</head>
<body>
  <%= yield %>
</body>
</html>
```

3. **Create Your View**:

```erb title="app/views/pages/editor.html.erb"
<div class="container">
  <h1>Rails On-Codemerge Editor</h1>
  
  <%= form_with url: save_content_path, method: :post, local: true do |form| %>
    <div id="editor" style="min-height: 300px;"></div>
    <%= form.hidden_field :content, id: 'editor-content' %>
    
    <div class="controls">
      <%= form.submit "Save Content", class: "btn btn-primary" %>
      <button type="button" onclick="previewContent()" class="btn btn-secondary">Preview</button>
    </div>
  <% end %>
  
  <div id="preview" style="display: none;">
    <h3>Preview:</h3>
    <div id="preview-content"></div>
  </div>
</div>

<!-- Initial content (if any) -->
<% if @initial_content %>
<script id="initial-content" type="text/plain"><%= raw @initial_content %></script>
<% end %>

<script>
function previewContent() {
  const content = document.getElementById('editor-content').value;
  const previewDiv = document.getElementById('preview');
  const previewContent = document.getElementById('preview-content');
  
  previewContent.innerHTML = content;
  previewDiv.style.display = 'block';
}
</script>
```

4. **Rails Controller**:

```ruby title="app/controllers/pages_controller.rb"
class PagesController < ApplicationController
  def editor
    @initial_content = '<p>Welcome to On-Codemerge with Rails!</p>'
  end

  def save_content
    content = params[:content]
    # Save content to database or file
    Rails.logger.info "Saving content: #{content}"
    
    respond_to do |format|
      format.html { redirect_to editor_path, notice: 'Content saved successfully!' }
      format.json { render json: { success: true } }
    end
  end
end
```

5. **Routes**:

```ruby title="config/routes.rb"
Rails.application.routes.draw do
  get 'pages/editor'
  post 'pages/save_content'
  root 'pages#editor'
end
```

6. **Model for Content Storage** (Optional):

```ruby title="app/models/content.rb"
class Content < ApplicationRecord
  validates :body, presence: true
  
  def self.latest
    order(created_at: :desc).first
  end
end
```

7. **Migration** (Optional):

```ruby title="db/migrate/YYYYMMDDHHMMSS_create_contents.rb"
class CreateContents < ActiveRecord::Migration[7.0]
  def change
    create_table :contents do |t|
      t.text :body, null: false
      t.string :title
      t.timestamps
    end
  end
end
```

### Asset Pipeline Integration (Legacy)

1. **Add JavaScript Files**: Place your JavaScript files, including `on-codemerge` and its dependencies, in `app/assets/javascripts`.

2. **Require Files in Application.js**:

```javascript title="app/assets/javascripts/application.js"
//= require on-codemerge
//= require_tree .
```

3. **Initialize On-Codemerge in Your View**:

```erb title="app/views/your_view.html.erb"
<div id="editor"></div>
<script>
  document.addEventListener('DOMContentLoaded', () => {
    // Initialization code as shown above
  });
</script>
```

## Key Features

- **Rails Integration**: Full compatibility with Rails asset pipeline and Webpacker
- **Turbolinks Support**: Proper integration with Rails Turbolinks
- **Form Integration**: Easy integration with Rails form helpers
- **CSRF Protection**: Built-in CSRF token support
- **Content Management**: Real-time content updates and saving
- **Plugin System**: Full plugin support
- **Localization**: Multi-language support
