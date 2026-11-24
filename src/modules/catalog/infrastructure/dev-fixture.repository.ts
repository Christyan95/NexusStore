import { ok, type Result } from '@/core/errors/result';
import type { AppError } from '@/core/errors/app-error';
import type { CatalogRepositoryPort } from '../application/catalog-repository.port';
import type { CatalogFacets, CatalogPage, CatalogProduct, CatalogQuery } from '../domain/entities';
import { filterAndPaginateProducts } from '../domain/filtering';

const DEV_FIXTURE_PRODUCTS: readonly CatalogProduct[] = [
  {
    id: '33333333-3333-4000-8000-000000000001',
    slug: 'apple-airpods-pro-2-geracao-magsafe-usbc',
    name: 'Apple AirPods Pro (2ª Geração) com Estojo MagSafe USB-C',
    description:
      'Cancelamento ativo de ruído, modo ambiente adaptativo e resistência IP54 contra poeira e água.',
    affiliateUrl: 'https://www.amazon.com.br/dp/B0CHWRXH8B',
    outboundUrl: 'https://www.amazon.com.br/dp/B0CHWRXH8B',
    imageUrl: 'https://m.media-amazon.com/images/I/61SUj2aKoEL._AC_SX679_.jpg',
    currentPrice: 1899.0,
    originalPrice: 2299.0,
    currency: 'BRL',
    ratingValue: 4.8,
    reviewCount: 3420,
    isTrending: true,
    priceSyncedAt: '2026-11-24T11:10:00.000Z',
    createdAt: '2026-11-24T11:10:00.000Z',
    category: {
      id: '11111111-1111-4000-8000-000000000001',
      name: 'Tecnologia',
      slug: 'tecnologia',
    },
    platform: {
      id: '22222222-2222-4000-8000-000000000001',
      name: 'Amazon',
      slug: 'amazon',
      rootDomain: 'amazon.com.br',
      primaryColor: '#007185',
    },
  },
  {
    id: '33333333-3333-4000-8000-000000000002',
    slug: 'kindle-11-geracao-16gb-antirreflexo',
    name: 'Kindle 11ª Geração 16 GB Tela Antirreflexo 300 ppi',
    description:
      'Leitor digital ultraleve com iluminação embutida ajustável e bateria para semanas de leitura.',
    affiliateUrl: 'https://www.amazon.com.br/dp/B09SWW583J',
    outboundUrl: 'https://www.amazon.com.br/dp/B09SWW583J',
    imageUrl: 'https://m.media-amazon.com/images/I/71B1msY1JPL._AC_SX679_.jpg',
    currentPrice: 499.0,
    originalPrice: null,
    currency: 'BRL',
    ratingValue: 4.7,
    reviewCount: 8915,
    isTrending: false,
    priceSyncedAt: '2026-11-24T11:12:00.000Z',
    createdAt: '2026-11-24T11:12:00.000Z',
    category: {
      id: '11111111-1111-4000-8000-000000000001',
      name: 'Tecnologia',
      slug: 'tecnologia',
    },
    platform: {
      id: '22222222-2222-4000-8000-000000000001',
      name: 'Amazon',
      slug: 'amazon',
      rootDomain: 'amazon.com.br',
      primaryColor: '#007185',
    },
  },
  {
    id: '33333333-3333-4000-8000-000000000003',
    slug: 'creme-hidratante-cerave-454g-ceramidas',
    name: 'Creme Hidratante CeraVe 454g com Ceramidas e Ácido Hialurônico',
    description:
      'Hidratação prolongada com tecnologia MVE para pele seca e extrasseca, sem fragrância.',
    affiliateUrl: 'https://www.amazon.com.br/dp/B07V2G2M4P',
    outboundUrl: 'https://www.amazon.com.br/dp/B07V2G2M4P',
    imageUrl: 'https://m.media-amazon.com/images/I/61S6B2Z7WUL._AC_SX679_.jpg',
    currentPrice: 89.9,
    originalPrice: 109.9,
    currency: 'BRL',
    ratingValue: 4.9,
    reviewCount: 12540,
    isTrending: true,
    priceSyncedAt: '2026-11-24T11:15:00.000Z',
    createdAt: '2026-11-24T11:15:00.000Z',
    category: {
      id: '11111111-1111-4000-8000-000000000002',
      name: 'Beleza',
      slug: 'beleza',
    },
    platform: {
      id: '22222222-2222-4000-8000-000000000001',
      name: 'Amazon',
      slug: 'amazon',
      rootDomain: 'amazon.com.br',
      primaryColor: '#007185',
    },
  },
  {
    id: '33333333-3333-4000-8000-000000000004',
    slug: 'air-fryer-philips-walita-serie-3000-4-1l',
    name: 'Fritadeira Elétrica Air Fryer Philips Walita Série 3000 4,1L Digital',
    description:
      'Tecnologia Rapid Air patenteada com painel digital touch e 7 programas pré-definidos.',
    affiliateUrl:
      'https://www.mercadolivre.com.br/fritadeira-eletrica-philips-walita-41l/p/MLB3849201944',
    outboundUrl:
      'https://www.mercadolivre.com.br/fritadeira-eletrica-philips-walita-41l/p/MLB3849201944',
    imageUrl: 'https://http2.mlstatic.com/D_NQ_NP_2X_845912-MLU74123456789_012026-F.webp',
    currentPrice: 469.9,
    originalPrice: 599.0,
    currency: 'BRL',
    ratingValue: 4.8,
    reviewCount: 2180,
    isTrending: true,
    priceSyncedAt: '2026-11-24T11:18:00.000Z',
    createdAt: '2026-11-24T11:18:00.000Z',
    category: {
      id: '11111111-1111-4000-8000-000000000003',
      name: 'Casa e Cozinha',
      slug: 'casa-e-cozinha',
    },
    platform: {
      id: '22222222-2222-4000-8000-000000000002',
      name: 'Mercado Livre',
      slug: 'mercado-livre',
      rootDomain: 'mercadolivre.com.br',
      primaryColor: '#FFE600',
    },
  },
  {
    id: '33333333-3333-4000-8000-000000000005',
    slug: 'teclado-mecanico-75-sem-fio-tri-mode-brown',
    name: 'Teclado Mecânico Compacto 75% Sem Fio Tri-Mode Switch Brown',
    description: 'Conexão Bluetooth 5.0, Wireless 2.4GHz e USB-C com keycaps PBT e hot-swap.',
    affiliateUrl: 'https://shopee.com.br/product/192837465/9928174650',
    outboundUrl: 'https://shopee.com.br/product/192837465/9928174650',
    imageUrl: 'https://down-br.img.susercontent.com/file/br-11134207-7r98o-lxyz123456789',
    currentPrice: 279.9,
    originalPrice: 349.9,
    currency: 'BRL',
    ratingValue: 4.6,
    reviewCount: 640,
    isTrending: false,
    priceSyncedAt: '2026-11-24T11:20:00.000Z',
    createdAt: '2026-11-24T11:20:00.000Z',
    category: {
      id: '11111111-1111-4000-8000-000000000001',
      name: 'Tecnologia',
      slug: 'tecnologia',
    },
    platform: {
      id: '22222222-2222-4000-8000-000000000003',
      name: 'Shopee',
      slug: 'shopee',
      rootDomain: 'shopee.com.br',
      primaryColor: '#EE4D2D',
    },
  },
];

