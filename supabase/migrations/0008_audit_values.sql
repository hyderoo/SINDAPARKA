-- Audit trail keeps what changed: old and new values of changed columns (admin-read only).
alter table public.audit_log add column if not exists old_data jsonb, add column if not exists new_data jsonb;
create or replace function public.log_change() returns trigger
language plpgsql security definer set search_path = public as
$$
declare o jsonb := case when tg_op in ('UPDATE','DELETE') then to_jsonb(old) end;
        n jsonb := case when tg_op in ('UPDATE','INSERT') then to_jsonb(new) end;
        od jsonb; nd jsonb;
begin
  if tg_op = 'UPDATE' then
    select coalesce(jsonb_object_agg(k, o->k), '{}'), coalesce(jsonb_object_agg(k, n->k), '{}') into od, nd
      from jsonb_object_keys(n) k where (o->k) is distinct from (n->k);
  else
    od := o; nd := n;
  end if;
  insert into public.audit_log(actor, action, table_name, row_id, old_data, new_data)
  values (auth.uid(), tg_op, tg_table_name, coalesce((n->>'id')::uuid, (o->>'id')::uuid), od, nd);
  return coalesce(new, old);
end $$;
