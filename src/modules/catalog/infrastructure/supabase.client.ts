import { createClient } from '@supabase/supabase-js';
import { generateRequestId } from '@/core/errors/app-error';
import { CATALOG_DEFAULTS } from '../domain/constants';

export interface SupabaseClientConfig {
  readonly supabaseUrl: string;
  readonly supabaseAnonKey: string;
  readonly timeoutMs?: number;
}

function createTimedFetch(timeoutMs: number): typeof fetch {
  return async (input, init) => {
    const controller = new AbortController();
    const timeoutId = globalThis.setTimeout(() => controller.abort(), timeoutMs);

    const externalSignal = init?.signal;
    const onExternalAbort = () => controller.abort();

    if (externalSignal) {
      if (externalSignal.aborted) {
        controller.abort();
      } else {
        externalSignal.addEventListener('abort', onExternalAbort, { once: true });
      }
    }

    const headers = new Headers(init?.headers);
    if (!headers.has('X-Request-Id')) {
      headers.set('X-Request-Id', generateRequestId());
    }

    try {
      return await fetch(input, {
        ...init,
        headers,
        signal: controller.signal,
      });
    } finally {
      globalThis.clearTimeout(timeoutId);
      if (externalSignal) {
        externalSignal.removeEventListener('abort', onExternalAbort);
      }
    }
  };
}

export function createNexusSupabaseClient(config: SupabaseClientConfig) {
  return createClient(config.supabaseUrl, config.supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      fetch: createTimedFetch(config.timeoutMs ?? CATALOG_DEFAULTS.REQUEST_TIMEOUT_MS),
    },
  });
}

export type NexusSupabaseClient = ReturnType<typeof createNexusSupabaseClient>;
