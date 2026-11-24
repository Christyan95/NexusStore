-- ============================================================
-- Migration  : V1.4.0__create_clic_afil.sql
-- Tabela     : "NEXUSSTORE"."CLIC_AFIL"
-- Autor      : Staff Data Architecture / Model DB Engine
-- Data       : 2026-11-24
-- Ambiente   : DEV | HML | PRD
-- Descrição  : Criação da tabela particionada mensalmente (ALTO VOLUME)
--              de telemetria de cliques de afiliado (CLIC_AFIL) com 12
--              partições mensais + DEFAULT, hash LGPD de IP, RLS, trigger
--              forense, view de ativos e registro completo no catálogo WIKI.
-- ============================================================

BEGIN;

SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';
SET LOCAL client_min_messages = WARNING;
SET LOCAL TIME ZONE 'America/Sao_Paulo';

-- ------------------------------------------------------------
-- 1. TABELA PARTICIONADA (ALTA ESCRITA / > 10M LINHAS): "CLIC_AFIL"
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "NEXUSSTORE"."CLIC_AFIL" (
    "IDEN_CLIC" UUID          NOT NULL DEFAULT uuid_generate_v4(),
    "PROD_CLIC" UUID          NOT NULL,
    "PLAT_CLIC" UUID          NOT NULL,
    "REQI_CLIC" VARCHAR(64)   NOT NULL,
    "IPHA_CLIC" VARCHAR(64)   NOT NULL,
    "ORIG_CLIC" VARCHAR(255)  NULL,
    "USAG_CLIC" VARCHAR(200)  NULL,
    "CREA_CLIC" TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    "UPDA_CLIC" TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    "DELE_CLIC" TIMESTAMPTZ   NULL,
    "USCR_CLIC" VARCHAR(150)  NOT NULL DEFAULT CURRENT_USER,
    "USAL_CLIC" VARCHAR(150)  NOT NULL DEFAULT CURRENT_USER,

    CONSTRAINT "PK_CLIC_AFIL"           PRIMARY KEY ("IDEN_CLIC", "CREA_CLIC"),
    CONSTRAINT "FK_CLIC_AFIL_PROD_AFIL" FOREIGN KEY ("PROD_CLIC")
        REFERENCES "NEXUSSTORE"."PROD_AFIL" ("IDEN_PROD")
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "FK_CLIC_AFIL_PLAT_AFIL" FOREIGN KEY ("PLAT_CLIC")
        REFERENCES "NEXUSSTORE"."PLAT_AFIL" ("IDEN_PLAT")
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CK_CLIC_AFIL_REQI_NVAZ" CHECK (BTRIM("REQI_CLIC") <> ''),
    CONSTRAINT "CK_CLIC_AFIL_IPHA"      CHECK ("IPHA_CLIC" ~ '^[a-f0-9]{64}$'),
    CONSTRAINT "CK_CLIC_AFIL_ORIG_NVAZ" CHECK ("ORIG_CLIC" IS NULL OR BTRIM("ORIG_CLIC") <> ''),
    CONSTRAINT "CK_CLIC_AFIL_USAG_NVAZ" CHECK ("USAG_CLIC" IS NULL OR BTRIM("USAG_CLIC") <> ''),
    CONSTRAINT "CK_CLIC_AFIL_DELE"      CHECK ("DELE_CLIC" IS NULL OR "DELE_CLIC" >= "CREA_CLIC")
) PARTITION BY RANGE ("CREA_CLIC");

-- ------------------------------------------------------------
-- 2. PARTIÇÕES MENSAIS (12 MESES) + PARTIÇÃO DEFAULT (FILLFACTOR = 70)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "NEXUSSTORE"."CLIC_AFIL_Y2026M11"
    PARTITION OF "NEXUSSTORE"."CLIC_AFIL"
    FOR VALUES FROM ('2026-11-01 00:00:00-03') TO ('2026-12-01 00:00:00-03')
    WITH (fillfactor = 70);

CREATE TABLE IF NOT EXISTS "NEXUSSTORE"."CLIC_AFIL_Y2026M12"
    PARTITION OF "NEXUSSTORE"."CLIC_AFIL"
    FOR VALUES FROM ('2026-12-01 00:00:00-03') TO ('2027-01-01 00:00:00-03')
    WITH (fillfactor = 70);

