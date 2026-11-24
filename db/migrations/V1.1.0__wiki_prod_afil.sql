-- ============================================================
-- Migration  : V1.1.0__wiki_prod_afil.sql
-- Tabela     : "NEXUSSTORE"."PROD_AFIL" (e "CATE_PROD", "PLAT_AFIL")
-- Autor      : Staff Data Architecture / Model DB Engine
-- Data       : 2026-11-24
-- Ambiente   : DEV | HML | PRD
-- Descrição  : Registro e atualização idempotente (UPSERT) de 100% dos
--              metadados das tabelas CATE_PROD, PLAT_AFIL e PROD_AFIL no
--              catálogo ativo WIKI_TABELA e WIKI_COLUNA (Zero TRUNCATE).
-- ============================================================

BEGIN;

SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';
SET LOCAL client_min_messages = WARNING;
SET LOCAL TIME ZONE 'America/Sao_Paulo';

-- ------------------------------------------------------------
-- 1. SINCRONIZAÇÃO SEGURA DAS SEQUENCES DO DICIONÁRIO (PRÉ-CARGA)
-- ------------------------------------------------------------
SELECT setval(
    pg_get_serial_sequence('"NEXUSSTORE"."WIKI_TABELA"', 'IDEN_TABE'),
    COALESCE((SELECT MAX("IDEN_TABE") FROM "NEXUSSTORE"."WIKI_TABELA"), 1),
    (SELECT COUNT(*) > 0 FROM "NEXUSSTORE"."WIKI_TABELA")
);

SELECT setval(
    pg_get_serial_sequence('"NEXUSSTORE"."WIKI_COLUNA"', 'IDEN_COLU'),
    COALESCE((SELECT MAX("IDEN_COLU") FROM "NEXUSSTORE"."WIKI_COLUNA"), 1),
    (SELECT COUNT(*) > 0 FROM "NEXUSSTORE"."WIKI_COLUNA")
);

-- ------------------------------------------------------------
-- 2. UPSERT IDEMPOTENTE NA "WIKI_TABELA" (ZERO TRUNCATE)
-- ------------------------------------------------------------
INSERT INTO "NEXUSSTORE"."WIKI_TABELA" (
    "SCHE_TABE",
    "NOME_TABE",
    "DESC_TABE"
)
VALUES
    (
        'NEXUSSTORE',
        'CATE_PROD',
        'Tabela de domínio das categorias comerciais da Nexus Store com slug SEO, ordenação de menu, rastreabilidade forense, RLS e Soft Delete.'
    ),
    (
        'NEXUSSTORE',
        'PLAT_AFIL',
        'Tabela de domínio dos marketplaces parceiros de afiliação (Amazon, Mercado Livre, Shopee) com domínio allowlist, identidade visual, RLS e Soft Delete.'
    ),
    (
        'NEXUSSTORE',
        'PROD_AFIL',
        'Tabela principal do catálogo de produtos afiliados da Nexus Store com integridade referencial, preços reais auditáveis, validação HTTPS, RLS e Soft Delete.'
    )
ON CONFLICT ON CONSTRAINT "UK_WIKI_TABELA_SCHE_NOME"
DO UPDATE SET
    "DESC_TABE" = EXCLUDED."DESC_TABE",
    "UPDA_TABE" = NOW(),
    "USAL_TABE" = CURRENT_USER,
    "DELE_TABE" = NULL;

