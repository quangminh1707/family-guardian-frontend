export function normalizeDomain(url: string): string {
  try {
    if (!url.includes('://')) {
      url = 'http://' + url;
    }
    const parsed = new URL(url);
    let domain = parsed.hostname.toLowerCase();
    
    // Remove www.
    if (domain.startsWith('www.')) {
      domain = domain.substring(4);
    }
    
    return domain;
  } catch {
    return url.toLowerCase().trim();
  }
}

export function getFaviconUrl(domain: string): string {
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
}
