---
sidebar_position: 13
---

# Spring

Welcome to the Spring Framework-specific documentation for **On-Codemerge**, an advanced web editor designed for easy integration with Spring-based applications.

## Getting Started with Spring Framework

To integrate On-Codemerge into your Spring application, install the package:

```bash
npm install on-codemerge
```

or

```bash
yarn add on-codemerge
```

## Spring Framework Integration Example

Here's how to integrate On-Codemerge into a Spring application:

1. **Create a JavaScript File for the Editor**:

```javascript title="src/main/resources/static/js/editor.js"
import { HTMLEditor, ToolbarPlugin, AlignmentPlugin } from '/node_modules/on-codemerge/index.js';
import '/node_modules/on-codemerge/public.css';
import '/node_modules/on-codemerge/index.css';
import '/node_modules/on-codemerge/plugins/ToolbarPlugin/style.css';
import '/node_modules/on-codemerge/plugins/AlignmentPlugin/public.css';
import '/node_modules/on-codemerge/plugins/AlignmentPlugin/style.css';

class SpringEditor {
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
    const initialContent = document.getElementById('initial-content')?.textContent || 'Welcome to On-Codemerge with Spring!';
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
  new SpringEditor();
});
```

2. **Include the JavaScript in Your Spring View**:

```html title="src/main/resources/templates/your_template.html"
<!DOCTYPE html>
<html xmlns:th="http://www.thymeleaf.org" lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Spring On-Codemerge Editor</title>
</head>
<body>
    <div class="container">
        <h1>Spring On-Codemerge Editor</h1>
        
        <form th:action="@{/save-content}" method="post">
            <div id="editor" style="min-height: 300px;"></div>
            <input type="hidden" id="editor-content" name="content" value="">
            
            <div class="controls">
                <button type="submit">Save Content</button>
                <button type="button" onclick="previewContent()">Preview</button>
            </div>
        </form>
        
        <div id="preview" style="display: none;">
            <h3>Preview:</h3>
            <div id="preview-content"></div>
        </div>
    </div>

    <!-- Initial content (if any) -->
    <script id="initial-content" type="text/plain" th:utext="${initialContent}">Welcome to On-Codemerge with Spring!</script>

    <script type="module" th:src="@{/js/editor.js}"></script>
    <script>
        function previewContent() {
            const content = document.getElementById('editor-content').value;
            const previewDiv = document.getElementById('preview');
            const previewContent = document.getElementById('preview-content');
            
            previewContent.innerHTML = content;
            previewDiv.style.display = 'block';
        }
    </script>
</body>
</html>
```

3. **Controller Setup**:

```java title="src/main/java/com/example/controller/EditorController.java"
package com.example.controller;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

@Controller
public class EditorController {

    @GetMapping("/")
    public String home(Model model) {
        String initialContent = "<p>Welcome to On-Codemerge with Spring!</p>";
        model.addAttribute("initialContent", initialContent);
        return "your_template";
    }

    @PostMapping("/save-content")
    @ResponseBody
    public String saveContent(@RequestParam String content) {
        // Save content to database or file
        System.out.println("Saving content: " + content);
        return "Content saved successfully!";
    }
}
```

4. **Application Properties**:

```properties title="src/main/resources/application.properties"
# Enable static resource handling
spring.web.resources.static-locations=classpath:/static/
spring.web.resources.add-mappings=true

# Thymeleaf configuration
spring.thymeleaf.cache=false
spring.thymeleaf.prefix=classpath:/templates/
spring.thymeleaf.suffix=.html
```

## Key Features

- **Spring Integration**: Full compatibility with Spring Boot and Spring MVC
- **Thymeleaf Templates**: Easy integration with Thymeleaf templating
- **Static Resources**: Proper static file handling
- **Form Integration**: Easy integration with Spring forms
- **Content Management**: Real-time content updates and saving
- **Plugin System**: Full plugin support
- **Localization**: Multi-language support
