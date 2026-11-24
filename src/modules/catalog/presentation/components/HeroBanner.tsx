import { ShieldCheck } from 'lucide-react';

export function HeroBanner() {
  const currentYear = new Date().getFullYear();

  return (
    <section aria-labelledby="hero-heading" className="mx-auto mt-6 max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="relative isolate overflow-hidden rounded-3xl bg-slate-900 shadow-xl">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-0 top-0 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/30 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 translate-x-1/2 translate-y-1/2 rounded-full bg-cyan-500/20 blur-3xl"
        />

        <div className="relative z-10 px-6 py-12 text-center sm:px-12 sm:py-16 sm:text-left">
          <div className="max-w-2xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-indigo-400/25 bg-indigo-500/15 px-3 py-1 text-xs font-semibold text-indigo-200">
              <ShieldCheck className="h-3.5 w-3.5 text-cyan-300" aria-hidden="true" />
              CURADORIA VERIFICADA {currentYear}
            </div>
            <h1
              id="hero-heading"
              className="text-3xl font-extrabold tracking-tight text-white leading-tight sm:text-5xl"
            >
              Ofertas Selecionadas{' '}
              <span className="bg-gradient-to-r from-indigo-400 to-cyan-300 bg-clip-text text-transparent">
                com Transparência Real
              </span>
            </h1>
            <p className="mt-4 max-w-xl text-base text-slate-300 sm:text-lg">
              Produtos escolhidos na Amazon, Mercado Livre e Shopee com preços auditáveis,
              avaliações reais e redirecionamento exclusivo para domínios oficiais.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
