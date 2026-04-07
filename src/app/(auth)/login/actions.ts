'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';

import { createClient } from '@/lib/supabase/server';
import { sanitizeNextPath } from '@/lib/utils';

const loginSchema = z.object({
  email: z.string().trim().email('Introduce un email válido.'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres.'),
  next: z.string().optional()
});

export type LoginState = {
  error?: string;
  fieldErrors?: {
    email?: string[];
    password?: string[];
  };
};

export async function loginAction(_: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    next: typeof formData.get('next') === 'string' ? formData.get('next') : undefined
  });

  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors
    };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password
  });

  if (error) {
    return {
      error: 'No se pudo iniciar sesión. Revisa tus credenciales o la configuración de Supabase.'
    };
  }

  return redirect(sanitizeNextPath(parsed.data.next) ?? '/dashboard');
}
