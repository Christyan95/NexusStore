import { z } from 'zod';
import { CURRENCY_VALUES } from '../domain/constants';
import type { CatalogFacets, CatalogProduct } from '../domain/entities';

const NonEmptyString = z.string().trim().min(1);
const SlugString = z
  .string()
  .trim()
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/);
const HexColorString = z
  .string()
  .trim()
  .regex(/^#[0-9A-Fa-f]{6}$/);

export const RpcVitrineRowSchema = z
  .object({
    IDEN_PROD: z.string().uuid(),
    SLUG_PROD: SlugString,
    NOME_PROD: NonEmptyString.max(200),
    DESC_PROD: z.string().trim().max(500).nullable().optional().default(null),
    URLA_PROD: z.string().url().startsWith('https://'),
    URLI_PROD: z.string().url().startsWith('https://'),
    PRAT_PROD: z.coerce.number().finite().positive().max(999_999_999_999.99),
    PROR_PROD: z.union([z.null(), z.coerce.number().finite().positive().max(999_999_999_999.99)]),
    MOED_PROD: z.enum(CURRENCY_VALUES).default('BRL'),
    AVAL_PROD: z.coerce.number().finite().min(0).max(5),
    QAVA_PROD: z.coerce.number().int().min(0).default(0),
    DEST_PROD: z.boolean(),
    SINC_PROD: NonEmptyString,
    CREA_PROD: NonEmptyString,
    IDEN_CATE: z.string().uuid(),
    NOME_CATE: NonEmptyString.max(80),
    SLUG_CATE: SlugString,
    IDEN_PLAT: z.string().uuid(),
    NOME_PLAT: NonEmptyString.max(60),
    SLUG_PLAT: SlugString,
    DOMI_PLAT: NonEmptyString.max(255),
    CORP_PLAT: HexColorString,
    TOTA_ITEN: z.coerce.number().int().min(0),
  })
  .refine((row) => row.PROR_PROD === null || row.PROR_PROD >= row.PRAT_PROD, {
    message: 'PROR_PROD não pode ser menor que PRAT_PROD.',
    path: ['PROR_PROD'],
  });

export type RpcVitrineRowDto = z.infer<typeof RpcVitrineRowSchema>;

export const RpcFacetsSchema = z.object({
  categorias: z.array(
    z.object({
      id: z.string().uuid(),
      nome: NonEmptyString.max(80),
      slug: SlugString,
      ordem: z.coerce.number().int().min(0),
      total_produtos: z.coerce.number().int().min(0),
    }),
  ),
  plataformas: z.array(
    z.object({
      id: z.string().uuid(),
      nome: NonEmptyString.max(60),
      slug: SlugString,
      dominio: NonEmptyString.max(255),
      cor_primaria: HexColorString,
      total_produtos: z.coerce.number().int().min(0),
    }),
  ),
});

export function mapRpcRowToDomainProduct(row: RpcVitrineRowDto): CatalogProduct {
  return {
    id: row.IDEN_PROD,
    slug: row.SLUG_PROD,
    name: row.NOME_PROD,
    description: row.DESC_PROD,
    affiliateUrl: row.URLA_PROD,
    outboundUrl: row.URLA_PROD,
    imageUrl: row.URLI_PROD,
    currentPrice: row.PRAT_PROD,
    originalPrice: row.PROR_PROD,
    currency: row.MOED_PROD,
    ratingValue: row.AVAL_PROD,
    reviewCount: row.QAVA_PROD,
    isTrending: row.DEST_PROD,
    priceSyncedAt: row.SINC_PROD,
    createdAt: row.CREA_PROD,
    category: {
      id: row.IDEN_CATE,
      name: row.NOME_CATE,
      slug: row.SLUG_CATE,
    },
    platform: {
      id: row.IDEN_PLAT,
      name: row.NOME_PLAT,
      slug: row.SLUG_PLAT,
      rootDomain: row.DOMI_PLAT,
      primaryColor: row.CORP_PLAT,
    },
  };
}

export function mapRpcFacetsToDomain(dto: z.infer<typeof RpcFacetsSchema>): CatalogFacets {
  return {
    categories: dto.categorias.map((c) => ({
      id: c.id,
      name: c.nome,
      slug: c.slug,
      displayOrder: c.ordem,
      productCount: c.total_produtos,
    })),
    platforms: dto.plataformas.map((p) => ({
      id: p.id,
      name: p.nome,
      slug: p.slug,
      rootDomain: p.dominio,
      primaryColor: p.cor_primaria,
      productCount: p.total_produtos,
    })),
  };
}
