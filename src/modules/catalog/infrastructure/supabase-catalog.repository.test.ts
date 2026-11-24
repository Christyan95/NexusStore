import { describe, expect, it, vi } from 'vitest';
import { createDefaultCatalogQuery } from '../domain/filtering';
import { SupabaseCatalogRepository } from './supabase-catalog.repository';
import type { NexusSupabaseClient } from './supabase.client';

const VALID_RPC_ROW = {
  IDEN_PROD: '33333333-3333-4000-8000-000000000001',
  SLUG_PROD: 'apple-airpods-pro-2',
  NOME_PROD: 'Apple AirPods Pro 2',
  DESC_PROD: 'Áudio espacial',
  URLA_PROD: 'https://www.amazon.com.br/dp/B0CHWRXH8B',
  URLI_PROD: 'https://m.media-amazon.com/images/I/61SUj2aKoEL.jpg',
  PRAT_PROD: '1899.00',
  PROR_PROD: '2299.00',
  MOED_PROD: 'BRL',
  AVAL_PROD: '4.8',
  QAVA_PROD: 3420,
  DEST_PROD: true,
  SINC_PROD: '2026-11-24T11:10:00Z',
  CREA_PROD: '2026-11-24T11:10:00Z',
  IDEN_CATE: '11111111-1111-4000-8000-000000000001',
  NOME_CATE: 'Tecnologia',
  SLUG_CATE: 'tecnologia',
  IDEN_PLAT: '22222222-2222-4000-8000-000000000001',
  NOME_PLAT: 'Amazon',
  SLUG_PLAT: 'amazon',
  DOMI_PLAT: 'amazon.com.br',
  CORP_PLAT: '#007185',
  TOTA_ITEN: 25,
};

function createFakeClient(
  rpcHandler: (fn: string, params?: unknown) => unknown,
): NexusSupabaseClient {
  return {
    schema: vi.fn(() => ({
      rpc: vi.fn((fn: string, params?: unknown) => Promise.resolve(rpcHandler(fn, params))),
    })),
  } as unknown as NexusSupabaseClient;
}

describe('SupabaseCatalogRepository contract adapter', () => {
  it('mapeia linhas válidas da RPC, descarta registros corrompidos e calcula paginação', async () => {
    const client = createFakeClient((fn) => {
      if (fn === 'RPC_LISTAR_VITRINE') {
        return {
          data: [
            VALID_RPC_ROW,
            { ...VALID_RPC_ROW, IDEN_PROD: '33333333-3333-4000-8000-000000000099', PRAT_PROD: -50 },
          ],
          error: null,
        };
      }
      return {
        data: {
          categorias: [
            {
              id: '11111111-1111-4000-8000-000000000001',
              nome: 'Tecnologia',
              slug: 'tecnologia',
              ordem: 1,
              total_produtos: 25,
            },
          ],
          plataformas: [
            {
              id: '22222222-2222-4000-8000-000000000001',
              nome: 'Amazon',
              slug: 'amazon',
              dominio: 'amazon.com.br',
              cor_primaria: '#007185',
              total_produtos: 25,
            },
          ],
        },
        error: null,
      };
    });

    const repo = new SupabaseCatalogRepository(client);

    const pageResult = await repo.listProducts(createDefaultCatalogQuery());
    expect(pageResult.ok).toBe(true);
    if (pageResult.ok) {
      expect(pageResult.value.items).toHaveLength(1);
      expect(pageResult.value.totalItems).toBe(25);
      expect(pageResult.value.totalPages).toBe(2);
      expect(pageResult.value.hasNextPage).toBe(true);
    }

    const facetsResult = await repo.listFacets();
    expect(facetsResult.ok).toBe(true);
    if (facetsResult.ok) {
      expect(facetsResult.value.categories).toHaveLength(1);
      expect(facetsResult.value.platforms).toHaveLength(1);
    }
  });

  it('retorna AppError seguro sem expor detalhes internos quando a RPC falha', async () => {
    const client = createFakeClient(() => ({
      data: null,
      error: { code: '42501', message: 'permission denied for schema NEXUSSTORE' },
    }));

    const repo = new SupabaseCatalogRepository(client);
    const result = await repo.listProducts(createDefaultCatalogQuery());

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('UPSTREAM_ERROR');
      expect(result.error.userMessage).not.toContain('NEXUSSTORE');
      expect(result.error.requestId).toMatch(/^req_/);
    }
  });
});