CREATE TABLE IF NOT EXISTS "NEXUSSTORE"."CLIC_AFIL_Y2027M01"
    PARTITION OF "NEXUSSTORE"."CLIC_AFIL"
    FOR VALUES FROM ('2027-01-01 00:00:00-03') TO ('2027-02-01 00:00:00-03')
    WITH (fillfactor = 70);

CREATE TABLE IF NOT EXISTS "NEXUSSTORE"."CLIC_AFIL_Y2027M02"
    PARTITION OF "NEXUSSTORE"."CLIC_AFIL"
    FOR VALUES FROM ('2027-02-01 00:00:00-03') TO ('2027-03-01 00:00:00-03')
    WITH (fillfactor = 70);

CREATE TABLE IF NOT EXISTS "NEXUSSTORE"."CLIC_AFIL_Y2027M03"
    PARTITION OF "NEXUSSTORE"."CLIC_AFIL"
    FOR VALUES FROM ('2027-03-01 00:00:00-03') TO ('2027-04-01 00:00:00-03')
    WITH (fillfactor = 70);

CREATE TABLE IF NOT EXISTS "NEXUSSTORE"."CLIC_AFIL_Y2027M04"
    PARTITION OF "NEXUSSTORE"."CLIC_AFIL"
    FOR VALUES FROM ('2027-04-01 00:00:00-03') TO ('2027-05-01 00:00:00-03')
    WITH (fillfactor = 70);

CREATE TABLE IF NOT EXISTS "NEXUSSTORE"."CLIC_AFIL_Y2027M05"
    PARTITION OF "NEXUSSTORE"."CLIC_AFIL"
    FOR VALUES FROM ('2027-05-01 00:00:00-03') TO ('2027-06-01 00:00:00-03')
    WITH (fillfactor = 70);

CREATE TABLE IF NOT EXISTS "NEXUSSTORE"."CLIC_AFIL_Y2027M06"
    PARTITION OF "NEXUSSTORE"."CLIC_AFIL"
    FOR VALUES FROM ('2027-06-01 00:00:00-03') TO ('2027-07-01 00:00:00-03')
    WITH (fillfactor = 70);

CREATE TABLE IF NOT EXISTS "NEXUSSTORE"."CLIC_AFIL_Y2027M07"
    PARTITION OF "NEXUSSTORE"."CLIC_AFIL"
    FOR VALUES FROM ('2027-07-01 00:00:00-03') TO ('2027-08-01 00:00:00-03')
    WITH (fillfactor = 70);

CREATE TABLE IF NOT EXISTS "NEXUSSTORE"."CLIC_AFIL_Y2027M08"
    PARTITION OF "NEXUSSTORE"."CLIC_AFIL"
    FOR VALUES FROM ('2027-08-01 00:00:00-03') TO ('2027-09-01 00:00:00-03')
    WITH (fillfactor = 70);

CREATE TABLE IF NOT EXISTS "NEXUSSTORE"."CLIC_AFIL_Y2027M09"
    PARTITION OF "NEXUSSTORE"."CLIC_AFIL"
    FOR VALUES FROM ('2027-09-01 00:00:00-03') TO ('2027-10-01 00:00:00-03')
    WITH (fillfactor = 70);

CREATE TABLE IF NOT EXISTS "NEXUSSTORE"."CLIC_AFIL_Y2027M10"
    PARTITION OF "NEXUSSTORE"."CLIC_AFIL"
    FOR VALUES FROM ('2027-10-01 00:00:00-03') TO ('2027-11-01 00:00:00-03')
    WITH (fillfactor = 70);

CREATE TABLE IF NOT EXISTS "NEXUSSTORE"."CLIC_AFIL_DEFAULT"
    PARTITION OF "NEXUSSTORE"."CLIC_AFIL"
    DEFAULT
    WITH (fillfactor = 70);

-- ------------------------------------------------------------
-- 3. ÍNDICES DE FK, ANALYTICS E DETECÇÃO DE ABUSO
-- ------------------------------------------------------------
CREATE INDEX IF NOT EXISTS "IDX_CLIC_AFIL_PROD_CLIC"
    ON "NEXUSSTORE"."CLIC_AFIL" ("PROD_CLIC", "CREA_CLIC" DESC)
    WITH (fillfactor = 80);

