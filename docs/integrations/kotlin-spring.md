---
sidebar_position: 20
---

# Kotlin Spring Boot

Welcome to the Kotlin Spring Boot-specific documentation for **On-Codemerge**, a versatile web editor designed for integration with Kotlin Spring Boot applications.

## Getting Started with Kotlin Spring Boot

To integrate On-Codemerge into your Kotlin Spring Boot application, add the required dependencies:

```bash
# Create Spring Boot project with Kotlin
spring init --build=gradle --language=kotlin --dependencies=web,data-jpa kotlin-spring-on-codemerge
cd kotlin-spring-on-codemerge
npm install on-codemerge
```

## Kotlin Spring Boot Integration Example

Here's how to integrate On-Codemerge into a Kotlin Spring Boot application:

1. **Create Kotlin Data Class**:

```kotlin title="src/main/kotlin/com/example/editor/Content.kt"
package com.example.editor

import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "contents")
data class Content(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,
    
    @Column(nullable = false)
    var title: String = "",
    
    @Column(columnDefinition = "TEXT", nullable = false)
    var body: String = "",
    
    @Column(nullable = false)
    val createdAt: LocalDateTime = LocalDateTime.now(),
    
    @Column(nullable = false)
    var updatedAt: LocalDateTime = LocalDateTime.now()
)
```

2. **Create Repository**:

```kotlin title="src/main/kotlin/com/example/editor/ContentRepository.kt"
package com.example.editor

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface ContentRepository : JpaRepository<Content, Long> {
    fun findAllByOrderByCreatedAtDesc(): List<Content>
}
```

3. **Create Service**:

```kotlin title="src/main/kotlin/com/example/editor/ContentService.kt"
package com.example.editor

import org.springframework.stereotype.Service
import java.time.LocalDateTime

@Service
class ContentService(private val contentRepository: ContentRepository) {
    
    fun saveContent(title: String, body: String): Content {
        val content = Content(
            title = title,
            body = body,
            updatedAt = LocalDateTime.now()
        )
        return contentRepository.save(content)
    }
    
    fun getContent(id: Long): Content? {
        return contentRepository.findById(id).orElse(null)
    }
    
    fun getAllContents(): List<Content> {
        return contentRepository.findAllByOrderByCreatedAtDesc()
    }
    
    fun updateContent(id: Long, title: String, body: String): Content? {
        val content = contentRepository.findById(id).orElse(null)
        return content?.let {
            it.title = title
            it.body = body
            it.updatedAt = LocalDateTime.now()
            contentRepository.save(it)
        }
    }
}
```

4. **Create Controller**:

```kotlin title="src/main/kotlin/com/example/editor/ContentController.kt"
package com.example.editor

import org.springframework.stereotype.Controller
import org.springframework.ui.Model
import org.springframework.web.bind.annotation.*

@Controller
class ContentController(private val contentService: ContentService) {
    
    @GetMapping("/")
    fun index(model: Model): String {
        val initialContent = "<p>Welcome to On-Codemerge with Kotlin Spring Boot!</p>"
        model.addAttribute("initialContent", initialContent)
        return "editor"
    }
    
    @PostMapping("/api/save-content")
    @ResponseBody
    fun saveContent(@RequestBody request: SaveContentRequest): ApiResponse<Content> {
        return try {
            val content = contentService.saveContent(request.title, request.body)
            ApiResponse(
                success = true,
                message = "Content saved successfully!",
                data = content
            )
        } catch (e: Exception) {
            ApiResponse(
                success = false,
                message = "Error saving content: ${e.message}",
                data = null
            )
        }
    }
    
    @GetMapping("/api/get-content/{id}")
    @ResponseBody
    fun getContent(@PathVariable id: Long): ApiResponse<Content> {
        return try {
            val content = contentService.getContent(id)
            if (content != null) {
                ApiResponse(
                    success = true,
                    message = "Content retrieved successfully!",
                    data = content
                )
            } else {
                ApiResponse(
                    success = false,
                    message = "Content not found",
                    data = null
                )
            }
        } catch (e: Exception) {
            ApiResponse(
                success = false,
                message = "Error retrieving content: ${e.message}",
                data = null
            )
        }
    }
    
    @GetMapping("/api/list-contents")
    @ResponseBody
    fun listContents(): ApiResponse<List<Content>> {
        return try {
            val contents = contentService.getAllContents()
            ApiResponse(
                success = true,
                message = "Contents retrieved successfully!",
                data = contents
            )
        } catch (e: Exception) {
            ApiResponse(
                success = false,
                message = "Error retrieving contents: ${e.message}",
                data = null
            )
        }
    }
}

data class SaveContentRequest(
    val title: String,
    val content: String
)

data class ApiResponse<T>(
    val success: Boolean,
    val message: String,
    val data: T?
)
```

5. **Create HTML Template**:

