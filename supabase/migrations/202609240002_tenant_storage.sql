-- KFO tenant-private files. Keys begin with the stable organization UUID.
insert into storage.buckets (id, name, public)
values ('tenant-private', 'tenant-private', false)
on conflict (id) do update set public = false;

create policy tenant_private_read on storage.objects
for select to authenticated
using (
  bucket_id = 'tenant-private' and
  (select private.has_org_permission(
    private.try_uuid((storage.foldername(name))[1]),
    'tenant.assets.read'
  ))
);

create policy tenant_private_insert on storage.objects
for insert to authenticated
with check (
  bucket_id = 'tenant-private' and
  (select private.has_org_permission(
    private.try_uuid((storage.foldername(name))[1]),
    'tenant.assets.manage'
  ))
);

create policy tenant_private_update on storage.objects
for update to authenticated
using (
  bucket_id = 'tenant-private' and
  (select private.has_org_permission(
    private.try_uuid((storage.foldername(name))[1]),
    'tenant.assets.manage'
  ))
)
with check (
  bucket_id = 'tenant-private' and
  (select private.has_org_permission(
    private.try_uuid((storage.foldername(name))[1]),
    'tenant.assets.manage'
  ))
);

create policy tenant_private_delete on storage.objects
for delete to authenticated
using (
  bucket_id = 'tenant-private' and
  (select private.has_org_permission(
    private.try_uuid((storage.foldername(name))[1]),
    'tenant.assets.manage'
  ))
);
