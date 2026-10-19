-- Internal marker for fictional sample rows. Never shown in exports or screens (except the admin-only notice).
alter table public.puskesmas add column if not exists is_demo boolean not null default false;
alter table public.posyandu add column if not exists is_demo boolean not null default false;
alter table public.children add column if not exists is_demo boolean not null default false;
alter table public.measurements add column if not exists is_demo boolean not null default false;

-- One-click removal for admins: deletes every row carrying the marker, plus its immunization and audit rows.
create or replace function public.delete_demo_data() returns jsonb
language plpgsql security definer set search_path = public as
$$
declare n_m int; n_c int; n_p int; n_k int;
begin
  if public.me_role() is distinct from 'admin' then raise exception 'only an admin can delete sample data'; end if;
  delete from public.audit_log where row_id in (select id from public.measurements where is_demo or child_id in (select id from public.children where is_demo))
     or row_id in (select id from public.children where is_demo);
  delete from public.audit_log where row_id in (select id from public.immunizations where child_id in (select id from public.children where is_demo));
  delete from public.immunizations where child_id in (select id from public.children where is_demo);
  delete from public.measurements where is_demo or child_id in (select id from public.children where is_demo);
  get diagnostics n_m = row_count;
  delete from public.children where is_demo; get diagnostics n_c = row_count;
  update public.profiles set posyandu_id = null where role = 'admin' and posyandu_id in (select id from public.posyandu where is_demo);
  update public.profiles set puskesmas_id = null where role = 'admin' and puskesmas_id in (select id from public.puskesmas where is_demo);
  delete from public.posyandu where is_demo and not exists (select 1 from public.children c where c.posyandu_id = posyandu.id) and not exists (select 1 from public.profiles pr where pr.posyandu_id = posyandu.id);
  get diagnostics n_p = row_count;
  delete from public.puskesmas where is_demo and not exists (select 1 from public.posyandu x where x.puskesmas_id = puskesmas.id) and not exists (select 1 from public.profiles pr where pr.puskesmas_id = puskesmas.id);
  get diagnostics n_k = row_count;
  -- the deletes above were logged by the audit trigger inside this same transaction; drop those entries too
  delete from public.audit_log where at = now();
  return jsonb_build_object('measurements', n_m, 'children', n_c, 'posyandu', n_p, 'puskesmas', n_k);
end $$;
revoke all on function public.delete_demo_data() from public, anon;
grant execute on function public.delete_demo_data() to authenticated;

create or replace function public.has_demo_data() returns boolean
language sql stable security definer set search_path = public as
$$ select public.me_role() = 'admin' and exists (select 1 from public.children where is_demo) $$;
revoke all on function public.has_demo_data() from public, anon;
grant execute on function public.has_demo_data() to authenticated;
