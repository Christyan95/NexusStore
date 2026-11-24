const OFFICIAL_SHORTENERS: Readonly<Record<string, readonly string[]>> = {
  'amazon.com.br': ['amzn.to', 'a.co'],
  'mercadolivre.com.br': ['meli.la', 'mercadolivre.com'],
  'shopee.com.br': ['s.shopee.com.br', 'shope.ee'],
};

function hostMatchesDomain(hostname: string, domain: string): boolean {
  const normalizedHost = hostname.toLowerCase();
  const normalizedDomain = domain.toLowerCase();
  return normalizedHost === normalizedDomain || normalizedHost.endsWith(`.${normalizedDomain}`);
}

export function validateAffiliateUrl(rawUrl: string, allowedRootDomain: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return null;
  }

  if (parsed.protocol !== 'https:' || parsed.username !== '' || parsed.password !== '') {
    return null;
  }

  const normalizedRoot = allowedRootDomain.trim().toLowerCase();
  if (!normalizedRoot) {
    return null;
  }

  const allowedList = [normalizedRoot, ...(OFFICIAL_SHORTENERS[normalizedRoot] ?? [])];
  const isTrustedHost = allowedList.some((domain) => hostMatchesDomain(parsed.hostname, domain));

  return isTrustedHost ? parsed.toString() : null;
}

export function validateHttpsImageUrl(rawUrl: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return null;
  }

  if (parsed.protocol !== 'https:' || parsed.username !== '' || parsed.password !== '') {
    return null;
  }

  return parsed.toString();
}

export function buildOutboundOfferUrl(params: {
  readonly slug: string;
  readonly directAffiliateUrl: string;
  readonly allowedRootDomain: string;
  readonly redirectBaseUrl: string | null;
}): string | null {
  const validatedDirect = validateAffiliateUrl(params.directAffiliateUrl, params.allowedRootDomain);
  if (!validatedDirect) {
    return null;
  }

  if (params.redirectBaseUrl) {
    const redirectUrl = new URL(params.redirectBaseUrl);
    redirectUrl.searchParams.set('slug', params.slug);
    return redirectUrl.toString();
  }

  return validatedDirect;
}
