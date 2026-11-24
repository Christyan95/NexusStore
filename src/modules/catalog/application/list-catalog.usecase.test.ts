import { describe, expect, it } from 'vitest';
import { ok } from '@/core/errors/result';
import type { CatalogRepositoryPort } from './catalog-repository.port';
import { ListCatalogUseCase } from './list-catalog.usecase';
import type { CatalogProduct } from '../domain/entities';

function makeProduct(overrides: Partial<CatalogProduct>): CatalogProduct {
  return {
    id: '33333333-3333-4000-8000-000000000001',
    slug: 'produto-seguro',
    name: 'Produto Seguro',
    description: null,
    affiliateUrl: 'https://www.amazon.com.br/dp/B0CHWRXH8B',
    outboundUrl: 'https://www.amazon.com.br/dp/B0CHWRXH8B',
    imageUrl: 'https://m.media-amazon.com/images/I/img.jpg',
    currentPrice: 199.9,
    originalPrice: 249.9,
    currency: 'BRL',
    ratingValue: 4.8,
    reviewCount: 120,
    isTrending: true,
    priceSyncedAt: '2026-11-24T11:00:00Z',
    createdAt: '2026-11-24T11:00:00Z',
    category: { id: 'c1', name: 'Tecnologia', slug: 'tecnologia' },
    platform: {
      id: 'p1',
      name: 'Amazon',
      slug: 'amazon',
      rootDomain: 'amazon.com.br',
      primaryColor: '#007185',
    },
    ...overrides,
  };
}

describe('ListCatalogUseCase', () => {
  it('descarta itens com domínio de afiliado fora da allowlist e reescreve links para redirect', async () => {
    const fakeRepo: CatalogRepositoryPort = {
      listProducts: () =>
        Promise.resolve(
          ok({
            items: [
              makeProduct({ id: 'safe-1', slug: 'item-valido' }),
              makeProduct({
                id: 'phish-2',
                slug: 'item-malicioso',
                affiliateUrl: 'https://evil-phishing.example/amazon',
              }),
            ],
            totalItems: 2,
            page: 1,
            pageSize: 20,
            totalPages: 1,
            hasNextPage: false,
            hasPreviousPage: false,
          }),
        ),
      listFacets: () => Promise.resolve(ok({ categories: [], platforms: [] })),
    };

    const useCase = new ListCatalogUseCase(
      fakeRepo,
      'https://demo.supabase.co/functions/v1/redirect',
    );

    const result = await useCase.execute({ page: 1 });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.items).toHaveLength(1);
      expect(result.value.items[0]?.id).toBe('safe-1');
      expect(result.value.items[0]?.outboundUrl).toBe(
        'https://demo.supabase.co/functions/v1/redirect?slug=item-valido',
      );
    }
  });
});
