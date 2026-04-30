"use client";

import { useFormState, useFormStatus } from "react-dom";
import { LogIn } from "lucide-react";
import { signInAction, type LoginState } from "./actions";

const initialState: LoginState = {};

export function LoginForm({ redirectTo }: { redirectTo?: string }) {
  const [state, formAction] = useFormState(signInAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="redirect" value={redirectTo ?? "/dashboard"} />

      <label className="flex flex-col gap-1 text-xs">
        <span className="font-medium text-gray-700">Email</span>
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="consultant@securexia.fr"
          className="input-field"
        />
      </label>

      <label className="flex flex-col gap-1 text-xs">
        <span className="font-medium text-gray-700">Mot de passe</span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          placeholder="••••••••"
          className="input-field"
        />
      </label>

      {state.error && (
        <div className="rounded-md border border-danger/40 bg-danger-light px-3 py-2 text-xs text-danger">
          {state.error}
        </div>
      )}

      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="btn-primary inline-flex w-full items-center justify-center gap-2 disabled:opacity-60"
    >
      <LogIn size={16} />
      {pending ? "Connexion…" : "Se connecter"}
    </button>
  );
}
