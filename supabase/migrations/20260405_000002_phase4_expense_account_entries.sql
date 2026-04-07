begin;

create or replace function public.sync_expense_account_entry()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  category_name text;
  vendor_name text;
  concept_text text;
begin
  if tg_op = 'DELETE' then
    delete from public.account_entries
    where source_type = 'expense'
      and source_id = old.id;

    return old;
  end if;

  if new.account_id is null then
    delete from public.account_entries
    where source_type = 'expense'
      and source_id = new.id;

    return new;
  end if;

  select name into category_name
  from public.expense_categories
  where id = new.category_id;

  if new.vendor_id is not null then
    select name into vendor_name
    from public.vendors
    where id = new.vendor_id;
  end if;

  concept_text := coalesce(nullif(trim(new.reference), ''), nullif(trim(vendor_name), ''), nullif(trim(category_name), ''), 'Gasto');

  update public.account_entries
  set business_id = new.business_id,
      account_id = new.account_id,
      entry_date = new.expense_date,
      type = 'expense',
      concept = concept_text,
      amount = new.total_amount,
      notes = new.notes,
      created_by = new.created_by
  where source_type = 'expense'
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
      new.expense_date,
      'expense',
      concept_text,
      new.total_amount,
      'expense',
      new.id,
      new.notes,
      new.created_by
    );
  end if;

  return new;
end;
$$;

drop trigger if exists sync_expenses_to_entries on public.expenses;
create trigger sync_expenses_to_entries
after insert or update or delete on public.expenses
for each row
execute function public.sync_expense_account_entry();

commit;
