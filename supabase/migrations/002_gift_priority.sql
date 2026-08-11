alter table public.gifts
  add column if not exists is_priority boolean not null default false;
