import { z } from 'zod';

const RawEnvSchema = z.object({
  VITE_SUPABASE_URL: z.string().trim().optional(),
  VITE_SUPABASE_ANON_KEY: z.string().trim().optional(),
  VITE_REDIRECT_BASE_URL: z.string().trim().optional(),
  VITE_USE_DEV_FIXTURE: z.string().trim().optional(),
});

const ValidatedSupabaseSchema = z.object({
  supabaseUrl: z
    .string()
    .url()
    .refine(
      (value) =>
        value.startsWith('https://') ||
        value.startsWith('http://localhost') ||
        value.startsWith('http://127.0.0.1'),
      {
        message: 'VITE_SUPABASE_URL deve utilizar HTTPS (ou localhost em desenvolvimento).',
      },
    ),
  supabaseAnonKey: z.string().min(20, 'VITE_SUPABASE_ANON_KEY inválida ou ausente.'),
});

const ValidatedRedirectSchema = z
  .string()
  .url()
  .refine(
    (value) =>
      value.startsWith('https://') ||
      value.startsWith('http://localhost') ||
      value.startsWith('http://127.0.0.1'),
    {
      message: 'VITE_REDIRECT_BASE_URL deve utilizar HTTPS.',
    },
  );

export interface AppEnvConfig {
  readonly isDev: boolean;
  readonly supabaseUrl: string | null;
  readonly supabaseAnonKey: string | null;
  readonly redirectBaseUrl: string | null;
  readonly useDevFixture: boolean;
  readonly isConfigured: boolean;
  readonly configErrors: readonly string[];
}

export function parseAppEnv(rawEnv: Record<string, unknown>, isDev: boolean): AppEnvConfig {
  const parsed = RawEnvSchema.parse({
    VITE_SUPABASE_URL:
      typeof rawEnv.VITE_SUPABASE_URL === 'string' ? rawEnv.VITE_SUPABASE_URL : undefined,
    VITE_SUPABASE_ANON_KEY:
      typeof rawEnv.VITE_SUPABASE_ANON_KEY === 'string' ? rawEnv.VITE_SUPABASE_ANON_KEY : undefined,
    VITE_REDIRECT_BASE_URL:
      typeof rawEnv.VITE_REDIRECT_BASE_URL === 'string' ? rawEnv.VITE_REDIRECT_BASE_URL : undefined,
    VITE_USE_DEV_FIXTURE:
      typeof rawEnv.VITE_USE_DEV_FIXTURE === 'string' ? rawEnv.VITE_USE_DEV_FIXTURE : undefined,
  });

  const configErrors: string[] = [];

  const supabaseCheck = ValidatedSupabaseSchema.safeParse({
    supabaseUrl: parsed.VITE_SUPABASE_URL ?? '',
    supabaseAnonKey: parsed.VITE_SUPABASE_ANON_KEY ?? '',
  });

  let supabaseUrl: string | null = null;
  let supabaseAnonKey: string | null = null;

  if (supabaseCheck.success) {
    supabaseUrl = supabaseCheck.data.supabaseUrl;
    supabaseAnonKey = supabaseCheck.data.supabaseAnonKey;
  } else {
    configErrors.push(...supabaseCheck.error.issues.map((issue) => issue.message));
  }

  let redirectBaseUrl: string | null = null;
  if (parsed.VITE_REDIRECT_BASE_URL && parsed.VITE_REDIRECT_BASE_URL.length > 0) {
    const redirectCheck = ValidatedRedirectSchema.safeParse(parsed.VITE_REDIRECT_BASE_URL);
    if (redirectCheck.success) {
      redirectBaseUrl = redirectCheck.data.replace(/\/+$/, '');
    } else {
      configErrors.push(...redirectCheck.error.issues.map((issue) => issue.message));
    }
  }

  // Fail-closed em produção: fixture local só pode ser habilitada quando isDev === true
  const useDevFixture = isDev && parsed.VITE_USE_DEV_FIXTURE === 'true';

  return {
    isDev,
    supabaseUrl,
    supabaseAnonKey,
    redirectBaseUrl,
    useDevFixture,
    isConfigured: supabaseUrl !== null && supabaseAnonKey !== null,
    configErrors,
  };
}

export const appEnv: AppEnvConfig = parseAppEnv(import.meta.env, import.meta.env.DEV);
