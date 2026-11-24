export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-20 border-t border-slate-200 bg-white py-10">
      <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
        <p className="text-sm font-medium text-slate-600">
          © {currentYear} Nexus Store. Todos os direitos reservados.
        </p>
        <p className="mx-auto mt-2 max-w-2xl text-xs leading-relaxed text-slate-400">
          Aviso de transparência: a Nexus Store participa de programas de afiliados da Amazon,
          Mercado Livre e Shopee e pode receber comissão por compras qualificadas. Preços e
          disponibilidade são sincronizados periodicamente e podem variar no marketplace de destino.
        </p>
      </div>
    </footer>
  );
}
