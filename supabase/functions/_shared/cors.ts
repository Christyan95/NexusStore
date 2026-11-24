export interface SecurityHeadersOptions {
  readonly requestId: string;
  readonly origin?: string | null;
  readonly allowedOrigins?: readonly string[];
}

export function buildSecurityHeaders(options: SecurityHeadersOptions): Headers {
  const headers = new Headers({
    'X-Request-Id': options.requestId,
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
    'Cache-Control': 'no-store',
  });

  if (options.origin && options.allowedOrigins && options.allowedOrigins.length > 0) {
    if (options.allowedOrigins.includes(options.origin)) {
      headers.set('Access-Control-Allow-Origin', options.origin);
      headers.set('Vary', 'Origin');
      headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
      headers.set(
        'Access-Control-Allow-Headers',
        'authorization, x-client-info, apikey, content-type, x-request-id',
      );
    }
  }

  return headers;
}

export function parseAllowedOrigins(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.startsWith('https://') || entry.startsWith('http://localhost'));
}
