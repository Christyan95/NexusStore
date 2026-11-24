import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { generateRequestId } from '@/core/errors/app-error';
import { logger } from '@/core/logging/logger';

interface ErrorBoundaryProps {
  readonly children: ReactNode;
}

interface ErrorBoundaryState {
  readonly hasError: boolean;
  readonly incidentId: string | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public override state: ErrorBoundaryState = {
    hasError: false,
    incidentId: null,
  };

  public static getDerivedStateFromError(): ErrorBoundaryState {
    return {
      hasError: true,
      incidentId: generateRequestId(),
    };
  }

  public override componentDidCatch(error: Error, info: ErrorInfo): void {
    logger.error('react_error_boundary_caught', {
      incidentId: this.state.incidentId ?? 'unknown',
      errorName: error.name,
      hasComponentStack: Boolean(info.componentStack),
    });
  }

  private readonly handleReset = (): void => {
    this.setState({ hasError: false, incidentId: null });
  };

  public override render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div
        role="alert"
        className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12"
      >
        <div className="bg-white max-w-md w-full rounded-2xl border border-slate-200 shadow-lg p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-amber-600">
            <AlertTriangle className="h-7 w-7" aria-hidden="true" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Algo inesperado aconteceu</h1>
          <p className="mt-2 text-sm text-slate-600">
            Não foi possível renderizar esta página no momento. Você pode tentar novamente abaixo.
          </p>
          {this.state.incidentId && (
            <p className="mt-4 text-xs text-slate-400 font-mono">
              Referência: {this.state.incidentId}
            </p>
          )}
          <button
            type="button"
            onClick={this.handleReset}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-600 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Recarregar vitrine
          </button>
        </div>
      </div>
    );
  }
}
