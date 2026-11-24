export const CATALOG_DEFAULTS = {
  PAGE: 1,
  PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 60,
  SEARCH_MAX_LENGTH: 120,
  SEARCH_DEBOUNCE_MS: 300,
  REQUEST_TIMEOUT_MS: 10_000,
  STALE_TIME_MS: 60_000,
  GC_TIME_MS: 5 * 60_000,
} as const;

export const SORT_OPTION_VALUES = [
  'RECOMENDADOS',
  'MENOR_PRECO',
  'MAIOR_PRECO',
  'MELHOR_AVALIACAO',
  'MENOR_AVALIACAO',
] as const;

export type SortOption = (typeof SORT_OPTION_VALUES)[number];

export const SORT_OPTION_LABELS: Readonly<Record<SortOption, string>> = {
  RECOMENDADOS: 'Recomendados',
  MENOR_PRECO: 'Menor Preço',
  MAIOR_PRECO: 'Maior Preço',
  MELHOR_AVALIACAO: 'Melhor Avaliação',
  MENOR_AVALIACAO: 'Menor Avaliação',
};

export const CURRENCY_VALUES = ['BRL', 'USD', 'EUR'] as const;
export type CurrencyCode = (typeof CURRENCY_VALUES)[number];

export const QUERY_PARAM_KEYS = {
  SEARCH: 'q',
  CATEGORY: 'categoria',
  PLATFORM: 'plataforma',
  TRENDING: 'destaque',
  SORT: 'ordem',
  PAGE: 'pagina',
} as const;

// SVG inline leve e determinístico (< 500 bytes) — elimina dependência de via.placeholder.com e risco de loop infinito
export const FALLBACK_PRODUCT_IMAGE_DATA_URI =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400' fill='none'%3E%3Crect width='400' height='400' fill='%23F1F5F9'/%3E%3Crect x='140' y='128' width='120' height='96' rx='16' fill='%23CBD5E1'/%3E%3Ccircle cx='176' cy='162' r='12' fill='%2394A3B8'/%3E%3Cpath d='M152 212l34-34 24 22 18-16 20 28H152Z' fill='%2394A3B8'/%3E%3Ctext x='200' y='268' text-anchor='middle' fill='%2364748B' font-family='system-ui,sans-serif' font-size='16' font-weight='600'%3ENexus Store%3C/text%3E%3C/svg%3E";
