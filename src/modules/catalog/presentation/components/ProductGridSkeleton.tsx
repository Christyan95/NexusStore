interface ProductGridSkeletonProps {
  readonly count?: number;
}

export function ProductGridSkeleton({ count = 8 }: ProductGridSkeletonProps) {
  return (
    <div
      aria-busy="true"
      aria-label="Carregando ofertas"
      className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4 lg:gap-8"
    >
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 animate-pulse"
        >
          <div className="mb-4 aspect-square w-full rounded-xl bg-slate-100" />
          <div className="mb-2 flex justify-between">
            <div className="h-4 w-16 rounded bg-slate-200" />
            <div className="h-4 w-10 rounded bg-slate-200" />
          </div>
          <div className="mb-2 h-4 w-full rounded bg-slate-200" />
          <div className="mb-4 h-4 w-3/4 rounded bg-slate-100" />
          <div className="mt-auto space-y-3 border-t border-slate-100 pt-3">
            <div className="h-6 w-28 rounded bg-slate-200" />
            <div className="h-10 w-full rounded-xl bg-slate-200" />
          </div>
        </div>
      ))}
    </div>
  );
}
