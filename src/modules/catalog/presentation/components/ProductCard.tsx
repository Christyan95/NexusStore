import { memo, useState } from 'react';
import { Clock, ExternalLink, ShoppingBag, Star } from 'lucide-react';
import { FALLBACK_PRODUCT_IMAGE_DATA_URI } from '../../domain/constants';
import type { CatalogProduct } from '../../domain/entities';
import {
  calculateRealDiscountPercent,
  formatMoney,
  formatPriceSyncedAt,
  formatReviewCount,
} from '../../domain/pricing';

interface ProductCardProps {
  readonly product: CatalogProduct;
}

const PLATFORM_BADGE_CLASSES: Readonly<Record<string, string>> = {
  amazon: 'bg-[#007185]/10 border-[#007185]/25 text-[#007185]',
  shopee: 'bg-[#EE4D2D]/10 border-[#EE4D2D]/25 text-[#C8371A]',
  'mercado-livre': 'bg-[#FFE600]/25 border-[#D4B800]/40 text-amber-950',
};

export const ProductCard = memo(function ProductCard({ product }: ProductCardProps) {
  const [hasImageError, setHasImageError] = useState(false);

  const realDiscount = calculateRealDiscountPercent(product.currentPrice, product.originalPrice);
  const syncedLabel = formatPriceSyncedAt(product.priceSyncedAt);
  const badgeClasses =
    PLATFORM_BADGE_CLASSES[product.platform.slug] ?? 'bg-slate-100 border-slate-200 text-slate-700';

  const resolvedImageSrc = hasImageError ? FALLBACK_PRODUCT_IMAGE_DATA_URI : product.imageUrl;

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white transition duration-200 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-100/50">
      <div className="absolute left-3 top-3 z-10 flex flex-wrap gap-1.5">
        {product.isTrending && (
          <span className="inline-flex items-center gap-1 rounded-md bg-amber-400 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-amber-950 shadow-xs">
            <Star className="h-3 w-3 fill-amber-950" aria-hidden="true" />
            Em Alta
          </span>
        )}
        {realDiscount !== null && (
          <span className="rounded-md bg-emerald-600 px-2 py-0.5 text-[11px] font-bold text-white shadow-xs">
            -{realDiscount}%
          </span>
        )}
      </div>

      <div className="relative aspect-square overflow-hidden bg-white p-4">
        <img
          src={resolvedImageSrc}
          alt={product.name}
          loading="lazy"
          decoding="async"
          onError={() => {
            if (!hasImageError) {
              setHasImageError(true);
            }
          }}
          className="h-full w-full object-contain transition-transform duration-300 ease-out group-hover:scale-105"
        />
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="mb-2 flex items-center justify-between gap-2">
          <span
            className={`rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${badgeClasses}`}
          >
            {product.platform.name}
          </span>

          <div
            className="flex items-center gap-1 text-xs"
            aria-label={`Avaliação ${product.ratingValue.toFixed(1)} de 5`}
          >
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
            <span className="font-bold text-slate-800">{product.ratingValue.toFixed(1)}</span>
            {product.reviewCount > 0 && (
              <span className="text-slate-400">({formatReviewCount(product.reviewCount)})</span>
            )}
          </div>
        </div>

        <h3 className="mb-2 flex-grow text-sm font-semibold leading-snug text-slate-900 line-clamp-2 sm:text-base group-hover:text-indigo-700 transition-colors">
          {product.name}
        </h3>

        {product.description && (
          <p className="mb-3 text-xs leading-relaxed text-slate-500 line-clamp-2">
            {product.description}
          </p>
        )}

        <div className="mt-auto border-t border-slate-100 pt-3">
          <div className="flex flex-wrap items-baseline gap-2">
            {realDiscount !== null && product.originalPrice !== null && (
              <span className="text-xs text-slate-400 line-through">
                {formatMoney(product.originalPrice, product.currency)}
              </span>
            )}
            <span className="text-lg font-extrabold text-indigo-700">
              {formatMoney(product.currentPrice, product.currency)}
            </span>
          </div>

          {syncedLabel && (
            <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-400">
              <Clock className="h-3 w-3 shrink-0" aria-hidden="true" />
              <span>Verificado em {syncedLabel}</span>
            </p>
          )}

          <a
            href={product.outboundUrl}
            target="_blank"
            rel="noopener noreferrer sponsored"
            aria-label={`Ver oferta de ${product.name} em ${product.platform.name} (abre em nova aba)`}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-indigo-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            <ShoppingBag className="h-4 w-4" aria-hidden="true" />
            <span>Ver na {product.platform.name}</span>
            <ExternalLink className="h-3.5 w-3.5 opacity-75" aria-hidden="true" />
          </a>
        </div>
      </div>
    </article>
  );
});
