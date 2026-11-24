import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationControlsProps {
  readonly page: number;
  readonly totalPages: number;
  readonly totalItems: number;
  readonly hasPreviousPage: boolean;
  readonly hasNextPage: boolean;
  readonly isFetching: boolean;
  readonly onPageChange: (nextPage: number) => void;
}

export function PaginationControls({
  page,
  totalPages,
  totalItems,
  hasPreviousPage,
  hasNextPage,
  isFetching,
  onPageChange,
}: PaginationControlsProps) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <nav
      aria-label="Paginação do catálogo"
      className="mt-10 flex flex-col items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white px-5 py-4 sm:flex-row"
    >
      <p className="text-sm text-slate-600">
        Página <strong className="font-semibold text-slate-900">{page}</strong> de{' '}
        <strong className="font-semibold text-slate-900">{totalPages}</strong> · {totalItems}{' '}
        {totalItems === 1 ? 'oferta' : 'ofertas'}
      </p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={!hasPreviousPage || isFetching}
          onClick={() => onPageChange(page - 1)}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          Anterior
        </button>
        <button
          type="button"
          disabled={!hasNextPage || isFetching}
          onClick={() => onPageChange(page + 1)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-45"
        >
          Próxima
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
}
