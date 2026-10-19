-- SINDAPARKA schema. Schema and policies only: no child data lives in this repository.
-- Every table has row level security on and no policy for anon.

create extension if not exists pgcrypto;

create type public.app_role as enum ('kader', 'nakes', 'admin');
create type public.account_status as enum ('pending', 'active', 'disabled');
create type public.sex as enum ('L', 'P');

create table public.puskesmas (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table public.posyandu (
  id uuid primary key default gen_random_uuid(),
  puskesmas_id uuid not null references public.puskesmas(id),
  name text not null,
  village text,
  created_at timestamptz not null default now(),
  unique (puskesmas_id, name)
);

-- One row per auth user. Self registration always yields kader + pending.
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  phone text,
  role public.app_role not null default 'kader',
  status public.account_status not null default 'pending',
  puskesmas_id uuid references public.puskesmas(id),
  posyandu_id uuid references public.posyandu(id),
  created_at timestamptz not null default now()
);

create table public.children (
  id uuid primary key default gen_random_uuid(),
  posyandu_id uuid not null references public.posyandu(id),
  name text not null check (char_length(name) between 1 and 120),
  sex public.sex not null,
  birth_date date not null check (birth_date <= current_date),
  guardian_name text,
  address_note text,
  consent_at date,                 -- date the guardian gave written consent
  consent_recorded_by uuid references auth.users(id),
  created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index children_posyandu_idx on public.children(posyandu_id) where deleted_at is null;

create table public.measurements (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children(id),
  measured_on date not null,
  weight_kg numeric(5,2) not null check (weight_kg between 1.5 and 30),
  length_height_cm numeric(5,1) not null check (length_height_cm between 40 and 125),
  lying boolean not null,
  note text,
  -- z-scores stored with the rule version so old rows can be recomputed if the rule changes
  z_hfa numeric(5,2), z_wfa numeric(5,2), z_wfh numeric(5,2), z_bfa numeric(5,2),
  rules_version text not null default 'permenkes-2-2020+who-2006',
  created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index measurements_child_idx on public.measurements(child_id, measured_on) where deleted_at is null;

create table public.immunizations (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children(id),
  vaccine text not null,
  given_on date not null,
  created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(),
  unique (child_id, vaccine, given_on)
);

create table public.audit_log (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  actor uuid,
  action text not null,
  table_name text not null,
  row_id uuid
);

-- helpers (security definer so policies do not recurse into profiles RLS)
create or replace function public.me_role() returns public.app_role
language sql stable security definer set search_path = public as
$$ select role from public.profiles where id = auth.uid() and status = 'active' $$;

create or replace function public.me_posyandu() returns uuid
language sql stable security definer set search_path = public as
$$ select posyandu_id from public.profiles where id = auth.uid() and status = 'active' $$;

create or replace function public.me_puskesmas() returns uuid
language sql stable security definer set search_path = public as
$$ select puskesmas_id from public.profiles where id = auth.uid() and status = 'active' $$;

-- can the current user see rows of this posyandu?
create or replace function public.can_see_posyandu(p uuid) returns boolean
language sql stable security definer set search_path = public as
$$
  select case public.me_role()
    when 'admin' then true
    when 'nakes' then exists (select 1 from public.posyandu x where x.id = p and x.puskesmas_id = public.me_puskesmas())
    when 'kader' then p = public.me_posyandu()
    else false end
$$;

create or replace function public.can_see_child(c uuid) returns boolean
language sql stable security definer set search_path = public as
$$ select exists (select 1 from public.children ch where ch.id = c and ch.deleted_at is null and public.can_see_posyandu(ch.posyandu_id)) $$;

-- new auth user -> pending kader profile
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as
$$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''));
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.puskesmas enable row level security;
alter table public.posyandu enable row level security;
alter table public.profiles enable row level security;
alter table public.children enable row level security;
alter table public.measurements enable row level security;
alter table public.immunizations enable row level security;
alter table public.audit_log enable row level security;

-- puskesmas / posyandu: active users read, admin writes
create policy puskesmas_read on public.puskesmas for select to authenticated using (public.me_role() is not null);
create policy puskesmas_admin on public.puskesmas for all to authenticated using (public.me_role() = 'admin') with check (public.me_role() = 'admin');
create policy posyandu_read on public.posyandu for select to authenticated using (public.me_role() is not null);
create policy posyandu_admin on public.posyandu for all to authenticated using (public.me_role() = 'admin') with check (public.me_role() = 'admin');

-- profiles: own row readable (so a pending user can see their state); admin reads/updates all.
create policy profiles_self_read on public.profiles for select to authenticated using (id = auth.uid() or public.me_role() = 'admin');
create policy profiles_self_name on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
create policy profiles_admin_update on public.profiles for update to authenticated
  using (public.me_role() = 'admin') with check (public.me_role() = 'admin');
-- stop a user from promoting themselves through the self update policy
create or replace function public.guard_profile_update() returns trigger
language plpgsql security definer set search_path = public as
$$
begin
  if public.me_role() is distinct from 'admin' and (
       new.role is distinct from old.role or new.status is distinct from old.status
       or new.puskesmas_id is distinct from old.puskesmas_id or new.posyandu_id is distinct from old.posyandu_id) then
    raise exception 'only an admin can change role, status or assignment';
  end if;
  return new;
end $$;
create trigger profiles_guard before update on public.profiles
  for each row execute function public.guard_profile_update();

-- children
create policy children_read on public.children for select to authenticated
  using (deleted_at is null and public.can_see_posyandu(posyandu_id));
create policy children_insert on public.children for insert to authenticated
  with check (public.me_role() in ('kader','nakes','admin') and public.can_see_posyandu(posyandu_id) and created_by = auth.uid());
create policy children_update on public.children for update to authenticated
  using (public.can_see_posyandu(posyandu_id)) with check (public.can_see_posyandu(posyandu_id));

-- measurements
create policy meas_read on public.measurements for select to authenticated
  using (deleted_at is null and public.can_see_child(child_id));
create policy meas_insert on public.measurements for insert to authenticated
  with check (public.can_see_child(child_id) and created_by = auth.uid());
create policy meas_update on public.measurements for update to authenticated
  using (public.can_see_child(child_id)) with check (public.can_see_child(child_id));

-- immunizations
create policy imm_read on public.immunizations for select to authenticated using (public.can_see_child(child_id));
create policy imm_insert on public.immunizations for insert to authenticated
  with check (public.can_see_child(child_id) and created_by = auth.uid());

-- audit log: admin reads; rows are written by the trigger below
create policy audit_admin_read on public.audit_log for select to authenticated using (public.me_role() = 'admin');

create or replace function public.log_change() returns trigger
language plpgsql security definer set search_path = public as
$$
begin
  insert into public.audit_log(actor, action, table_name, row_id)
  values (auth.uid(), tg_op, tg_table_name, coalesce((to_jsonb(new)->>'id')::uuid, (to_jsonb(old)->>'id')::uuid));
  return coalesce(new, old);
end $$;
create trigger audit_children after insert or update or delete on public.children for each row execute function public.log_change();
create trigger audit_measurements after insert or update or delete on public.measurements for each row execute function public.log_change();

-- kader cannot hard delete: no delete policies exist. Soft delete = update deleted_at.
revoke all on all tables in schema public from anon;
grant select, insert, update on public.children, public.measurements, public.immunizations, public.profiles to authenticated;
grant select, insert, update, delete on public.puskesmas, public.posyandu to authenticated;
grant select on public.audit_log to authenticated;
