# Spring Boot

Serve a Vite-built editor and persist document **JSON** from a Spring controller (same HTTP contract as the verified smoke).

Verified with a JDK `HttpServer` smoke on port 4195 (static `public/` + `GET/PUT /api/doc`) and screenshot. Spring mapping below matches that contract.

## Install

```bash
# Spring Boot app (start.spring.io or your existing project)
npm install on-codemerge
npm install -D vite
```

Build the editor into `src/main/resources/static/dist` (or `public/dist`).

## Minimal example

```java
@RestController
public class DocController {
  private final Path data = Path.of("data/doc.json");

  @GetMapping("/api/doc")
  public String get() throws IOException {
    return Files.readString(data);
  }

  @PutMapping("/api/doc")
  public Map<String, Object> put(@RequestBody Map<String, Object> body) throws IOException {
    Files.writeString(data, new ObjectMapper().writeValueAsString(body));
    return Map.of("ok", true);
  }
}
```

Client: Vite entry calling `editor.getJSON()` / `setJSON()` (see Express guide).

## Persist

`PUT /api/doc` with `{ "doc": editor.getJSON() }`.

## Gotchas

- Bundle the editor with Vite; Spring only serves assets + JSON.
- Persist JSON, not HTML.

## Related

- [Chrome & host](./chrome-and-host.md)
- [Editor API](/guide/editor)
- [Plugins overview](/plugins/)
- [Integrate overview](/integrate/)
