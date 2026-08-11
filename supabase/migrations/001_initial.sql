-- Wedding platform schema
create extension if not exists "pgcrypto";

create table if not exists public.weddings (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  date date,
  location text,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  wedding_id uuid references public.weddings(id) on delete set null,
  full_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.guests (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  name text not null,
  slug text not null,
  phone text,
  email text,
  invitation_status text not null default 'not_sent'
    check (invitation_status in ('not_sent', 'sent')),
  confirmation_status text not null default 'pending'
    check (confirmation_status in ('pending', 'confirmed', 'declined')),
  companions jsonb not null default '[]'::jsonb,
  companions_count int not null default 0,
  dietary text,
  notes text,
  rsvp_notes text,
  first_accessed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (wedding_id, slug)
);

create table if not exists public.gifts (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  name text not null,
  description text,
  image_url text,
  price numeric(12,2) not null check (price >= 0),
  category text,
  quantity int not null default 1 check (quantity >= 1),
  status text not null default 'active'
    check (status in ('active', 'hidden', 'completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.gift_contributions (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  gift_id uuid not null references public.gifts(id) on delete cascade,
  guest_id uuid references public.guests(id) on delete set null,
  payer_name text not null,
  amount numeric(12,2) not null check (amount > 0),
  payment_method text not null check (payment_method in ('pix', 'credit', 'debit')),
  payment_status text not null default 'pending'
    check (payment_status in ('pending', 'paid', 'failed', 'cancelled')),
  asaas_payment_id text unique,
  pix_qr_code text,
  pix_copy_paste text,
  invoice_url text,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create table if not exists public.invitation_accesses (
  id uuid primary key default gen_random_uuid(),
  guest_id uuid not null references public.guests(id) on delete cascade,
  accessed_at timestamptz not null default now(),
  device text
);

create index if not exists guests_wedding_id_idx on public.guests(wedding_id);
create index if not exists guests_slug_idx on public.guests(slug);
create index if not exists gifts_wedding_id_idx on public.gifts(wedding_id);
create index if not exists contributions_gift_id_idx on public.gift_contributions(gift_id);
create index if not exists contributions_status_idx on public.gift_contributions(payment_status);
create index if not exists invitation_accesses_guest_id_idx on public.invitation_accesses(guest_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists guests_set_updated_at on public.guests;
create trigger guests_set_updated_at
before update on public.guests
for each row execute function public.set_updated_at();

drop trigger if exists gifts_set_updated_at on public.gifts;
create trigger gifts_set_updated_at
before update on public.gifts
for each row execute function public.set_updated_at();

create or replace function public.is_wedding_admin(p_wedding_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.wedding_id = p_wedding_id
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Public RSVP
create or replace function public.submit_rsvp(
  p_slug text,
  p_confirmation_status text,
  p_companions_count int default 0,
  p_companions jsonb default '[]'::jsonb,
  p_dietary text default null,
  p_rsvp_notes text default null
)
returns public.guests
language plpgsql
security definer
set search_path = public
as $$
declare
  g public.guests;
begin
  if p_confirmation_status not in ('confirmed', 'declined') then
    raise exception 'invalid confirmation status';
  end if;

  update public.guests
  set
    confirmation_status = p_confirmation_status,
    companions_count = greatest(coalesce(p_companions_count, 0), 0),
    companions = coalesce(p_companions, '[]'::jsonb),
    dietary = p_dietary,
    rsvp_notes = p_rsvp_notes,
    updated_at = now()
  where slug = p_slug
  returning * into g;

  if g.id is null then
    raise exception 'guest not found';
  end if;

  return g;
end;
$$;

create or replace function public.track_invitation_access(
  p_slug text,
  p_device text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  g_id uuid;
begin
  select id into g_id from public.guests where slug = p_slug;
  if g_id is null then
    return;
  end if;

  insert into public.invitation_accesses (guest_id, device)
  values (g_id, p_device);

  update public.guests
  set first_accessed_at = coalesce(first_accessed_at, now()),
      updated_at = now()
  where id = g_id;
end;
$$;

create or replace function public.refresh_gift_completion(p_gift_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  raised numeric;
  price numeric;
  current_status text;
begin
  select coalesce(sum(amount), 0) into raised
  from public.gift_contributions
  where gift_id = p_gift_id and payment_status = 'paid';

  select g.price, g.status into price, current_status
  from public.gifts g where g.id = p_gift_id;

  if price is null then
    return;
  end if;

  if raised >= price and current_status <> 'hidden' then
    update public.gifts set status = 'completed', updated_at = now() where id = p_gift_id;
  elsif raised < price and current_status = 'completed' then
    update public.gifts set status = 'active', updated_at = now() where id = p_gift_id;
  end if;
end;
$$;

alter table public.weddings enable row level security;
alter table public.profiles enable row level security;
alter table public.guests enable row level security;
alter table public.gifts enable row level security;
alter table public.gift_contributions enable row level security;
alter table public.invitation_accesses enable row level security;

-- Weddings
drop policy if exists weddings_public_read on public.weddings;
create policy weddings_public_read on public.weddings
for select using (true);

drop policy if exists weddings_admin_all on public.weddings;
create policy weddings_admin_all on public.weddings
for all using (public.is_wedding_admin(id))
with check (public.is_wedding_admin(id));

-- Profiles
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
for select using (auth.uid() = id);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
for update using (auth.uid() = id);

-- Guests
drop policy if exists guests_public_read on public.guests;
create policy guests_public_read on public.guests
for select using (true);

drop policy if exists guests_admin_all on public.guests;
create policy guests_admin_all on public.guests
for all using (public.is_wedding_admin(wedding_id))
with check (public.is_wedding_admin(wedding_id));

-- Gifts
drop policy if exists gifts_public_read_active on public.gifts;
create policy gifts_public_read_active on public.gifts
for select using (status in ('active', 'completed') or public.is_wedding_admin(wedding_id));

drop policy if exists gifts_admin_all on public.gifts;
create policy gifts_admin_all on public.gifts
for all using (public.is_wedding_admin(wedding_id))
with check (public.is_wedding_admin(wedding_id));

-- Contributions: public can read paid totals; create pending via API/service role mostly
drop policy if exists contributions_public_read on public.gift_contributions;
create policy contributions_public_read on public.gift_contributions
for select using (
  payment_status = 'paid'
  or public.is_wedding_admin(wedding_id)
);

drop policy if exists contributions_admin_all on public.gift_contributions;
create policy contributions_admin_all on public.gift_contributions
for all using (public.is_wedding_admin(wedding_id))
with check (public.is_wedding_admin(wedding_id));

-- Invitation accesses
drop policy if exists invitation_accesses_admin_read on public.invitation_accesses;
create policy invitation_accesses_admin_read on public.invitation_accesses
for select using (
  exists (
    select 1 from public.guests g
    where g.id = guest_id and public.is_wedding_admin(g.wedding_id)
  )
);

grant usage on schema public to anon, authenticated;
grant select on public.weddings to anon, authenticated;
grant select on public.guests to anon, authenticated;
grant select on public.gifts to anon, authenticated;
grant select on public.gift_contributions to anon, authenticated;
grant select, update on public.profiles to authenticated;
grant all on public.weddings to authenticated;
grant all on public.guests to authenticated;
grant all on public.gifts to authenticated;
grant all on public.gift_contributions to authenticated;
grant select on public.invitation_accesses to authenticated;
grant execute on function public.submit_rsvp(text, text, int, jsonb, text, text) to anon, authenticated;
grant execute on function public.track_invitation_access(text, text) to anon, authenticated;

alter publication supabase_realtime add table public.guests;
alter publication supabase_realtime add table public.gifts;
alter publication supabase_realtime add table public.gift_contributions;

insert into storage.buckets (id, name, public)
values ('wedding-media', 'wedding-media', true)
on conflict (id) do nothing;

drop policy if exists wedding_media_public_read on storage.objects;
create policy wedding_media_public_read on storage.objects
for select using (bucket_id = 'wedding-media');

drop policy if exists wedding_media_admin_write on storage.objects;
create policy wedding_media_admin_write on storage.objects
for all using (
  bucket_id = 'wedding-media'
  and exists (select 1 from public.profiles p where p.id = auth.uid() and p.wedding_id is not null)
)
with check (
  bucket_id = 'wedding-media'
  and exists (select 1 from public.profiles p where p.id = auth.uid() and p.wedding_id is not null)
);

-- Seed wedding
insert into public.weddings (id, name, date, location, settings)
values (
  '11111111-1111-1111-1111-111111111111',
  'Rafael & Noiva',
  '2026-12-12',
  'A definir',
  jsonb_build_object(
    'couple_names', 'Rafael & Noiva',
    'welcome_message', 'Você está convidado para celebrar esse momento especial conosco.',
    'story', 'Uma história de amor escrita a quatro mãos, com carinho, encontros e planos para a vida.',
    'ceremony_time', '16:00',
    'dress_code', 'Esporte fino',
    'additional_info', 'Confirme sua presença e celebre conosco.',
    'gallery', '[]'::jsonb
  )
)
on conflict (id) do nothing;
