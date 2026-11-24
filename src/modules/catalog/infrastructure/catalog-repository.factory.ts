import { appEnv, type AppEnvConfig } from '@/core/config/env';
import { AppError } from '@/core/errors/app-error';
import { err, type Result } from '@/core/errors/result';
import type { CatalogRepositoryPort } from '../application/catalog-repository.port';
import { ListCatalogUseCase } from '../application/list-catalog.usecase';
import type { CatalogFacets, CatalogPage } from '../domain/entities';
import { DevFixtureCatalogRepository } from './dev-fixture.repository';
import { createNexusSupabaseClient } from './supabase.client';
import { SupabaseCatalogRepository } from './supabase-catalog.repository';

class UnconfiguredCatalogRepository implements CatalogRepositoryPort {
  private createConfigError(): AppError {
    return new AppError({
      code: 'CONFIG_MISSING',
      message: 'Integração do catálogo não configurada no ambiente de execução.',
      userMessage:
        'A vitrine está temporariamente indisponível para manutenção técnica. Tente novamente em instantes.',
      retryable: false,
    });
  }

  public listProducts(): Promise<Result<CatalogPage, AppError>> {
    return Promise.resolve(err(this.createConfigError()));
  }

  public listFacets(): Promise<Result<CatalogFacets, AppError>> {
    return Promise.resolve(err(this.createConfigError()));
  }
}

export function createCatalogRepository(env: AppEnvConfig = appEnv): CatalogRepositoryPort {
  if (env.isConfigured && env.supabaseUrl && env.supabaseAnonKey) {
    const client = createNexusSupabaseClient({
      supabaseUrl: env.supabaseUrl,
      supabaseAnonKey: env.supabaseAnonKey,
    });
    return new SupabaseCatalogRepository(client);
  }

  // Somente em DEV explícito; em produção falha fechado (fail-closed) sem expor dados falsos
  if (import.meta.env.DEV && env.useDevFixture) {
    return new DevFixtureCatalogRepository();
  }

  return new UnconfiguredCatalogRepository();
}

export const catalogUseCase = new ListCatalogUseCase(
  createCatalogRepository(appEnv),
  appEnv.redirectBaseUrl,
);
