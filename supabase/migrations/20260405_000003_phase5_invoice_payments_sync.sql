begin;

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
    when paid_total <= 0 then 'pending'
    when paid_total + 0.009 >= invoice_total then 'paid'
    else 'partially_paid'
  end,
  updated_at = timezone('utc', now())
  where id = p_invoice_id;
end;
$$;

create or replace function public.sync_purchase_invoice_payment_entry()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  invoice_number_text text;
  vendor_name text;
  concept_text text;
begin
  if tg_op = 'DELETE' then
    delete from public.account_entries
    where source_type = 'purchase_invoice_payment'
      and source_id = old.id;

    perform public.recalculate_purchase_invoice_status(old.invoice_id);
    return old;
  end if;

  select invoices.invoice_number, vendors.name
    into invoice_number_text, vendor_name
  from public.purchase_invoices as invoices
  join public.vendors on vendors.id = invoices.vendor_id
  where invoices.id = new.invoice_id;

  concept_text := concat('Pago factura ', coalesce(invoice_number_text, ''), case when coalesce(vendor_name, '') <> '' then concat(' · ', vendor_name) else '' end);

  update public.account_entries
  set business_id = new.business_id,
      account_id = new.account_id,
      entry_date = new.payment_date,
      type = 'expense',
      concept = concept_text,
      amount = new.amount,
      source_type = 'purchase_invoice_payment',
      source_id = new.id,
      notes = new.notes,
      created_by = new.created_by
  where source_type = 'purchase_invoice_payment'
    and source_id = new.id;

  if not found then
    insert into public.account_entries (
      business_id,
      account_id,
      entry_date,
      type,
      concept,
      amount,
      source_type,
      source_id,
      notes,
      created_by
    )
    values (
      new.business_id,
      new.account_id,
      new.payment_date,
      'expense',
      concept_text,
      new.amount,
      'purchase_invoice_payment',
      new.id,
      new.notes,
      new.created_by
    );
  end if;

  perform public.recalculate_purchase_invoice_status(new.invoice_id);
  return new;
end;
$$;

create or replace function public.recalculate_invoice_after_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.recalculate_purchase_invoice_status(new.id);
  return new;
end;
$$;



delete from public.account_entries
where source_type = 'purchase_invoice_payment';

insert into public.account_entries (
  business_id,
  account_id,
  entry_date,
  type,
  concept,
  amount,
  source_type,
  source_id,
  notes,
  created_by
)
select
  payments.business_id,
  payments.account_id,
  payments.payment_date,
  'expense',
  concat('Pago factura ', invoices.invoice_number, case when coalesce(vendors.name, '') <> '' then concat(' · ', vendors.name) else '' end),
  payments.amount,
  'purchase_invoice_payment',
  payments.id,
  payments.notes,
  payments.created_by
from public.purchase_invoice_payments as payments
join public.purchase_invoices as invoices on invoices.id = payments.invoice_id
join public.vendors on vendors.id = invoices.vendor_id;

DO $$
DECLARE
  invoice_row record;
BEGIN
  for invoice_row in select id from public.purchase_invoices loop
    perform public.recalculate_purchase_invoice_status(invoice_row.id);
  end loop;
END $$;


drop trigger if exists sync_invoice_payments_to_entries on public.purchase_invoice_payments;
create trigger sync_invoice_payments_to_entries
after insert or update or delete on public.purchase_invoice_payments
for each row
execute function public.sync_purchase_invoice_payment_entry();

drop trigger if exists recalculate_invoice_status_on_update on public.purchase_invoices;
create trigger recalculate_invoice_status_on_update
after update of subtotal, tax_amount on public.purchase_invoices
for each row
execute function public.recalculate_invoice_after_update();

commit;
