import type { CurrencyCode, SortOption } from './constants';

export interface CategoryFacet {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly displayOrder: number;
  readonly productCount: number;
}

export interface PlatformFacet {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly rootDomain: string;
  readonly primaryColor: string;
  readonly productCount: number;
}

export interface CatalogFacets {
  readonly categories: readonly CategoryFacet[];
  readonly platforms: readonly PlatformFacet[];
}

export interface CatalogProduct {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly description: string | null;
  readonly affiliateUrl: string;
  readonly outboundUrl: string;
  readonly imageUrl: string;
  readonly currentPrice: number;
  readonly originalPrice: number | null;
  readonly currency: CurrencyCode;
  readonly ratingValue: number;
  readonly reviewCount: number;
  readonly isTrending: boolean;
  readonly priceSyncedAt: string;
  readonly createdAt: string;
  readonly category: {
    readonly id: string;
    readonly name: string;
    readonly slug: string;
  };
  readonly platform: {
    readonly id: string;
    readonly name: string;
    readonly slug: string;
    readonly rootDomain: string;
    readonly primaryColor: string;
  };
}

export interface CatalogQuery {
  readonly search: string;
  readonly categorySlug: string | null;
  readonly platformSlug: string | null;
  readonly onlyTrending: boolean;
  readonly sortBy: SortOption;
  readonly page: number;
  readonly pageSize: number;
}

export interface CatalogPage {
  readonly items: readonly CatalogProduct[];
  readonly totalItems: number;
  readonly page: number;
  readonly pageSize: number;
  readonly totalPages: number;
  readonly hasNextPage: boolean;
  readonly hasPreviousPage: boolean;
}
