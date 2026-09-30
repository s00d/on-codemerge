/**
 * Optional Redis fanout between process instances.
 * Uses dynamic import so `redis` is an optional peer dependency.
 */
export type RedisFanout = {
  publish: (channel: string, message: string) => Promise<void>;
  subscribe: (channel: string, onMessage: (message: string) => void) => Promise<() => void>;
  close: () => Promise<void>;
};

export type RedisFanoutOptions = {
  url: string;
  /** Single pub/sub channel for all rooms (default `ocm-collab:broadcast`) */
  channel?: string;
};

export async function createRedisFanout(opts: RedisFanoutOptions): Promise<RedisFanout> {
  type RedisClient = {
    connect: () => Promise<unknown>;
    publish: (channel: string, message: string) => Promise<unknown>;
    subscribe: (channel: string, listener: (message: string) => void) => Promise<unknown>;
    unsubscribe: (channel: string) => Promise<unknown>;
    quit: () => Promise<unknown>;
  };
  type RedisMod = { createClient: (opts: { url: string }) => RedisClient };

  let mod: RedisMod;
  try {
    mod = (await import('redis')) as unknown as RedisMod;
  } catch {
    throw new Error('redis package is required for Redis fanout. Install: pnpm add redis');
  }
  const channel = opts.channel ?? 'ocm-collab:broadcast';
  const pub = mod.createClient({ url: opts.url });
  const sub = mod.createClient({ url: opts.url });
  await pub.connect();
  await sub.connect();
  return {
    async publish(_ch, message) {
      await pub.publish(channel, message);
    },
    async subscribe(_ch, onMessage) {
      await sub.subscribe(channel, (message: string) => {
        onMessage(message);
      });
      return async () => {
        await sub.unsubscribe(channel);
      };
    },
    async close() {
      await pub.quit();
      await sub.quit();
    },
  };
}