```html title="src/main/resources/templates/editor.html"
<!DOCTYPE html>
<html lang="en" xmlns:th="http://www.thymeleaf.org">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Kotlin Spring Boot On-Codemerge Editor</title>
    <style>
        body {
            margin: 0;
            padding: 20px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        #editor {
            border: 1px solid #ddd;
            border-radius: 4px;
            margin: 20px 0;
            min-height: 300px;
        }
        .controls {
            margin: 20px 0;
        }
        button {
            padding: 8px 16px;
            margin-right: 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
            background: #f8f9fa;
            cursor: pointer;
        }
        button:hover {
            background: #e9ecef;
        }
        .content-list {
            margin-top: 20px;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 4px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Kotlin Spring Boot On-Codemerge Editor</h1>
        
        <div class="controls">
            <input type="text" id="content-title" placeholder="Content Title" value="Untitled">
            <button onclick="saveContent()">Save Content</button>
            <button onclick="loadContent()">Load Content</button>
            <button onclick="listContents()">List Contents</button>
        </div>
        
        <div id="editor"></div>
        
        <div class="content-list" id="content-list" style="display: none;">
            <h3>Saved Contents:</h3>
            <div id="contents-list"></div>
        </div>
    </div>

    <!-- Initial content -->
    <script id="initial-content" type="text/plain" th:utext="${initialContent}">Welcome to On-Codemerge with Kotlin Spring Boot!</script>

    <script type="module" src="/static/js/editor.js"></script>
    <script>
        function saveContent() {
            const content = window.editorInstance ? window.editorInstance.getHtml() : '';
            const title = document.getElementById('content-title').value || 'Untitled';
            
            fetch('/api/save-content', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title: title,
                    content: content
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('Content saved successfully!');
                } else {
                    alert('Error saving content: ' + data.message);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Error saving content');
            });
        }

        function loadContent() {
            const contentId = prompt('Enter content ID:');
            if (contentId) {
                fetch(`/api/get-content/${contentId}`)
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        window.editorInstance.setHtml(data.data.body);
                        document.getElementById('content-title').value = data.data.title;
                    } else {
                        alert('Error loading content: ' + data.message);
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    alert('Error loading content');
                });
            }
        }

        function listContents() {
            fetch('/api/list-contents')
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    const listDiv = document.getElementById('contents-list');
                    const contentList = document.getElementById('content-list');
                    
                    listDiv.innerHTML = '';
                    data.data.forEach(item => {
                        const itemDiv = document.createElement('div');
                        itemDiv.innerHTML = `
                            <strong>ID: ${item.id}</strong> - ${item.title}<br>
                            <small>Created: ${item.createdAt}</small>
                            <button onclick="loadContentById(${item.id})">Load</button>
                            <hr>
                        `;
                        listDiv.appendChild(itemDiv);
                    });
                    
                    contentList.style.display = 'block';
                } else {
                    alert('Error loading contents: ' + data.message);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Error loading contents');
            });
        }

        function loadContentById(id) {
            fetch(`/api/get-content/${id}`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    window.editorInstance.setHtml(data.data.body);
                    document.getElementById('content-title').value = data.data.title;
                    document.getElementById('content-list').style.display = 'none';
                } else {
                    alert('Error loading content: ' + data.message);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Error loading content');
            });
        }
    </script>
</body>
</html>
```

6. **Create JavaScript for Editor**:

```javascript title="src/main/resources/static/js/editor.js"
import { HTMLEditor, ToolbarPlugin, AlignmentPlugin } from '/node_modules/on-codemerge/index.js';
import '/node_modules/on-codemerge/public.css';
import '/node_modules/on-codemerge/index.css';
import '/node_modules/on-codemerge/plugins/ToolbarPlugin/style.css';
import '/node_modules/on-codemerge/plugins/AlignmentPlugin/public.css';
import '/node_modules/on-codemerge/plugins/AlignmentPlugin/style.css';

class KotlinSpringEditor {
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
      console.log('Content changed:', newContent);
    });

    // Set initial content
    const initialContent = document.getElementById('initial-content')?.textContent || 'Welcome to On-Codemerge with Kotlin Spring Boot!';
    this.editor.setHtml(initialContent);

    // Make editor instance globally available
    window.editorInstance = this.editor;
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new KotlinSpringEditor();
});
```

7. **Application Properties**:

```properties title="src/main/resources/application.properties"
# Database configuration
spring.datasource.url=jdbc:h2:mem:testdb
spring.datasource.driverClassName=org.h2.Driver
spring.datasource.username=sa
spring.datasource.password=

# JPA configuration
spring.jpa.database-platform=org.hibernate.dialect.H2Dialect
spring.jpa.hibernate.ddl-auto=create-drop
spring.jpa.show-sql=true

# H2 Console
spring.h2.console.enabled=true

# Static resources
spring.web.resources.static-locations=classpath:/static/
spring.web.resources.add-mappings=true

# Thymeleaf configuration
spring.thymeleaf.cache=false
```

8. **Build Configuration**:

```kotlin title="build.gradle.kts"
import org.jetbrains.kotlin.gradle.tasks.KotlinCompile

plugins {
    id("org.springframework.boot") version "3.2.0"
    id("io.spring.dependency-management") version "1.1.4"
    kotlin("jvm") version "1.9.20"
    kotlin("plugin.spring") version "1.9.20"
    kotlin("plugin.jpa") version "1.9.20"
}

group = "com.example"
version = "0.0.1-SNAPSHOT"

java {
    sourceCompatibility = JavaVersion.VERSION_17
}

repositories {
    mavenCentral()
}

dependencies {
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")
    implementation("org.springframework.boot:spring-boot-starter-thymeleaf")
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("com.fasterxml.jackson.module:jackson-module-kotlin")
    implementation("org.jetbrains.kotlin:kotlin-reflect")
    runtimeOnly("com.h2database:h2")
    testImplementation("org.springframework.boot:spring-boot-starter-test")
}

tasks.withType<KotlinCompile> {
    kotlinOptions {
        freeCompilerArgs += "-Xjsr305=strict"
        jvmTarget = "17"
    }
}

tasks.withType<Test> {
    useJUnitPlatform()
}
```

## Key Features

- **Kotlin Spring Boot Integration**: Full compatibility with Spring Boot and Kotlin
- **JPA Support**: Database persistence with Hibernate
- **RESTful API**: Clean API endpoints for content management
- **Thymeleaf Templates**: Server-side templating
- **Content Management**: Save, load, and list content functionality
- **Plugin System**: Full plugin support
- **Localization**: Multi-language support 