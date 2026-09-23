# Go Gin

Serve a Vite-built editor and persist document **JSON** with Gin.

Verified with Gin 1.10 + Vite + `on-codemerge@2.0.3` (browser smoke).

## Install

```bash
go get github.com/gin-gonic/gin
npm install on-codemerge
npm install -D vite
```

## Minimal example

Build the editor into `public/dist`, then:

```go
r := gin.Default()
r.Static("/dist", "./public/dist")
r.StaticFile("/", "./public/index.html")

r.GET("/api/doc", func(c *gin.Context) {
  b, _ := os.ReadFile("data/doc.json")
  c.Data(http.StatusOK, "application/json", b)
})

r.PUT("/api/doc", func(c *gin.Context) {
  var body map[string]any
  if err := c.BindJSON(&body); err != nil {
    c.JSON(400, gin.H{"error": err.Error()})
    return
  }
  out, _ := json.MarshalIndent(map[string]any{"doc": body["doc"]}, "", "  ")
  _ = os.WriteFile("data/doc.json", out, 0o644)
  c.JSON(200, gin.H{"ok": true})
})

r.Run("127.0.0.1:3000")
```

Client uses `getJSON` / `setJSON` (same Vite entry as Express).

## Persist

`PUT /api/doc` with `{ "doc": editor.getJSON() }`.

## Gotchas

- Bundle the editor with Vite; Gin only serves the built assets + JSON API.
- Persist JSON, not HTML.

## Related

- [Chrome & host](./chrome-and-host.md)
- [Editor API](/guide/editor)
- [Plugins overview](/plugins/)
- [Integrate overview](/integrate/)
