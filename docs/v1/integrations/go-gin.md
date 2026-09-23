# Go Gin

> Archive: v1 API. Current guides: [Integrate](/integrate/).

Boot **HTMLEditor** on a host element, register plugins, import CSS.

## Example

```go
// r.Static("/assets", "./assets"); r.LoadHTMLGlob("templates/*")
// template has #editor; assets/editor.js → new HTMLEditor + ToolbarPlugin
// POST /save stores HTML string from the client
```
