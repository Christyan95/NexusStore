# ADR-002 — Modelagem Relacional Estrita (`model_db`) e Migração Expand-and-Contract

- **Status:** Aceito
- **Data:** 2026-11-24
- **Contexto:** A tabela legada `public.my_prod` possuía colunas `TEXT`/`NUMERIC` anuláveis sem `CHECK`, sem índices, sem ciclo de vida (`status`/`deleted_at`), sem normalização de categoria/plataforma e RLS permissivo demais (`USING (true)`).

## Decisão

1. Criar o schema dedicado `"NEXUSSTORE"` sob governança rígida `model_db` (identificadores `MAIÚSCULO` com aspas duplas, colunas bidimensionais `XXXX_YYYY`, 5 colunas forenses protegidas por trigger anti-tampering, catálogo ativo `WIKI_TABELA`/`WIKI_COLUNA`, Zero Trust RBAC + RLS).
2. Normalizar `"CATE_PROD"`, `"PLAT_AFIL"` e `"PROD_AFIL"` com FKs `ON DELETE RESTRICT ON UPDATE CASCADE` e índices parciais/compostos + GIN FTS (`portuguese`).
3. Criar tabela particionada por range mensal (`PARTITION BY RANGE ("CREA_CLIC")`) `"CLIC_AFIL"` para telemetria real de cliques de saída com hash irreversível de IP (LGPD).
4. Executar transição do legado `public.my_prod` via estratégia **Expand-and-Contract** (`V1.3.0`), migrando registros válidos de forma idempotente sem apagar `public.my_prod` imediatamente.

## Breaking Changes

- **`BREAKING CHANGE` (Banco):** Nova estrutura reside no schema `"NEXUSSTORE"` em vez de `public.my_prod`.
- **`BREAKING CHANGE` (Supabase API):** Exige exposição do schema `NEXUSSTORE` (ou consumo via RPCs em `public` / Edge Functions) e concessão controlada de `role_leitura_nexusstore` para a role `anon` (mantendo `PUBLIC` revogado).

## Trade-offs

- **O que ganhamos:** Integridade matemática no banco (impossível inserir preço `<= 0`, `NaN`, nota `> 5` ou URL `javascript:`), idempotência de ingestão via `("PLAT_PROD", "EXID_PROD")`, auditoria forense imutável e escalabilidade real de leitura/telemetria.
- **O que perdemos:** Consultas SQL exigem aspas duplas e mapeamento explícito na camada de infraestrutura (`PRAT_PROD` -> `currentPrice`).
- **Risco assumido:** Partições futuras de `"CLIC_AFIL"` após os próximos 12 meses precisam ser provisionadas por rotina agendada (`pg_cron` ou pipeline) antes de cair na partição `DEFAULT`.
