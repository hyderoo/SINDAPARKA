-- F2: soft-deleted children could still be updated (and un-deleted) via RLS.
-- children_read excludes deleted rows, but children_update only checked
-- posyandu access. Add the same deleted_at guard to the USING clause so a
-- soft-deleted child row can no longer be targeted by UPDATE. WITH CHECK
-- stays unguarded so the soft-delete itself (setting deleted_at) still works.
drop policy if exists children_update on public.children;
create policy children_update on public.children for update to authenticated
  using (deleted_at is null and public.can_see_posyandu(posyandu_id))
  with check (public.can_see_posyandu(posyandu_id));
