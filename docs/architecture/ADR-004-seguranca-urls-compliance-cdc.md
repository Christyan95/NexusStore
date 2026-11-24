# ADR-004 — Segurança de Redirecionamento, Headers HTTP e Remoção de Dark Patterns (CDC)

- **Status:** Aceito
- **Data:** 2026-11-24
- **Contexto:** A vitrine anterior (a) fabricava desconto fictício de 40% (`price_current * 1.4`), (b) simulava notificações falsas de compra, (c) renderizava `affiliate_url` sem allowlist, (d) expunha `error.message` e nome da tabela instruindo desativar RLS, e (e) fazia fail-open para `MOCK_PRODUCTS` em produção.

## Decisão

1. **Compliance CDC & Programas de Afiliados:** Remover integralmente o markup artificial `* 1.4` e o toast de compras falsas. Exibir preço anterior riscado e percentual de desconto **somente** quando `originalPrice` real (`PROR_PROD`) existir e for maior que `currentPrice` (`PRAT_PROD`), acompanhado da indicação de verificação (`priceSyncedAt`) e volume real de avaliações (`reviewCount`).
2. **Defesa em Profundidade para URLs:** Validar protocolo `https://` e _domain allowlist_ vinculada a `PLAT_AFIL.DOMI_PLAT` em três camadas: Constraint PostgreSQL, Supabase Edge Function `redirect` (com rate limiting e telemetria real de clique) e sanitizador frontend (`affiliate-url.ts`).
3. **Fail-Closed & Headers HTTP:** Variáveis de ambiente validadas no startup com Zod; em produção, configuração ausente bloqueia o uso de dados mock e exibe tela de indisponibilidade segura com `request_id`. Headers CSP, HSTS, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff` e `Referrer-Policy` configurados em `vercel.json` e `public/_headers`.

## Trade-offs

- **O que ganhamos:** Conformidade legal (CDC Art. 37), proteção das contas de afiliado contra banimento, eliminação de phishing/XSS via links e postura Zero Trust de ponta a ponta.
- **O que perdemos:** Perda da "ancoragem artificial" de preço em itens sem `PROR_PROD` preenchido (troca deliberada por integridade jurídica e confiança de marca).
- **Risco assumido:** Novos domínios encurtadores de afiliados (ex.: `amzn.to`, `meli.la`, `s.shopee.com.br`) precisam constar na allowlist explícita (`affiliate-url.ts` e `supabase/functions/_shared/url-security.ts`) antes de serem aceitos.
