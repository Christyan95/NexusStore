import { AlertCircle, RotateCcw } from 'lucide-react';
import type { AppError } from '@/core/errors/app-error';

interface CatalogErrorStateProps {
  readonly error: AppError;
  readonly onRetry: () => void;
}

export function CatalogErrorState({ error, onRetry }: CatalogErrorStateProps) {
  return (
    <div
      role="alert"
      className="mx-auto max-w-lg rounded-3xl border border-red-100 bg-white p-8 text-center shadow-sm"
    >
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">
        <AlertCircle className="h-7 w-7" aria-hidden="true" />
      </div>
      <h2 className="text-xl font-bold text-slate-900">Indisponibilidade temporária</h2>
      <p className="mt-2 text-sm text-slate-600">{error.userMessage}</p>
      <p className="mt-4 font-mono text-xs text-slate-400">Código de suporte: {error.requestId}</p>

      {error.retryable && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Tentar novamente
        </button>
      )}
    </div>
  );
}
