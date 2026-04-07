select 'profiles' as table_name, count(*) as row_count from public.profiles
union all
select 'businesses', count(*) from public.businesses
union all
select 'business_users', count(*) from public.business_users
union all
select 'expense_categories', count(*) from public.expense_categories
union all
select 'accounts', count(*) from public.accounts;
