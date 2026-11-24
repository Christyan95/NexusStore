import type { AppError } from '@/core/errors/app-error';
import { logger } from '@/core/logging/logger';
import { ok, type Result } from '@/core/errors/result';
import { buildOutboundOfferUrl, validateHttpsImageUrl } from '@/core/security/affiliate-url';
import { FALLBACK_PRODUCT_IMAGE_DATA_URI } from '../domain/constants';
import type { CatalogFacets, CatalogPage, CatalogProduct, CatalogQuery } from '../domain/entities';
import { sanitizeCatalogQuery } from '../domain/filtering';
import type { CatalogRepositoryPort } from './catalog-repository.port';

export class ListCatalogUseCase {
  private readonly repository: CatalogRepositoryPort;
  private readonly redirectBaseUrl: string | null;

  constructor(repository: CatalogRepositoryPort, redirectBaseUrl: string | null) {
    this.repository = repository;
    this.redirectBaseUrl = redirectBaseUrl;
  }

  public async execute(
    rawQuery: Partial<CatalogQuery>,
    signal?: AbortSignal,
  ): Promise<Result<CatalogPage, AppError>> {
    const query = sanitizeCatalogQuery(rawQuery);
    const result = await this.repository.listProducts(query, signal);

    if (!result.ok) {
      return result;
    }

    const safeItems: CatalogProduct[] = [];
    for (const item of result.value.items) {
      const outboundUrl = buildOutboundOfferUrl({
        slug: item.slug,
        directAffiliateUrl: item.affiliateUrl,
        allowedRootDomain: item.platform.rootDomain,
        redirectBaseUrl: this.redirectBaseUrl,
      });

      if (!outboundUrl) {
        logger.warn('catalog_item_dropped_unsafe_affiliate_url', {
          productId: item.id,
          platformSlug: item.platform.slug,
        });
        continue;
      }

      const safeImageUrl = validateHttpsImageUrl(item.imageUrl) ?? FALLBACK_PRODUCT_IMAGE_DATA_URI;

      safeItems.push({
        ...item,
        outboundUrl,
        imageUrl: safeImageUrl,
      });
    }

    return ok({
      ...result.value,
      items: safeItems,
    });
  }

  public async getFacets(signal?: AbortSignal): Promise<Result<CatalogFacets, AppError>> {
    return this.repository.listFacets(signal);
  }
}