CREATE INDEX IF NOT EXISTS "IDX_CLIC_AFIL_PLAT_CLIC"
    ON "NEXUSSTORE"."CLIC_AFIL" ("PLAT_CLIC", "CREA_CLIC" DESC)
    WITH (fillfactor = 80);

CREATE INDEX IF NOT EXISTS "IDX_CLIC_AFIL_IPHA_ATIV"
    ON "NEXUSSTORE"."CLIC_AFIL" ("IPHA_CLIC", "CREA_CLIC" DESC)
    WITH (fillfactor = 80)
    WHERE "DELE_CLIC" IS NULL;

-- ------------------------------------------------------------
-- 4. TRIGGER FORENSE, VIEW DE ATIVOS E RLS (SOMENTE ESCRITA/ANALYTICS)
-- ------------------------------------------------------------
DROP TRIGGER IF EXISTS "TRG_AUDIT_CLIC_AFIL" ON "NEXUSSTORE"."CLIC_AFIL";
CREATE TRIGGER "TRG_AUDIT_CLIC_AFIL"
    BEFORE UPDATE ON "NEXUSSTORE"."CLIC_AFIL"
    FOR EACH ROW
    EXECUTE FUNCTION "NEXUSSTORE"."TRG_UPDATE_TIMESTAMP"('CLIC');

CREATE OR REPLACE VIEW "NEXUSSTORE"."VW_CLIC_AFIL_ATIVOS"
WITH (security_invoker = true) AS
SELECT
    "IDEN_CLIC",
    "PROD_CLIC",
    "PLAT_CLIC",
    "REQI_CLIC",
    "IPHA_CLIC",
    "ORIG_CLIC",
    "USAG_CLIC",
    "CREA_CLIC",
    "UPDA_CLIC",
    "DELE_CLIC",
    "USCR_CLIC",
    "USAL_CLIC"
FROM "NEXUSSTORE"."CLIC_AFIL"
WHERE "DELE_CLIC" IS NULL;

ALTER TABLE "NEXUSSTORE"."CLIC_AFIL" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "POL_ISOLAMENTO_CLIC_AFIL" ON "NEXUSSTORE"."CLIC_AFIL";
CREATE POLICY "POL_ISOLAMENTO_CLIC_AFIL"
    ON "NEXUSSTORE"."CLIC_AFIL"
    AS PERMISSIVE
    FOR ALL
    TO PUBLIC
    USING (
        pg_has_role(CURRENT_USER, 'role_escrita_nexusstore', 'MEMBER')
        OR "USCR_CLIC" = CURRENT_USER
    )
    WITH CHECK (
        pg_has_role(CURRENT_USER, 'role_escrita_nexusstore', 'MEMBER')
        OR "USCR_CLIC" = CURRENT_USER
    );

-- Telemetria contém pseudonimização de IP: revogar leitura pública/anon explicitamente (pai + partições filhas)
REVOKE ALL ON TABLE "NEXUSSTORE"."CLIC_AFIL" FROM PUBLIC;
REVOKE ALL ON TABLE "NEXUSSTORE"."VW_CLIC_AFIL_ATIVOS" FROM PUBLIC;
REVOKE SELECT ON TABLE "NEXUSSTORE"."CLIC_AFIL" FROM role_leitura_nexusstore;
REVOKE SELECT ON TABLE "NEXUSSTORE"."VW_CLIC_AFIL_ATIVOS" FROM role_leitura_nexusstore;

DO $$
DECLARE
    v_part RECORD;
BEGIN
    FOR v_part IN
        SELECT c.relname
        FROM pg_catalog.pg_inherits AS i
        INNER JOIN pg_catalog.pg_class AS c ON c.oid = i.inhrelid
        INNER JOIN pg_catalog.pg_namespace AS n ON n.oid = c.relnamespace
        WHERE i.inhparent = '"NEXUSSTORE"."CLIC_AFIL"'::REGCLASS
          AND n.nspname = 'NEXUSSTORE'
    LOOP
        EXECUTE format('REVOKE ALL ON TABLE "NEXUSSTORE".%I FROM PUBLIC;', v_part.relname);
        EXECUTE format('REVOKE SELECT ON TABLE "NEXUSSTORE".%I FROM role_leitura_nexusstore;', v_part.relname);
    END LOOP;
