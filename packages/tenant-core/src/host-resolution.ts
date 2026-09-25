export type TenantHostResolution =
  | { kind: 'public'; hostname: string }
  | { kind: 'tenant-subdomain'; hostname: string; slug: string; organizationId: string }
  | { kind: 'custom-domain'; hostname: string; organizationId: string }
  | { kind: 'unresolved'; hostname: string; reason: 'invalid-host' | 'unknown-tenant' | 'unverified-domain' };

export type TenantDomainLookup = (hostname: string) => Promise<
  | { organizationId: string; verified: boolean; domainType: 'kfo_subdomain' | 'custom' }
  | null
>;

const DNS_LABEL = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
const TENANT_SLUG = /^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$/;
const RESERVED_TENANT_SLUGS = new Set([
  'www', 'api', 'app', 'admin', 'business', 'learn', 'partner', 'partners',
  'auth', 'assets', 'static', 'status', 'support', 'mail', 'ftp', 'staging',
]);

export function normalizeHostname(input: string): string | null {
  if (!input || input.length > 300) return null;
  let host = input.trim().toLowerCase();
  if (!host || /[\s/@\\]/.test(host)) return null;

  // Host headers may contain a numeric port. IPv6 literals are not tenant hosts.
  if (host.startsWith('[')) return null;
  const colon = host.lastIndexOf(':');
  if (colon >= 0) {
    const port = host.slice(colon + 1);
    if (!/^\d{1,5}$/.test(port) || Number(port) > 65535) return null;
    host = host.slice(0, colon);
  }
  host = host.replace(/\.$/, '');
  if (host.length > 253) return null;
  const labels = host.split('.');
  if (labels.some((label) => !DNS_LABEL.test(label))) return null;
  return host;
}

/**
 * Resolve only from the request host supplied by the trusted hosting adapter.
 * This function maps context; callers must still authenticate and authorize membership.
 */
export async function resolveTenantHost(
  requestHost: string,
  baseDomain: string,
  tenantDomainLookup: TenantDomainLookup,
): Promise<TenantHostResolution> {
  const hostname = normalizeHostname(requestHost);
  const normalizedBase = normalizeHostname(baseDomain);
  if (!hostname || !normalizedBase) {
    return { kind: 'unresolved', hostname: requestHost, reason: 'invalid-host' };
  }
  if (hostname === normalizedBase || hostname === `www.${normalizedBase}`) {
    return { kind: 'public', hostname };
  }

  const suffix = `.${normalizedBase}`;
  if (hostname.endsWith(suffix)) {
    const prefix = hostname.slice(0, -suffix.length);
    // Exactly one tenant label is accepted. Nested labels do not select a tenant.
    if (!prefix || prefix.includes('.')) {
      return { kind: 'unresolved', hostname, reason: 'unknown-tenant' };
    }
    if (!TENANT_SLUG.test(prefix) || RESERVED_TENANT_SLUGS.has(prefix)) {
      return { kind: 'unresolved', hostname, reason: 'unknown-tenant' };
    }
    const tenant = await tenantDomainLookup(hostname);
    if (!tenant || tenant.domainType !== 'kfo_subdomain') {
      return { kind: 'unresolved', hostname, reason: 'unknown-tenant' };
    }
    if (!tenant.verified) return { kind: 'unresolved', hostname, reason: 'unverified-domain' };
    return { kind: 'tenant-subdomain', hostname, slug: prefix, organizationId: tenant.organizationId };
  }

  const custom = await tenantDomainLookup(hostname);
  if (!custom || custom.domainType !== 'custom') return { kind: 'unresolved', hostname, reason: 'unknown-tenant' };
  if (!custom.verified) return { kind: 'unresolved', hostname, reason: 'unverified-domain' };
  return { kind: 'custom-domain', hostname, organizationId: custom.organizationId };
}
