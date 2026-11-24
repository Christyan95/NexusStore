# ADR-001 — Arquitetura Modular Pragmática (Feature-Sliced Clean Architecture)

- **Status:** Aceito
- **Data:** 2026-11-24
- **Contexto:** O código original concentrava 100% da aplicação (configuração, SDK do Supabase, mocks, regras de negócio, estado e 10+ seções de UI) em `src/App.jsx` (532 linhas), sem tipagem estática nem fronteiras de responsabilidade.

## Decisão

Adotar uma arquitetura modular em 4 camadas por módulo de domínio (`src/core`, `src/modules/catalog/{domain,application,infrastructure,presentation}`, `src/shared/ui`) sobre **React 19 + TypeScript estrito + Vite 7 + Tailwind CSS v4**, mantendo o Supabase como plataforma PostgreSQL/Auth/Edge Functions.

## Regra de Dependência

`presentation` -> `application` -> `domain` <- `infrastructure`  
A camada `domain` não importa React, Vite nem `@supabase/supabase-js`.

## Trade-offs

- **O que ganhamos:** Testabilidade unitária imediata do domínio sem subir navegador ou banco; isolamento total do SDK do Supabase atrás de um Port (`CatalogRepositoryPort`); facilidade para trocar a origem de dados (ex.: BFF Node/Fastify) sem tocar na UI; eliminação de classes inteiras de bugs em tempo de compilação com `strict: true` e `noUncheckedIndexedAccess`.
- **O que perdemos:** Maior número de arquivos iniciais (~30 arquivos vs. 1 arquivo monolítico) e necessidade de manter mapeadores explícitos entre DTOs de banco (`MAIÚSCULO`) e entidades de domínio (`camelCase`).
- **Risco assumido:** Sem SSR completo (Next.js), o SEO por página de produto depende de prerender/meta tags dinâmicas ou futura evolução de camada SSR/Edge caso a aquisição orgânica por páginas individuais torne-se o canal principal.
