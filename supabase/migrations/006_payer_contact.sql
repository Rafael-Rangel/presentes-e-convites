alter table public.gift_contributions
  add column if not exists payer_phone text,
  add column if not exists payer_cpf text;

drop function if exists public.create_pending_contribution(uuid, uuid, uuid, text, numeric, text);

create function public.create_pending_contribution(
  p_wedding_id uuid,
  p_gift_id uuid,
  p_guest_id uuid,
  p_payer_name text,
  p_amount numeric,
  p_payment_method text,
  p_payer_phone text default null,
  p_payer_cpf text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid;
begin
  if p_payment_method not in ('pix', 'credit', 'debit') then
    raise exception 'invalid payment method';
  end if;

  insert into public.gift_contributions
    (wedding_id, gift_id, guest_id, payer_name, payer_phone, payer_cpf, amount, payment_method, payment_status)
  values
    (p_wedding_id, p_gift_id, p_guest_id, p_payer_name, p_payer_phone, p_payer_cpf, p_amount, p_payment_method, 'pending')
  returning id into new_id;

  return new_id;
end;
$$;

grant execute on function public.create_pending_contribution(uuid, uuid, uuid, text, numeric, text, text, text) to anon, authenticated;

revoke select (payer_phone, payer_cpf) on public.gift_contributions from anon;
