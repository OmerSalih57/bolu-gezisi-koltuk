-- Bolu Gezisi Koltuk Seçim Sistemi
-- Supabase SQL Editor'da bir kez çalıştırın. Fonksiyonlar yeniden çalıştırmaya uygundur.
--
-- Kurulum:
-- 1. Project Settings > API içindeki URL ve anon key değerlerini .env.local dosyasına koyun.
-- 2. Yönetim şifresi varsayılan olarak bolu2026'dır.
--    Değiştirmek için .env.local içindeki VITE_ADMIN_PASSWORD ile bu kaydı aynı yapın:
--    update public.admin_secret set password = 'yeni-sifre' where id = 1;
--
-- Güvenlik:
-- Anon anahtar tarayıcıda durur; bu normaldir. participants ve seats tablolarında
-- anonim okuma/yazma yoktur. Herkese açık olan tek tablo seat_status'tur ve
-- içinde yalnızca otobüs, koltuk numarası ve dolu/boş bilgisi vardır.
-- Koltuk ayırma book_seat fonksiyonundan geçer. T.C. listesi tarayıcıya inmez.

create table if not exists public.participants (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  tc_no text not null unique,
  phone text not null,
  is_registered boolean not null default true
);

create table if not exists public.seats (
  id uuid primary key default gen_random_uuid(),
  bus_number integer not null check (bus_number in (1, 2, 3)),
  seat_number integer not null check (seat_number between 1 and 55),
  participant_tc text,
  is_booked boolean not null default false,
  unique (bus_number, seat_number),
  check (
    (is_booked = true and participant_tc is not null)
    or (is_booked = false and participant_tc is null)
  )
);

create index if not exists seats_participant_tc_idx on public.seats (participant_tc);

create table if not exists public.seat_status (
  bus_number integer not null,
  seat_number integer not null,
  is_booked boolean not null default false,
  primary key (bus_number, seat_number)
);

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade
);

create table if not exists public.admin_secret (
  id integer primary key,
  password text not null,
  constraint admin_secret_singleton check (id = 1)
);

insert into public.admin_secret (id, password)
values (1, 'bolu2026')
on conflict (id) do nothing;

alter table public.participants enable row level security;
alter table public.seats enable row level security;
alter table public.seat_status enable row level security;
alter table public.admin_users enable row level security;
alter table public.admin_secret enable row level security;

revoke all on table public.participants from anon, authenticated;
revoke all on table public.seats from anon, authenticated;
revoke all on table public.seat_status from anon, authenticated;
revoke all on table public.admin_users from anon, authenticated;
revoke all on table public.admin_secret from anon, authenticated;

grant select on table public.seat_status to anon, authenticated;

drop policy if exists seat_status_read on public.seat_status;
create policy seat_status_read
  on public.seat_status
  for select
  to anon, authenticated
  using (true);

drop function if exists public.list_bookings();
drop function if exists public.list_roster();
drop function if exists public.replace_participants(jsonb);
drop function if exists public.close_roster();
drop function if exists public.release_seat(integer, integer);
drop function if exists public.is_admin();

