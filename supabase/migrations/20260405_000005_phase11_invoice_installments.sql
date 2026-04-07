begin;

create table if not exists public.purchase_invoice_installments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null,
  invoice_id uuid not null references public.purchase_invoices(id) on delete cascade,
  sequence_number integer not null,
  due_date date not null,
  amount numeric(12,2) not null check (amount >= 0),
  paid_amount numeric(12,2) not null default 0 check (paid_amount >= 0),
  status text not null default 'pending' check (status in ('pending', 'partially_paid', 'paid', 'overdue')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (invoice_id, sequence_number)
);

create index if not exists purchase_invoice_installments_business_id_idx on public.purchase_invoice_installments (business_id);
create index if not exists purchase_invoice_installments_invoice_id_idx on public.purchase_invoice_installments (invoice_id);
create index if not exists purchase_invoice_installments_due_date_idx on public.purchase_invoice_installments (due_date);
create index if not exists purchase_invoice_installments_status_idx on public.purchase_invoice_installments (status);

alter table public.purchase_invoice_installments enable row level security;

drop policy if exists purchase_invoice_installments_read on public.purchase_invoice_installments;
create policy purchase_invoice_installments_read on public.purchase_invoice_installments
for select
using (public.user_has_business_access(business_id));

drop policy if exists purchase_invoice_installments_manage on public.purchase_invoice_installments;
create policy purchase_invoice_installments_manage on public.purchase_invoice_installments
for all
using (public.user_can_manage_business(business_id))
with check (public.user_can_manage_business(business_id));

create or replace function public.refresh_purchase_invoice_schedule(p_invoice_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  payment_row record;
  installment_row record;
  remaining_payment numeric(12,2);
  allocation numeric(12,2);
  invoice_status_text public.invoice_status;
  pending_count integer;
  overdue_count integer;
  partial_count integer;
  paid_count integer;
  current_invoice_status public.invoice_status;
  next_due date;
begin
  select status into current_invoice_status
  from public.purchase_invoices
  where id = p_invoice_id;

  if current_invoice_status is null then
    return;
  end if;

  update public.purchase_invoice_installments
  set paid_amount = 0,
      status = case
        when due_date < current_date then 'overdue'
        else 'pending'
      end,
      updated_at = timezone('utc', now())
  where invoice_id = p_invoice_id;

  for payment_row in
    select amount
    from public.purchase_invoice_payments
    where invoice_id = p_invoice_id
    order by payment_date asc, created_at asc, id asc
  loop
    remaining_payment := coalesce(payment_row.amount, 0);

    for installment_row in
      select id, amount, paid_amount, due_date
      from public.purchase_invoice_installments
      where invoice_id = p_invoice_id
      order by sequence_number asc, due_date asc, created_at asc
    loop
      exit when remaining_payment <= 0;

      if coalesce(installment_row.paid_amount, 0) + 0.009 >= installment_row.amount then
        continue;
      end if;

      allocation := least(remaining_payment, installment_row.amount - coalesce(installment_row.paid_amount, 0));

      update public.purchase_invoice_installments
      set paid_amount = coalesce(paid_amount, 0) + allocation,
          updated_at = timezone('utc', now())
      where id = installment_row.id;

      remaining_payment := remaining_payment - allocation;
    end loop;
  end loop;

  update public.purchase_invoice_installments
  set status = case
      when paid_amount + 0.009 >= amount then 'paid'
      when paid_amount > 0 then 'partially_paid'
      when due_date < current_date then 'overdue'
      else 'pending'
    end,
    updated_at = timezone('utc', now())
  where invoice_id = p_invoice_id;

  select
    count(*) filter (where status in ('pending', 'overdue')),
    count(*) filter (where status = 'overdue'),
    count(*) filter (where status = 'partially_paid'),
    count(*) filter (where status = 'paid')
  into pending_count, overdue_count, partial_count, paid_count
  from public.purchase_invoice_installments
  where invoice_id = p_invoice_id;

  select due_date into next_due
  from public.purchase_invoice_installments
  where invoice_id = p_invoice_id
    and status <> 'paid'
  order by sequence_number asc, due_date asc
  limit 1;

  invoice_status_text := case
    when current_invoice_status = 'cancelled' then 'cancelled'::public.invoice_status
    when coalesce(pending_count, 0) = 0 and coalesce(partial_count, 0) = 0 and coalesce(paid_count, 0) > 0 then 'paid'::public.invoice_status
    when coalesce(partial_count, 0) > 0 or (coalesce(paid_count, 0) > 0 and coalesce(pending_count, 0) > 0) then 'partially_paid'::public.invoice_status
    else 'pending'::public.invoice_status
  end;

  update public.purchase_invoices
  set status = invoice_status_text,
      due_date = coalesce(next_due, due_date),
      updated_at = timezone('utc', now())
  where id = p_invoice_id;
end;
$$;


create or replace function public.recalculate_purchase_invoice_status(p_invoice_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.refresh_purchase_invoice_schedule(p_invoice_id);
end;
$$;

create or replace function public.sync_purchase_invoice_schedule_trigger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    perform public.refresh_purchase_invoice_schedule(old.invoice_id);
    return old;
  end if;

  perform public.refresh_purchase_invoice_schedule(new.invoice_id);
  return new;
end;
$$;

drop trigger if exists sync_purchase_invoice_payments_schedule on public.purchase_invoice_payments;
create trigger sync_purchase_invoice_payments_schedule
after insert or update or delete on public.purchase_invoice_payments
for each row
execute function public.sync_purchase_invoice_schedule_trigger();

insert into public.purchase_invoice_installments (
  business_id,
  invoice_id,
  sequence_number,
  due_date,
  amount,
  paid_amount,
  status
)
select
  invoices.business_id,
  invoices.id,
  1,
  invoices.due_date,
  invoices.total,
  0,
  case when invoices.due_date < current_date and invoices.status <> 'paid' then 'overdue' else 'pending' end
from public.purchase_invoices as invoices
where not exists (
  select 1 from public.purchase_invoice_installments as installments where installments.invoice_id = invoices.id
);

DO $$
DECLARE
  invoice_row record;
BEGIN
  for invoice_row in select id from public.purchase_invoices loop
    perform public.refresh_purchase_invoice_schedule(invoice_row.id);
  end loop;
END $$;

commit;
