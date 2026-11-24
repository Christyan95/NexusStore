import { useCallback, useEffect, useState } from 'react';
import { CATALOG_DEFAULTS, QUERY_PARAM_KEYS, type SortOption } from '../../domain/constants';
import type { CatalogQuery } from '../../domain/entities';
import {
  createDefaultCatalogQuery,
  isSortOption,
  sanitizeCatalogQuery,
} from '../../domain/filtering';

export function parseQueryFromSearch(searchString: string): CatalogQuery {
  const params = new URLSearchParams(searchString);
  const rawPage = Number.parseInt(params.get(QUERY_PARAM_KEYS.PAGE) ?? '', 10);
  const rawSort = params.get(QUERY_PARAM_KEYS.SORT);

  return sanitizeCatalogQuery({
    search: params.get(QUERY_PARAM_KEYS.SEARCH) ?? '',
    categorySlug: params.get(QUERY_PARAM_KEYS.CATEGORY),
    platformSlug: params.get(QUERY_PARAM_KEYS.PLATFORM),
    onlyTrending: params.get(QUERY_PARAM_KEYS.TRENDING) === '1',
    sortBy: isSortOption(rawSort) ? rawSort : 'RECOMENDADOS',
    page: Number.isNaN(rawPage) ? CATALOG_DEFAULTS.PAGE : rawPage,
    pageSize: CATALOG_DEFAULTS.PAGE_SIZE,
  });
}

export function serializeQueryToSearch(query: CatalogQuery): string {
  const params = new URLSearchParams();

  if (query.search.trim().length > 0) {
    params.set(QUERY_PARAM_KEYS.SEARCH, query.search.trim());
  }
  if (query.categorySlug) {
    params.set(QUERY_PARAM_KEYS.CATEGORY, query.categorySlug);
  }
  if (query.platformSlug) {
    params.set(QUERY_PARAM_KEYS.PLATFORM, query.platformSlug);
  }
  if (query.onlyTrending) {
    params.set(QUERY_PARAM_KEYS.TRENDING, '1');
  }
  if (query.sortBy !== 'RECOMENDADOS') {
    params.set(QUERY_PARAM_KEYS.SORT, query.sortBy);
  }
  if (query.page > 1) {
    params.set(QUERY_PARAM_KEYS.PAGE, String(query.page));
  }

  const encoded = params.toString();
  return encoded.length > 0 ? `?${encoded}` : '';
}

export function useCatalogQueryParams() {
  const [query, setQuery] = useState<CatalogQuery>(() =>
    parseQueryFromSearch(window.location.search),
  );

  const commitQuery = useCallback((next: CatalogQuery) => {
    const sanitized = sanitizeCatalogQuery(next);
    setQuery(sanitized);

    const nextSearch = serializeQueryToSearch(sanitized);
    const nextUrl = `${window.location.pathname}${nextSearch}${window.location.hash}`;
    if (window.location.search !== nextSearch) {
      window.history.replaceState(null, '', nextUrl);
    }
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      setQuery(parseQueryFromSearch(window.location.search));
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const setSearch = useCallback(
    (search: string) => {
      commitQuery({ ...query, search, page: 1 });
    },
    [commitQuery, query],
  );

  const setCategorySlug = useCallback(
    (categorySlug: string | null) => {
      commitQuery({ ...query, categorySlug, page: 1 });
    },
    [commitQuery, query],
  );

  const setPlatformSlug = useCallback(
    (platformSlug: string | null) => {
      commitQuery({ ...query, platformSlug, page: 1 });
    },
    [commitQuery, query],
  );

  const toggleOnlyTrending = useCallback(() => {
    commitQuery({ ...query, onlyTrending: !query.onlyTrending, page: 1 });
  }, [commitQuery, query]);

  const setSortBy = useCallback(
    (sortBy: SortOption) => {
      commitQuery({ ...query, sortBy, page: 1 });
    },
    [commitQuery, query],
  );

  const setPage = useCallback(
    (page: number) => {
      commitQuery({ ...query, page });
    },
    [commitQuery, query],
  );

  const resetAllFilters = useCallback(() => {
    commitQuery(createDefaultCatalogQuery());
  }, [commitQuery]);

  const hasActiveFilters =
    query.search.length > 0 ||
    query.categorySlug !== null ||
    query.platformSlug !== null ||
    query.onlyTrending ||
    query.sortBy !== 'RECOMENDADOS';

  return {
    query,
    hasActiveFilters,
    setSearch,
    setCategorySlug,
    setPlatformSlug,
    toggleOnlyTrending,
    setSortBy,
    setPage,
    resetAllFilters,
  };
}
