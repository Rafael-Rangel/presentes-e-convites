create or replace function public.mark_pix_paid_by_guest(p_contribution_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_gift uuid;
  v_status text;
begin
  select gift_id, payment_status into v_gift, v_status
  from public.gift_contributions
  where id = p_contribution_id
    and payment_method = 'pix';

  if v_gift is null then
    raise exception 'contribuição não encontrada';
  end if;

  if v_status = 'pending' then
    update public.gift_contributions
    set payment_status = 'paid',
        paid_at = now()
    where id = p_contribution_id;

    perform public.refresh_gift_completion(v_gift);
  elsif v_status <> 'paid' then
    raise exception 'contribuição não pode ser confirmada';
  end if;
end;
$$;

grant execute on function public.mark_pix_paid_by_guest(uuid) to anon, authenticated;
