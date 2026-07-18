import type { CorsOptions } from 'cors';

/**
 * Allowed origins come only from env (no hardcoded localhost).
 *
 * Railway / production example:
 *   CLIENT_URL=https://your-app.vercel.app
 * Or multiple:
 *   CLIENT_ORIGINS=https://your-app.vercel.app,http://localhost:5173
 *
 * Local: set CLIENT_URL in server/.env
 * If unset, reflects the request Origin (any) so deploys are not bricked.
 */
export function getCorsOptions(): CorsOptions {
  const raw = (
    process.env.CLIENT_ORIGINS ||
    process.env.CLIENT_URL ||
    ''
  ).trim();

  const allowed = raw
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  return {
    origin(origin, callback) {
      // Non-browser clients (curl, server-to-server) often send no Origin
      if (!origin) {
        callback(null, true);
        return;
      }

      // No env configured → reflect any origin (Bearer JWT API)
      if (allowed.length === 0) {
        callback(null, true);
        return;
      }

      if (allowed.includes('*') || allowed.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Content-Disposition'],
    optionsSuccessStatus: 204,
  };
}
