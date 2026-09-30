import type { CollabRole } from './protocol';

export type AuthContext = {
  docId?: string;
  remoteAddress?: string;
  /** Client-claimed identity (static/dev tokens may accept this for multi-user demos). */
  claimedUserId?: string;
};

function sanitizeUserId(raw: string | undefined, fallback: string): string {
  if (!raw) {
    return fallback;
  }
  const cleaned = raw.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64);
  return cleaned || fallback;
}

export type AuthSession = {
  userId: string;
  role: CollabRole;
  /** Optional allow-list of doc ids; empty/undefined = all */
  docs?: string[];
};

export type AuthAdapter = {
  verify: (token: string, ctx: AuthContext) => Promise<AuthSession | null> | AuthSession | null;
};

/**
 * Dev/static shared secret.
 * When the client sends `auth.userId`, that claim is used so multiple tabs can
 * share one token without colliding on authorId / presence.
 */
export function staticTokenAuth(opts: {
  token: string;
  userId?: string;
  role?: CollabRole;
}): AuthAdapter {
  const expected = opts.token;
  const defaultUserId = opts.userId ?? 'user';
  const role = opts.role ?? 'write';
  return {
    verify(token, ctx) {
      if (token !== expected) {
        return null;
      }
      return { userId: sanitizeUserId(ctx.claimedUserId, defaultUserId), role };
    },
  };
}

/** Minimal HS256 JWT (header.payload.sig) — claims: sub, role?, docs? */
export function hmacJwtAuth(opts: { secret: string }): AuthAdapter {
  const secret = opts.secret;
  return {
    async verify(token) {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }
      const [headerB64, payloadB64, sigB64] = parts;
      if (!headerB64 || !payloadB64 || !sigB64) {
        return null;
      }
      const data = `${headerB64}.${payloadB64}`;
      const key = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign', 'verify']
      );
      const sig = Buffer.from(sigB64, 'base64url');
      const ok = await crypto.subtle.verify('HMAC', key, sig, new TextEncoder().encode(data));
      if (!ok) {
        return null;
      }
      let payload: Record<string, unknown>;
      try {
        payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8')) as Record<
          string,
          unknown
        >;
      } catch {
        return null;
      }
      const sub = payload.sub;
      if (typeof sub !== 'string' || !sub) {
        return null;
      }
      const roleRaw = payload.role;
      const role: CollabRole =
        roleRaw === 'read' || roleRaw === 'write' || roleRaw === 'comment' ? roleRaw : 'write';
      const docs = Array.isArray(payload.docs)
        ? payload.docs.filter((d): d is string => typeof d === 'string')
        : undefined;
      if (typeof payload.exp === 'number' && Date.now() / 1000 > payload.exp) {
        return null;
      }
      return { userId: sub, role, docs };
    },
  };
}

export async function signHmacJwt(
  secret: string,
  claims: { sub: string; role?: CollabRole; docs?: string[]; exp?: number }
): Promise<string> {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify(claims)).toString('base64url');
  const data = `${header}.${payload}`;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = Buffer.from(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data)));
  return `${data}.${sig.toString('base64url')}`;
}
