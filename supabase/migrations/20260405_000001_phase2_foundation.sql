begin;

create extension if not exists pgcrypto;

DO $$
BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'viewer');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE public.membership_status AS ENUM ('active', 'invited', 'disabled');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE public.account_type AS ENUM ('cash', 'bank', 'other');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE public.payment_method AS ENUM ('cash', 'card', 'transfer', 'bizum', 'direct_debit', 'other');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE public.invoice_status AS ENUM ('pending', 'partially_paid', 'paid', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE public.entry_type AS ENUM ('income', 'expense', 'adjustment');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE public.attachment_entity_type AS ENUM ('expense', 'purchase_invoice');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) >= 2),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  currency text not null default 'EUR',
  timezone text not null default 'Europe/Madrid',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.business_users (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role public.app_role not null default 'admin',
  status public.membership_status not null default 'active',
  created_at timestamptz not null default timezone('utc', now()),
  unique (business_id, user_id)
);

create table if not exists public.expense_categories (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  name text not null check (char_length(trim(name)) >= 2),
  color text,
  icon text,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.vendors (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  name text not null check (char_length(trim(name)) >= 2),
  tax_id text,
  phone text,
  email text,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  name text not null check (char_length(trim(name)) >= 2),
  type public.account_type not null default 'cash',
  initial_balance numeric(12,2) not null default 0 check (initial_balance >= 0),
  is_primary boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  vendor_id uuid references public.vendors (id) on delete set null,
  category_id uuid not null references public.expense_categories (id) on delete restrict,
  account_id uuid references public.accounts (id) on delete set null,
  expense_date date not null,
  base_amount numeric(12,2) not null check (base_amount >= 0),
  tax_amount numeric(12,2) not null default 0 check (tax_amount >= 0),
  total_amount numeric(12,2) generated always as (base_amount + tax_amount) stored,
  payment_method public.payment_method not null default 'other',
  reference text,
  notes text,
  attachment_count integer not null default 0 check (attachment_count >= 0),
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.purchase_invoices (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  vendor_id uuid not null references public.vendors (id) on delete restrict,
  invoice_number text not null check (char_length(trim(invoice_number)) >= 1),
  issue_date date not null,
  due_date date not null,
  subtotal numeric(12,2) not null check (subtotal >= 0),
  tax_amount numeric(12,2) not null default 0 check (tax_amount >= 0),
  total numeric(12,2) generated always as (subtotal + tax_amount) stored,
  status public.invoice_status not null default 'pending',
  notes text,
  attachment_count integer not null default 0 check (attachment_count >= 0),
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.purchase_invoice_payments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  invoice_id uuid not null references public.purchase_invoices (id) on delete cascade,
  account_id uuid not null references public.accounts (id) on delete restrict,
  payment_date date not null,
  amount numeric(12,2) not null check (amount > 0),
  payment_method public.payment_method not null default 'transfer',
  reference text,
  notes text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.account_entries (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  account_id uuid not null references public.accounts (id) on delete restrict,
  entry_date date not null,
  type public.entry_type not null,
  concept text not null check (char_length(trim(concept)) >= 2),
  amount numeric(12,2) not null check (amount >= 0),
  source_type text,
  source_id uuid,
  notes text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.daily_closings (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  account_id uuid not null references public.accounts (id) on delete restrict,
  closing_date date not null,
  opening_balance numeric(12,2) not null default 0,
  inflow_total numeric(12,2) not null default 0,
  outflow_total numeric(12,2) not null default 0,
  closing_balance numeric(12,2) not null default 0,
  notes text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  unique (account_id, closing_date)
);

create table if not exists public.attachments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  entity_type public.attachment_entity_type not null,
  entity_id uuid not null,
  storage_path text not null,
  file_name text not null,
  mime_type text,
  size_bytes integer,
  uploaded_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now())
);

insert into public.profiles (id, email, full_name)
select
  users.id,
  users.email,
  coalesce(users.raw_user_meta_data ->> 'full_name', users.raw_user_meta_data ->> 'name', '')
from auth.users as users
on conflict (id) do update
set email = excluded.email,
    full_name = case
      when coalesce(public.profiles.full_name, '') = '' then excluded.full_name
      else public.profiles.full_name
    end,
    updated_at = timezone('utc', now());

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', '')
  )
  on conflict (id) do update
  set email = excluded.email,
      full_name = case
        when coalesce(public.profiles.full_name, '') = '' then excluded.full_name
        else public.profiles.full_name
      end,
      updated_at = timezone('utc', now());

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

create or replace function public.is_business_member(target_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.business_users bu
    where bu.business_id = target_business_id
      and bu.user_id = auth.uid()
      and bu.status = 'active'
  );
$$;

create or replace function public.can_manage_business(target_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.business_users bu
    where bu.business_id = target_business_id
      and bu.user_id = auth.uid()
      and bu.status = 'active'
      and bu.role in ('admin', 'manager')
  );
$$;

create or replace function public.is_business_admin(target_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.business_users bu
    where bu.business_id = target_business_id
      and bu.user_id = auth.uid()
      and bu.status = 'active'
      and bu.role = 'admin'
  );
$$;

create or replace function public.recompute_purchase_invoice_status(target_invoice_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  paid_total numeric(12,2);
  invoice_total numeric(12,2);
  current_status public.invoice_status;
  next_status public.invoice_status;
begin
  select pi.total, pi.status
    into invoice_total, current_status
  from public.purchase_invoices pi
  where pi.id = target_invoice_id;

  if invoice_total is null then
    return;
  end if;

  if current_status = 'cancelled' then
    return;
  end if;

  select coalesce(sum(pip.amount), 0)
    into paid_total
  from public.purchase_invoice_payments pip
  where pip.invoice_id = target_invoice_id;

  next_status := case
    when paid_total <= 0 then 'pending'::public.invoice_status
    when paid_total < invoice_total then 'partially_paid'::public.invoice_status
    else 'paid'::public.invoice_status
  end;

  update public.purchase_invoices
  set status = next_status,
      updated_at = timezone('utc', now())
  where id = target_invoice_id;
end;
$$;

create or replace function public.sync_purchase_invoice_payment_entry()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_invoice_id uuid;
  invoice_number_value text;
begin
  if tg_op = 'DELETE' then
    delete from public.account_entries
    where source_type = 'purchase_invoice_payment'
      and source_id = old.id;

    perform public.recompute_purchase_invoice_status(old.invoice_id);
    return old;
  end if;

  target_invoice_id := new.invoice_id;

  select invoice_number
    into invoice_number_value
  from public.purchase_invoices
  where id = target_invoice_id;

  update public.account_entries
  set business_id = new.business_id,
      account_id = new.account_id,
      entry_date = new.payment_date,
      type = 'expense',
      concept = 'Pago factura ' || coalesce(invoice_number_value, 'sin número'),
      amount = new.amount,
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
      'Pago factura ' || coalesce(invoice_number_value, 'sin número'),
      new.amount,
      'purchase_invoice_payment',
      new.id,
      new.notes,
      new.created_by
    );
  end if;

  perform public.recompute_purchase_invoice_status(target_invoice_id);
  return new;
end;
$$;

create or replace function public.storage_business_id(path text)
returns uuid
language plpgsql
immutable
as $$
declare
  folder text;
begin
  folder := (storage.foldername(path))[1];

  if folder is null then
    return null;
  end if;

  if folder ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    return folder::uuid;
  end if;

  return null;
end;
$$;

create or replace function public.recount_entity_attachments(target_entity_type public.attachment_entity_type, target_entity_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  total_count integer;
begin
  select count(*)::integer
    into total_count
  from public.attachments a
  where a.entity_type = target_entity_type
    and a.entity_id = target_entity_id;

  if target_entity_type = 'expense' then
    update public.expenses
    set attachment_count = total_count,
        updated_at = timezone('utc', now())
    where id = target_entity_id;
  elsif target_entity_type = 'purchase_invoice' then
    update public.purchase_invoices
    set attachment_count = total_count,
        updated_at = timezone('utc', now())
    where id = target_entity_id;
  end if;
end;
$$;

create or replace function public.sync_attachment_counts()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    perform public.recount_entity_attachments(old.entity_type, old.entity_id);
    return old;
  end if;

  if tg_op = 'UPDATE' and (old.entity_type <> new.entity_type or old.entity_id <> new.entity_id) then
    perform public.recount_entity_attachments(old.entity_type, old.entity_id);
  end if;

  perform public.recount_entity_attachments(new.entity_type, new.entity_id);
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

drop trigger if exists set_businesses_updated_at on public.businesses;
create trigger set_businesses_updated_at
before update on public.businesses
for each row
execute function public.set_updated_at();

drop trigger if exists set_expense_categories_updated_at on public.expense_categories;
create trigger set_expense_categories_updated_at
before update on public.expense_categories
for each row
execute function public.set_updated_at();

drop trigger if exists set_vendors_updated_at on public.vendors;
create trigger set_vendors_updated_at
before update on public.vendors
for each row
execute function public.set_updated_at();

drop trigger if exists set_accounts_updated_at on public.accounts;
create trigger set_accounts_updated_at
before update on public.accounts
for each row
execute function public.set_updated_at();

drop trigger if exists set_expenses_updated_at on public.expenses;
create trigger set_expenses_updated_at
before update on public.expenses
for each row
execute function public.set_updated_at();

drop trigger if exists set_purchase_invoices_updated_at on public.purchase_invoices;
create trigger set_purchase_invoices_updated_at
before update on public.purchase_invoices
for each row
execute function public.set_updated_at();

drop trigger if exists sync_purchase_invoice_payments_to_entries on public.purchase_invoice_payments;
create trigger sync_purchase_invoice_payments_to_entries
after insert or update or delete on public.purchase_invoice_payments
for each row
execute function public.sync_purchase_invoice_payment_entry();

drop trigger if exists sync_attachment_counts_trigger on public.attachments;
create trigger sync_attachment_counts_trigger
after insert or update or delete on public.attachments
for each row
execute function public.sync_attachment_counts();

create unique index if not exists expense_categories_business_name_key
  on public.expense_categories (business_id, lower(name));
create unique index if not exists vendors_business_name_key
  on public.vendors (business_id, lower(name));
create unique index if not exists accounts_business_name_key
  on public.accounts (business_id, lower(name));
create unique index if not exists purchase_invoices_vendor_number_key
  on public.purchase_invoices (business_id, vendor_id, invoice_number);
create unique index if not exists account_entries_source_key
  on public.account_entries (source_type, source_id)
  where source_id is not null;

create index if not exists business_users_user_business_status_idx
  on public.business_users (user_id, business_id, status);
create index if not exists expense_categories_business_idx
  on public.expense_categories (business_id);
create index if not exists vendors_business_idx
  on public.vendors (business_id);
create index if not exists accounts_business_idx
  on public.accounts (business_id);
create index if not exists expenses_business_idx
  on public.expenses (business_id);
create index if not exists expenses_expense_date_idx
  on public.expenses (expense_date);
create index if not exists purchase_invoices_business_idx
  on public.purchase_invoices (business_id);
create index if not exists purchase_invoices_due_date_idx
  on public.purchase_invoices (due_date);
create index if not exists purchase_invoices_status_idx
  on public.purchase_invoices (status);
create index if not exists purchase_invoice_payments_business_idx
  on public.purchase_invoice_payments (business_id);
create index if not exists purchase_invoice_payments_invoice_idx
  on public.purchase_invoice_payments (invoice_id);
create index if not exists account_entries_business_idx
  on public.account_entries (business_id);
create index if not exists account_entries_account_date_idx
  on public.account_entries (account_id, entry_date desc);
create index if not exists daily_closings_business_idx
  on public.daily_closings (business_id);
create index if not exists attachments_business_idx
  on public.attachments (business_id);

alter table public.profiles enable row level security;
alter table public.businesses enable row level security;
alter table public.business_users enable row level security;
alter table public.expense_categories enable row level security;
alter table public.vendors enable row level security;
alter table public.accounts enable row level security;
alter table public.expenses enable row level security;
alter table public.purchase_invoices enable row level security;
alter table public.purchase_invoice_payments enable row level security;
alter table public.account_entries enable row level security;
alter table public.daily_closings enable row level security;
alter table public.attachments enable row level security;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own
on public.profiles
for select
to authenticated
using (id = auth.uid());

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists businesses_select_member on public.businesses;
create policy businesses_select_member
on public.businesses
for select
to authenticated
using (public.is_business_member(id));

drop policy if exists businesses_update_admin on public.businesses;
create policy businesses_update_admin
on public.businesses
for update
to authenticated
using (public.is_business_admin(id))
with check (public.is_business_admin(id));

drop policy if exists business_users_select_member on public.business_users;
create policy business_users_select_member
on public.business_users
for select
to authenticated
using (public.is_business_member(business_id));

drop policy if exists business_users_insert_admin on public.business_users;
create policy business_users_insert_admin
on public.business_users
for insert
to authenticated
with check (public.is_business_admin(business_id));

drop policy if exists business_users_update_admin on public.business_users;
create policy business_users_update_admin
on public.business_users
for update
to authenticated
using (public.is_business_admin(business_id))
with check (public.is_business_admin(business_id));

drop policy if exists business_users_delete_admin on public.business_users;
create policy business_users_delete_admin
on public.business_users
for delete
to authenticated
using (public.is_business_admin(business_id));

drop policy if exists expense_categories_select_member on public.expense_categories;
create policy expense_categories_select_member
on public.expense_categories
for select
to authenticated
using (public.is_business_member(business_id));

drop policy if exists expense_categories_insert_manager on public.expense_categories;
create policy expense_categories_insert_manager
on public.expense_categories
for insert
to authenticated
with check (public.can_manage_business(business_id));

drop policy if exists expense_categories_update_manager on public.expense_categories;
create policy expense_categories_update_manager
on public.expense_categories
for update
to authenticated
using (public.can_manage_business(business_id))
with check (public.can_manage_business(business_id));

drop policy if exists expense_categories_delete_admin on public.expense_categories;
create policy expense_categories_delete_admin
on public.expense_categories
for delete
to authenticated
using (public.is_business_admin(business_id));

drop policy if exists vendors_select_member on public.vendors;
create policy vendors_select_member
on public.vendors
for select
to authenticated
using (public.is_business_member(business_id));

drop policy if exists vendors_insert_manager on public.vendors;
create policy vendors_insert_manager
on public.vendors
for insert
to authenticated
with check (public.can_manage_business(business_id));

drop policy if exists vendors_update_manager on public.vendors;
create policy vendors_update_manager
on public.vendors
for update
to authenticated
using (public.can_manage_business(business_id))
with check (public.can_manage_business(business_id));

drop policy if exists vendors_delete_admin on public.vendors;
create policy vendors_delete_admin
on public.vendors
for delete
to authenticated
using (public.is_business_admin(business_id));

drop policy if exists accounts_select_member on public.accounts;
create policy accounts_select_member
on public.accounts
for select
to authenticated
using (public.is_business_member(business_id));

drop policy if exists accounts_insert_manager on public.accounts;
create policy accounts_insert_manager
on public.accounts
for insert
to authenticated
with check (public.can_manage_business(business_id));

drop policy if exists accounts_update_manager on public.accounts;
create policy accounts_update_manager
on public.accounts
for update
to authenticated
using (public.can_manage_business(business_id))
with check (public.can_manage_business(business_id));

drop policy if exists accounts_delete_admin on public.accounts;
create policy accounts_delete_admin
on public.accounts
for delete
to authenticated
using (public.is_business_admin(business_id));

drop policy if exists expenses_select_member on public.expenses;
create policy expenses_select_member
on public.expenses
for select
to authenticated
using (public.is_business_member(business_id));

drop policy if exists expenses_insert_manager on public.expenses;
create policy expenses_insert_manager
on public.expenses
for insert
to authenticated
with check (public.can_manage_business(business_id));

drop policy if exists expenses_update_manager on public.expenses;
create policy expenses_update_manager
on public.expenses
for update
to authenticated
using (public.can_manage_business(business_id))
with check (public.can_manage_business(business_id));

drop policy if exists expenses_delete_admin on public.expenses;
create policy expenses_delete_admin
on public.expenses
for delete
to authenticated
using (public.is_business_admin(business_id));

drop policy if exists purchase_invoices_select_member on public.purchase_invoices;
create policy purchase_invoices_select_member
on public.purchase_invoices
for select
to authenticated
using (public.is_business_member(business_id));

drop policy if exists purchase_invoices_insert_manager on public.purchase_invoices;
create policy purchase_invoices_insert_manager
on public.purchase_invoices
for insert
to authenticated
with check (public.can_manage_business(business_id));

drop policy if exists purchase_invoices_update_manager on public.purchase_invoices;
create policy purchase_invoices_update_manager
on public.purchase_invoices
for update
to authenticated
using (public.can_manage_business(business_id))
with check (public.can_manage_business(business_id));

drop policy if exists purchase_invoices_delete_admin on public.purchase_invoices;
create policy purchase_invoices_delete_admin
on public.purchase_invoices
for delete
to authenticated
using (public.is_business_admin(business_id));

drop policy if exists purchase_invoice_payments_select_member on public.purchase_invoice_payments;
create policy purchase_invoice_payments_select_member
on public.purchase_invoice_payments
for select
to authenticated
using (public.is_business_member(business_id));

drop policy if exists purchase_invoice_payments_insert_manager on public.purchase_invoice_payments;
create policy purchase_invoice_payments_insert_manager
on public.purchase_invoice_payments
for insert
to authenticated
with check (public.can_manage_business(business_id));

drop policy if exists purchase_invoice_payments_update_manager on public.purchase_invoice_payments;
create policy purchase_invoice_payments_update_manager
on public.purchase_invoice_payments
for update
to authenticated
using (public.can_manage_business(business_id))
with check (public.can_manage_business(business_id));

drop policy if exists purchase_invoice_payments_delete_admin on public.purchase_invoice_payments;
create policy purchase_invoice_payments_delete_admin
on public.purchase_invoice_payments
for delete
to authenticated
using (public.is_business_admin(business_id));

drop policy if exists account_entries_select_member on public.account_entries;
create policy account_entries_select_member
on public.account_entries
for select
to authenticated
using (public.is_business_member(business_id));

drop policy if exists account_entries_insert_manager on public.account_entries;
create policy account_entries_insert_manager
on public.account_entries
for insert
to authenticated
with check (public.can_manage_business(business_id));

drop policy if exists account_entries_update_manager on public.account_entries;
create policy account_entries_update_manager
on public.account_entries
for update
to authenticated
using (public.can_manage_business(business_id))
with check (public.can_manage_business(business_id));

drop policy if exists account_entries_delete_admin on public.account_entries;
create policy account_entries_delete_admin
on public.account_entries
for delete
to authenticated
using (public.is_business_admin(business_id));

drop policy if exists daily_closings_select_member on public.daily_closings;
create policy daily_closings_select_member
on public.daily_closings
for select
to authenticated
using (public.is_business_member(business_id));

drop policy if exists daily_closings_insert_manager on public.daily_closings;
create policy daily_closings_insert_manager
on public.daily_closings
for insert
to authenticated
with check (public.can_manage_business(business_id));

drop policy if exists daily_closings_update_manager on public.daily_closings;
create policy daily_closings_update_manager
on public.daily_closings
for update
to authenticated
using (public.can_manage_business(business_id))
with check (public.can_manage_business(business_id));

drop policy if exists daily_closings_delete_admin on public.daily_closings;
create policy daily_closings_delete_admin
on public.daily_closings
for delete
to authenticated
using (public.is_business_admin(business_id));

drop policy if exists attachments_select_member on public.attachments;
create policy attachments_select_member
on public.attachments
for select
to authenticated
using (public.is_business_member(business_id));

drop policy if exists attachments_insert_manager on public.attachments;
create policy attachments_insert_manager
on public.attachments
for insert
to authenticated
with check (public.can_manage_business(business_id));

drop policy if exists attachments_update_manager on public.attachments;
create policy attachments_update_manager
on public.attachments
for update
to authenticated
using (public.can_manage_business(business_id))
with check (public.can_manage_business(business_id));

drop policy if exists attachments_delete_admin on public.attachments;
create policy attachments_delete_admin
on public.attachments
for delete
to authenticated
using (public.is_business_admin(business_id));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'private-documents',
  'private-documents',
  false,
  10485760,
  array[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp'
  ]
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

alter table storage.objects enable row level security;

drop policy if exists storage_private_documents_select on storage.objects;
create policy storage_private_documents_select
on storage.objects
for select
to authenticated
using (
  bucket_id = 'private-documents'
  and public.is_business_member(public.storage_business_id(name))
);

drop policy if exists storage_private_documents_insert on storage.objects;
create policy storage_private_documents_insert
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'private-documents'
  and public.can_manage_business(public.storage_business_id(name))
);

drop policy if exists storage_private_documents_update on storage.objects;
create policy storage_private_documents_update
on storage.objects
for update
to authenticated
using (
  bucket_id = 'private-documents'
  and public.can_manage_business(public.storage_business_id(name))
)
with check (
  bucket_id = 'private-documents'
  and public.can_manage_business(public.storage_business_id(name))
);

drop policy if exists storage_private_documents_delete on storage.objects;
create policy storage_private_documents_delete
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'private-documents'
  and public.is_business_admin(public.storage_business_id(name))
);

commit;