-- ------------------------------------------------------------
-- 3. UPSERT IDEMPOTENTE NA "WIKI_COLUNA" (100% DAS COLUNAS + AUDITORIA)
-- ------------------------------------------------------------
INSERT INTO "NEXUSSTORE"."WIKI_COLUNA" (
    "NOME_TABE",
    "NOME_COLU",
    "TIPO_COLU",
    "DESC_COLU"
)
VALUES
    -- Colunas de CATE_PROD (11/11)
    ('CATE_PROD', 'IDEN_CATE', 'UUID',          'Chave primária (PK) universal da categoria gerada via uuid_generate_v4().'),
    ('CATE_PROD', 'NOME_CATE', 'VARCHAR(80)',   'Nome oficial de exibição da categoria na vitrine (único case-insensitive entre ativos).'),
    ('CATE_PROD', 'SLUG_CATE', 'VARCHAR(80)',   'Identificador URL amigável em kebab-case validado via Regex POSIX.'),
    ('CATE_PROD', 'DESC_CATE', 'VARCHAR(300)',  'Descrição editorial curta da categoria utilizada para SEO e organização do catálogo.'),
    ('CATE_PROD', 'ORDE_CATE', 'SMALLINT',      'Ordem numérica crescente (>= 0) de exibição da categoria na barra de filtros.'),
    ('CATE_PROD', 'STAT_CATE', 'VARCHAR(20)',   'Status operacional da categoria: ATIVA ou INATIVA.'),
    ('CATE_PROD', 'CREA_CATE', 'TIMESTAMPTZ',   'Auditoria Forense: Data e hora exata de criação do registro em UTC.'),
    ('CATE_PROD', 'UPDA_CATE', 'TIMESTAMPTZ',   'Auditoria Forense: Data e hora exata da última alteração gerenciada via Trigger.'),
    ('CATE_PROD', 'DELE_CATE', 'TIMESTAMPTZ',   'Auditoria Forense / Soft Delete: Data e hora de inativação lógica (NULL indica registro ativo).'),
    ('CATE_PROD', 'USCR_CATE', 'VARCHAR(150)',  'Auditoria Forense: Usuário/Role do PostgreSQL responsável pela inserção original do registro.'),
    ('CATE_PROD', 'USAL_CATE', 'VARCHAR(150)',  'Auditoria Forense: Usuário/Role do PostgreSQL responsável pela última atualização do registro.'),

    -- Colunas de PLAT_AFIL (11/11)
    ('PLAT_AFIL', 'IDEN_PLAT', 'UUID',          'Chave primária (PK) universal da plataforma afiliada gerada via uuid_generate_v4().'),
    ('PLAT_AFIL', 'NOME_PLAT', 'VARCHAR(60)',   'Nome comercial oficial da plataforma/marketplace parceiro (Ex: Amazon, Mercado Livre, Shopee).'),
    ('PLAT_AFIL', 'SLUG_PLAT', 'VARCHAR(60)',   'Slug canônico em kebab-case da plataforma para filtros, rotas e integrações.'),
    ('PLAT_AFIL', 'DOMI_PLAT', 'VARCHAR(255)',  'Domínio raiz oficial permitido para validação de links de afiliado (allowlist anti-phishing).'),
    ('PLAT_AFIL', 'CORP_PLAT', 'VARCHAR(7)',    'Cor hexadecimal primária (#RRGGBB) utilizada na renderização do selo da plataforma.'),
    ('PLAT_AFIL', 'STAT_PLAT', 'VARCHAR(20)',   'Status operacional da plataforma: ATIVA, INATIVA ou MANUTENCAO.'),
    ('PLAT_AFIL', 'CREA_PLAT', 'TIMESTAMPTZ',   'Auditoria Forense: Data e hora exata de criação do registro em UTC.'),
    ('PLAT_AFIL', 'UPDA_PLAT', 'TIMESTAMPTZ',   'Auditoria Forense: Data e hora exata da última alteração gerenciada via Trigger.'),
    ('PLAT_AFIL', 'DELE_PLAT', 'TIMESTAMPTZ',   'Auditoria Forense / Soft Delete: Data e hora de inativação lógica (NULL indica registro ativo).'),
    ('PLAT_AFIL', 'USCR_PLAT', 'VARCHAR(150)',  'Auditoria Forense: Usuário/Role do PostgreSQL responsável pela inserção original do registro.'),
    ('PLAT_AFIL', 'USAL_PLAT', 'VARCHAR(150)',  'Auditoria Forense: Usuário/Role do PostgreSQL responsável pela última atualização do registro.'),

    -- Colunas de PROD_AFIL (22/22)
    ('PROD_AFIL', 'IDEN_PROD', 'UUID',          'Chave primária (PK) universal do produto afiliado gerada via uuid_generate_v4().'),
    ('PROD_AFIL', 'CATE_PROD', 'UUID',          'Chave estrangeira (FK) para CATE_PROD(IDEN_CATE) com ON DELETE RESTRICT ON UPDATE CASCADE.'),
    ('PROD_AFIL', 'PLAT_PROD', 'UUID',          'Chave estrangeira (FK) para PLAT_AFIL(IDEN_PLAT) com ON DELETE RESTRICT ON UPDATE CASCADE.'),
    ('PROD_AFIL', 'EXID_PROD', 'VARCHAR(100)',  'Identificador externo do produto na plataforma (ASIN, MLB, ItemID) para idempotência de upsert.'),
    ('PROD_AFIL', 'NOME_PROD', 'VARCHAR(200)',  'Título comercial do produto exibido na vitrine e indexado via Full-Text Search (portuguese).'),
    ('PROD_AFIL', 'SLUG_PROD', 'VARCHAR(220)',  'Slug URL amigável em kebab-case único entre produtos ativos para SEO.'),
    ('PROD_AFIL', 'DESC_PROD', 'VARCHAR(500)',  'Descrição resumida e diferenciais editoriais opcionais do produto.'),
    ('PROD_AFIL', 'URLA_PROD', 'VARCHAR(2048)', 'URL HTTPS obrigatória de redirecionamento de afiliado validada via Regex POSIX.'),
    ('PROD_AFIL', 'URLI_PROD', 'VARCHAR(2048)', 'URL HTTPS obrigatória da imagem principal do produto validada via Regex POSIX.'),
    ('PROD_AFIL', 'PRAT_PROD', 'NUMERIC(15,2)', 'Preço atual verificado do produto na moeda configurada (estritamente positivo e finito).'),
    ('PROD_AFIL', 'PROR_PROD', 'NUMERIC(15,2)', 'Preço original real antes de desconto (opcional; exige PROR_PROD >= PRAT_PROD).'),
    ('PROD_AFIL', 'MOED_PROD', 'VARCHAR(3)',    'Código ISO 4217 da moeda do preço (BRL, USD ou EUR).'),
    ('PROD_AFIL', 'AVAL_PROD', 'NUMERIC(2,1)',  'Nota média real de avaliação do produto no marketplace de origem (0.0 a 5.0).'),
    ('PROD_AFIL', 'QAVA_PROD', 'INTEGER',       'Quantidade real de avaliações verificadas do produto no marketplace de origem (>= 0).'),
    ('PROD_AFIL', 'DEST_PROD', 'BOOLEAN',       'Flag indicando se o produto está destacado como Em Alta na curadoria da vitrine.'),
    ('PROD_AFIL', 'STAT_PROD', 'VARCHAR(20)',   'Ciclo de vida do produto: RASCUNHO, PUBLICADO, PAUSADO, ESGOTADO ou ARQUIVADO.'),
    ('PROD_AFIL', 'SINC_PROD', 'TIMESTAMPTZ',   'Data e hora da última sincronização real de preço/estoque na origem (transparência CDC).'),
    ('PROD_AFIL', 'CREA_PROD', 'TIMESTAMPTZ',   'Auditoria Forense: Data e hora exata de criação do registro em UTC.'),
    ('PROD_AFIL', 'UPDA_PROD', 'TIMESTAMPTZ',   'Auditoria Forense: Data e hora exata da última alteração gerenciada via Trigger.'),
    ('PROD_AFIL', 'DELE_PROD', 'TIMESTAMPTZ',   'Auditoria Forense / Soft Delete: Data e hora de inativação lógica (NULL indica registro ativo).'),
    ('PROD_AFIL', 'USCR_PROD', 'VARCHAR(150)',  'Auditoria Forense: Usuário/Role do PostgreSQL responsável pela inserção original do registro.'),
    ('PROD_AFIL', 'USAL_PROD', 'VARCHAR(150)',  'Auditoria Forense: Usuário/Role do PostgreSQL responsável pela última atualização do registro.')
ON CONFLICT ON CONSTRAINT "UK_WIKI_COLUNA_TABE_COLU"
DO UPDATE SET
    "TIPO_COLU" = EXCLUDED."TIPO_COLU",
    "DESC_COLU" = EXCLUDED."DESC_COLU",
    "UPDA_COLU" = NOW(),
    "USAL_COLU" = CURRENT_USER,
    "DELE_COLU" = NULL;

-- ------------------------------------------------------------
-- 4. RESSINCRONIZAÇÃO PÓS-CARGA DAS SEQUENCES
-- ------------------------------------------------------------
SELECT setval(
    pg_get_serial_sequence('"NEXUSSTORE"."WIKI_TABELA"', 'IDEN_TABE'),
    COALESCE((SELECT MAX("IDEN_TABE") FROM "NEXUSSTORE"."WIKI_TABELA"), 1),
    true
);

SELECT setval(
    pg_get_serial_sequence('"NEXUSSTORE"."WIKI_COLUNA"', 'IDEN_COLU'),
    COALESCE((SELECT MAX("IDEN_COLU") FROM "NEXUSSTORE"."WIKI_COLUNA"), 1),
    true
);

COMMIT;
