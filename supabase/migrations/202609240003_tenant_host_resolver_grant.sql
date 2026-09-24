-- Allow the public host resolver policies to read the tenant availability flag.
-- RLS continues to expose only rows whose tenant_access_enabled value is true.
grant select (tenant_access_enabled) on public.organizations to anon;
