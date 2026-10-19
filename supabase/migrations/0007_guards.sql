-- New children need a recorded consent date. NOT VALID: applies to new and changed rows only.
alter table public.children add constraint children_consent_required check (consent_at is not null) not valid;
-- Same posyandu, same name (case-insensitive), sex and birth date cannot be registered twice.
create unique index if not exists children_no_duplicate on public.children (posyandu_id, lower(btrim(name)), sex, birth_date) where deleted_at is null;
