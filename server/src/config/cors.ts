import type { CorsOptions } from 'cors';

/**
 * Reflect the request Origin so any frontend (Vercel, localhost, etc.)
 * can call this API without maintaining an allow-list in env.
 * Auth uses Bearer JWT in headers (not cookies), so this is safe for assignment scope.
 */
export function getCorsOptions(): CorsOptions {
  return {
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Content-Disposition'],
    optionsSuccessStatus: 204,
  };
}
