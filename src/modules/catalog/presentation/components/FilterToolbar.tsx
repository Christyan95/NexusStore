import { RotateCcw, Star } from 'lucide-react';
import { SORT_OPTION_LABELS, SORT_OPTION_VALUES, type SortOption } from '../../domain/constants';
import type { PlatformFacet } from '../../domain/entities';

interface FilterToolbarProps {
  readonly platforms: readonly PlatformFacet[];
  readonly selectedPlatformSlug: string | null;
  readonly onlyTrending: boolean;
  readonly sortBy: SortOption;
  readonly hasActiveFilters: boolean;
  readonly onSelectPlatform: (slug: string | null) => void;
  readonly onToggleTrending: () => void;
  readonly onChangeSort: (sort: SortOption) => void;
  readonly onResetFilters: () => void;
}

export function FilterToolbar({
  platforms,
  selectedPlatformSlug,
  onlyTrending,
  sortBy,
  hasActiveFilters,
  onSelectPlatform,
  onToggleTrending,
  onChangeSort,
  onResetFilters,
}: FilterToolbarProps) {
  return (
    <div className="mb-8 flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs lg:flex-row lg:items-center lg:justify-between">
      <div className="no-scrollbar flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0">
        <span className="whitespace-nowrap text-sm font-semibold text-slate-700">Plataforma:</span>
        <button
          type="button"
          aria-pressed={selectedPlatformSlug === null}
          onClick={() => onSelectPlatform(null)}
          className={`whitespace-nowrap rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
            selectedPlatformSlug === null
              ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
              : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
          }`}
        >
          Todas
        </button>

        {platforms.map((platform) => {
          const isSelected = selectedPlatformSlug === platform.slug;
          return (
            <button
              key={platform.id}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onSelectPlatform(platform.slug)}
              className={`whitespace-nowrap rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                isSelected
                  ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                  : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
              }`}
            >
              {platform.name}
            </button>
          );
        })}
      </div>

      <div className="h-px w-full bg-slate-200 lg:h-8 lg:w-px" aria-hidden="true" />

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          aria-pressed={onlyTrending}
          onClick={onToggleTrending}
          className={`inline-flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-sm font-semibold transition ${
            onlyTrending
              ? 'border-amber-300 bg-amber-100 text-amber-900 ring-2 ring-amber-400/50'
              : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Star
            className={`h-4 w-4 ${onlyTrending ? 'fill-amber-600 text-amber-600' : 'text-slate-400'}`}
            aria-hidden="true"
          />
          <span>Em Alta</span>
        </button>

        <div className="flex items-center gap-2">
          <label
            htmlFor="catalog-sort"
            className="whitespace-nowrap text-sm font-semibold text-slate-700"
          >
            Ordenar por:
          </label>
          <select
            id="catalog-sort"
            value={sortBy}
            onChange={(event) => onChangeSort(event.target.value as SortOption)}
            className="cursor-pointer rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none hover:bg-slate-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
          >
            {SORT_OPTION_VALUES.map((option) => (
              <option key={option} value={option}>
                {SORT_OPTION_LABELS[option]}
              </option>
            ))}
          </select>
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-50 transition"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            Limpar filtros
          </button>
        )}
      </div>
    </div>
  );
}
