'use client';

import { useActionState } from 'react';
import { LoaderCircle, LockKeyhole, Mail } from 'lucide-react';

import { loginAction, type LoginState } from '@/app/(auth)/login/actions';
import { Button } from '@/components/ui/button';

const initialState: LoginState = {};

export function LoginForm({ nextPath }: { nextPath: string | null }) {
  const [state, formAction, isPending] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="mt-8 space-y-5">
      <input type="hidden" name="next" value={nextPath ?? ''} />

      <div>
        <label htmlFor="email" className="mb-2 block text-sm font-semibold text-[var(--foreground)]">
          Email
        </label>
        <div className="flex items-center gap-3 rounded-[22px] border border-[rgba(123,136,95,0.16)] bg-[rgba(255,255,255,0.82)] px-4 py-3">
          <Mail className="h-4 w-4 text-[var(--foreground-soft)]" />
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="tu@negocio.com"
            className="w-full border-none bg-transparent text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-soft)]"
          />
        </div>
        {state.fieldErrors?.email ? (
          <p className="mt-2 text-sm text-[var(--danger)]">{state.fieldErrors.email[0]}</p>
        ) : null}
      </div>

      <div>
        <label htmlFor="password" className="mb-2 block text-sm font-semibold text-[var(--foreground)]">
          Contraseña
        </label>
        <div className="flex items-center gap-3 rounded-[22px] border border-[rgba(123,136,95,0.16)] bg-[rgba(255,255,255,0.82)] px-4 py-3">
          <LockKeyhole className="h-4 w-4 text-[var(--foreground-soft)]" />
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            className="w-full border-none bg-transparent text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-soft)]"
          />
        </div>
        {state.fieldErrors?.password ? (
          <p className="mt-2 text-sm text-[var(--danger)]">{state.fieldErrors.password[0]}</p>
        ) : null}
      </div>

      {state.error ? (
        <div className="rounded-[20px] border border-[rgba(155,91,83,0.14)] bg-[rgba(155,91,83,0.08)] px-4 py-3 text-sm text-[var(--danger)]">
          {state.error}
        </div>
      ) : null}

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? (
          <>
            <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
            Accediendo...
          </>
        ) : (
          'Entrar al panel privado'
        )}
      </Button>
    </form>
  );
}
