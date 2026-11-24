import type { CurrencyCode } from './constants';

const formatterCache = new Map<CurrencyCode, Intl.NumberFormat>();

function getCurrencyFormatter(currency: CurrencyCode): Intl.NumberFormat {
  const existing = formatterCache.get(currency);
  if (existing) {
    return existing;
  }

  const formatter = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  formatterCache.set(currency, formatter);
  return formatter;
}

export function formatMoney(amount: number, currency: CurrencyCode = 'BRL'): string {
  if (!Number.isFinite(amount) || amount <= 0) {
    return 'Indisponível';
  }
  return getCurrencyFormatter(currency).format(amount);
}

/**
 * Calcula percentual real de desconto exclusivamente quando existe preço original
 * auditável estritamente superior ao preço atual. Jamais fabrica descontos artificiais.
 */
export function calculateRealDiscountPercent(
  currentPrice: number,
  originalPrice: number | null,
): number | null {
  if (
    originalPrice === null ||
    !Number.isFinite(currentPrice) ||
    !Number.isFinite(originalPrice) ||
    currentPrice <= 0 ||
    originalPrice <= currentPrice
  ) {
    return null;
  }

  const percent = Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
  return percent >= 1 && percent <= 99 ? percent : null;
}

const syncDateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
});

export function formatPriceSyncedAt(isoDate: string): string | null {
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return syncDateFormatter.format(parsed);
}

const reviewCountFormatter = new Intl.NumberFormat('pt-BR');

export function formatReviewCount(count: number): string {
  if (!Number.isFinite(count) || count < 0) {
    return '0';
  }
  return reviewCountFormatter.format(Math.floor(count));
}
