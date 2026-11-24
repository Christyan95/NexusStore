import { describe, expect, it } from 'vitest';
import { parseAppEnv } from './env';

describe('parseAppEnv', () => {
  it('valida configuração completa com HTTPS', () => {
    const config = parseAppEnv(
      {
        VITE_SUPABASE_URL: 'https://demo-project.supabase.co',
        VITE_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.valid-key',
        VITE_REDIRECT_BASE_URL: 'https://demo-project.supabase.co/functions/v1/redirect/',
      },
      false,
    );

    expect(config.isConfigured).toBe(true);
    expect(config.useDevFixture).toBe(false);
    expect(config.redirectBaseUrl).toBe('https://demo-project.supabase.co/functions/v1/redirect');
    expect(config.configErrors).toHaveLength(0);
  });

  it('garante fail-closed em produção mesmo se VITE_USE_DEV_FIXTURE=true', () => {
    const config = parseAppEnv({ VITE_USE_DEV_FIXTURE: 'true' }, false);

    expect(config.isConfigured).toBe(false);
    expect(config.useDevFixture).toBe(false);
    expect(config.configErrors.length).toBeGreaterThan(0);
  });

  it('permite dev fixture exclusivamente quando isDev === true e flag explícita', () => {
    const config = parseAppEnv({ VITE_USE_DEV_FIXTURE: 'true' }, true);

    expect(config.isConfigured).toBe(false);
    expect(config.useDevFixture).toBe(true);
  });

  it('rejeita URL HTTP não-localhost', () => {
    const config = parseAppEnv(
      {
        VITE_SUPABASE_URL: 'http://insecure.supabase.co',
        VITE_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.valid-key',
      },
      false,
    );

    expect(config.isConfigured).toBe(false);
    expect(config.supabaseUrl).toBeNull();
  });
});
