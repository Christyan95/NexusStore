-- ============================================================
-- Migration  : V1.0.0__create_prod_afil.sql
-- Tabela     : "NEXUSSTORE"."PROD_AFIL" (e tabelas de domínio "CATE_PROD", "PLAT_AFIL")
-- Autor      : Staff Data Architecture / Model DB Engine
-- Data       : 2026-11-24
-- Ambiente   : DEV | HML | PRD
-- Descrição  : Criação do schema NEXUSSTORE, infraestrutura de catálogo
--              ativo (WIKI), tabelas normalizadas de domínio (CATE_PROD,
--              PLAT_AFIL e PROD_AFIL), índices compostos/parciais/FTS,
--              triggers forenses anti-tampering, views operacionais,
--              segurança Zero Trust (RBAC + RLS) e metadados nativos.
-- ============================================================

BEGIN;

SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';
SET LOCAL client_min_messages = WARNING;
SET LOCAL TIME ZONE 'America/Sao_Paulo';

-- ------------------------------------------------------------
-- 1. EXTENSÕES OBRIGATÓRIAS
-- ------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------
-- 2. SCHEMA E BLINDAGEM DE ACESSO PÚBLICO (ZERO TRUST)
-- ------------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS "NEXUSSTORE";
REVOKE ALL ON SCHEMA "NEXUSSTORE" FROM PUBLIC;

-- Criação idempotente das Roles de Leitura e Escrita do Schema
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = 'role_leitura_nexusstore') THEN
        CREATE ROLE role_leitura_nexusstore NOLOGIN;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = 'role_escrita_nexusstore') THEN
        CREATE ROLE role_escrita_nexusstore NOLOGIN;
    END IF;
END
$$;

-- Regionalização oficial (Horário de Brasília / Distrito Federal)
ALTER ROLE role_leitura_nexusstore SET timezone TO 'America/Sao_Paulo';
ALTER ROLE role_escrita_nexusstore SET timezone TO 'America/Sao_Paulo';

GRANT USAGE ON SCHEMA "NEXUSSTORE" TO role_leitura_nexusstore;
GRANT USAGE ON SCHEMA "NEXUSSTORE" TO role_escrita_nexusstore;

-- ------------------------------------------------------------
-- 3. FUNÇÃO GENÉRICA DE AUDITORIA FORENSE (ANTI-TAMPERING)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION "NEXUSSTORE"."TRG_UPDATE_TIMESTAMP"()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $$
DECLARE
    v_sufixo   TEXT  := COALESCE(TG_ARGV[0], '');
    v_old_json JSONB := to_jsonb(OLD);
BEGIN
    IF v_sufixo = '' THEN
        RAISE EXCEPTION 'Violação de Governança: Sufixo da tabela não informado na trigger TRG_UPDATE_TIMESTAMP para %.%',
            TG_TABLE_SCHEMA, TG_TABLE_NAME
            USING ERRCODE = 'P0001';
    END IF;

    -- Imutabilidade Forense: bloqueia adulteração de CREA_ e USCR_ e força atualização de UPDA_ e USAL_
    NEW := jsonb_populate_record(
        NEW,
        jsonb_build_object(
            'CREA_' || v_sufixo, v_old_json -> ('CREA_' || v_sufixo),
            'USCR_' || v_sufixo, v_old_json -> ('USCR_' || v_sufixo),
            'UPDA_' || v_sufixo, NOW(),
            'USAL_' || v_sufixo, CURRENT_USER
        )
    );

    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION "NEXUSSTORE"."TRG_UPDATE_TIMESTAMP"() IS
    'Função forense genérica de auditoria BEFORE UPDATE. Preserva CREA_[SUFIXO] e USCR_[SUFIXO] originais e força atualização de UPDA_[SUFIXO] (NOW) e USAL_[SUFIXO] (CURRENT_USER).';

-- ------------------------------------------------------------
-- 4. INFRAESTRUTURA DO DICIONÁRIO DE DADOS ATIVO (WIKI)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "NEXUSSTORE"."WIKI_TABELA" (
    "IDEN_TABE" BIGSERIAL     NOT NULL,
    "SCHE_TABE" VARCHAR(64)   NOT NULL,
    "NOME_TABE" VARCHAR(64)   NOT NULL,
    "DESC_TABE" VARCHAR(500)  NOT NULL,
    "CREA_TABE" TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    "UPDA_TABE" TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    "DELE_TABE" TIMESTAMPTZ   NULL,
    "USCR_TABE" VARCHAR(150)  NOT NULL DEFAULT CURRENT_USER,
    "USAL_TABE" VARCHAR(150)  NOT NULL DEFAULT CURRENT_USER,

    CONSTRAINT "PK_WIKI_TABELA"           PRIMARY KEY ("IDEN_TABE"),
    CONSTRAINT "UK_WIKI_TABELA_NOME"      UNIQUE ("NOME_TABE"),
    CONSTRAINT "UK_WIKI_TABELA_SCHE_NOME" UNIQUE ("SCHE_TABE", "NOME_TABE"),
    CONSTRAINT "CK_WIKI_TABELA_SCHE_NVAZ" CHECK (BTRIM("SCHE_TABE") <> ''),
    CONSTRAINT "CK_WIKI_TABELA_NOME_NVAZ" CHECK (BTRIM("NOME_TABE") <> ''),
    CONSTRAINT "CK_WIKI_TABELA_DESC_NVAZ" CHECK (BTRIM("DESC_TABE") <> ''),
    CONSTRAINT "CK_WIKI_TABELA_DELE"      CHECK ("DELE_TABE" IS NULL OR "DELE_TABE" >= "CREA_TABE")
) WITH (fillfactor = 90);

DROP TRIGGER IF EXISTS "TRG_AUDIT_WIKI_TABELA" ON "NEXUSSTORE"."WIKI_TABELA";
CREATE TRIGGER "TRG_AUDIT_WIKI_TABELA"
    BEFORE UPDATE ON "NEXUSSTORE"."WIKI_TABELA"
    FOR EACH ROW
    EXECUTE FUNCTION "NEXUSSTORE"."TRG_UPDATE_TIMESTAMP"('TABE');

