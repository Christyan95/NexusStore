-- ============================================================
-- Migration  : V1.3.0__rpc_catalogo_e_bridge.sql
-- Tabela     : "NEXUSSTORE"."PROD_AFIL" (RPCs server-side & Bridge Expand-and-Contract)
-- Autor      : Staff Data Architecture / Model DB Engine
-- Data       : 2026-11-24
-- Ambiente   : DEV | HML | PRD
-- Descrição  : Criação das funções RPC server-side de busca/paginação/facetas
--              (SECURITY INVOKER respeitando RLS), bridge idempotente de roles
--              Supabase (anon/authenticated) e migração segura Expand-and-Contract
--              dos registros válidos da tabela legada public.my_prod.
-- ============================================================

BEGIN;

SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';
SET LOCAL client_min_messages = WARNING;
SET LOCAL TIME ZONE 'America/Sao_Paulo';

-- ------------------------------------------------------------
-- 1. BRIDGE IDEMPOTENTE DE ROLES SUPABASE (MANTENDO ZERO TRUST)
-- ------------------------------------------------------------
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = 'anon') THEN
        GRANT role_leitura_nexusstore TO anon;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = 'authenticated') THEN
        GRANT role_leitura_nexusstore TO authenticated;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = 'service_role') THEN
        GRANT role_escrita_nexusstore TO service_role;
    END IF;
END
$$;

-- ------------------------------------------------------------
-- 2. RPC SERVER-SIDE DE LISTAGEM, BUSCA FTS, FILTROS E PAGINAÇÃO
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION "NEXUSSTORE"."RPC_LISTAR_VITRINE"(
    "P_BUSC" VARCHAR(120) DEFAULT NULL,
    "P_CATE" VARCHAR(80)  DEFAULT NULL,
    "P_PLAT" VARCHAR(60)  DEFAULT NULL,
    "P_DEST" BOOLEAN      DEFAULT FALSE,
    "P_ORDE" VARCHAR(20)  DEFAULT 'RECOMENDADOS',
    "P_PAGI" INTEGER      DEFAULT 1,
    "P_LIMP" INTEGER      DEFAULT 20
)
RETURNS TABLE (
    "IDEN_PROD" UUID,
    "SLUG_PROD" VARCHAR(220),
    "NOME_PROD" VARCHAR(200),
    "DESC_PROD" VARCHAR(500),
    "URLA_PROD" VARCHAR(2048),
    "URLI_PROD" VARCHAR(2048),
    "PRAT_PROD" NUMERIC(15,2),
    "PROR_PROD" NUMERIC(15,2),
    "MOED_PROD" VARCHAR(3),
    "AVAL_PROD" NUMERIC(2,1),
    "QAVA_PROD" INTEGER,
    "DEST_PROD" BOOLEAN,
    "SINC_PROD" TIMESTAMPTZ,
    "CREA_PROD" TIMESTAMPTZ,
    "IDEN_CATE" UUID,
    "NOME_CATE" VARCHAR(80),
    "SLUG_CATE" VARCHAR(80),
    "IDEN_PLAT" UUID,
    "NOME_PLAT" VARCHAR(60),
    "SLUG_PLAT" VARCHAR(60),
    "DOMI_PLAT" VARCHAR(255),
    "CORP_PLAT" VARCHAR(7),
    "TOTA_ITEN" BIGINT
)
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $$
DECLARE
    v_busca          TEXT;
    v_busca_like     TEXT;
    v_pagina         INTEGER := GREATEST(COALESCE("P_PAGI", 1), 1);
    v_limite         INTEGER := LEAST(GREATEST(COALESCE("P_LIMP", 20), 1), 60);
    v_offset         INTEGER := (v_pagina - 1) * v_limite;
    v_ordenacao      TEXT    := UPPER(COALESCE(BTRIM("P_ORDE"), 'RECOMENDADOS'));
    v_categoria      TEXT    := NULLIF(LOWER(BTRIM(COALESCE("P_CATE", ''))), '');
    v_plataforma     TEXT    := NULLIF(LOWER(BTRIM(COALESCE("P_PLAT", ''))), '');
    v_so_destaque    BOOLEAN := COALESCE("P_DEST", FALSE);
