alter table public.guests
  add column if not exists category text,
  add column if not exists seat_price numeric(12,2) not null default 175,
  add column if not exists is_paying boolean not null default true;

create index if not exists guests_category_idx on public.guests(category);
