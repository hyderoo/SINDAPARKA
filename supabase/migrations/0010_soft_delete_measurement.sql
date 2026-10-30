-- Repair: the "Hapus penimbangan" button has never worked. Postgres enforces
-- that the new row of an UPDATE still satisfies the SELECT policies, and
-- meas_read requires deleted_at IS NULL, so the client's soft-delete UPDATE
-- always failed with an RLS error (42501). Verified on 30 Oct: audit_log
-- shows zero UPDATEs ever setting deleted_at.
-- Fix: a SECURITY DEFINER RPC that checks visibility itself and sets
-- deleted_at. meas_read keeps archived rows invisible; the audit trigger on
-- measurements records the change with actor = auth.uid().
-- Scope: measurements only. Children have no client archive feature, so no
-- child-delete RPC is added.
--
-- Record correction (no history rewritten): the earlier audit finding "F2"
-- (soft-deleted children updatable via children_update) was a false positive.
-- children_read requires deleted_at IS NULL and Postgres applies the SELECT
-- policy to the rows an UPDATE can target, so archived children were never
-- updatable by clients. Migration 0009's deleted_at guard on children_update
-- is behavior-neutral defense in depth, not a vulnerability fix.
create or replace function public.soft_delete_measurement(m uuid) returns void
language plpgsql security definer set search_path = public as
$$
begin
  if public.me_role() is null or not public.can_see_child((select child_id from public.measurements where id = m)) then
    raise exception 'not allowed';
  end if;
  update public.measurements set deleted_at = now() where id = m and deleted_at is null;
end $$;
revoke all on function public.soft_delete_measurement(uuid) from public, anon;
grant execute on function public.soft_delete_measurement(uuid) to authenticated;
