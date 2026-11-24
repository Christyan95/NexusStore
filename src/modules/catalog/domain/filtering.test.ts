import { describe, expect, it } from 'vitest';
import type { CatalogProduct } from './entities';
import { filterAndPaginateProducts, normalizeSearchText } from './filtering';

const SAMPLE_PRODUCTS: readonly CatalogProduct[] = [
  {
    id: '1',
    slug: 'kindle-geracao',
    name: 'Kindle 11ª Geração',
    description: 'Leitor digital',
    affiliateUrl: 'https://www.amazon.com.br/dp/1',
    outboundUrl: 'https://www.amazon.com.br/dp/1',
    imageUrl: 'https://m.media-amazon.com/images/1.jpg',
    currentPrice: 499,
    originalPrice: null,
    currency: 'BRL',
    ratingValue: 4.7,
    reviewCount: 100,
    isTrending: false,
    priceSyncedAt: '2026-11-24T10:00:00Z',
    createdAt: '2026-11-24T10:00:00Z',
    category: { id: 'c1', name: 'Tecnologia', slug: 'tecnologia' },
    platform: {
      id: 'p1',
      name: 'Amazon',
      slug: 'amazon',
      rootDomain: 'amazon.com.br',
      primaryColor: '#007185',
    },
  },
  {
    id: '2',
    slug: 'air-fryer',
    name: 'Air Fryer Digital',
    description: 'Fritadeira elétrica',
    affiliateUrl: 'https://www.mercadolivre.com.br/p/2',
    outboundUrl: 'https://www.mercadolivre.com.br/p/2',
    imageUrl: 'https://http2.mlstatic.com/2.webp',
    currentPrice: 399,
    originalPrice: 549,
    currency: 'BRL',
    ratingValue: 4.9,
    reviewCount: 250,
    isTrending: true,
    priceSyncedAt: '2026-11-24T10:00:00Z',
    createdAt: '2026-11-24T11:00:00Z',
    category: { id: 'c2', name: 'Casa', slug: 'casa' },
    platform: {
      id: 'p2',
      name: 'Mercado Livre',
      slug: 'mercado-livre',
      rootDomain: 'mercadolivre.com.br',
      primaryColor: '#FFE600',
    },
  },
];

describe('catalog filtering and search', () => {
  it('realiza busca insensível a acentos e caixa (pt-BR)', () => {
    expect(normalizeSearchText('Geração Eletrônica')).toBe('geracao eletronica');
    const result = filterAndPaginateProducts(SAMPLE_PRODUCTS, { search: 'geracao' });
    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.id).toBe('1');
  });

  it('ordena por menor preço e filtra por plataforma e destaque', () => {
    const byPrice = filterAndPaginateProducts(SAMPLE_PRODUCTS, { sortBy: 'MENOR_PRECO' });
    expect(byPrice.items.map((item) => item.id)).toEqual(['2', '1']);

    const trendingOnly = filterAndPaginateProducts(SAMPLE_PRODUCTS, { onlyTrending: true });
    expect(trendingOnly.items.map((item) => item.id)).toEqual(['2']);

    const byPlatform = filterAndPaginateProducts(SAMPLE_PRODUCTS, {
      platformSlug: 'mercado-livre',
    });
    expect(byPlatform.items.map((item) => item.id)).toEqual(['2']);
  });
});
