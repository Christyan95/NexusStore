import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { CategoryFacet } from '../../domain/entities';

interface CategoryBarProps {
  readonly categories: readonly CategoryFacet[];
  readonly selectedCategorySlug: string | null;
  readonly onSelectCategory: (slug: string | null) => void;
}

const SCROLL_STEP_PX = 220;

export function CategoryBar({
  categories,
  selectedCategorySlug,
  onSelectCategory,
}: CategoryBarProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const scrollByDirection = (direction: 'left' | 'right') => {
    scrollRef.current?.scrollBy({
      left: direction === 'left' ? -SCROLL_STEP_PX : SCROLL_STEP_PX,
      behavior: 'smooth',
    });
  };

  return (
    <section
      aria-label="Filtrar por categoria"
      className="mx-auto mt-8 max-w-7xl px-4 sm:px-6 lg:px-8"
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => scrollByDirection('left')}
          aria-label="Rolar categorias para a esquerda"
          className="hidden rounded-full p-2 text-slate-600 hover:bg-slate-200 transition md:inline-flex focus-visible:outline-2 focus-visible:outline-indigo-600"
        >
          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
        </button>

        <div
          ref={scrollRef}
          className="no-scrollbar flex flex-1 gap-2.5 overflow-x-auto pb-1 scroll-smooth"
        >
          <button
            type="button"
            aria-pressed={selectedCategorySlug === null}
            onClick={() => onSelectCategory(null)}
            className={`whitespace-nowrap rounded-full border px-5 py-2 text-sm font-medium transition ${
              selectedCategorySlug === null
                ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm'
                : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-300 hover:text-indigo-700'
            }`}
          >
            Todas
          </button>

          {categories.map((category) => {
            const isSelected = selectedCategorySlug === category.slug;
            return (
              <button
                key={category.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => onSelectCategory(category.slug)}
                className={`whitespace-nowrap rounded-full border px-5 py-2 text-sm font-medium transition ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-300 hover:text-indigo-700'
                }`}
              >
                <span>{category.name}</span>
                {category.productCount > 0 && (
                  <span
                    className={`ml-2 rounded-full px-1.5 py-0.5 text-xs ${
                      isSelected ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {category.productCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => scrollByDirection('right')}
          aria-label="Rolar categorias para a direita"
          className="hidden rounded-full p-2 text-slate-600 hover:bg-slate-200 transition md:inline-flex focus-visible:outline-2 focus-visible:outline-indigo-600"
        >
          <ChevronRight className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}