END
$$;

GRANT SELECT, INSERT, UPDATE ON TABLE "NEXUSSTORE"."CLIC_AFIL" TO role_escrita_nexusstore;
GRANT SELECT ON TABLE "NEXUSSTORE"."VW_CLIC_AFIL_ATIVOS" TO role_escrita_nexusstore;

-- ------------------------------------------------------------
-- 5. OBSERVABILIDADE NATIVA (PG_DESCRIPTION + LGPD [PII])
-- ------------------------------------------------------------
COMMENT ON TABLE "NEXUSSTORE"."CLIC_AFIL" IS
    'Tabela particionada mensalmente de telemetria de cliques de saída (click-out) para marketplaces parceiros. Acesso restrito a role_escrita_nexusstore (Zero exposição pública).';
COMMENT ON VIEW "NEXUSSTORE"."VW_CLIC_AFIL_ATIVOS" IS
    'Visão de eventos de clique ativos (DELE_CLIC IS NULL) com security_invoker = true e acesso restrito.';

COMMENT ON COLUMN "NEXUSSTORE"."CLIC_AFIL"."IDEN_CLIC" IS
    'UUID | Identificador único universal do evento de clique (parte da PK composta) | Ex: 44444444-4444-4000-8000-000000000001';
COMMENT ON COLUMN "NEXUSSTORE"."CLIC_AFIL"."PROD_CLIC" IS
    'UUID | Chave estrangeira (FK) referenciando o produto clicado em PROD_AFIL | Ex: 33333333-3333-4000-8000-000000000001';
COMMENT ON COLUMN "NEXUSSTORE"."CLIC_AFIL"."PLAT_CLIC" IS
    'UUID | Chave estrangeira (FK) referenciando a plataforma de destino em PLAT_AFIL | Ex: 22222222-2222-4000-8000-000000000001';
COMMENT ON COLUMN "NEXUSSTORE"."CLIC_AFIL"."REQI_CLIC" IS
    'VARCHAR(64) | Identificador de correlação distribuída (request_id) gerado na Edge Function | Ex: req_01j9x7k8m9n0p1q2';
COMMENT ON COLUMN "NEXUSSTORE"."CLIC_AFIL"."IPHA_CLIC" IS
    '[PII - DADO SENSÍVEL] VARCHAR(64) | Hash SHA-256 com salt do endereço IP de origem (pseudonimização LGPD para detecção de fraude sem armazenar IP em claro) | Ex: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
COMMENT ON COLUMN "NEXUSSTORE"."CLIC_AFIL"."ORIG_CLIC" IS
    'VARCHAR(255) | Origem sanitizada (host/path sem query string) da requisição de clique | Ex: https://nexusstore.com.br/';
COMMENT ON COLUMN "NEXUSSTORE"."CLIC_AFIL"."USAG_CLIC" IS
    '[PII - DADO SENSÍVEL] VARCHAR(200) | User-Agent truncado do navegador para filtragem de bots e análise de dispositivos (LGPD) | Ex: Mozilla/5.0 (Windows NT 10.0; Win64; x64)';
COMMENT ON COLUMN "NEXUSSTORE"."CLIC_AFIL"."CREA_CLIC" IS
    'TIMESTAMPTZ | Timestamp forense de ocorrência do clique e chave de particionamento mensal (UTC) | Ex: 2026-11-24 08:30:00-03';
COMMENT ON COLUMN "NEXUSSTORE"."CLIC_AFIL"."UPDA_CLIC" IS
    'TIMESTAMPTZ | Timestamp forense da última atualização (Trigger) | Ex: 2026-11-24 08:30:00-03';
COMMENT ON COLUMN "NEXUSSTORE"."CLIC_AFIL"."DELE_CLIC" IS
    'TIMESTAMPTZ | Timestamp de exclusão lógica / Soft Delete (NULL = ativo) | Ex: NULL';
COMMENT ON COLUMN "NEXUSSTORE"."CLIC_AFIL"."USCR_CLIC" IS
    'VARCHAR(150) | Role/usuário do banco responsável pela inserção original | Ex: role_escrita_nexusstore';
