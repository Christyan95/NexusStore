import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.91.0';
import { buildSecurityHeaders, parseAllowedOrigins } from '../_shared/cors.ts';
import { logEdgeEvent } from '../_shared/logger.ts';

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

  const startedAt = performance.now();
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseKey =
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_ANON_KEY');

  if (!supabaseUrl || !supabaseKey) {
    logEdgeEvent('error', 'health_missing_env', requestId);
    headers.set('Content-Type', 'application/json');
    return new Response(
      JSON.stringify({ status: 'degraded', dependency: 'database', request_id: requestId }),
      { status: 503, headers },
    );
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { fetch: (url, init) => fetch(url, { ...init, signal: AbortSignal.timeout(4_000) }) },
    });

    const { error } = await supabase
      .schema('NEXUSSTORE')
      .from('VW_PROD_AFIL_VITRINE')
      .select('IDEN_PROD', { count: 'exact', head: true });

    const latencyMs = Math.round(performance.now() - startedAt);
    headers.set('Content-Type', 'application/json');

    if (error) {
      logEdgeEvent('error', 'health_db_probe_failed', requestId, {
        latency_ms: latencyMs,
        code: error.code,
      });
      return new Response(
        JSON.stringify({
          status: 'unhealthy',
          database: 'unreachable',
          latency_ms: latencyMs,
          request_id: requestId,
        }),
        { status: 503, headers },
      );
    }

    logEdgeEvent('info', 'health_ok', requestId, { latency_ms: latencyMs });
    return new Response(
      JSON.stringify({
        status: 'ok',
        service: 'nexus-store',
        database: 'ok',
        latency_ms: latencyMs,
        request_id: requestId,
      }),
      { status: 200, headers },
    );
  } catch (err) {
    const latencyMs = Math.round(performance.now() - startedAt);
    logEdgeEvent('error', 'health_unexpected_exception', requestId, {
      latency_ms: latencyMs,
      reason: err instanceof Error ? err.name : 'unknown',
    });
    headers.set('Content-Type', 'application/json');
    return new Response(
      JSON.stringify({ status: 'unhealthy', latency_ms: latencyMs, request_id: requestId }),
      { status: 503, headers },
    );
  }
});
