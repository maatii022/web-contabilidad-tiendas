begin;
DO $$
DECLARE
  v_business public.businesses%ROWTYPE;
  v_supplier_a uuid;
  v_supplier_b uuid;
  v_supplier_c uuid;
  v_bank_account uuid;
  v_cash_account uuid;
  v_category_suppliers uuid;
  v_category_services uuid;
  v_invoice_partial uuid;
BEGIN
  select * into v_business from public.businesses where slug = '[REPLACE_WITH_BUSINESS_SLUG]' limit 1;
  if v_business.id is null then raise exception 'No se encontró ningún negocio con ese slug.'; end if;
  select id into v_bank_account from public.accounts where business_id = v_business.id and type = 'bank' order by is_primary desc, created_at asc limit 1;
  select id into v_cash_account from public.accounts where business_id = v_business.id and type in ('cash', 'other') order by is_primary desc, created_at asc limit 1;
  select id into v_category_suppliers from public.expense_categories where business_id = v_business.id and name = 'Proveedores' limit 1;
  select id into v_category_services from public.expense_categories where business_id = v_business.id and name = 'Servicios' limit 1;
  if not exists (select 1 from public.vendors where business_id = v_business.id and name = 'Laboratorios Sierra') then insert into public.vendors (business_id, name, notes) values (v_business.id, 'Laboratorios Sierra', 'phase3_demo'); end if;
  if not exists (select 1 from public.vendors where business_id = v_business.id and name = 'Distribuciones Neroli') then insert into public.vendors (business_id, name, notes) values (v_business.id, 'Distribuciones Neroli', 'phase3_demo'); end if;
  if not exists (select 1 from public.vendors where business_id = v_business.id and name = 'Servicios Clínicos Costa') then insert into public.vendors (business_id, name, notes) values (v_business.id, 'Servicios Clínicos Costa', 'phase3_demo'); end if;
  select id into v_supplier_a from public.vendors where business_id = v_business.id and name = 'Laboratorios Sierra' limit 1;
  select id into v_supplier_b from public.vendors where business_id = v_business.id and name = 'Distribuciones Neroli' limit 1;
  select id into v_supplier_c from public.vendors where business_id = v_business.id and name = 'Servicios Clínicos Costa' limit 1;
  if not exists (select 1 from public.expenses where business_id = v_business.id and reference = 'P3-DEMO-GASTO-001') then insert into public.expenses (business_id, vendor_id, category_id, account_id, expense_date, base_amount, tax_amount, payment_method, reference, notes) values (v_business.id, v_supplier_c, v_category_services, v_bank_account, current_date - 2, 120.00, 25.20, 'transfer', 'P3-DEMO-GASTO-001', 'phase3_demo'); end if;
  if not exists (select 1 from public.expenses where business_id = v_business.id and reference = 'P3-DEMO-GASTO-002') then insert into public.expenses (business_id, vendor_id, category_id, account_id, expense_date, base_amount, tax_amount, payment_method, reference, notes) values (v_business.id, v_supplier_b, v_category_suppliers, v_cash_account, current_date - 7, 58.00, 12.18, 'cash', 'P3-DEMO-GASTO-002', 'phase3_demo'); end if;
  if not exists (select 1 from public.account_entries where business_id = v_business.id and source_type = 'phase3_demo' and concept = 'Ingreso diario mostrado en demo') then insert into public.account_entries (business_id, account_id, entry_date, type, concept, amount, source_type, notes) values (v_business.id, coalesce(v_bank_account, v_cash_account), current_date - 1, 'income', 'Ingreso diario mostrado en demo', 960.00, 'phase3_demo', 'phase3_demo'); end if;
  if not exists (select 1 from public.account_entries where business_id = v_business.id and source_type = 'phase3_demo' and concept = 'Salida operativa mostrada en demo') then insert into public.account_entries (business_id, account_id, entry_date, type, concept, amount, source_type, notes) values (v_business.id, coalesce(v_cash_account, v_bank_account), current_date - 3, 'expense', 'Salida operativa mostrada en demo', 74.50, 'phase3_demo', 'phase3_demo'); end if;
  if not exists (select 1 from public.purchase_invoices where business_id = v_business.id and invoice_number = 'P3-DEMO-INV-001') then insert into public.purchase_invoices (business_id, vendor_id, invoice_number, issue_date, due_date, subtotal, tax_amount, status, notes) values (v_business.id, v_supplier_a, 'P3-DEMO-INV-001', current_date - 10, current_date + 3, 1030.00, 218.50, 'pending', 'phase3_demo'); end if;
  if not exists (select 1 from public.purchase_invoices where business_id = v_business.id and invoice_number = 'P3-DEMO-INV-002') then insert into public.purchase_invoices (business_id, vendor_id, invoice_number, issue_date, due_date, subtotal, tax_amount, status, notes) values (v_business.id, v_supplier_b, 'P3-DEMO-INV-002', current_date - 18, current_date - 2, 410.00, 86.10, 'pending', 'phase3_demo'); end if;
  if not exists (select 1 from public.purchase_invoices where business_id = v_business.id and invoice_number = 'P3-DEMO-INV-003') then insert into public.purchase_invoices (business_id, vendor_id, invoice_number, issue_date, due_date, subtotal, tax_amount, status, notes) values (v_business.id, v_supplier_c, 'P3-DEMO-INV-003', current_date - 8, current_date + 12, 620.00, 130.20, 'pending', 'phase3_demo'); end if;
  select id into v_invoice_partial from public.purchase_invoices where business_id = v_business.id and invoice_number = 'P3-DEMO-INV-003' limit 1;
  if v_invoice_partial is not null and v_bank_account is not null and not exists (select 1 from public.purchase_invoice_payments where business_id = v_business.id and reference = 'P3-DEMO-PAGO-001') then insert into public.purchase_invoice_payments (business_id, invoice_id, account_id, payment_date, amount, payment_method, reference, notes) values (v_business.id, v_invoice_partial, v_bank_account, current_date - 1, 200.00, 'transfer', 'P3-DEMO-PAGO-001', 'phase3_demo'); end if;
END $$;
commit;
