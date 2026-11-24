type LogLevel = 'info' | 'warn' | 'error';

const SENSITIVE_KEY_PATTERN = /(token|secret|key|password|authorization|cookie|email|cpf|cnpj)/i;

function sanitizeContext(context?: Record<string, unknown>): Record<string, unknown> | undefined {
  if (!context) return undefined;
  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(context)) {
    sanitized[key] = SENSITIVE_KEY_PATTERN.test(key) ? '[REDACTED]' : value;
  }
  return sanitized;
}

function emit(level: LogLevel, event: string, context?: Record<string, unknown>): void {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    event,
    ...(sanitizeContext(context) ?? {}),
  };

  if (level === 'error') {
    console.error(JSON.stringify(entry));
  } else if (level === 'warn') {
    console.warn(JSON.stringify(entry));
  }
}

export const logger = {
  warn: (event: string, context?: Record<string, unknown>) => emit('warn', event, context),
  error: (event: string, context?: Record<string, unknown>) => emit('error', event, context),
};
