# Kotlin Spring Boot

> Archive: on-codemerge **v1** API (`HTMLEditor`, class plugins). Current docs: [Guide](/guide/editor) · [Migrate](/guide/migration-v1-to-v2).


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

_…trimmed for the v1 archive. See source history for the full guide._
