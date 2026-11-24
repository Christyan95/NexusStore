const EXTRA_OFFICIAL_SHORTENERS: Readonly<Record<string, readonly string[]>> = {
  'amazon.com.br': ['amzn.to', 'a.co'],
  'mercadolivre.com.br': ['meli.la', 'mercadolivre.com'],
  'shopee.com.br': ['s.shopee.com.br', 'shope.ee'],
};

function matchesDomain(hostname: string, allowedDomain: string): boolean {
  const normalizedHost = hostname.toLowerCase();
  const normalizedDomain = allowedDomain.toLowerCase();
  return normalizedHost === normalizedDomain || normalizedHost.endsWith(`.${normalizedDomain}`);
}

export function isAllowedAffiliateTarget(rawUrl: string, platformRootDomain: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return false;
  }

  if (parsed.protocol !== 'https:' || parsed.username !== '' || parsed.password !== '') {
    return false;
  }

  const allowedDomains = [
    platformRootDomain.toLowerCase(),
    ...(EXTRA_OFFICIAL_SHORTENERS[platformRootDomain.toLowerCase()] ?? []),
  ];

  return allowedDomains.some((domain) => matchesDomain(parsed.hostname, domain));
}
