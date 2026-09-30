export type WebhookConfig = {
  url: string;
  secret?: string;
  events?: string[];
};

export function createWebhookEmitter(
  cfg?: WebhookConfig | WebhookConfig[]
): (event: string, payload: Record<string, unknown>) => void {
  const list = !cfg ? [] : Array.isArray(cfg) ? cfg : [cfg];
  if (list.length === 0) {
    return () => {};
  }
  return (event, payload) => {
    for (const hook of list) {
      if (hook.events && !hook.events.includes(event) && !hook.events.includes('*')) {
        continue;
      }
      const body = JSON.stringify({ event, payload, at: Date.now() });
      const headers: Record<string, string> = {
        'content-type': 'application/json',
      };
      if (hook.secret) {
        headers['x-codemerge-webhook-secret'] = hook.secret;
      }
      void fetch(hook.url, { method: 'POST', headers, body }).catch(() => {
        /* fire-and-forget */
      });
    }
  };
}
