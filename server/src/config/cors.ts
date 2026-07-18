import type { CorsOptions } from 'cors';

function parseAllowedOrigins(): string[] {
  const raw = (
    process.env.CLIENT_ORIGINS ||
    process.env.CLIENT_URL ||
    ''
  ).trim();

  return raw
    .split(',')
    .map((o) => o.trim().replace(/\/$/, ''))
    .filter(Boolean);
}

function isLocalOrigin(origin: string): boolean {
  try {
    const { hostname } = new URL(origin);
    return hostname === 'localhost' || hostname === '127.0.0.1';
  } catch {
    return false;
  }
}

/**
 * Allowed origins come only from env (no hardcoded deploy URLs).
 *
 * Railway / production example:
 *   CLIENT_ORIGINS=https://your-app.vercel.app,http://localhost:5173
 *
 * If unset → reflect any Origin (Bearer JWT API).
 * If env only lists localhost but the request is from a remote Origin
 * (common when Railway still has a leftover local CLIENT_URL) → allow
 * the request Origin so production is not bricked.
 */
export function getCorsOptions(): CorsOptions {
  const allowed = parseAllowedOrigins();

  if (allowed.length > 0) {
    console.log(`[cors] allow-list: ${allowed.join(', ')}`);
  } else {
    console.log('[cors] no CLIENT_URL / CLIENT_ORIGINS — reflecting any Origin');
  }

  return {
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }

      const normalized = origin.replace(/\/$/, '');

      if (allowed.length === 0) {
        callback(null, true);
        return;
      }

      if (allowed.includes('*') || allowed.includes(normalized)) {
        callback(null, true);
        return;
      }

      // Stale localhost-only allow-list on a deployed host
      const onlyLocal = allowed.every(isLocalOrigin);
      if (onlyLocal && !isLocalOrigin(normalized)) {
        console.warn(
          `[cors] allow-list is localhost-only; reflecting remote Origin ${normalized}. Set CLIENT_ORIGINS to include your frontend URL.`
        );
        callback(null, true);
        return;
      }

      console.warn(`[cors] blocked Origin: ${normalized}`);
      callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Content-Disposition'],
    optionsSuccessStatus: 204,
  };
}
