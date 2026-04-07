begin;
DO $$
DECLARE v_business_id uuid;
BEGIN
  select id into v_business_id from public.businesses where slug = '[REPLACE_WITH_BUSINESS_SLUG]' limit 1;
  if v_business_id is null then raise exception 'No se encontró ningún negocio con ese slug.'; end if;
  delete from public.purchase_invoice_payments where business_id = v_business_id and notes = 'phase3_demo';
  delete from public.purchase_invoices where business_id = v_business_id and notes = 'phase3_demo';
  delete from public.account_entries where business_id = v_business_id and notes = 'phase3_demo';
  delete from public.expenses where business_id = v_business_id and notes = 'phase3_demo';
  delete from public.vendors where business_id = v_business_id and notes = 'phase3_demo';
END $$;
commit;