export class DevFixtureCatalogRepository implements CatalogRepositoryPort {
  public listProducts(query: CatalogQuery): Promise<Result<CatalogPage, AppError>> {
    return Promise.resolve(ok(filterAndPaginateProducts(DEV_FIXTURE_PRODUCTS, query)));
  }

  public listFacets(): Promise<Result<CatalogFacets, AppError>> {
    return Promise.resolve(
      ok({
        categories: [
          {
            id: '11111111-1111-4000-8000-000000000001',
            name: 'Tecnologia',
            slug: 'tecnologia',
            displayOrder: 1,
            productCount: 3,
          },
          {
            id: '11111111-1111-4000-8000-000000000002',
            name: 'Beleza',
            slug: 'beleza',
            displayOrder: 2,
            productCount: 1,
          },
          {
            id: '11111111-1111-4000-8000-000000000003',
            name: 'Casa e Cozinha',
            slug: 'casa-e-cozinha',
            displayOrder: 3,
            productCount: 1,
          },
        ],
        platforms: [
          {
            id: '22222222-2222-4000-8000-000000000001',
            name: 'Amazon',
            slug: 'amazon',
            rootDomain: 'amazon.com.br',
            primaryColor: '#007185',
            productCount: 3,
          },
          {
            id: '22222222-2222-4000-8000-000000000002',
            name: 'Mercado Livre',
            slug: 'mercado-livre',
            rootDomain: 'mercadolivre.com.br',
            primaryColor: '#FFE600',
            productCount: 1,
          },
          {
            id: '22222222-2222-4000-8000-000000000003',
            name: 'Shopee',
            slug: 'shopee',
            rootDomain: 'shopee.com.br',
            primaryColor: '#EE4D2D',
            productCount: 1,
          },
        ],
      }),
    );
  }
}