BEGIN
    v_busca := NULLIF(BTRIM(COALESCE("P_BUSC", '')), '');
    IF v_busca IS NOT NULL THEN
        -- Escapa metacaracteres LIKE para evitar wildcard injection
        v_busca_like := '%' || REPLACE(REPLACE(REPLACE(v_busca, '\', '\\'), '%', '\%'), '_', '\_') || '%';
    END IF;

    RETURN QUERY
    SELECT
        "V"."IDEN_PROD",
        "V"."SLUG_PROD",
        "V"."NOME_PROD",
        "V"."DESC_PROD",
        "V"."URLA_PROD",
        "V"."URLI_PROD",
        "V"."PRAT_PROD",
        "V"."PROR_PROD",
        "V"."MOED_PROD",
        "V"."AVAL_PROD",
        "V"."QAVA_PROD",
        "V"."DEST_PROD",
        "V"."SINC_PROD",
        "V"."CREA_PROD",
        "V"."IDEN_CATE",
        "V"."NOME_CATE",
        "V"."SLUG_CATE",
        "V"."IDEN_PLAT",
        "V"."NOME_PLAT",
        "V"."SLUG_PLAT",
        "V"."DOMI_PLAT",
        "V"."CORP_PLAT",
        COUNT(*) OVER() AS "TOTA_ITEN"
    FROM "NEXUSSTORE"."VW_PROD_AFIL_VITRINE" AS "V"
    WHERE (
            v_busca IS NULL
            OR to_tsvector('portuguese', "V"."NOME_PROD") @@ websearch_to_tsquery('portuguese', v_busca)
            OR "V"."NOME_PROD" ILIKE v_busca_like ESCAPE '\'
        )
      AND (v_categoria IS NULL OR "V"."SLUG_CATE" = v_categoria)
      AND (v_plataforma IS NULL OR "V"."SLUG_PLAT" = v_plataforma)
      AND (NOT v_so_destaque OR "V"."DEST_PROD" = TRUE)
    ORDER BY
        CASE WHEN v_ordenacao = 'MENOR_PRECO'      THEN "V"."PRAT_PROD" END ASC NULLS LAST,
        CASE WHEN v_ordenacao = 'MAIOR_PRECO'      THEN "V"."PRAT_PROD" END DESC NULLS LAST,
        CASE WHEN v_ordenacao = 'MELHOR_AVALIACAO' THEN "V"."AVAL_PROD" END DESC NULLS LAST,
        CASE WHEN v_ordenacao = 'MENOR_AVALIACAO'  THEN "V"."AVAL_PROD" END ASC NULLS LAST,
        "V"."DEST_PROD" DESC,
        "V"."AVAL_PROD" DESC,
        "V"."CREA_PROD" DESC,
        "V"."IDEN_PROD" ASC
    LIMIT v_limite
    OFFSET v_offset;
END;
$$;

COMMENT ON FUNCTION "NEXUSSTORE"."RPC_LISTAR_VITRINE"(VARCHAR, VARCHAR, VARCHAR, BOOLEAN, VARCHAR, INTEGER, INTEGER) IS
    'RPC server-side de busca textual (FTS português + ILIKE escapado), filtros whitelisted e paginação controlada da vitrine Nexus Store (SECURITY INVOKER).';

-- ------------------------------------------------------------
-- 3. RPC SERVER-SIDE DE FACETAS (CATEGORIAS E PLATAFORMAS ATIVAS)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION "NEXUSSTORE"."RPC_LISTAR_FACETAS"()
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $$
    SELECT jsonb_build_object(
        'categorias', COALESCE(
            (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'id', "C"."IDEN_CATE",
                        'nome', "C"."NOME_CATE",
                        'slug', "C"."SLUG_CATE",
                        'ordem', "C"."ORDE_CATE",
                        'total_produtos', COALESCE("CNT"."QTD", 0)
                    )
                    ORDER BY "C"."ORDE_CATE" ASC, "C"."NOME_CATE" ASC
                )
                FROM "NEXUSSTORE"."VW_CATE_PROD_ATIVOS" AS "C"
                LEFT JOIN (
                    SELECT "IDEN_CATE", COUNT(*)::INTEGER AS "QTD"
                    FROM "NEXUSSTORE"."VW_PROD_AFIL_VITRINE"
                    GROUP BY "IDEN_CATE"
                ) AS "CNT" ON "CNT"."IDEN_CATE" = "C"."IDEN_CATE"
                WHERE "C"."STAT_CATE" = 'ATIVA'
            ),
            '[]'::JSONB
        ),
        'plataformas', COALESCE(
            (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'id', "L"."IDEN_PLAT",
                        'nome', "L"."NOME_PLAT",
                        'slug', "L"."SLUG_PLAT",
                        'dominio', "L"."DOMI_PLAT",
                        'cor_primaria', "L"."CORP_PLAT",
                        'total_produtos', COALESCE("CNT"."QTD", 0)
                    )
                    ORDER BY "L"."NOME_PLAT" ASC
                )
                FROM "NEXUSSTORE"."VW_PLAT_AFIL_ATIVOS" AS "L"
                LEFT JOIN (
                    SELECT "IDEN_PLAT", COUNT(*)::INTEGER AS "QTD"
                    FROM "NEXUSSTORE"."VW_PROD_AFIL_VITRINE"
                    GROUP BY "IDEN_PLAT"
                ) AS "CNT" ON "CNT"."IDEN_PLAT" = "L"."IDEN_PLAT"
                WHERE "L"."STAT_PLAT" = 'ATIVA'
            ),
            '[]'::JSONB
        )
    );
