# Plano de Migração Incremental (Strangler Fig) & Rollback

Este plano permite evoluir o `NexusStore` de `public.my_prod` + `src/App.jsx` para a arquitetura alvo **sem Big Bang** e com **zero downtime** em produção.

## Ordem Exata de Execução

### Etapa 1 — Expandir Banco de Dados (Zero Impacto no Legado)

1. Executar em ordem transacional (`psql` / Flyway / Supabase SQL Editor):
   - `db/migrations/V1.0.0__create_prod_afil.sql`
   - `db/migrations/V1.1.0__wiki_prod_afil.sql`
   - `db/migrations/V1.3.0__rpc_catalogo_e_bridge.sql` _(inclui migração idempotente opcional de registros válidos de `public.my_prod`)_
   - `db/migrations/V1.4.0__create_clic_afil.sql`
   - _(Somente DEV/HML)_ `db/migrations/V1.2.0__mock_prod_afil.sql`
2. Validar no banco:
   - `SELECT COUNT(*) FROM "NEXUSSTORE"."VW_PROD_AFIL_VITRINE";`
   - `SELECT COUNT(*) FROM "NEXUSSTORE"."WIKI_COLUNA";`
3. **Estado do legado:** `public.my_prod` permanece intocada e operando para a versão antiga do frontend.

### Etapa 2 — Publicar Edge Functions & Configurar Variáveis

1. Deploy das Edge Functions `health` e `redirect` no Supabase com segredo `CLICK_IP_HASH_SALT` (string aleatória >= 32 bytes) e `ALLOWED_ORIGINS`.
2. Validar smoke test em `/functions/v1/health` (deve retornar HTTP `200` com `status: "ok"` e `request_id`).
3. Adicionar `NEXUSSTORE` em **Supabase Dashboard > Project Settings > Data API (API Settings) > Exposed schemas** e salvar — obrigatório para que o PostgREST autorize o acesso via `schema('NEXUSSTORE').rpc(...)` (mantendo o isolamento por RLS/RBAC).

### Etapa 3 — Cutover do Frontend (Blue/Green / Canary)

1. Configurar variáveis de ambiente (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, opcional `VITE_REDIRECT_BASE_URL`).
2. Publicar novo build TypeScript/Vite com headers de segurança (`vercel.json` / `public/_headers`).
3. Validar: busca FTS, filtros combinados, ordenação, paginação, sincronização de URL, redirecionamento de afiliado e ausência de erros no console.

### Etapa 4 — Contrato & Limpeza do Legado (Após 7-14 dias estáveis)

1. Revogar `SELECT` de `public.my_prod` e renomear para `public.my_prod_deprecated_YYYYMMDD` (período de quarentena).
2. Após validação sem tráfego residual, arquivar backup e remover tabela legada e `supabase_schema.sql`.

---

## Estratégia de Rollback por Etapa

- **Rollback da Etapa 3 (Frontend):** Reverter deployment na Vercel/Cloudflare para a versão anterior em `< 60s` — como `public.my_prod` não foi alterada nem removida, a versão anterior volta a operar imediatamente.
- **Rollback da Etapa 2 (Edge Functions):** Remover `VITE_REDIRECT_BASE_URL` no frontend faz os links usarem diretamente as URLs HTTPS já validadas pela allowlist no cliente sem interromper vendas.
- **Rollback da Etapa 1 (Banco):** Como todas as migrations estão isoladas no schema `"NEXUSSTORE"` (mais funções proxy idempotentes), o rollback seguro é o descarte controlado das funções proxy e do schema `"NEXUSSTORE"` apenas se ainda não houver escrita exclusiva nele; nunca executar `DROP SCHEMA CASCADE` sem snapshot validado.
