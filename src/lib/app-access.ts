import 'server-only';

import { cache } from 'react';
import { redirect } from 'next/navigation';

import { getCurrentUser, getUserPresentation } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database';

type AppRole = Database['public']['Enums']['app_role'];

type AppBusiness = Database['public']['Tables']['businesses']['Row'];

type AppMembership = Pick<
  Database['public']['Tables']['business_users']['Row'],
  'id' | 'business_id' | 'role' | 'status' | 'created_at'
>;

export type ActiveAppContext = {
  user: {
    id: string;
    email: string;
    name: string;
  };
  membership: AppMembership;
  business: AppBusiness;
};

const roleLabelMap: Record<AppRole, string> = {
  admin: 'Administrador',
  manager: 'Gestor',
  viewer: 'Lectura'
};

export function getRoleLabel(role: AppRole) {
  return roleLabelMap[role];
}

export const getActiveAppContext = cache(async (): Promise<ActiveAppContext | null> => {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const supabase = await createClient();

  const { data: memberships, error: membershipError } = await supabase
    .from('business_users')
    .select('id, business_id, role, status, created_at')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .order('created_at', { ascending: true })
    .limit(1);

  if (membershipError || !memberships || memberships.length === 0) {
    return null;
  }

  const membership = memberships[0];

  const { data: business, error: businessError } = await supabase
    .from('businesses')
    .select('id, name, slug, currency, timezone, created_at, updated_at')
    .eq('id', membership.business_id)
    .single();

  if (businessError || !business) {
    return null;
  }

  const presentedUser = getUserPresentation(user);

  return {
    user: {
      id: user.id,
      email: presentedUser.email,
      name: presentedUser.name
    },
    membership,
    business
  };
});

export async function requireAppContext() {
  const appContext = await getActiveAppContext();

  if (!appContext) {
    redirect('/acceso-denegado');
  }

  return appContext;
}
