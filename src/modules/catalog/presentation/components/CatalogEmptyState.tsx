import { RotateCcw, Search } from 'lucide-react';

interface CatalogEmptyStateProps {
  readonly hasActiveFilters: boolean;
  readonly onResetFilters: () => void;
}

export function CatalogEmptyState({ hasActiveFilters, onResetFilters }: CatalogEmptyStateProps) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
      <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        <Search className="h-7 w-7" aria-hidden="true" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900">Nenhuma oferta encontrada</h3>
      <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
        {hasActiveFilters
          ? 'Nenhum produto corresponde à combinação atual de busca e filtros.'
          : 'Ainda não há ofertas publicadas no catálogo no momento.'}
      </p>
      {hasActiveFilters && (
        <button
          type="button"
          onClick={onResetFilters}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Limpar todos os filtros
        </button>
      )}
    </div>
  );
}
