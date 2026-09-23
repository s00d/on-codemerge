# Go Gin

> Archive: on-codemerge **v1** API (`HTMLEditor`, class plugins). Current docs: [Guide](/guide/editor) · [Migrate](/guide/migration-v1-to-v2).


Welcome to the Go Gin-specific documentation for **On-Codemerge**, a versatile web editor designed for integration with Gin applications.

## Getting Started with Gin

To integrate On-Codemerge into your Gin application, install the required packages:

```bash
go mod init gin-on-codemerge
go get github.com/gin-gonic/gin
npm install on-codemerge
```

## Gin Integration Example

Here's how to integrate On-Codemerge into a Gin application:

1. **Create Go Application**:

```go title="main.go"
package main

import (
	"encoding/json"
	"log"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

// Content represents a content item
type Content struct {
	ID        int       `json:"id"`
	Title     string    `json:"title"`
	Body      string    `json:"body"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// In-memory storage (use database in production)
var contents []Content
var nextID = 1

func main() {
	r := gin.Default()

	// Serve static files
	r.Static("/static", "./static")
	r.LoadHTMLGlob("templates/*")

	// Routes
	r.GET("/", func(c *gin.Context) {
		initialContent := "<p>Welcome to On-Codemerge with Gin!</p>"
		c.HTML(http.StatusOK, "editor.html", gin.H{
			"initialContent": initialContent,
		})
	})

	// API routes
	api := r.Group("/api")
	{
		api.POST("/save-content", saveContent)
		api.GET("/get-content/:id", getContent)
		api.GET("/list-contents", listContents)
	}

	log.Fatal(r.Run(":8080"))
}

func saveContent(c *gin.Context) {
	var request struct {
		Content string `json:"content"`
		Title   string `json:"title"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid request data",
		})
		return
	}

	content := Content{
		ID:        nextID,
		Title:     request.Title,
		Body:      request.Content,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	contents = append(contents, content)
	nextID++


_…trimmed for the v1 archive. See source history for the full guide._