create or replace function public.is_admin(p_password text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(p_password, '') <> ''
    and exists (
      select 1
      from public.admin_secret
      where id = 1
        and password = p_password
    );
$$;

create or replace function public.is_valid_tc(tc text)
returns boolean
language plpgsql
immutable
set search_path = public
as $$
declare
  digits integer[];
  odd_sum integer;
  even_sum integer;
  tenth integer;
  eleventh integer;
begin
  if tc !~ '^[1-9][0-9]{10}$' then
    return false;
  end if;

  select array_agg(substr(tc, index, 1)::integer order by index)
  into digits
  from generate_series(1, 11) as index;

  odd_sum := digits[1] + digits[3] + digits[5] + digits[7] + digits[9];
  even_sum := digits[2] + digits[4] + digits[6] + digits[8];
  tenth := mod(mod((odd_sum * 7) - even_sum, 10) + 10, 10);
  eleventh := mod(
    digits[1] + digits[2] + digits[3] + digits[4] + digits[5]
    + digits[6] + digits[7] + digits[8] + digits[9] + digits[10],
    10
  );

  return digits[10] = tenth and digits[11] = eleventh;
end;
$$;

create or replace function public.normalize_phone(raw text)
returns text
language plpgsql
immutable
set search_path = public
as $$
declare
  digits text := regexp_replace(coalesce(raw, ''), '\D', '', 'g');
begin
  if length(digits) = 12 and left(digits, 2) = '90' then
    return '0' || substr(digits, 3);
  end if;
  if length(digits) = 10 and left(digits, 1) = '5' then
    return '0' || digits;
  end if;
  return digits;
end;
$$;

create or replace function public.sync_seat_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.seat_status (bus_number, seat_number, is_booked)
  values (new.bus_number, new.seat_number, new.is_booked)
  on conflict (bus_number, seat_number)
  do update set is_booked = excluded.is_booked;
  return new;
end;
$$;

drop trigger if exists seats_sync_status on public.seats;
create trigger seats_sync_status
  after insert or update on public.seats
  for each row
  execute function public.sync_seat_status();

insert into public.seats (bus_number, seat_number)
select bus.bus_number, seat.seat_number
from (values (1), (2)) as bus (bus_number)
cross join generate_series(1, 46) as seat (seat_number)
on conflict (bus_number, seat_number) do nothing;

insert into public.seats (bus_number, seat_number)
select 3, seat.seat_number
from generate_series(1, 55) as seat (seat_number)
on conflict (bus_number, seat_number) do nothing;

insert into public.seat_status (bus_number, seat_number, is_booked)
select bus_number, seat_number, is_booked
from public.seats
on conflict (bus_number, seat_number)
do update set is_booked = excluded.is_booked;

create or replace function public.book_seat(
  p_full_name text,
  p_tc_no text,
  p_phone text,
  p_bus_number integer,
  p_seat_number integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text := regexp_replace(trim(coalesce(p_full_name, '')), '\s+', ' ', 'g');
  v_tc text := regexp_replace(coalesce(p_tc_no, ''), '\D', '', 'g');
  v_phone text := public.normalize_phone(p_phone);
  v_registered boolean;
  v_booked boolean;
begin
  if length(v_name) < 5 or v_name !~ '\S\s+\S' then
    return jsonb_build_object('ok', false, 'error', 'Ad ve soyadı birlikte yazın.');
  end if;

  if not public.is_valid_tc(v_tc) then
    return jsonb_build_object('ok', false, 'error', 'Geçerli bir T.C. kimlik numarası girin.');
  end if;

  if v_phone !~ '^05[0-9]{9}$' then
    return jsonb_build_object('ok', false, 'error', 'Telefon 05 ile başlayan 11 hane olmalı.');
  end if;

  if p_bus_number not in (1, 2, 3) or p_seat_number < 1 or p_seat_number > 55 then
    return jsonb_build_object('ok', false, 'error', 'Bu koltuk veritabanında yok.');
  end if;

  select is_registered
  into v_registered
  from public.participants
  where tc_no = v_tc
  for update;

  if not found or v_registered is not true then
    return jsonb_build_object('ok', false, 'error', 'Listede bulunamadınız.');
  end if;

  perform 1
  from public.seats
  where participant_tc = v_tc
    and is_booked
  for update;

  if found then
    return jsonb_build_object('ok', false, 'error', 'Bu T.C. kimlik numarası için koltuk daha önce seçilmiş.');
  end if;

  select is_booked
  into v_booked
  from public.seats
  where bus_number = p_bus_number
    and seat_number = p_seat_number
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'Bu koltuk veritabanında yok.');
  end if;

  if v_booked then
    return jsonb_build_object('ok', false, 'error', 'Bu koltuk dolu.');
  end if;

  update public.seats
  set is_booked = true,
      participant_tc = v_tc
  where bus_number = p_bus_number
    and seat_number = p_seat_number;

  return jsonb_build_object('ok', true);
end;
$$;

-- CSV yüklemesi ekler veya aynı T.C. kimlik numarasını günceller.
-- Dosyada olmayan kayıtlı katılımcılar silinmez ve kayıt hakları kapanmaz.
create or replace function public.replace_participants(p_password text, p_entries jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total integer;
  v_saved integer := 0;
begin
  if not public.is_admin(p_password) then
    return jsonb_build_object('ok', false, 'error', 'Yönetici girişi gerekli.');
  end if;

  if jsonb_typeof(p_entries) <> 'array' then
    return jsonb_build_object('ok', false, 'error', 'Katılımcı listesi okunamadı.');
  end if;

  v_total := jsonb_array_length(p_entries);
  if v_total < 1 or v_total > 5000 then
    return jsonb_build_object('ok', false, 'error', 'Dosyada katılımcı satırı bulunamadı.');
  end if;

  create temporary table pg_temp.incoming_roster (
    full_name text not null,
    tc_no text primary key,
    phone text not null
  ) on commit drop;

  insert into pg_temp.incoming_roster (full_name, tc_no, phone)
  select distinct on (tc_no)
    full_name,
    tc_no,
    phone
  from (
    select
      ordinality,
      regexp_replace(trim(coalesce(value->>'full_name', '')), '\s+', ' ', 'g') as full_name,
      regexp_replace(coalesce(value->>'tc_no', ''), '\D', '', 'g') as tc_no,
      public.normalize_phone(value->>'phone') as phone
    from jsonb_array_elements(p_entries) with ordinality
  ) as parsed
  where public.is_valid_tc(tc_no)
    and phone ~ '^05[0-9]{9}$'
    and length(full_name) >= 5
    and full_name ~ '\S\s+\S'
  order by tc_no, ordinality desc;

  select count(*) into v_saved from pg_temp.incoming_roster;
  if v_saved = 0 then
    return jsonb_build_object('ok', false, 'error', 'Dosyada geçerli katılımcı satırı bulunamadı.');
  end if;

  insert into public.participants (full_name, tc_no, phone, is_registered)
  select full_name, tc_no, phone, true
  from pg_temp.incoming_roster
  on conflict (tc_no) do update
    set full_name = excluded.full_name,
        phone = excluded.phone,
        is_registered = true;

  return jsonb_build_object('ok', true, 'saved', v_saved, 'skipped', greatest(v_total - v_saved, 0));
end;
$$;

create or replace function public.close_roster(p_password text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin(p_password) then
    return jsonb_build_object('ok', false, 'error', 'Yönetici girişi gerekli.');
  end if;

  update public.participants
  set is_registered = false;

  return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.release_seat(
  p_password text,
  p_bus_number integer,
  p_seat_number integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin(p_password) then
    return jsonb_build_object('ok', false, 'error', 'Yönetici girişi gerekli.');
  end if;

  update public.seats
  set is_booked = false,
      participant_tc = null
  where bus_number = p_bus_number
    and seat_number = p_seat_number
    and is_booked;

  return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.list_bookings(p_password text)
returns table (
  bus_number integer,
  seat_number integer,
  full_name text,
  tc_no text,
  phone text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin(p_password) then
    raise exception 'yetkisiz' using errcode = '42501';
  end if;

  return query
  select
    seat.bus_number,
    seat.seat_number,
    coalesce(person.full_name, 'Kayıt bulunamadı') as full_name,
    seat.participant_tc as tc_no,
    coalesce(person.phone, '') as phone
  from public.seats as seat
  left join public.participants as person
    on person.tc_no = seat.participant_tc
  where seat.is_booked
  order by seat.bus_number, seat.seat_number;
end;
$$;

create or replace function public.list_roster(p_password text)
returns table (
  full_name text,
  tc_no text,
  phone text,
  is_registered boolean
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin(p_password) then
    raise exception 'yetkisiz' using errcode = '42501';
  end if;

  return query
  select
    person.full_name,
    person.tc_no,
    person.phone,
    person.is_registered
  from public.participants as person
  order by person.full_name;
end;
$$;

revoke all on function public.is_admin(text) from public, anon, authenticated;
revoke all on function public.is_valid_tc(text) from public, anon, authenticated;
revoke all on function public.normalize_phone(text) from public, anon, authenticated;
revoke all on function public.sync_seat_status() from public, anon, authenticated;
revoke all on function public.book_seat(text, text, text, integer, integer) from public, anon, authenticated;
revoke all on function public.replace_participants(text, jsonb) from public, anon, authenticated;
revoke all on function public.close_roster(text) from public, anon, authenticated;
revoke all on function public.release_seat(text, integer, integer) from public, anon, authenticated;
revoke all on function public.list_bookings(text) from public, anon, authenticated;
revoke all on function public.list_roster(text) from public, anon, authenticated;

grant execute on function public.is_admin(text) to anon, authenticated;
grant execute on function public.book_seat(text, text, text, integer, integer) to anon, authenticated;
grant execute on function public.replace_participants(text, jsonb) to anon, authenticated;
grant execute on function public.close_roster(text) to anon, authenticated;
grant execute on function public.release_seat(text, integer, integer) to anon, authenticated;
grant execute on function public.list_bookings(text) to anon, authenticated;
grant execute on function public.list_roster(text) to anon, authenticated;

do $$
begin
  alter publication supabase_realtime add table public.seat_status;
exception
  when duplicate_object then
    null;
end;
$$;
