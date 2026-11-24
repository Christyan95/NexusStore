import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.91.0';
import { buildSecurityHeaders, parseAllowedOrigins } from '../_shared/cors.ts';
import { logEdgeEvent } from '../_shared/logger.ts';
import { checkRateLimit } from '../_shared/rate-limit.ts';
import { isAllowedAffiliateTarget } from '../_shared/url-security.ts';

const SLUG_REGEX = /^[a-z0-9]+(-[a-z0-9]+)*$/;

async function sha256Hex(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function sanitizeOrigin(rawReferer: string | null): string | null {
  if (!rawReferer) return null;
  try {
    const parsed = new URL(rawReferer);
    return `${parsed.origin}${parsed.pathname}`.slice(0, 255);
  } catch {
    return null;
  }
}

Deno.serve(async (req: Request): Promise<Response> => {
  const requestId = req.headers.get('x-request-id') ?? crypto.randomUUID();
  const allowedOrigins = parseAllowedOrigins(Deno.env.get('ALLOWED_ORIGINS'));
  const headers = buildSecurityHeaders({
    requestId,
    origin: req.headers.get('origin'),
    allowedOrigins,
  });

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  if (req.method !== 'GET') {
    headers.set('Content-Type', 'application/json');
    return new Response(JSON.stringify({ error: 'Method not allowed', request_id: requestId }), {
      status: 405,
      headers,
    });
  }

  const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const ipHashSalt = Deno.env.get('CLICK_IP_HASH_SALT');
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceRoleKey || !ipHashSalt || ipHashSalt.length < 32) {
    logEdgeEvent('error', 'redirect_misconfigured_env', requestId);
    headers.set('Content-Type', 'application/json');
    return new Response(
      JSON.stringify({ error: 'Service temporarily unavailable', request_id: requestId }),
      { status: 503, headers },
    );
  }

  const ipHash = await sha256Hex(`${ipHashSalt}:${clientIp}`);
  const limit = checkRateLimit(ipHash, 45, 60_000);
  if (!limit.allowed) {
    headers.set('Content-Type', 'application/json');
    headers.set('Retry-After', String(limit.retryAfterSeconds));
    logEdgeEvent('warn', 'redirect_rate_limited', requestId, {
      ip_hash_prefix: ipHash.slice(0, 8),
    });
    return new Response(JSON.stringify({ error: 'Too many requests', request_id: requestId }), {
      status: 429,
      headers,
    });
  }

  const slug = new URL(req.url).searchParams.get('slug')?.trim().toLowerCase() ?? '';
  if (!slug || slug.length > 220 || !SLUG_REGEX.test(slug)) {
    headers.set('Content-Type', 'application/json');
    return new Response(JSON.stringify({ error: 'Invalid product slug', request_id: requestId }), {
      status: 400,
      headers,
    });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (url, init) => fetch(url, { ...init, signal: AbortSignal.timeout(4_000) }) },
  });

  const { data: product, error } = await supabase
    .schema('NEXUSSTORE')
    .from('VW_PROD_AFIL_VITRINE')
    .select('IDEN_PROD, IDEN_PLAT, URLA_PROD, DOMI_PLAT, SLUG_PROD')
    .eq('SLUG_PROD', slug)
    .maybeSingle();

  if (error) {
    logEdgeEvent('error', 'redirect_db_error', requestId, { code: error.code });
    headers.set('Content-Type', 'application/json');
    return new Response(JSON.stringify({ error: 'Upstream error', request_id: requestId }), {
      status: 502,
      headers,
    });
  }

  if (!product) {
    headers.set('Content-Type', 'application/json');
    return new Response(JSON.stringify({ error: 'Offer not found', request_id: requestId }), {
      status: 404,
      headers,
    });
  }

  if (!isAllowedAffiliateTarget(product.URLA_PROD, product.DOMI_PLAT)) {
    logEdgeEvent('error', 'redirect_blocked_untrusted_domain', requestId, {
      product_id: product.IDEN_PROD,
      expected_domain: product.DOMI_PLAT,
    });
    headers.set('Content-Type', 'application/json');
    return new Response(
      JSON.stringify({ error: 'Unsafe redirect blocked', request_id: requestId }),
      {
        status: 422,
        headers,
      },
    );
  }

  const userAgent = req.headers.get('user-agent')?.slice(0, 200) ?? null;
  const sanitizedOrigin = sanitizeOrigin(req.headers.get('referer'));

  // Best-effort telemetry persistence: falha de telemetria nunca bloqueia a conversão do usuário
  const { error: clickError } = await supabase
    .schema('NEXUSSTORE')
    .from('CLIC_AFIL')
    .insert({
      PROD_CLIC: product.IDEN_PROD,
      PLAT_CLIC: product.IDEN_PLAT,
      REQI_CLIC: requestId.slice(0, 64),
      IPHA_CLIC: ipHash,
      ORIG_CLIC: sanitizedOrigin,
      USAG_CLIC: userAgent,
    });

  if (clickError) {
    logEdgeEvent('warn', 'redirect_telemetry_insert_failed', requestId, {
      product_id: product.IDEN_PROD,
      code: clickError.code,
    });
  } else {
    logEdgeEvent('info', 'redirect_dispatched', requestId, {
      product_id: product.IDEN_PROD,
      platform_id: product.IDEN_PLAT,
    });
  }

  headers.set('Location', product.URLA_PROD);
  return new Response(null, { status: 302, headers });
});
