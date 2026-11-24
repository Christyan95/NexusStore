import type { AppError } from '@/core/errors/app-error';
import type { Result } from '@/core/errors/result';
import type { CatalogFacets, CatalogPage, CatalogQuery } from '../domain/entities';

export interface CatalogRepositoryPort {
  listProducts(query: CatalogQuery, signal?: AbortSignal): Promise<Result<CatalogPage, AppError>>;
  listFacets(signal?: AbortSignal): Promise<Result<CatalogFacets, AppError>>;
}
