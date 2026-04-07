begin;

create index if not exists account_entries_business_account_date_idx
  on public.account_entries (business_id, account_id, entry_date desc, created_at desc);

create index if not exists daily_closings_business_account_date_idx
  on public.daily_closings (business_id, account_id, closing_date desc, created_at desc);

create or replace function public.recalculate_purchase_invoice_status(p_invoice_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  invoice_total numeric(12,2);
  current_status public.invoice_status;
  paid_total numeric(12,2);
begin
  select total, status
    into invoice_total, current_status
  from public.purchase_invoices
  where id = p_invoice_id;

  if invoice_total is null then
    return;
  end if;

  if current_status = 'cancelled' then
    return;
  end if;

  select coalesce(sum(amount), 0)
    into paid_total
  from public.purchase_invoice_payments
  where invoice_id = p_invoice_id;

  update public.purchase_invoices
  set status = case
    when paid_total <= 0 then 'pending'::public.invoice_status
    when paid_total + 0.009 >= invoice_total then 'paid'::public.invoice_status
    else 'partially_paid'::public.invoice_status
  end,
  updated_at = timezone('utc', now())
  where id = p_invoice_id;
end;
$$;

commit;
