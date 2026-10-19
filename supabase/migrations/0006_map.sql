-- Posyandu location (set by admin) for the map page. No child data is stored here.
alter table public.posyandu
  add column if not exists latitude double precision check (latitude between -11.5 and 6.5),
  add column if not exists longitude double precision check (longitude between 94 and 142),
  add column if not exists dusun text check (dusun is null or char_length(dusun) <= 80),
  add constraint posyandu_latlng_pair check ((latitude is null) = (longitude is null));

-- Measurement date must be on or after birth and not in the future (Asia/Jakarta).
create or replace function public.check_measurement_date() returns trigger
language plpgsql as $$
declare b date;
begin
  select birth_date into b from public.children where id = new.child_id;
  if new.measured_on > (now() at time zone 'Asia/Jakarta')::date then
    raise exception 'Tanggal pengukuran tidak boleh di masa depan';
  end if;
  if b is not null and new.measured_on < b then
    raise exception 'Tanggal pengukuran tidak boleh sebelum tanggal lahir';
  end if;
  return new;
end $$;
drop trigger if exists measurements_date_check on public.measurements;
create trigger measurements_date_check before insert or update of measured_on on public.measurements
  for each row execute function public.check_measurement_date();
