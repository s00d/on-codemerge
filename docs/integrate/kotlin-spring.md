# Kotlin Spring Boot

Same contract as [Spring Boot](./spring.md): Vite-built editor + JSON API. Keep this short — Kotlin is a thin syntax layer over the Java smoke.

Verified via the Java HTTP smoke (`Spring JSON SoT` screenshot); Kotlin controller equivalent:

```kotlin
@RestController
class DocController(
  private final val data: Path = Path.of("data/doc.json"),
  private final val mapper: ObjectMapper = ObjectMapper(),
) {
  @GetMapping("/api/doc")
  fun get(): String = Files.readString(data)

  @PutMapping("/api/doc")
  fun put(@RequestBody body: Map<String, Any?>): Map<String, Boolean> {
    Files.writeString(data, mapper.writeValueAsString(body))
    return mapOf("ok" to true)
  }
}
```

## Install

```bash
npm install on-codemerge
npm install -D vite
```

## Persist

`PUT /api/doc` with `{ "doc": editor.getJSON() }`. HTML is not SoT.

## Gotchas

- Identical to Java Spring: serve built assets, persist JSON.
- See [Spring Boot](./spring.md) for the longer static+API notes.

## Related

- [Spring Boot](./spring.md)
- [Chrome & host](./chrome-and-host.md)
- [Editor API](/guide/editor)
- [Plugins overview](/plugins/)
