-- Allow role/status changes from trusted SQL context (no JWT, e.g. bootstrap of the first admin in the SQL editor).
-- API calls always carry a JWT, so a signed-in user still cannot promote themselves.
create or replace function public.guard_profile_update() returns trigger
language plpgsql security definer set search_path = public as
$$
begin
  if auth.uid() is not null and public.me_role() is distinct from 'admin' and (
       new.role is distinct from old.role or new.status is distinct from old.status
       or new.puskesmas_id is distinct from old.puskesmas_id or new.posyandu_id is distinct from old.posyandu_id) then
    raise exception 'only an admin can change role, status or assignment';
  end if;
  return new;
end $$;
