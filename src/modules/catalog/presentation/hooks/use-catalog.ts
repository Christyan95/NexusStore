import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { AppError } from '@/core/errors/app-error';
import type { ListCatalogUseCase } from '../../application/list-catalog.usecase';
import { CATALOG_DEFAULTS } from '../../domain/constants';
import type { CatalogFacets, CatalogPage, CatalogQuery } from '../../domain/entities';
import { catalogUseCase as defaultCatalogUseCase } from '../../infrastructure/catalog-repository.factory';

export function useCatalogProducts(
  query: CatalogQuery,
  useCase: ListCatalogUseCase = defaultCatalogUseCase,
) {
  return useQuery<CatalogPage, AppError>({
    queryKey: ['catalog', 'products', query] as const,
    queryFn: async ({ signal }) => {
      const result = await useCase.execute(query, signal);
      if (!result.ok) {
        throw result.error;
      }
      return result.value;
    },
    placeholderData: keepPreviousData,
    staleTime: CATALOG_DEFAULTS.STALE_TIME_MS,
    gcTime: CATALOG_DEFAULTS.GC_TIME_MS,
  });
}

export function useCatalogFacets(useCase: ListCatalogUseCase = defaultCatalogUseCase) {
  return useQuery<CatalogFacets, AppError>({
    queryKey: ['catalog', 'facets'] as const,
    queryFn: async ({ signal }) => {
      const result = await useCase.getFacets(signal);
      if (!result.ok) {
        throw result.error;
      }
      return result.value;
    },
    staleTime: CATALOG_DEFAULTS.STALE_TIME_MS * 5,
    gcTime: CATALOG_DEFAULTS.GC_TIME_MS * 2,
  });
}
