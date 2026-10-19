-- allow correcting the given date of a recorded dose (upsert); same visibility rule as insert
create policy imm_update on public.immunizations for update to authenticated
  using (public.can_see_child(child_id)) with check (public.can_see_child(child_id));
