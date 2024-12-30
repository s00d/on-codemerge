---
sidebar_position: 13
---

# Spring

Welcome to the Spring Framework-specific documentation for **On-Codemerge**, an advanced web editor designed for easy integration with Spring-based applications.

## Getting Started with Spring Framework

To integrate On-Codemerge into your Spring application, install the package:

```bash
npm install --save on-codemerge
```

or

```bash
yarn add on-codemerge
```

## Spring Framework Integration Example

Here’s how to integrate On-Codemerge into a Spring application:

1. **Create a JavaScript File for the Editor**:

```javascript title="src/main/resources/static/js/editor.js"
import { HTMLEditor, ToolbarPlugin, AlignmentPlugin } from 'on-codemerge';

document.addEventListener('DOMContentLoaded', async () => {
  const editorElement = document.getElementById('editor');
  if (editorElement) {
    const editor = new HTMLEditor(editorElement);

    await editor.setLocale('ru');

    editor.use(new ToolbarPlugin());
    editor.use(new AlignmentPlugin());

    editor.subscribeToContentChange((newContent) => {
      console.log('Content changed:', newContent);
    });

    editor.setHtml('Initial content goes here');
    console.log(editor.getHtml());
  }
});
```

2. **Include the JavaScript in Your Spring View**:

```html title="src/main/resources/templates/your_template.html"
<!DOCTYPE html>
<html xmlns:th="http://www.thymeleaf.org">
<head>
    <!-- Head contents -->
</head>
<body>
    <div id="editor"></div>
    <script th:src="@{/js/editor.js}"></script>
</body>
</html>
```

3. **Controller Setup**:

```java title="YourController.java"
@Controller
public class YourController {

    @GetMapping("/")
    public String home(Model model) {
        return "your_template";
    }
}
```
