# ADR-003 — Paginação/Filtragem Server-Side (RPC), Validação Zod e Separação de Estado

- **Status:** Aceito
- **Data:** 2026-11-24
- **Contexto:** O código original executava `select('*').limit(100)` e filtrava/ordenava tudo em memória no navegador, truncando silenciosamente o catálogo a partir do 101º item e disparando re-renders a cada tecla sem debounce nem sincronização de URL.

## Decisão

1. Encapsular busca textual (FTS Português + fallback substring seguro), filtros (categoria, plataforma, destaque), ordenação whitelisted e paginação (`LIMIT`/`OFFSET` controlado + `total_count`) na função PostgreSQL `"NEXUSSTORE"."RPC_LISTAR_VITRINE"`.
2. Validar **100% dos inputs e outputs** na borda com **Zod** e retornar resultados tipados via **Result Pattern** (`Result<T, AppError>`).
3. Separar rigorosamente estados no frontend:
   - **Estado de Servidor:** `@tanstack/react-query` (cache, deduplicação, cancelamento via `AbortSignal`, retries com backoff exponencial).
   - **Estado Compartilhável de Navegação:** `URLSearchParams` (`?q=&categoria=&plataforma=&destaque=&ordem=&pagina=`).
   - **Estado Local de UI:** somente interações efêmeras (drawer mobile, fallback de imagem).

## Trade-offs

- **O que ganhamos:** Catálogo escala para centenas de milhares de produtos com payload mínimo por página (20 itens), links compartilháveis/favoritáveis, resiliência a respostas malformadas e zero race conditions em `StrictMode`.
- **O que perdemos:** Dependência de `@tanstack/react-query` e `zod` (~25 KB gzip combinados no bundle, mitigado com `manualChunks`).
- **Risco assumido:** Paginação por `OFFSET` degrada em páginas muito profundas (> 10.000 itens); mitigável migrando o mesmo contrato de porta para _keyset/cursor pagination_ sem quebrar a UI.
