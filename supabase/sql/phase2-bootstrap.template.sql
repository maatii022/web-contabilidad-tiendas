-- Reemplaza los valores entre corchetes antes de ejecutar.
-- Este script crea la primera tienda, vincula al usuario admin y carga categorías/cuentas base.

begin;

DO $$
DECLARE
  v_user_id uuid := '[REPLACE_WITH_AUTH_USER_ID]'::uuid;
  v_business_id uuid;
BEGIN
  insert into public.businesses (name, slug, currency, timezone)
  values (
    '[REPLACE_WITH_BUSINESS_NAME]',
    '[REPLACE_WITH_BUSINESS_SLUG]',
    'EUR',
    'Europe/Madrid'
  )
  returning id into v_business_id;

  insert into public.business_users (business_id, user_id, role, status)
  values (v_business_id, v_user_id, 'admin', 'active')
  on conflict (business_id, user_id) do nothing;

  insert into public.expense_categories (business_id, name, color, icon)
  values
    (v_business_id, 'Alquiler', '#9c8f6b', 'building-2'),
    (v_business_id, 'Proveedores', '#6f7d55', 'truck'),
    (v_business_id, 'Nóminas', '#6b7f91', 'badge-euro'),
    (v_business_id, 'Suministros', '#9b7e65', 'zap'),
    (v_business_id, 'Limpieza', '#8da37b', 'sparkles'),
    (v_business_id, 'Servicios', '#7e8a6c', 'briefcase-business'),
    (v_business_id, 'Transporte', '#8d826c', 'car-front'),
    (v_business_id, 'Otros', '#8b8b8b', 'circle-ellipsis')
  on conflict do nothing;

  insert into public.accounts (business_id, name, type, initial_balance, is_primary)
  values
    (v_business_id, 'Caja principal', 'cash', 0, true),
    (v_business_id, 'Banco principal', 'bank', 0, false),
    (v_business_id, 'Efectivo', 'other', 0, false)
  on conflict do nothing;
END $$;

commit;
