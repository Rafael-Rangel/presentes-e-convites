alter table public.guests
  add column if not exists party_size integer not null default 1
  check (party_size >= 1 and party_size <= 50);

comment on column public.guests.party_size is
  'Número de pessoas neste convite (agrupado). Usado na contagem financeira.';
