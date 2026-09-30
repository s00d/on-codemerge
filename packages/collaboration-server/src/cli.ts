import { staticTokenAuth, hmacJwtAuth } from './auth';
import { createCollaborationServer } from './server';
import { memoryStore } from './store/memory';
import { sqliteStore } from './store/sqlite';
import { createRedisFanout } from './redis';

function usage(): never {
  console.log(`codemerge-collaboration-server — CodeMerge collab (protocol v2)

Usage:
  codemerge-collaboration-server serve [options]
  codemerge-collaboration-server compact --doc <docId> [--keep 100]
  codemerge-collaboration-server inspect <docId>

Options (serve):
  --port <n>              Listen port (default PORT env or 8080)
  --host <host>           Bind host (default 0.0.0.0)
  --path <path>           WS/REST path (default /collab)
  --store memory|sqlite:<path>
  --auth static|jwt
  --token <secret>        Static token (or COLLAB_TOKEN)
  --jwt-secret <secret>   JWT HS256 secret (or COLLAB_JWT_SECRET)
  --redis <url>           Optional Redis fanout URL
  --webhook <url>         Optional webhook URL (repeatable)

Env: COLLAB_TOKEN, COLLAB_JWT_SECRET, PORT, COLLAB_STORE
`);
  process.exit(1);
}

function argValue(args: string[], name: string): string | undefined {
  const i = args.indexOf(name);
  if (i === -1) {
    return undefined;
  }
  return args[i + 1];
}

function argAll(args: string[], name: string): string[] {
  const out: string[] = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === name && args[i + 1]) {
      out.push(args[i + 1]!);
    }
  }
  return out;
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const cmd = argv[0] ?? 'serve';

  if (cmd === '-h' || cmd === '--help' || cmd === 'help') {
    usage();
  }

  const storeSpec = argValue(argv, '--store') ?? process.env.COLLAB_STORE ?? 'memory';
  const store = storeSpec.startsWith('sqlite:')
    ? sqliteStore({ path: storeSpec.slice('sqlite:'.length) })
    : storeSpec === 'sqlite'
      ? sqliteStore({ path: './collab.db' })
      : memoryStore();

  if (cmd === 'inspect') {
    const docId = argv[1];
    if (!docId) {
      usage();
    }
    const room = await store.loadRoom(docId);
    console.log(JSON.stringify(room, null, 2));
    await store.close?.();
    return;
  }

  if (cmd === 'compact') {
    const docId = argValue(argv, '--doc') ?? argv[1];
    if (!docId) {
      usage();
    }
    const keep = Number(argValue(argv, '--keep') ?? 100);
    const room = await store.compactSnapshot(docId, keep);
    console.log(
      room ? `compacted ${docId} → version ${room.version}, ops ${room.ops.length}` : 'not found'
    );
    await store.close?.();
    return;
  }

  if (cmd !== 'serve') {
    usage();
  }

  const authMode = argValue(argv, '--auth') ?? (process.env.COLLAB_JWT_SECRET ? 'jwt' : 'static');
  const token = argValue(argv, '--token') ?? process.env.COLLAB_TOKEN;
  const jwtSecret = argValue(argv, '--jwt-secret') ?? process.env.COLLAB_JWT_SECRET;

  if (authMode === 'jwt') {
    if (!jwtSecret) {
      console.error('JWT auth requires --jwt-secret or COLLAB_JWT_SECRET');
      process.exit(1);
    }
  } else if (!token) {
    console.error('Static auth requires --token or COLLAB_TOKEN (fail-closed)');
    process.exit(1);
  }

  const auth =
    authMode === 'jwt' ? hmacJwtAuth({ secret: jwtSecret! }) : staticTokenAuth({ token: token! });

  const redisUrl = argValue(argv, '--redis') ?? process.env.COLLAB_REDIS;
  const redis = redisUrl ? await createRedisFanout({ url: redisUrl }) : undefined;
  const webhooks = argAll(argv, '--webhook').map((url) => ({ url }));

  const port = Number(argValue(argv, '--port') ?? process.env.PORT ?? 8080);
  const host = argValue(argv, '--host') ?? '0.0.0.0';
  const path = argValue(argv, '--path') ?? '/collab';

  const server = await createCollaborationServer({
    store,
    auth,
    path,
    redis,
    webhooks: webhooks.length > 0 ? webhooks : undefined,
  });
  await server.listen(port, host);
  console.log(
    `CodeMerge collab v2 on ws://${host}:${port}${path} (REST ${path}/rooms/:id, health ${path}/health)`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
