# on-codemerge demo

Стенд на пакете с npm.

```bash
cd demo
pnpm install
pnpm exec playwright install chromium   # один раз
pnpm dev                                # http://localhost:3001
```

E2E: `pnpm build && pnpm test:e2e`