CREATE TABLE IF NOT EXISTS "NEXUSSTORE"."WIKI_COLUNA" (
    "IDEN_COLU" BIGSERIAL     NOT NULL,
    "NOME_TABE" VARCHAR(64)   NOT NULL,
    "NOME_COLU" VARCHAR(64)   NOT NULL,
    "TIPO_COLU" VARCHAR(100)  NOT NULL,
    "DESC_COLU" VARCHAR(500)  NOT NULL,
    "CREA_COLU" TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    "UPDA_COLU" TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    "DELE_COLU" TIMESTAMPTZ   NULL,
    "USCR_COLU" VARCHAR(150)  NOT NULL DEFAULT CURRENT_USER,
    "USAL_COLU" VARCHAR(150)  NOT NULL DEFAULT CURRENT_USER,

    CONSTRAINT "PK_WIKI_COLUNA"             PRIMARY KEY ("IDEN_COLU"),
    CONSTRAINT "UK_WIKI_COLUNA_TABE_COLU"   UNIQUE ("NOME_TABE", "NOME_COLU"),
    CONSTRAINT "FK_WIKI_COLUNA_WIKI_TABELA" FOREIGN KEY ("NOME_TABE")
        REFERENCES "NEXUSSTORE"."WIKI_TABELA" ("NOME_TABE")
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CK_WIKI_COLUNA_COLU_NVAZ"   CHECK (BTRIM("NOME_COLU") <> ''),
    CONSTRAINT "CK_WIKI_COLUNA_TIPO_NVAZ"   CHECK (BTRIM("TIPO_COLU") <> ''),
    CONSTRAINT "CK_WIKI_COLUNA_DESC_NVAZ"   CHECK (BTRIM("DESC_COLU") <> ''),
    CONSTRAINT "CK_WIKI_COLUNA_DELE"        CHECK ("DELE_COLU" IS NULL OR "DELE_COLU" >= "CREA_COLU")
) WITH (fillfactor = 90);

CREATE INDEX IF NOT EXISTS "IDX_WIKI_COLUNA_NOME_TABE"
    ON "NEXUSSTORE"."WIKI_COLUNA" ("NOME_TABE")
    WITH (fillfactor = 90);

DROP TRIGGER IF EXISTS "TRG_AUDIT_WIKI_COLUNA" ON "NEXUSSTORE"."WIKI_COLUNA";
CREATE TRIGGER "TRG_AUDIT_WIKI_COLUNA"
    BEFORE UPDATE ON "NEXUSSTORE"."WIKI_COLUNA"
    FOR EACH ROW
    EXECUTE FUNCTION "NEXUSSTORE"."TRG_UPDATE_TIMESTAMP"('COLU');

