import 'server-only';

import type { User } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';

export type AppUser = Pick<User, 'id' | 'email' | 'user_metadata'>;

export async function getCurrentUser(): Promise<AppUser | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  const user = data.user;

  if (error || !user) {
    return null;
  }

  return user;
}

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return user;
}

export function getUserPresentation(user: AppUser | null) {
  const email = user?.email ?? 'usuario@negocio.com';
  const fullName =
    typeof user?.user_metadata?.full_name === 'string' ? user.user_metadata.full_name.trim() : '';

  return {
    email,
    name: fullName.length > 0 ? fullName : 'Usuario autorizado'
  };
}
