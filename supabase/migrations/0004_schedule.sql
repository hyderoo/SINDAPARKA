-- Posyandu day (date of the month), endemic vaccine switch, immunization recording rules.
alter table public.posyandu add column if not exists visit_day smallint check (visit_day between 1 and 31);
alter table public.puskesmas add column if not exists endemic_vaccines boolean not null default false;

-- Kader of a posyandu (and nakes/admin who can see it) may set only the visit day, nothing else on the posyandu row.
create or replace function public.set_posyandu_day(p uuid, d smallint) returns void
language plpgsql security definer set search_path = public as
$$
begin
  if public.me_role() is null or not public.can_see_posyandu(p) then raise exception 'not allowed'; end if;
  if d is not null and (d < 1 or d > 31) then raise exception 'day must be 1-31'; end if;
  update public.posyandu set visit_day = d where id = p;
end $$;
revoke all on function public.set_posyandu_day(uuid, smallint) from public, anon;
grant execute on function public.set_posyandu_day(uuid, smallint) to authenticated;

-- immunizations: one record per vaccine dose per child; date sanity (Asia/Jakarta); removable by those who can see the child; audited.
alter table public.immunizations drop constraint if exists immunizations_child_id_vaccine_given_on_key;
alter table public.immunizations add constraint immunizations_one_per_dose unique (child_id, vaccine);
create or replace function public.check_immunization() returns trigger language plpgsql as
$$
declare b date;
begin
  select birth_date into b from public.children where id = new.child_id;
  if new.given_on > (now() at time zone 'Asia/Jakarta')::date then raise exception 'given_on is in the future'; end if;
  if new.given_on < b then raise exception 'given_on is before birth'; end if;
  return new;
end $$;
drop trigger if exists imm_check on public.immunizations;
create trigger imm_check before insert or update on public.immunizations for each row execute function public.check_immunization();
create policy imm_delete on public.immunizations for delete to authenticated using (public.can_see_child(child_id));
grant delete on public.immunizations to authenticated;
drop trigger if exists audit_immunizations on public.immunizations;
create trigger audit_immunizations after insert or update or delete on public.immunizations for each row execute function public.log_change();
