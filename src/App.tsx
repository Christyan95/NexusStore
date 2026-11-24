import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppError } from '@/core/errors/app-error';
import { StorefrontPage } from '@/modules/catalog/presentation/pages/StorefrontPage';
import { ErrorBoundary } from '@/shared/ui/ErrorBoundary';

function shouldRetryQuery(failureCount: number, error: Error): boolean {
  if (failureCount >= 2) {
    return false;
  }
  if (error instanceof AppError) {
    return error.retryable;
  }
  return true;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: shouldRetryQuery,
      retryDelay: (attempt) => Math.min(1_000 * 2 ** attempt, 4_000),
    },
  },
});

export function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <StorefrontPage />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