-- ------------------------------------------------------------
-- 5. TABELA DE DOMÍNIO: "NEXUSSTORE"."CATE_PROD" (CATEGORIAS)
-- ------------------------------------------------------------
-- INFO: Particionamento não aplicado. Reavaliar ao atingir 5M linhas.
CREATE TABLE IF NOT EXISTS "NEXUSSTORE"."CATE_PROD" (
    "IDEN_CATE" UUID          NOT NULL DEFAULT uuid_generate_v4(),
    "NOME_CATE" VARCHAR(80)   NOT NULL,
    "SLUG_CATE" VARCHAR(80)   NOT NULL,
    "DESC_CATE" VARCHAR(300)  NULL,
    "ORDE_CATE" SMALLINT      NOT NULL DEFAULT 0,
    "STAT_CATE" VARCHAR(20)   NOT NULL DEFAULT 'ATIVA',
    "CREA_CATE" TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    "UPDA_CATE" TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    "DELE_CATE" TIMESTAMPTZ   NULL,
    "USCR_CATE" VARCHAR(150)  NOT NULL DEFAULT CURRENT_USER,
    "USAL_CATE" VARCHAR(150)  NOT NULL DEFAULT CURRENT_USER,

    CONSTRAINT "PK_CATE_PROD"           PRIMARY KEY ("IDEN_CATE"),
    CONSTRAINT "CK_CATE_PROD_NOME_NVAZ" CHECK (BTRIM("NOME_CATE") <> ''),
    CONSTRAINT "CK_CATE_PROD_SLUG"      CHECK ("SLUG_CATE" ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
    CONSTRAINT "CK_CATE_PROD_DESC_NVAZ" CHECK ("DESC_CATE" IS NULL OR BTRIM("DESC_CATE") <> ''),
    CONSTRAINT "CK_CATE_PROD_ORDE"      CHECK ("ORDE_CATE" >= 0),
    CONSTRAINT "CK_CATE_PROD_STAT"      CHECK ("STAT_CATE" IN ('ATIVA', 'INATIVA')),
    CONSTRAINT "CK_CATE_PROD_DELE"      CHECK ("DELE_CATE" IS NULL OR "DELE_CATE" >= "CREA_CATE")
) WITH (fillfactor = 90);

CREATE UNIQUE INDEX IF NOT EXISTS "UK_CATE_PROD_SLUG_ATIV"
    ON "NEXUSSTORE"."CATE_PROD" ("SLUG_CATE")
    WITH (fillfactor = 90)
    WHERE "DELE_CATE" IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "UK_CATE_PROD_NOME_ATIV"
    ON "NEXUSSTORE"."CATE_PROD" (LOWER("NOME_CATE"))
    WITH (fillfactor = 90)
    WHERE "DELE_CATE" IS NULL;

CREATE INDEX IF NOT EXISTS "IDX_CATE_PROD_ORDE_ATIV"
    ON "NEXUSSTORE"."CATE_PROD" ("ORDE_CATE" ASC, "NOME_CATE" ASC)
    WITH (fillfactor = 90)
    WHERE "DELE_CATE" IS NULL AND "STAT_CATE" = 'ATIVA';

DROP TRIGGER IF EXISTS "TRG_AUDIT_CATE_PROD" ON "NEXUSSTORE"."CATE_PROD";
CREATE TRIGGER "TRG_AUDIT_CATE_PROD"
    BEFORE UPDATE ON "NEXUSSTORE"."CATE_PROD"
    FOR EACH ROW
    EXECUTE FUNCTION "NEXUSSTORE"."TRG_UPDATE_TIMESTAMP"('CATE');

-- ------------------------------------------------------------
-- 6. TABELA DE DOMÍNIO: "NEXUSSTORE"."PLAT_AFIL" (PLATAFORMAS)
-- ------------------------------------------------------------
-- INFO: Particionamento não aplicado. Reavaliar ao atingir 5M linhas.
CREATE TABLE IF NOT EXISTS "NEXUSSTORE"."PLAT_AFIL" (
    "IDEN_PLAT" UUID          NOT NULL DEFAULT uuid_generate_v4(),
    "NOME_PLAT" VARCHAR(60)   NOT NULL,
    "SLUG_PLAT" VARCHAR(60)   NOT NULL,
    "DOMI_PLAT" VARCHAR(255)  NOT NULL,
    "CORP_PLAT" VARCHAR(7)    NOT NULL DEFAULT '#0F172A',
    "STAT_PLAT" VARCHAR(20)   NOT NULL DEFAULT 'ATIVA',
    "CREA_PLAT" TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    "UPDA_PLAT" TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    "DELE_PLAT" TIMESTAMPTZ   NULL,
    "USCR_PLAT" VARCHAR(150)  NOT NULL DEFAULT CURRENT_USER,
    "USAL_PLAT" VARCHAR(150)  NOT NULL DEFAULT CURRENT_USER,

    CONSTRAINT "PK_PLAT_AFIL"           PRIMARY KEY ("IDEN_PLAT"),
    CONSTRAINT "CK_PLAT_AFIL_NOME_NVAZ" CHECK (BTRIM("NOME_PLAT") <> ''),
    CONSTRAINT "CK_PLAT_AFIL_SLUG"      CHECK ("SLUG_PLAT" ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
    CONSTRAINT "CK_PLAT_AFIL_DOMI"      CHECK ("DOMI_PLAT" ~ '^[a-z0-9-]+(\.[a-z0-9-]+)+$'),
    CONSTRAINT "CK_PLAT_AFIL_CORP"      CHECK ("CORP_PLAT" ~ '^#[0-9A-Fa-f]{6}$'),
    CONSTRAINT "CK_PLAT_AFIL_STAT"      CHECK ("STAT_PLAT" IN ('ATIVA', 'INATIVA', 'MANUTENCAO')),
    CONSTRAINT "CK_PLAT_AFIL_DELE"      CHECK ("DELE_PLAT" IS NULL OR "DELE_PLAT" >= "CREA_PLAT")
) WITH (fillfactor = 90);

CREATE UNIQUE INDEX IF NOT EXISTS "UK_PLAT_AFIL_SLUG_ATIV"
    ON "NEXUSSTORE"."PLAT_AFIL" ("SLUG_PLAT")
    WITH (fillfactor = 90)
    WHERE "DELE_PLAT" IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "UK_PLAT_AFIL_DOMI_ATIV"
    ON "NEXUSSTORE"."PLAT_AFIL" (LOWER("DOMI_PLAT"))
    WITH (fillfactor = 90)
    WHERE "DELE_PLAT" IS NULL;

CREATE INDEX IF NOT EXISTS "IDX_PLAT_AFIL_STAT_ATIV"
    ON "NEXUSSTORE"."PLAT_AFIL" ("STAT_PLAT", "NOME_PLAT")
    WITH (fillfactor = 90)
    WHERE "DELE_PLAT" IS NULL;

DROP TRIGGER IF EXISTS "TRG_AUDIT_PLAT_AFIL" ON "NEXUSSTORE"."PLAT_AFIL";
CREATE TRIGGER "TRG_AUDIT_PLAT_AFIL"
    BEFORE UPDATE ON "NEXUSSTORE"."PLAT_AFIL"
    FOR EACH ROW
    EXECUTE FUNCTION "NEXUSSTORE"."TRG_UPDATE_TIMESTAMP"('PLAT');

-- ------------------------------------------------------------
-- 7. TABELA PRINCIPAL: "NEXUSSTORE"."PROD_AFIL" (PRODUTOS AFILIADOS)
-- ------------------------------------------------------------
-- INFO: Particionamento não aplicado. Reavaliar ao atingir 5M linhas.
CREATE TABLE IF NOT EXISTS "NEXUSSTORE"."PROD_AFIL" (
    "IDEN_PROD" UUID           NOT NULL DEFAULT uuid_generate_v4(),
    "CATE_PROD" UUID           NOT NULL,
    "PLAT_PROD" UUID           NOT NULL,
    "EXID_PROD" VARCHAR(100)   NOT NULL,
    "NOME_PROD" VARCHAR(200)   NOT NULL,
    "SLUG_PROD" VARCHAR(220)   NOT NULL,
    "DESC_PROD" VARCHAR(500)   NULL,
    "URLA_PROD" VARCHAR(2048)  NOT NULL,
    "URLI_PROD" VARCHAR(2048)  NOT NULL,
    "PRAT_PROD" NUMERIC(15,2)  NOT NULL,
    "PROR_PROD" NUMERIC(15,2)  NULL,
    "MOED_PROD" VARCHAR(3)     NOT NULL DEFAULT 'BRL',
    "AVAL_PROD" NUMERIC(2,1)   NOT NULL DEFAULT 0.0,
    "QAVA_PROD" INTEGER        NOT NULL DEFAULT 0,
    "DEST_PROD" BOOLEAN        NOT NULL DEFAULT FALSE,
    "STAT_PROD" VARCHAR(20)    NOT NULL DEFAULT 'RASCUNHO',
    "SINC_PROD" TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    "CREA_PROD" TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    "UPDA_PROD" TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    "DELE_PROD" TIMESTAMPTZ    NULL,
    "USCR_PROD" VARCHAR(150)   NOT NULL DEFAULT CURRENT_USER,
    "USAL_PROD" VARCHAR(150)   NOT NULL DEFAULT CURRENT_USER,

    CONSTRAINT "PK_PROD_AFIL"           PRIMARY KEY ("IDEN_PROD"),
    CONSTRAINT "FK_PROD_AFIL_CATE_PROD" FOREIGN KEY ("CATE_PROD")
        REFERENCES "NEXUSSTORE"."CATE_PROD" ("IDEN_CATE")
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "FK_PROD_AFIL_PLAT_AFIL" FOREIGN KEY ("PLAT_PROD")
        REFERENCES "NEXUSSTORE"."PLAT_AFIL" ("IDEN_PLAT")
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CK_PROD_AFIL_EXID_NVAZ" CHECK (BTRIM("EXID_PROD") <> ''),
    CONSTRAINT "CK_PROD_AFIL_NOME_NVAZ" CHECK (BTRIM("NOME_PROD") <> ''),
    CONSTRAINT "CK_PROD_AFIL_SLUG"      CHECK ("SLUG_PROD" ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
    CONSTRAINT "CK_PROD_AFIL_DESC_NVAZ" CHECK ("DESC_PROD" IS NULL OR BTRIM("DESC_PROD") <> ''),
    CONSTRAINT "CK_PROD_AFIL_URLA"      CHECK ("URLA_PROD" ~* '^https://[A-Za-z0-9.-]+\.[A-Za-z]{2,}(/[^[:space:]]*)?$'),
    CONSTRAINT "CK_PROD_AFIL_URLI"      CHECK ("URLI_PROD" ~* '^https://[A-Za-z0-9.-]+\.[A-Za-z]{2,}(/[^[:space:]]*)?$'),
    CONSTRAINT "CK_PROD_AFIL_PRAT"      CHECK ("PRAT_PROD" > 0 AND "PRAT_PROD" <= 999999999999.99),
    CONSTRAINT "CK_PROD_AFIL_PROR"      CHECK ("PROR_PROD" IS NULL OR ("PROR_PROD" >= "PRAT_PROD" AND "PROR_PROD" <= 999999999999.99)),
    CONSTRAINT "CK_PROD_AFIL_MOED"      CHECK ("MOED_PROD" IN ('BRL', 'USD', 'EUR')),
    CONSTRAINT "CK_PROD_AFIL_AVAL"      CHECK ("AVAL_PROD" >= 0.0 AND "AVAL_PROD" <= 5.0),
    CONSTRAINT "CK_PROD_AFIL_QAVA"      CHECK ("QAVA_PROD" >= 0),
    CONSTRAINT "CK_PROD_AFIL_STAT"      CHECK ("STAT_PROD" IN ('RASCUNHO', 'PUBLICADO', 'PAUSADO', 'ESGOTADO', 'ARQUIVADO')),
    CONSTRAINT "CK_PROD_AFIL_DELE"      CHECK ("DELE_PROD" IS NULL OR "DELE_PROD" >= "CREA_PROD")
) WITH (fillfactor = 70);

-- ------------------------------------------------------------
-- 8. ÍNDICES DE INTEGRIDADE, FK, PERFORMANCE E BUSCA TEXTUAL
-- ------------------------------------------------------------
-- Idempotência de ingestão externa (plataforma + SKU/ASIN/MLB único entre ativos)
CREATE UNIQUE INDEX IF NOT EXISTS "UK_PROD_AFIL_PLAT_EXID_ATIV"
    ON "NEXUSSTORE"."PROD_AFIL" ("PLAT_PROD", "EXID_PROD")
    WITH (fillfactor = 80)
    WHERE "DELE_PROD" IS NULL;

-- Unicidade de slug SEO entre ativos
CREATE UNIQUE INDEX IF NOT EXISTS "UK_PROD_AFIL_SLUG_ATIV"
    ON "NEXUSSTORE"."PROD_AFIL" ("SLUG_PROD")
    WITH (fillfactor = 80)
    WHERE "DELE_PROD" IS NULL;

-- Índices obrigatórios de FK (prevenção de table lock em integridade referencial)
CREATE INDEX IF NOT EXISTS "IDX_PROD_AFIL_CATE_PROD"
    ON "NEXUSSTORE"."PROD_AFIL" ("CATE_PROD")
    WITH (fillfactor = 80);

CREATE INDEX IF NOT EXISTS "IDX_PROD_AFIL_PLAT_PROD"
    ON "NEXUSSTORE"."PROD_AFIL" ("PLAT_PROD")
    WITH (fillfactor = 80);

-- Índices parciais compostos para ordenação e filtros da vitrine publicada
CREATE INDEX IF NOT EXISTS "IDX_PROD_AFIL_VITRINE_ORD"
    ON "NEXUSSTORE"."PROD_AFIL" ("DEST_PROD" DESC, "AVAL_PROD" DESC, "CREA_PROD" DESC)
    WITH (fillfactor = 80)
    WHERE "DELE_PROD" IS NULL AND "STAT_PROD" = 'PUBLICADO';

CREATE INDEX IF NOT EXISTS "IDX_PROD_AFIL_CATE_PRECO_ATIV"
    ON "NEXUSSTORE"."PROD_AFIL" ("CATE_PROD", "PRAT_PROD" ASC)
    WITH (fillfactor = 80)
    WHERE "DELE_PROD" IS NULL AND "STAT_PROD" = 'PUBLICADO';

CREATE INDEX IF NOT EXISTS "IDX_PROD_AFIL_PLAT_PRECO_ATIV"
    ON "NEXUSSTORE"."PROD_AFIL" ("PLAT_PROD", "PRAT_PROD" ASC)
    WITH (fillfactor = 80)
    WHERE "DELE_PROD" IS NULL AND "STAT_PROD" = 'PUBLICADO';

-- Índice para rotinas de sincronização de preços (itens mais desatualizados primeiro)
CREATE INDEX IF NOT EXISTS "IDX_PROD_AFIL_SINC_ATIV"
    ON "NEXUSSTORE"."PROD_AFIL" ("SINC_PROD" ASC)
    WITH (fillfactor = 80)
    WHERE "DELE_PROD" IS NULL AND "STAT_PROD" IN ('PUBLICADO', 'PAUSADO');

-- Busca textual Full-Text Search em Português (GIN nativo para registros ativos publicados)
CREATE INDEX IF NOT EXISTS "IDX_PROD_AFIL_NOME_FTS_ATIV"
    ON "NEXUSSTORE"."PROD_AFIL"
    USING GIN (to_tsvector('portuguese', "NOME_PROD"))
    WITH (fastupdate = on)
    WHERE "DELE_PROD" IS NULL AND "STAT_PROD" = 'PUBLICADO';

DROP TRIGGER IF EXISTS "TRG_AUDIT_PROD_AFIL" ON "NEXUSSTORE"."PROD_AFIL";
CREATE TRIGGER "TRG_AUDIT_PROD_AFIL"
    BEFORE UPDATE ON "NEXUSSTORE"."PROD_AFIL"
    FOR EACH ROW
    EXECUTE FUNCTION "NEXUSSTORE"."TRG_UPDATE_TIMESTAMP"('PROD');

-- ------------------------------------------------------------
-- 9. VIEWS OPERACIONAIS DE REGISTROS ATIVOS (SECURITY INVOKER)
-- ------------------------------------------------------------
CREATE OR REPLACE VIEW "NEXUSSTORE"."VW_CATE_PROD_ATIVOS"
WITH (security_invoker = true) AS
SELECT
    "IDEN_CATE",
    "NOME_CATE",
    "SLUG_CATE",
    "DESC_CATE",
    "ORDE_CATE",
    "STAT_CATE",
    "CREA_CATE",
    "UPDA_CATE",
    "DELE_CATE",
    "USCR_CATE",
    "USAL_CATE"
FROM "NEXUSSTORE"."CATE_PROD"
WHERE "DELE_CATE" IS NULL;

CREATE OR REPLACE VIEW "NEXUSSTORE"."VW_PLAT_AFIL_ATIVOS"
WITH (security_invoker = true) AS
SELECT
    "IDEN_PLAT",
    "NOME_PLAT",
    "SLUG_PLAT",
    "DOMI_PLAT",
    "CORP_PLAT",
    "STAT_PLAT",
    "CREA_PLAT",
    "UPDA_PLAT",
    "DELE_PLAT",
    "USCR_PLAT",
    "USAL_PLAT"
FROM "NEXUSSTORE"."PLAT_AFIL"
WHERE "DELE_PLAT" IS NULL;

CREATE OR REPLACE VIEW "NEXUSSTORE"."VW_PROD_AFIL_ATIVOS"
WITH (security_invoker = true) AS
SELECT
    "IDEN_PROD",
    "CATE_PROD",
    "PLAT_PROD",
    "EXID_PROD",
    "NOME_PROD",
    "SLUG_PROD",
    "DESC_PROD",
    "URLA_PROD",
    "URLI_PROD",
    "PRAT_PROD",
    "PROR_PROD",
    "MOED_PROD",
    "AVAL_PROD",
    "QAVA_PROD",
    "DEST_PROD",
    "STAT_PROD",
    "SINC_PROD",
    "CREA_PROD",
    "UPDA_PROD",
    "DELE_PROD",
    "USCR_PROD",
    "USAL_PROD"
FROM "NEXUSSTORE"."PROD_AFIL"
WHERE "DELE_PROD" IS NULL;

CREATE OR REPLACE VIEW "NEXUSSTORE"."VW_PROD_AFIL_VITRINE"
WITH (security_invoker = true) AS
SELECT
    "P"."IDEN_PROD",
    "P"."SLUG_PROD",
    "P"."NOME_PROD",
    "P"."DESC_PROD",
    "P"."URLA_PROD",
    "P"."URLI_PROD",
    "P"."PRAT_PROD",
    "P"."PROR_PROD",
    "P"."MOED_PROD",
    "P"."AVAL_PROD",
    "P"."QAVA_PROD",
    "P"."DEST_PROD",
    "P"."SINC_PROD",
    "P"."CREA_PROD",
    "C"."IDEN_CATE",
    "C"."NOME_CATE",
    "C"."SLUG_CATE",
    "L"."IDEN_PLAT",
    "L"."NOME_PLAT",
    "L"."SLUG_PLAT",
    "L"."DOMI_PLAT",
    "L"."CORP_PLAT"
FROM "NEXUSSTORE"."PROD_AFIL" AS "P"
INNER JOIN "NEXUSSTORE"."CATE_PROD" AS "C"
    ON "C"."IDEN_CATE" = "P"."CATE_PROD"
INNER JOIN "NEXUSSTORE"."PLAT_AFIL" AS "L"
    ON "L"."IDEN_PLAT" = "P"."PLAT_PROD"
WHERE "P"."DELE_PROD" IS NULL
  AND "P"."STAT_PROD" = 'PUBLICADO'
  AND "C"."DELE_CATE" IS NULL
  AND "C"."STAT_CATE" = 'ATIVA'
  AND "L"."DELE_PLAT" IS NULL
  AND "L"."STAT_PLAT" = 'ATIVA';

-- ------------------------------------------------------------
-- 10. ROW LEVEL SECURITY (RLS) E CONTROLE DE ACESSO (RBAC)
-- ------------------------------------------------------------
ALTER TABLE "NEXUSSTORE"."CATE_PROD" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "POL_ISOLAMENTO_CATE_PROD" ON "NEXUSSTORE"."CATE_PROD";
CREATE POLICY "POL_ISOLAMENTO_CATE_PROD"
    ON "NEXUSSTORE"."CATE_PROD"
    AS PERMISSIVE
    FOR ALL
    TO PUBLIC
    USING (
        pg_has_role(CURRENT_USER, 'role_escrita_nexusstore', 'MEMBER')
        OR "USCR_CATE" = CURRENT_USER
        OR (
            pg_has_role(CURRENT_USER, 'role_leitura_nexusstore', 'MEMBER')
            AND "DELE_CATE" IS NULL
            AND "STAT_CATE" = 'ATIVA'
        )
    )
    WITH CHECK (
        pg_has_role(CURRENT_USER, 'role_escrita_nexusstore', 'MEMBER')
        OR "USCR_CATE" = CURRENT_USER
    );

ALTER TABLE "NEXUSSTORE"."PLAT_AFIL" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "POL_ISOLAMENTO_PLAT_AFIL" ON "NEXUSSTORE"."PLAT_AFIL";
CREATE POLICY "POL_ISOLAMENTO_PLAT_AFIL"
    ON "NEXUSSTORE"."PLAT_AFIL"
    AS PERMISSIVE
    FOR ALL
    TO PUBLIC
    USING (
        pg_has_role(CURRENT_USER, 'role_escrita_nexusstore', 'MEMBER')
        OR "USCR_PLAT" = CURRENT_USER
        OR (
            pg_has_role(CURRENT_USER, 'role_leitura_nexusstore', 'MEMBER')
            AND "DELE_PLAT" IS NULL
            AND "STAT_PLAT" = 'ATIVA'
        )
    )
    WITH CHECK (
        pg_has_role(CURRENT_USER, 'role_escrita_nexusstore', 'MEMBER')
        OR "USCR_PLAT" = CURRENT_USER
    );

ALTER TABLE "NEXUSSTORE"."PROD_AFIL" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "POL_ISOLAMENTO_PROD_AFIL" ON "NEXUSSTORE"."PROD_AFIL";
CREATE POLICY "POL_ISOLAMENTO_PROD_AFIL"
    ON "NEXUSSTORE"."PROD_AFIL"
    AS PERMISSIVE
    FOR ALL
    TO PUBLIC
    USING (
        pg_has_role(CURRENT_USER, 'role_escrita_nexusstore', 'MEMBER')
        OR "USCR_PROD" = CURRENT_USER
        OR (
            pg_has_role(CURRENT_USER, 'role_leitura_nexusstore', 'MEMBER')
            AND "DELE_PROD" IS NULL
            AND "STAT_PROD" = 'PUBLICADO'
        )
    )
    WITH CHECK (
        pg_has_role(CURRENT_USER, 'role_escrita_nexusstore', 'MEMBER')
        OR "USCR_PROD" = CURRENT_USER
    );

-- Revogação pública e concessão pelo Princípio do Menor Privilégio (Zero DELETE/TRUNCATE)
REVOKE ALL ON ALL TABLES IN SCHEMA "NEXUSSTORE" FROM PUBLIC;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA "NEXUSSTORE" FROM PUBLIC;

GRANT SELECT ON ALL TABLES IN SCHEMA "NEXUSSTORE" TO role_leitura_nexusstore;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA "NEXUSSTORE" TO role_escrita_nexusstore;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA "NEXUSSTORE" TO role_escrita_nexusstore;

-- Privilégios padrão para objetos futuros criados no schema
ALTER DEFAULT PRIVILEGES IN SCHEMA "NEXUSSTORE" REVOKE ALL ON TABLES FROM PUBLIC;
ALTER DEFAULT PRIVILEGES IN SCHEMA "NEXUSSTORE" REVOKE ALL ON SEQUENCES FROM PUBLIC;

ALTER DEFAULT PRIVILEGES IN SCHEMA "NEXUSSTORE"
    GRANT SELECT ON TABLES TO role_leitura_nexusstore;

ALTER DEFAULT PRIVILEGES IN SCHEMA "NEXUSSTORE"
    GRANT SELECT, INSERT, UPDATE ON TABLES TO role_escrita_nexusstore;

ALTER DEFAULT PRIVILEGES IN SCHEMA "NEXUSSTORE"
    GRANT USAGE, SELECT ON SEQUENCES TO role_escrita_nexusstore;

-- ------------------------------------------------------------
-- 11. OBSERVABILIDADE NATIVA (METADADOS PG_DESCRIPTION)
-- ------------------------------------------------------------
COMMENT ON TABLE "NEXUSSTORE"."WIKI_TABELA" IS
    'Catálogo corporativo ativo de tabelas do schema NEXUSSTORE para governança de dados e Data Mesh.';
COMMENT ON COLUMN "NEXUSSTORE"."WIKI_TABELA"."IDEN_TABE" IS
    'BIGSERIAL | Identificador sequencial único (PK) do registro de tabela no catálogo WIKI | Ex: 1';
COMMENT ON COLUMN "NEXUSSTORE"."WIKI_TABELA"."SCHE_TABE" IS
    'VARCHAR(64) | Nome do schema proprietário da tabela catalogada em MAIÚSCULO | Ex: NEXUSSTORE';
COMMENT ON COLUMN "NEXUSSTORE"."WIKI_TABELA"."NOME_TABE" IS
    'VARCHAR(64) | Nome da tabela catalogada em MAIÚSCULO (chave de vínculo com WIKI_COLUNA) | Ex: PROD_AFIL';
COMMENT ON COLUMN "NEXUSSTORE"."WIKI_TABELA"."DESC_TABE" IS
    'VARCHAR(500) | Descrição semântica e escopo de governança da tabela | Ex: Tabela principal do catálogo de produtos afiliados.';
COMMENT ON COLUMN "NEXUSSTORE"."WIKI_TABELA"."CREA_TABE" IS
    'TIMESTAMPTZ | Timestamp forense de criação do registro (UTC) | Ex: 2026-11-24 08:00:00-03';
COMMENT ON COLUMN "NEXUSSTORE"."WIKI_TABELA"."UPDA_TABE" IS
    'TIMESTAMPTZ | Timestamp forense da última atualização (Trigger) | Ex: 2026-11-24 08:00:00-03';
COMMENT ON COLUMN "NEXUSSTORE"."WIKI_TABELA"."DELE_TABE" IS
    'TIMESTAMPTZ | Timestamp de exclusão lógica / Soft Delete (NULL = ativo) | Ex: NULL';
COMMENT ON COLUMN "NEXUSSTORE"."WIKI_TABELA"."USCR_TABE" IS
    'VARCHAR(150) | Role/usuário criador original do registro | Ex: role_escrita_nexusstore';
COMMENT ON COLUMN "NEXUSSTORE"."WIKI_TABELA"."USAL_TABE" IS
    'VARCHAR(150) | Role/usuário autor da última modificação | Ex: role_escrita_nexusstore';

COMMENT ON TABLE "NEXUSSTORE"."WIKI_COLUNA" IS
    'Catálogo corporativo ativo de colunas e metadados semânticos/LGPD do schema NEXUSSTORE.';
COMMENT ON COLUMN "NEXUSSTORE"."WIKI_COLUNA"."IDEN_COLU" IS
    'BIGSERIAL | Identificador sequencial único (PK) do registro de coluna no catálogo WIKI | Ex: 1';
COMMENT ON COLUMN "NEXUSSTORE"."WIKI_COLUNA"."NOME_TABE" IS
    'VARCHAR(64) | Chave estrangeira (FK) referenciando o nome da tabela em WIKI_TABELA | Ex: PROD_AFIL';
COMMENT ON COLUMN "NEXUSSTORE"."WIKI_COLUNA"."NOME_COLU" IS
    'VARCHAR(64) | Nome oficial da coluna em MAIÚSCULO no padrão XXXX_YYYY | Ex: PRAT_PROD';
COMMENT ON COLUMN "NEXUSSTORE"."WIKI_COLUNA"."TIPO_COLU" IS
    'VARCHAR(100) | Tipo de dado físico PostgreSQL da coluna | Ex: NUMERIC(15,2)';
COMMENT ON COLUMN "NEXUSSTORE"."WIKI_COLUNA"."DESC_COLU" IS
    'VARCHAR(500) | Definição de negócio, regras de qualidade e classificação LGPD da coluna | Ex: Preço atual verificado do produto.';
COMMENT ON COLUMN "NEXUSSTORE"."WIKI_COLUNA"."CREA_COLU" IS
    'TIMESTAMPTZ | Timestamp forense de criação do registro (UTC) | Ex: 2026-11-24 08:00:00-03';
COMMENT ON COLUMN "NEXUSSTORE"."WIKI_COLUNA"."UPDA_COLU" IS
    'TIMESTAMPTZ | Timestamp forense da última atualização (Trigger) | Ex: 2026-11-24 08:00:00-03';
COMMENT ON COLUMN "NEXUSSTORE"."WIKI_COLUNA"."DELE_COLU" IS
    'TIMESTAMPTZ | Timestamp de exclusão lógica / Soft Delete (NULL = ativo) | Ex: NULL';
COMMENT ON COLUMN "NEXUSSTORE"."WIKI_COLUNA"."USCR_COLU" IS
    'VARCHAR(150) | Role/usuário criador original do registro | Ex: role_escrita_nexusstore';
COMMENT ON COLUMN "NEXUSSTORE"."WIKI_COLUNA"."USAL_COLU" IS
    'VARCHAR(150) | Role/usuário autor da última modificação | Ex: role_escrita_nexusstore';

-- Comentários: CATE_PROD
COMMENT ON TABLE "NEXUSSTORE"."CATE_PROD" IS
    'Tabela de domínio das categorias comerciais do catálogo Nexus Store. Governança: Soft Delete ativo (DELE_CATE) e RLS habilitado.';
COMMENT ON VIEW "NEXUSSTORE"."VW_CATE_PROD_ATIVOS" IS
    'Visão operacional de categorias ativas (DELE_CATE IS NULL) com security_invoker = true para respeitar políticas RLS.';

COMMENT ON COLUMN "NEXUSSTORE"."CATE_PROD"."IDEN_CATE" IS
    'UUID | Identificador único universal (PK) da categoria | Ex: 11111111-1111-4000-8000-000000000001';
COMMENT ON COLUMN "NEXUSSTORE"."CATE_PROD"."NOME_CATE" IS
    'VARCHAR(80) | Nome oficial de exibição da categoria na vitrine | Ex: Tecnologia';
COMMENT ON COLUMN "NEXUSSTORE"."CATE_PROD"."SLUG_CATE" IS
    'VARCHAR(80) | Identificador URL amigável em kebab-case único entre categorias ativas | Ex: tecnologia';
COMMENT ON COLUMN "NEXUSSTORE"."CATE_PROD"."DESC_CATE" IS
    'VARCHAR(300) | Descrição editorial curta da categoria para SEO e curadoria | Ex: Eletrônicos, áudio e dispositivos inteligentes selecionados.';
COMMENT ON COLUMN "NEXUSSTORE"."CATE_PROD"."ORDE_CATE" IS
    'SMALLINT | Ordem numérica crescente de exibição da categoria no menu horizontal | Ex: 1';
COMMENT ON COLUMN "NEXUSSTORE"."CATE_PROD"."STAT_CATE" IS
    'VARCHAR(20) | Status operacional da categoria (ATIVA, INATIVA) | Ex: ATIVA';
COMMENT ON COLUMN "NEXUSSTORE"."CATE_PROD"."CREA_CATE" IS
    'TIMESTAMPTZ | Timestamp forense de criação do registro (armazenado em UTC) | Ex: 2026-11-24 08:00:00-03';
COMMENT ON COLUMN "NEXUSSTORE"."CATE_PROD"."UPDA_CATE" IS
    'TIMESTAMPTZ | Timestamp forense da última atualização (gerenciado via Trigger) | Ex: 2026-11-24 08:00:00-03';
COMMENT ON COLUMN "NEXUSSTORE"."CATE_PROD"."DELE_CATE" IS
    'TIMESTAMPTZ | Timestamp de exclusão lógica / Soft Delete (NULL = registro ativo) | Ex: NULL';
COMMENT ON COLUMN "NEXUSSTORE"."CATE_PROD"."USCR_CATE" IS
    'VARCHAR(150) | Role/usuário do banco responsável pela criação original do registro | Ex: role_escrita_nexusstore';
COMMENT ON COLUMN "NEXUSSTORE"."CATE_PROD"."USAL_CATE" IS
    'VARCHAR(150) | Role/usuário do banco responsável pela última modificação do registro | Ex: role_escrita_nexusstore';

-- Comentários: PLAT_AFIL
COMMENT ON TABLE "NEXUSSTORE"."PLAT_AFIL" IS
    'Tabela de domínio das plataformas/marketplaces parceiros de afiliação (Amazon, Mercado Livre, Shopee). Governança: Soft Delete ativo (DELE_PLAT) e RLS habilitado.';
COMMENT ON VIEW "NEXUSSTORE"."VW_PLAT_AFIL_ATIVOS" IS
    'Visão operacional de plataformas parceiras ativas (DELE_PLAT IS NULL) com security_invoker = true para respeitar políticas RLS.';

COMMENT ON COLUMN "NEXUSSTORE"."PLAT_AFIL"."IDEN_PLAT" IS
    'UUID | Identificador único universal (PK) da plataforma afiliada | Ex: 22222222-2222-4000-8000-000000000001';
COMMENT ON COLUMN "NEXUSSTORE"."PLAT_AFIL"."NOME_PLAT" IS
    'VARCHAR(60) | Nome comercial oficial do marketplace parceiro | Ex: Amazon';
COMMENT ON COLUMN "NEXUSSTORE"."PLAT_AFIL"."SLUG_PLAT" IS
    'VARCHAR(60) | Slug canônico em kebab-case da plataforma para filtros e URLs | Ex: amazon';
COMMENT ON COLUMN "NEXUSSTORE"."PLAT_AFIL"."DOMI_PLAT" IS
    'VARCHAR(255) | Domínio raiz oficial permitido para validação de links de afiliado (allowlist) | Ex: amazon.com.br';
COMMENT ON COLUMN "NEXUSSTORE"."PLAT_AFIL"."CORP_PLAT" IS
    'VARCHAR(7) | Cor hexadecimal primária (#RRGGBB) da identidade visual do selo da plataforma | Ex: #007185';
COMMENT ON COLUMN "NEXUSSTORE"."PLAT_AFIL"."STAT_PLAT" IS
    'VARCHAR(20) | Status operacional da plataforma (ATIVA, INATIVA, MANUTENCAO) | Ex: ATIVA';
COMMENT ON COLUMN "NEXUSSTORE"."PLAT_AFIL"."CREA_PLAT" IS
    'TIMESTAMPTZ | Timestamp forense de criação do registro (armazenado em UTC) | Ex: 2026-11-24 08:00:00-03';
COMMENT ON COLUMN "NEXUSSTORE"."PLAT_AFIL"."UPDA_PLAT" IS
    'TIMESTAMPTZ | Timestamp forense da última atualização (gerenciado via Trigger) | Ex: 2026-11-24 08:00:00-03';
COMMENT ON COLUMN "NEXUSSTORE"."PLAT_AFIL"."DELE_PLAT" IS
    'TIMESTAMPTZ | Timestamp de exclusão lógica / Soft Delete (NULL = registro ativo) | Ex: NULL';
COMMENT ON COLUMN "NEXUSSTORE"."PLAT_AFIL"."USCR_PLAT" IS
    'VARCHAR(150) | Role/usuário do banco responsável pela criação original do registro | Ex: role_escrita_nexusstore';
COMMENT ON COLUMN "NEXUSSTORE"."PLAT_AFIL"."USAL_PLAT" IS
    'VARCHAR(150) | Role/usuário do banco responsável pela última modificação do registro | Ex: role_escrita_nexusstore';

-- Comentários: PROD_AFIL
COMMENT ON TABLE "NEXUSSTORE"."PROD_AFIL" IS
    'Tabela principal do catálogo de produtos afiliados da Nexus Store. Contém preços reais auditáveis, validação HTTPS de links, controle de ciclo de vida, Soft Delete (DELE_PROD) e RLS.';
COMMENT ON VIEW "NEXUSSTORE"."VW_PROD_AFIL_ATIVOS" IS
    'Visão operacional de produtos afiliados não excluídos logicamente (DELE_PROD IS NULL) com security_invoker = true para respeitar RLS.';
COMMENT ON VIEW "NEXUSSTORE"."VW_PROD_AFIL_VITRINE" IS
    'Visão denormalizada de leitura pública para a vitrine Nexus Store, retornando apenas produtos PUBLICADOS vinculados a categorias e plataformas ATIVAS com security_invoker = true.';

COMMENT ON COLUMN "NEXUSSTORE"."PROD_AFIL"."IDEN_PROD" IS
    'UUID | Identificador único universal (PK) do produto afiliado | Ex: 33333333-3333-4000-8000-000000000001';
COMMENT ON COLUMN "NEXUSSTORE"."PROD_AFIL"."CATE_PROD" IS
    'UUID | Chave estrangeira (FK) referenciando a categoria em CATE_PROD | Ex: 11111111-1111-4000-8000-000000000001';
COMMENT ON COLUMN "NEXUSSTORE"."PROD_AFIL"."PLAT_PROD" IS
    'UUID | Chave estrangeira (FK) referenciando a plataforma afiliada em PLAT_AFIL | Ex: 22222222-2222-4000-8000-000000000001';
COMMENT ON COLUMN "NEXUSSTORE"."PROD_AFIL"."EXID_PROD" IS
    'VARCHAR(100) | Identificador externo do item no marketplace (ASIN, MLB, ItemID) para idempotência de sincronização | Ex: B0CHWRXH8B';
COMMENT ON COLUMN "NEXUSSTORE"."PROD_AFIL"."NOME_PROD" IS
    'VARCHAR(200) | Título comercial do produto exibido na vitrine | Ex: Apple AirPods Pro (2ª Geração) com Estojo MagSafe USB-C';
COMMENT ON COLUMN "NEXUSSTORE"."PROD_AFIL"."SLUG_PROD" IS
    'VARCHAR(220) | Slug URL amigável único em kebab-case para SEO e rotas canônicas | Ex: apple-airpods-pro-2-geracao-magsafe-usbc';
COMMENT ON COLUMN "NEXUSSTORE"."PROD_AFIL"."DESC_PROD" IS
    'VARCHAR(500) | Descrição resumida e diferenciais editoriais do produto | Ex: Cancelamento ativo de ruído até 2x superior e áudio espacial personalizado.';
COMMENT ON COLUMN "NEXUSSTORE"."PROD_AFIL"."URLA_PROD" IS
    'VARCHAR(2048) | URL HTTPS validada de redirecionamento de afiliado | Ex: https://www.amazon.com.br/dp/B0CHWRXH8B?tag=nexusstore-20';
COMMENT ON COLUMN "NEXUSSTORE"."PROD_AFIL"."URLI_PROD" IS
    'VARCHAR(2048) | URL HTTPS validada da imagem principal do produto | Ex: https://m.media-amazon.com/images/I/61SUj2aKoEL._AC_SX679_.jpg';
COMMENT ON COLUMN "NEXUSSTORE"."PROD_AFIL"."PRAT_PROD" IS
    'NUMERIC(15,2) | Preço atual verificado do produto na moeda informada (deve ser > 0 e finito) | Ex: 1899.00';
COMMENT ON COLUMN "NEXUSSTORE"."PROD_AFIL"."PROR_PROD" IS
    'NUMERIC(15,2) | Preço original real antes de desconto (opcional; se preenchido deve ser >= PRAT_PROD) | Ex: 2299.00';
COMMENT ON COLUMN "NEXUSSTORE"."PROD_AFIL"."MOED_PROD" IS
    'VARCHAR(3) | Código ISO 4217 da moeda do preço (BRL, USD, EUR) | Ex: BRL';
COMMENT ON COLUMN "NEXUSSTORE"."PROD_AFIL"."AVAL_PROD" IS
    'NUMERIC(2,1) | Avaliação média real do produto na plataforma de origem entre 0.0 e 5.0 | Ex: 4.8';
COMMENT ON COLUMN "NEXUSSTORE"."PROD_AFIL"."QAVA_PROD" IS
    'INTEGER | Quantidade real de avaliações verificadas na plataforma de origem | Ex: 3420';
COMMENT ON COLUMN "NEXUSSTORE"."PROD_AFIL"."DEST_PROD" IS
    'BOOLEAN | Indica se o produto está sinalizado como destaque / Em Alta na vitrine | Ex: true';
COMMENT ON COLUMN "NEXUSSTORE"."PROD_AFIL"."STAT_PROD" IS
    'VARCHAR(20) | Status do ciclo de vida do produto (RASCUNHO, PUBLICADO, PAUSADO, ESGOTADO, ARQUIVADO) | Ex: PUBLICADO';
COMMENT ON COLUMN "NEXUSSTORE"."PROD_AFIL"."SINC_PROD" IS
    'TIMESTAMPTZ | Data e hora da última sincronização real de preço e disponibilidade na origem (compliance CDC) | Ex: 2026-11-24 08:00:00-03';
COMMENT ON COLUMN "NEXUSSTORE"."PROD_AFIL"."CREA_PROD" IS
    'TIMESTAMPTZ | Timestamp forense de criação do registro (armazenado em UTC) | Ex: 2026-11-24 08:00:00-03';
COMMENT ON COLUMN "NEXUSSTORE"."PROD_AFIL"."UPDA_PROD" IS
    'TIMESTAMPTZ | Timestamp forense da última atualização (gerenciado via Trigger) | Ex: 2026-11-24 08:00:00-03';
COMMENT ON COLUMN "NEXUSSTORE"."PROD_AFIL"."DELE_PROD" IS
    'TIMESTAMPTZ | Timestamp de exclusão lógica / Soft Delete (NULL = registro ativo) | Ex: NULL';
COMMENT ON COLUMN "NEXUSSTORE"."PROD_AFIL"."USCR_PROD" IS
    'VARCHAR(150) | Role/usuário do banco responsável pela criação original do registro | Ex: role_escrita_nexusstore';
COMMENT ON COLUMN "NEXUSSTORE"."PROD_AFIL"."USAL_PROD" IS
    'VARCHAR(150) | Role/usuário do banco responsável pela última modificação do registro | Ex: role_escrita_nexusstore';

COMMIT;
