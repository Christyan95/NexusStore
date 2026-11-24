# Changelog

Todas as mudanças relevantes do **Nexus Store** são documentadas neste arquivo seguindo [Semantic Versioning](https://semver.org/).

## [2.0.0] — 2026-11-24

### Arquitetura & Frontend

- Migração completa de `App.jsx` monolítico para arquitetura modular em **TypeScript estrito** (`core`, `modules/catalog/{domain,application,infrastructure,presentation}`, `shared/ui`).
- Separação de estado: **TanStack Query** (estado de servidor com cache, `AbortSignal` e retry exponencial), sincronização bidirecional de filtros com `URLSearchParams` e busca com debounce (300ms).
- Correção da configuração nativa do **Tailwind CSS v4** (`@theme`), substituição do asset pesado (689 KB) por marca/favicon vetorial (`< 1 KB`), Skeleton UI não bloqueante, `ErrorBoundary` e link de acessibilidade (_skip-to-content_).
- Remoção integral de _dark patterns_ (markup fictício de 40% e notificações simuladas de compra), garantindo transparência CDC.

### Banco de Dados (`model_db`) & Backend Edge

- Novo schema `"NEXUSSTORE"` sob governança rígida: tabelas normalizadas `"CATE_PROD"`, `"PLAT_AFIL"`, `"PROD_AFIL"`, catálogo ativo `"WIKI_TABELA"`/`"WIKI_COLUNA"`, triggers forenses anti-tampering e RLS.
- RPCs server-side `"RPC_LISTAR_VITRINE"` (busca FTS Português, filtros whitelisted e paginação) e `"RPC_LISTAR_FACETAS"`.
- Tabela particionada mensalmente `"CLIC_AFIL"` (12 meses + `DEFAULT`) e Supabase Edge Functions `health` e `redirect` com rate limiting, allowlist de domínios e pseudonimização LGPD.

### Qualidade & DevSecOps

- Suíte de testes unitários e de integração (**Vitest + Testing Library** — 9 arquivos, 22 testes, > 83% cobertura em domínio/infra).
- Esteira CI/CD GitHub Actions com Gitleaks, Prettier, TypeScript, ESLint type-checked, testes, `npm audit`, build com _code splitting_ e SBOM CycloneDX.
- Headers HTTP de segurança configurados em `vercel.json` e `public/_headers`.
