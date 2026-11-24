export type AppErrorCode =
  | 'CONFIG_MISSING'
  | 'VALIDATION_ERROR'
  | 'NETWORK_ERROR'
  | 'TIMEOUT_ERROR'
  | 'UPSTREAM_ERROR'
  | 'UNSAFE_URL'
  | 'UNKNOWN_ERROR';

export class AppError extends Error {
  public readonly code: AppErrorCode;
  public readonly userMessage: string;
  public readonly requestId: string;
  public readonly retryable: boolean;

  constructor(params: {
    code: AppErrorCode;
    message: string;
    userMessage: string;
    requestId?: string;
    retryable?: boolean;
    cause?: unknown;
  }) {
    super(params.message, { cause: params.cause });
    this.name = 'AppError';
    this.code = params.code;
    this.userMessage = params.userMessage;
    this.requestId = params.requestId ?? generateRequestId();
    this.retryable = params.retryable ?? false;
  }
}

export function generateRequestId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `req_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;
  }
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export function toAppError(error: unknown, requestId?: string): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof DOMException && error.name === 'AbortError') {
    return new AppError({
      code: 'TIMEOUT_ERROR',
      message: 'A requisição expirou ou foi cancelada.',
      userMessage: 'A consulta demorou mais do que o esperado. Tente novamente em instantes.',
      requestId,
      retryable: true,
      cause: error,
    });
  }

  if (error instanceof Error) {
    const isNetwork = /network|fetch|failed to fetch|offline/i.test(error.message);
    return new AppError({
      code: isNetwork ? 'NETWORK_ERROR' : 'UNKNOWN_ERROR',
      message: error.message,
      userMessage: isNetwork
        ? 'Sem conexão com o servidor de ofertas. Verifique sua internet e tente novamente.'
        : 'Não foi possível carregar as ofertas neste momento. Tente novamente em instantes.',
      requestId,
      retryable: true,
      cause: error,
    });
  }

  return new AppError({
    code: 'UNKNOWN_ERROR',
    message: 'Erro inesperado sem instância Error.',
    userMessage:
      'Não foi possível carregar as ofertas neste momento. Tente novamente em instantes.',
    requestId,
    retryable: true,
    cause: error,
  });
}
