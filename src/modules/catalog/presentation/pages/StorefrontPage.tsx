import { useEffect, useState } from 'react';
import { TrendingUp } from 'lucide-react';
import type { ListCatalogUseCase } from '../../application/list-catalog.usecase';
import { CATALOG_DEFAULTS } from '../../domain/constants';
import type { CategoryFacet, PlatformFacet } from '../../domain/entities';
import { catalogUseCase as defaultCatalogUseCase } from '../../infrastructure/catalog-repository.factory';

const EMPTY_CATEGORIES: readonly CategoryFacet[] = [];
const EMPTY_PLATFORMS: readonly PlatformFacet[] = [];
import { CategoryBar } from '../components/CategoryBar';
import { CatalogEmptyState } from '../components/CatalogEmptyState';
import { CatalogErrorState } from '../components/CatalogErrorState';
import { FilterToolbar } from '../components/FilterToolbar';
import { Footer } from '../components/Footer';
import { HeroBanner } from '../components/HeroBanner';
import { Navbar } from '../components/Navbar';
import { PaginationControls } from '../components/PaginationControls';
import { ProductCard } from '../components/ProductCard';
import { ProductGridSkeleton } from '../components/ProductGridSkeleton';
import { useCatalogFacets, useCatalogProducts } from '../hooks/use-catalog';
import { useCatalogQueryParams } from '../hooks/use-catalog-query-params';
import { useDebouncedValue } from '../hooks/use-debounced-value';

interface StorefrontPageProps {
  readonly useCase?: ListCatalogUseCase;
}

export function StorefrontPage({ useCase = defaultCatalogUseCase }: StorefrontPageProps) {
  const {
    query,
    hasActiveFilters,
    setSearch,
    setCategorySlug,
    setPlatformSlug,
    toggleOnlyTrending,
    setSortBy,
    setPage,
    resetAllFilters,
  } = useCatalogQueryParams();

  const [searchInput, setSearchInput] = useState(query.search);
  const debouncedSearch = useDebouncedValue(searchInput, CATALOG_DEFAULTS.SEARCH_DEBOUNCE_MS);

  // Sincroniza entrada debounced com os query params de URL
  useEffect(() => {
    if (debouncedSearch !== query.search) {
      setSearch(debouncedSearch);
    }
  }, [debouncedSearch, query.search, setSearch]);

  const productsQuery = useCatalogProducts(query, useCase);
  const facetsQuery = useCatalogFacets(useCase);

  const categories = facetsQuery.data?.categories ?? EMPTY_CATEGORIES;
  const platforms = facetsQuery.data?.platforms ?? EMPTY_PLATFORMS;

  // SEO dinâmico leve no título do documento
  useEffect(() => {
    const activeCategory = categories.find((cat) => cat.slug === query.categorySlug);
    if (query.search.length > 0) {
      document.title = `Busca: ${query.search} | Nexus Store`;
    } else if (activeCategory) {
      document.title = `${activeCategory.name} | Nexus Store`;
    } else {
      document.title = 'Nexus Store | Curadoria de Ofertas Verificadas';
    }
  }, [categories, query.categorySlug, query.search]);

  const handleResetAll = () => {
    setSearchInput('');
    resetAllFilters();
  };

  const handlePageChange = (nextPage: number) => {
    setPage(nextPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const pageData = productsQuery.data;
  const totalItems = pageData?.totalItems ?? 0;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-indigo-100">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-indigo-600 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white focus:shadow-lg"
      >
        Pular para o conteúdo principal
      </a>

      <Navbar
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        onResetHome={handleResetAll}
      />

      <HeroBanner />

      <CategoryBar
        categories={categories}
        selectedCategorySlug={query.categorySlug}
        onSelectCategory={setCategorySlug}
      />

      <main id="main-content" className="mx-auto mt-8 max-w-7xl px-4 sm:px-6 lg:px-8">
        <FilterToolbar
          platforms={platforms}
          selectedPlatformSlug={query.platformSlug}
          onlyTrending={query.onlyTrending}
          sortBy={query.sortBy}
          hasActiveFilters={hasActiveFilters || searchInput.length > 0}
          onSelectPlatform={setPlatformSlug}
          onToggleTrending={toggleOnlyTrending}
          onChangeSort={setSortBy}
          onResetFilters={handleResetAll}
        />

        <div className="mb-6 flex items-center justify-between gap-4">
          <h2 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
            <span>{query.onlyTrending ? 'Ofertas em Alta' : 'Catálogo Verificado'}</span>
            <TrendingUp className="h-5 w-5 text-indigo-600" aria-hidden="true" />
          </h2>

          <p aria-live="polite" className="text-sm text-slate-500">
            {productsQuery.isPending
              ? 'Carregando...'
              : `${totalItems} ${totalItems === 1 ? 'produto encontrado' : 'produtos encontrados'}`}
          </p>
        </div>

        {productsQuery.isPending ? (
          <ProductGridSkeleton />
        ) : productsQuery.isError ? (
          <CatalogErrorState
            error={productsQuery.error}
            onRetry={() => {
              void productsQuery.refetch();
            }}
          />
        ) : pageData && pageData.items.length > 0 ? (
          <>
            <div
              className={`grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4 lg:gap-8 transition-opacity ${
                productsQuery.isFetching ? 'opacity-70' : 'opacity-100'
              }`}
            >
              {pageData.items.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            <PaginationControls
              page={pageData.page}
              totalPages={pageData.totalPages}
              totalItems={pageData.totalItems}
              hasPreviousPage={pageData.hasPreviousPage}
              hasNextPage={pageData.hasNextPage}
              isFetching={productsQuery.isFetching}
              onPageChange={handlePageChange}
            />
          </>
        ) : (
          <CatalogEmptyState
            hasActiveFilters={hasActiveFilters || searchInput.length > 0}
            onResetFilters={handleResetAll}
          />
        )}
      </main>

      <Footer />
    </div>
  );
}