COMMENT ON COLUMN "NEXUSSTORE"."CLIC_AFIL"."USAL_CLIC" IS
    'VARCHAR(150) | Role/usuário do banco responsável pela última modificação | Ex: role_escrita_nexusstore';

-- ------------------------------------------------------------
-- 6. ATUALIZAÇÃO IDEMPOTENTE DO CATÁLOGO WIKI (ZERO TRUNCATE)
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

INSERT INTO "NEXUSSTORE"."WIKI_TABELA" ("SCHE_TABE", "NOME_TABE", "DESC_TABE")
VALUES (
    'NEXUSSTORE',
    'CLIC_AFIL',
    'Tabela particionada mensalmente de telemetria de cliques de saída (click-out) com pseudonimização LGPD de IP, rastreabilidade forense e RLS restrito.'
)
ON CONFLICT ON CONSTRAINT "UK_WIKI_TABELA_SCHE_NOME"
DO UPDATE SET
    "DESC_TABE" = EXCLUDED."DESC_TABE",
    "UPDA_TABE" = NOW(),
    "USAL_TABE" = CURRENT_USER,
    "DELE_TABE" = NULL;

INSERT INTO "NEXUSSTORE"."WIKI_COLUNA" ("NOME_TABE", "NOME_COLU", "TIPO_COLU", "DESC_COLU")
VALUES
    ('CLIC_AFIL', 'IDEN_CLIC', 'UUID',         'Chave primária (PK composta com CREA_CLIC) universal do evento de clique.'),
    ('CLIC_AFIL', 'PROD_CLIC', 'UUID',         'Chave estrangeira (FK) para PROD_AFIL(IDEN_PROD) com ON DELETE RESTRICT ON UPDATE CASCADE.'),
    ('CLIC_AFIL', 'PLAT_CLIC', 'UUID',         'Chave estrangeira (FK) para PLAT_AFIL(IDEN_PLAT) com ON DELETE RESTRICT ON UPDATE CASCADE.'),
    ('CLIC_AFIL', 'REQI_CLIC', 'VARCHAR(64)',  'Identificador de correlação distribuída (request_id) gerado na borda Edge.'),
    ('CLIC_AFIL', 'IPHA_CLIC', 'VARCHAR(64)',  '[PII - DADO SENSÍVEL] Hash SHA-256 com salt do IP de origem para antifraude sob pseudonimização LGPD.'),
    ('CLIC_AFIL', 'ORIG_CLIC', 'VARCHAR(255)', 'Origem sanitizada (host e path sem query string) da requisição de clique.'),
    ('CLIC_AFIL', 'USAG_CLIC', 'VARCHAR(200)', '[PII - DADO SENSÍVEL] User-Agent truncado do cliente para filtragem de bots (LGPD).'),
    ('CLIC_AFIL', 'CREA_CLIC', 'TIMESTAMPTZ',  'Auditoria Forense e chave de particionamento mensal: timestamp do clique em UTC.'),
    ('CLIC_AFIL', 'UPDA_CLIC', 'TIMESTAMPTZ',  'Auditoria Forense: timestamp da última alteração gerenciada via Trigger.'),
    ('CLIC_AFIL', 'DELE_CLIC', 'TIMESTAMPTZ',  'Auditoria Forense / Soft Delete: timestamp de inativação lógica (NULL = ativo).'),
    ('CLIC_AFIL', 'USCR_CLIC', 'VARCHAR(150)', 'Auditoria Forense: Role/usuário PostgreSQL criador do registro.'),
    ('CLIC_AFIL', 'USAL_CLIC', 'VARCHAR(150)', 'Auditoria Forense: Role/usuário PostgreSQL autor da última atualização.')
ON CONFLICT ON CONSTRAINT "UK_WIKI_COLUNA_TABE_COLU"
DO UPDATE SET
    "TIPO_COLU" = EXCLUDED."TIPO_COLU",
    "DESC_COLU" = EXCLUDED."DESC_COLU",
    "UPDA_COLU" = NOW(),
    "USAL_COLU" = CURRENT_USER,
    "DELE_COLU" = NULL;

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
