create or replace function public.mark_pix_contribution_paid(p_contribution_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_gift uuid;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  update public.gift_contributions
  set payment_status = 'paid',
      paid_at = now()
  where id = p_contribution_id
    and payment_method = 'pix'
    and payment_status = 'pending'
  returning gift_id into v_gift;

  if v_gift is not null then
    perform public.refresh_gift_completion(v_gift);
  end if;
end;
$$;

grant execute on function public.mark_pix_contribution_paid(uuid) to authenticated;
