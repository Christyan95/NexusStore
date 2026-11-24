# Política de Segurança — Nexus Store

## Arquitetura Security by Design

O **Nexus Store** adota defesa em profundidade em todas as camadas:

- **Banco de Dados (PostgreSQL / Supabase):** Acesso `PUBLIC` revogado, segregação RBAC (`role_leitura_nexusstore` vs `role_escrita_nexusstore` sem `DELETE`/`TRUNCATE`), `ROW LEVEL SECURITY` ativo em todas as tabelas, triggers forenses anti-tampering e isolamento da tabela de telemetria `"NEXUSSTORE"."CLIC_AFIL"`.
- **Proteção de Links & Anti-Phishing:** Validação estrita de protocolo `https://` e _allowlist_ de domínios oficiais (Amazon, Mercado Livre e Shopee) aplicada no banco (`CHECK`), na Edge Function `redirect` e no cliente (`affiliate-url.ts`).
- **Privacidade & LGPD:** Nenhum dado PII de consumidor final é armazenado em texto claro. Eventos de clique gravam apenas hash SHA-256 com salt server-side (`CLICK_IP_HASH_SALT`) para rate limiting e antifraude.
- **Cabeçalhos HTTP:** CSP restritiva, HSTS com `preload`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy` e `Permissions-Policy`.
- **CI/CD Shift-Left:** Varredura de segredos (Gitleaks), SCA (`npm audit`), tipagem estrita e geração de SBOM CycloneDX em toda alteração.

## Reportando Vulnerabilidades

Caso identifique qualquer vulnerabilidade de segurança, **não abra uma Issue pública**. Entre em contato diretamente com o mantenedor do repositório informando passos de reprodução e impacto estimado para correção coordenada.
