export type LogLevel = 'info' | 'warn' | 'error';

const REDACTED_KEYS = new Set([
  'authorization',
  'apikey',
  'password',
  'token',
  'secret',
  'service_role',
  'cookie',
  'ip',
]);

function scrubMeta(meta: Record<string, unknown>): Record<string, unknown> {
  const safe: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(meta)) {
    if (REDACTED_KEYS.has(key.toLowerCase())) {
      safe[key] = '[REDACTED]';
    } else {
      safe[key] = value;
    }
  }
  return safe;
}

export function logEdgeEvent(
  level: LogLevel,
  event: string,
  requestId: string,
  meta: Record<string, unknown> = {},
): void {
  const payload = JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    service: 'nexus-store-edge',
    event,
    request_id: requestId,
    ...scrubMeta(meta),
  });

  if (level === 'error') {
    console.error(payload);
  } else if (level === 'warn') {
    console.warn(payload);
  } else {
    console.info(payload);
  }
}
