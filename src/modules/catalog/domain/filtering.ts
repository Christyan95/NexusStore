import { CATALOG_DEFAULTS, SORT_OPTION_VALUES, type SortOption } from './constants';
import type { CatalogPage, CatalogProduct, CatalogQuery } from './entities';

export function normalizeSearchText(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function isSortOption(value: string | null | undefined): value is SortOption {
  return typeof value === 'string' && (SORT_OPTION_VALUES as readonly string[]).includes(value);
}

export function createDefaultCatalogQuery(): CatalogQuery {
  return {
    search: '',
    categorySlug: null,
    platformSlug: null,
    onlyTrending: false,
    sortBy: 'RECOMENDADOS',
    page: CATALOG_DEFAULTS.PAGE,
    pageSize: CATALOG_DEFAULTS.PAGE_SIZE,
  };
}

export function sanitizeCatalogQuery(query: Partial<CatalogQuery>): CatalogQuery {
  const defaults = createDefaultCatalogQuery();
  const page =
    Number.isInteger(query.page) && (query.page ?? 0) >= 1 ? (query.page as number) : defaults.page;
  const pageSize =
    Number.isInteger(query.pageSize) && (query.pageSize ?? 0) >= 1
      ? Math.min(query.pageSize as number, CATALOG_DEFAULTS.MAX_PAGE_SIZE)
      : defaults.pageSize;

  return {
    search: (query.search ?? '').trim().slice(0, CATALOG_DEFAULTS.SEARCH_MAX_LENGTH),
    categorySlug: query.categorySlug ? query.categorySlug.trim().toLowerCase() || null : null,
    platformSlug: query.platformSlug ? query.platformSlug.trim().toLowerCase() || null : null,
    onlyTrending: Boolean(query.onlyTrending),
    sortBy: isSortOption(query.sortBy) ? query.sortBy : defaults.sortBy,
    page,
    pageSize,
  };
}

export function filterAndPaginateProducts(
  products: readonly CatalogProduct[],
  rawQuery: Partial<CatalogQuery>,
): CatalogPage {
  const query = sanitizeCatalogQuery(rawQuery);
  const normalizedSearch = normalizeSearchText(query.search);

  const filtered = products.filter((product) => {
    const matchesSearch =
      normalizedSearch.length === 0 ||
      normalizeSearchText(product.name).includes(normalizedSearch) ||
      (product.description !== null &&
        normalizeSearchText(product.description).includes(normalizedSearch));

    const matchesCategory =
      query.categorySlug === null || product.category.slug === query.categorySlug;

    const matchesPlatform =
      query.platformSlug === null || product.platform.slug === query.platformSlug;

    const matchesTrending = !query.onlyTrending || product.isTrending;

    return matchesSearch && matchesCategory && matchesPlatform && matchesTrending;
  });

  const sorted = [...filtered].sort((a, b) => {
    switch (query.sortBy) {
      case 'MENOR_PRECO':
        return a.currentPrice - b.currentPrice || a.id.localeCompare(b.id);
      case 'MAIOR_PRECO':
        return b.currentPrice - a.currentPrice || a.id.localeCompare(b.id);
      case 'MELHOR_AVALIACAO':
        return (
          b.ratingValue - a.ratingValue || b.reviewCount - a.reviewCount || a.id.localeCompare(b.id)
        );
      case 'MENOR_AVALIACAO':
        return a.ratingValue - b.ratingValue || a.id.localeCompare(b.id);
      case 'RECOMENDADOS':
      default:
        return (
          Number(b.isTrending) - Number(a.isTrending) ||
          b.ratingValue - a.ratingValue ||
          b.createdAt.localeCompare(a.createdAt) ||
          a.id.localeCompare(b.id)
        );
    }
  });

  const totalItems = sorted.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / query.pageSize));
  const safePage = Math.min(query.page, totalPages);
  const offset = (safePage - 1) * query.pageSize;
  const items = sorted.slice(offset, offset + query.pageSize);

  return {
    items,
    totalItems,
    page: safePage,
    pageSize: query.pageSize,
    totalPages,
    hasNextPage: safePage < totalPages,
    hasPreviousPage: safePage > 1,
  };
}
