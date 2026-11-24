import { useState } from 'react';
import { Search, ShieldCheck, X } from 'lucide-react';
import { BrandLogo } from '@/shared/ui/BrandLogo';

interface NavbarProps {
  readonly searchValue: string;
  readonly onSearchChange: (value: string) => void;
  readonly onResetHome: () => void;
}

export function Navbar({ searchValue, onSearchChange, onResetHome }: NavbarProps) {
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/85 backdrop-blur-md shadow-xs">
      <nav aria-label="Navegação principal" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => {
              onResetHome();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            aria-label="Nexus Store — voltar ao início e limpar filtros"
            className="flex shrink-0 items-center gap-2.5 rounded-lg text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            <BrandLogo className="h-9 w-9 shadow-xs" />
            <span className="hidden bg-gradient-to-r from-indigo-600 to-indigo-900 bg-clip-text text-xl font-bold tracking-tight text-transparent sm:block">
              Nexus Store
            </span>
          </button>

          <div className="hidden flex-1 max-w-lg md:block">
            <label htmlFor="desktop-catalog-search" className="sr-only">
              Buscar ofertas por nome do produto
            </label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <input
                id="desktop-catalog-search"
                type="search"
                value={searchValue}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder="Buscar ofertas verificadas..."
                maxLength={120}
                className="block w-full rounded-full border border-slate-200 bg-slate-50 py-2 pl-10 pr-9 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition"
              />
              {searchValue.length > 0 && (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  aria-label="Limpar busca"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 sm:flex">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
              <span className="text-xs font-semibold text-emerald-800">Links Verificados</span>
            </div>

            <button
              type="button"
              onClick={() => setIsMobileSearchOpen((prev) => !prev)}
              aria-expanded={isMobileSearchOpen}
              aria-controls="mobile-catalog-search-panel"
              aria-label={isMobileSearchOpen ? 'Fechar busca' : 'Abrir busca'}
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden focus-visible:outline-2 focus-visible:outline-indigo-600"
            >
              {isMobileSearchOpen ? (
                <X className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Search className="h-5 w-5" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {isMobileSearchOpen && (
          <div id="mobile-catalog-search-panel" className="pb-4 md:hidden animate-slide-down">
            <label htmlFor="mobile-catalog-search" className="sr-only">
              Buscar ofertas por nome do produto
            </label>
            <div className="relative">
              <input
                id="mobile-catalog-search"
                type="search"
                value={searchValue}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder="Buscar ofertas verificadas..."
                maxLength={120}
                autoFocus
                className="block w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-4 pr-9 text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
              {searchValue.length > 0 && (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  aria-label="Limpar busca"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:text-slate-700"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