$$;

COMMENT ON FUNCTION "NEXUSSTORE"."RPC_LISTAR_FACETAS"() IS
    'Retorna em uma única viagem JSONB as categorias e plataformas ativas com contagem de produtos publicados (SECURITY INVOKER).';

-- Permissões estritas de execução nas RPCs (Zero PUBLIC)
REVOKE ALL ON FUNCTION "NEXUSSTORE"."RPC_LISTAR_VITRINE"(VARCHAR, VARCHAR, VARCHAR, BOOLEAN, VARCHAR, INTEGER, INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION "NEXUSSTORE"."RPC_LISTAR_FACETAS"() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "NEXUSSTORE"."RPC_LISTAR_VITRINE"(VARCHAR, VARCHAR, VARCHAR, BOOLEAN, VARCHAR, INTEGER, INTEGER)
    TO role_leitura_nexusstore, role_escrita_nexusstore;

GRANT EXECUTE ON FUNCTION "NEXUSSTORE"."RPC_LISTAR_FACETAS"()
    TO role_leitura_nexusstore, role_escrita_nexusstore;

-- ------------------------------------------------------------
-- 4. MIGRAÇÃO EXPAND-AND-CONTRACT DO LEGADO public.my_prod (IDEMPOTENTE)
-- ------------------------------------------------------------
DO $$
DECLARE
    v_migrou INTEGER := 0;
BEGIN
    IF to_regclass('public.my_prod') IS NULL THEN
        RETURN;
    END IF;

    -- 4.1 Importar categorias distintas válidas do legado
    INSERT INTO "NEXUSSTORE"."CATE_PROD" ("NOME_CATE", "SLUG_CATE", "ORDE_CATE", "STAT_CATE")
    SELECT DISTINCT
        BTRIM(m.category)::VARCHAR(80),
        REGEXP_REPLACE(
            REGEXP_REPLACE(
                LOWER(TRANSLATE(BTRIM(m.category), 'áàâãäéèêëíìîïóòôõöúùûüçÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ', 'aaaaaeeeeiiiiooooouuuucAAAAAEEEEIIIIOOOOOUUUUC')),
                '[^a-z0-9]+', '-', 'g'
            ),
            '(^-|-$)', '', 'g'
        )::VARCHAR(80),
        10,
        'ATIVA'
    FROM public.my_prod AS m
    WHERE m.category IS NOT NULL
      AND BTRIM(m.category) <> ''
      AND REGEXP_REPLACE(
            REGEXP_REPLACE(
                LOWER(TRANSLATE(BTRIM(m.category), 'áàâãäéèêëíìîïóòôõöúùûüçÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ', 'aaaaaeeeeiiiiooooouuuucAAAAAEEEEIIIIOOOOOUUUUC')),
                '[^a-z0-9]+', '-', 'g'
            ),
            '(^-|-$)', '', 'g'
        ) ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
    ON CONFLICT DO NOTHING;

    -- 4.2 Importar plataformas padrão conhecidas do legado
    INSERT INTO "NEXUSSTORE"."PLAT_AFIL" ("NOME_PLAT", "SLUG_PLAT", "DOMI_PLAT", "CORP_PLAT", "STAT_PLAT")
    VALUES
        ('Amazon',        'amazon',        'amazon.com.br',       '#007185', 'ATIVA'),
        ('Mercado Livre', 'mercado-livre', 'mercadolivre.com.br', '#FFE600', 'ATIVA'),
        ('Shopee',        'shopee',        'shopee.com.br',       '#EE4D2D', 'ATIVA')
    ON CONFLICT DO NOTHING;

    -- 4.3 Migrar exclusivamente registros válidos e íntegros para PROD_AFIL
    INSERT INTO "NEXUSSTORE"."PROD_AFIL" (
        "IDEN_PROD",
        "CATE_PROD",
        "PLAT_PROD",
        "EXID_PROD",
        "NOME_PROD",
        "SLUG_PROD",
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
        "UPDA_PROD"
    )
    SELECT
        m.id,
        "C"."IDEN_CATE",
        "L"."IDEN_PLAT",
        'LEGACY-' || m.id::TEXT,
        LEFT(BTRIM(m.name), 200)::VARCHAR(200),
        LEFT(
            COALESCE(
                NULLIF(
                    REGEXP_REPLACE(
                        REGEXP_REPLACE(
                            LOWER(TRANSLATE(BTRIM(m.name), 'áàâãäéèêëíìîïóòôõöúùûüçÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ', 'aaaaaeeeeiiiiooooouuuucAAAAAEEEEIIIIOOOOOUUUUC')),
                            '[^a-z0-9]+', '-', 'g'
                        ),
                        '(^-|-$)', '', 'g'
                    ),
                    ''
                ),
                'produto'
            ) || '-' || LEFT(m.id::TEXT, 8),
            220
        )::VARCHAR(220),
        LEFT(BTRIM(m.affiliate_url), 2048)::VARCHAR(2048),
        LEFT(BTRIM(m.image_url), 2048)::VARCHAR(2048),
        ROUND(m.price_current, 2)::NUMERIC(15,2),
        NULL,
        'BRL',
        LEAST(GREATEST(COALESCE(ROUND(m.rating_value, 1), 0.0), 0.0), 5.0)::NUMERIC(2,1),
        0,
        COALESCE(m.is_trending, FALSE),
        'PUBLICADO',
        COALESCE(m.created_at, NOW()),
        COALESCE(m.created_at, NOW()),
        NOW()
    FROM public.my_prod AS m
    INNER JOIN "NEXUSSTORE"."CATE_PROD" AS "C"
        ON LOWER("C"."NOME_CATE") = LOWER(BTRIM(m.category))
       AND "C"."DELE_CATE" IS NULL
    INNER JOIN "NEXUSSTORE"."PLAT_AFIL" AS "L"
        ON "L"."DELE_PLAT" IS NULL
       AND (
           (LOWER(COALESCE(m.platform, '')) LIKE '%amazon%' AND "L"."SLUG_PLAT" = 'amazon')
           OR (LOWER(COALESCE(m.platform, '')) LIKE '%mercado%' AND "L"."SLUG_PLAT" = 'mercado-livre')
           OR (LOWER(COALESCE(m.platform, '')) LIKE '%shopee%' AND "L"."SLUG_PLAT" = 'shopee')
       )
    WHERE m.name IS NOT NULL
      AND BTRIM(m.name) <> ''
      AND m.affiliate_url ~* '^https://[A-Za-z0-9.-]+\.[A-Za-z]{2,}(/[^[:space:]]*)?$'
      AND m.image_url     ~* '^https://[A-Za-z0-9.-]+\.[A-Za-z]{2,}(/[^[:space:]]*)?$'
      AND m.price_current IS NOT NULL
      AND m.price_current > 0
      AND m.price_current <= 999999999999.99
    ON CONFLICT DO NOTHING;

    GET DIAGNOSTICS v_migrou = ROW_COUNT;
    RAISE NOTICE 'Expand-and-Contract: % registro(s) migrado(s) de public.my_prod para NEXUSSTORE.PROD_AFIL.', v_migrou;
END
$$;

COMMIT;
