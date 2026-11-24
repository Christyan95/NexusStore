import { AppError, generateRequestId, toAppError } from '@/core/errors/app-error';
import { err, ok, type Result } from '@/core/errors/result';
import { logger } from '@/core/logging/logger';
import type { CatalogRepositoryPort } from '../application/catalog-repository.port';
import type { CatalogFacets, CatalogPage, CatalogProduct, CatalogQuery } from '../domain/entities';
import {
  mapRpcFacetsToDomain,
  mapRpcRowToDomainProduct,
  RpcFacetsSchema,
  RpcVitrineRowSchema,
} from './catalog.schemas';
import type { NexusSupabaseClient } from './supabase.client';

const NEXUS_SCHEMA = 'NEXUSSTORE';

export class SupabaseCatalogRepository implements CatalogRepositoryPort {
  private readonly client: NexusSupabaseClient;

  constructor(client: NexusSupabaseClient) {
    this.client = client;
  }

  public async listProducts(
    query: CatalogQuery,
    signal?: AbortSignal,
  ): Promise<Result<CatalogPage, AppError>> {
    const requestId = generateRequestId();

    try {
      const rpcCall = this.client.schema(NEXUS_SCHEMA).rpc('RPC_LISTAR_VITRINE', {
        P_BUSC: query.search.length > 0 ? query.search : null,
        P_CATE: query.categorySlug,
        P_PLAT: query.platformSlug,
        P_DEST: query.onlyTrending,
        P_ORDE: query.sortBy,
        P_PAGI: query.page,
        P_LIMP: query.pageSize,
      });

      const response = signal ? await rpcCall.abortSignal(signal) : await rpcCall;

      if (response.error) {
        logger.error('supabase_rpc_listar_vitrine_failed', {
          requestId,
          code: response.error.code,
        });
        return err(
          new AppError({
            code: 'UPSTREAM_ERROR',
            message: `RPC_LISTAR_VITRINE falhou (${response.error.code ?? 'sem código'}).`,
            userMessage:
              'Não foi possível carregar o catálogo de ofertas agora. Tente novamente em instantes.',
            requestId,
            retryable: true,
            cause: response.error,
          }),
        );
      }

      const rawRows = Array.isArray(response.data) ? response.data : [];
      const items: CatalogProduct[] = [];
      let totalItems = 0;

      for (const rawRow of rawRows) {
        const parsed = RpcVitrineRowSchema.safeParse(rawRow);
        if (!parsed.success) {
          logger.warn('catalog_row_rejected_by_contract', {
            requestId,
            issueCount: parsed.error.issues.length,
          });
          continue;
        }
        totalItems = parsed.data.TOTA_ITEN;
        items.push(mapRpcRowToDomainProduct(parsed.data));
      }

      const effectiveTotal = Math.max(totalItems, items.length);
      const totalPages = Math.max(1, Math.ceil(effectiveTotal / query.pageSize));

      return ok({
        items,
        totalItems: effectiveTotal,
        page: query.page,
        pageSize: query.pageSize,
        totalPages,
        hasNextPage: query.page < totalPages,
        hasPreviousPage: query.page > 1,
      });
    } catch (caught) {
      const appError = toAppError(caught, requestId);
      logger.error('supabase_rpc_listar_vitrine_exception', {
        requestId: appError.requestId,
        code: appError.code,
      });
      return err(appError);
    }
  }

  public async listFacets(signal?: AbortSignal): Promise<Result<CatalogFacets, AppError>> {
    const requestId = generateRequestId();

    try {
      const rpcCall = this.client.schema(NEXUS_SCHEMA).rpc('RPC_LISTAR_FACETAS');
      const response = signal ? await rpcCall.abortSignal(signal) : await rpcCall;

      if (response.error) {
        logger.error('supabase_rpc_listar_facetas_failed', {
          requestId,
          code: response.error.code,
        });
        return err(
          new AppError({
            code: 'UPSTREAM_ERROR',
            message: `RPC_LISTAR_FACETAS falhou (${response.error.code ?? 'sem código'}).`,
            userMessage: 'Não foi possível carregar os filtros da loja no momento.',
            requestId,
            retryable: true,
            cause: response.error,
          }),
        );
      }

      const parsed = RpcFacetsSchema.safeParse(response.data);
      if (!parsed.success) {
        logger.error('supabase_rpc_listar_facetas_invalid_contract', {
          requestId,
          issueCount: parsed.error.issues.length,
        });
        return err(
          new AppError({
            code: 'VALIDATION_ERROR',
            message: 'Contrato de facetas inválido retornado pelo servidor.',
            userMessage: 'Não foi possível carregar os filtros da loja no momento.',
            requestId,
            retryable: false,
          }),
        );
      }

      return ok(mapRpcFacetsToDomain(parsed.data));
    } catch (caught) {
      const appError = toAppError(caught, requestId);
      logger.error('supabase_rpc_listar_facetas_exception', {
        requestId: appError.requestId,
        code: appError.code,
      });
      return err(appError);
    }
  }
}
