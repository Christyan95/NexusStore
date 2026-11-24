import { describe, expect, it } from 'vitest';
import {
  buildOutboundOfferUrl,
  validateAffiliateUrl,
  validateHttpsImageUrl,
} from './affiliate-url';

describe('affiliate-url security', () => {
  it('aceita domínios oficiais da plataforma e encurtadores oficiais', () => {
    expect(
      validateAffiliateUrl('https://www.amazon.com.br/dp/B0CHWRXH8B?tag=nexus-20', 'amazon.com.br'),
    ).toBe('https://www.amazon.com.br/dp/B0CHWRXH8B?tag=nexus-20');
    expect(validateAffiliateUrl('https://amzn.to/4abcXYZ', 'amazon.com.br')).toBe(
      'https://amzn.to/4abcXYZ',
    );
    expect(validateAffiliateUrl('https://meli.la/1AbCdEf', 'mercadolivre.com.br')).toBe(
      'https://meli.la/1AbCdEf',
    );
  });

  it('bloqueia protocolos inseguros, credenciais embutidas e domínios phishing', () => {
    expect(validateAffiliateUrl('javascript:alert(1)', 'amazon.com.br')).toBeNull();
    expect(validateAffiliateUrl('http://www.amazon.com.br/dp/123', 'amazon.com.br')).toBeNull();
    expect(
      validateAffiliateUrl('https://amazon.com.br.evil-phish.com/dp/123', 'amazon.com.br'),
    ).toBeNull();
    expect(
      validateAffiliateUrl('https://user:pass@www.amazon.com.br/dp/123', 'amazon.com.br'),
    ).toBeNull();
  });

  it('constrói URL de redirecionamento rastreado quando redirectBaseUrl está ativo', () => {
    const outbound = buildOutboundOfferUrl({
      slug: 'kindle-11-geracao',
      directAffiliateUrl: 'https://www.amazon.com.br/dp/B09SWW583J',
      allowedRootDomain: 'amazon.com.br',
      redirectBaseUrl: 'https://proj.supabase.co/functions/v1/redirect',
    });

    expect(outbound).toBe('https://proj.supabase.co/functions/v1/redirect?slug=kindle-11-geracao');
  });

  it('rejeita imagens que não utilizam HTTPS', () => {
    expect(validateHttpsImageUrl('https://m.media-amazon.com/images/I/img.jpg')).not.toBeNull();
    expect(validateHttpsImageUrl('http://m.media-amazon.com/images/I/img.jpg')).toBeNull();
    expect(validateHttpsImageUrl('data:text/html,<script>alert(1)</script>')).toBeNull();
  });
});
