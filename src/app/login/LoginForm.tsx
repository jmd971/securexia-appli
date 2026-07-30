"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { LogIn, Eye, EyeOff } from "lucide-react";
import { signInAction, type LoginState } from "./actions";

const initialState: LoginState = {};

export function LoginForm({ redirectTo }: { redirectTo?: string }) {
  const [state, formAction] = useFormState(signInAction, initialState);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="redirect" value={redirectTo ?? "/dashboard"} />

      <label className="flex flex-col gap-1 text-xs">
        <span className="font-medium text-gray-700">Email</span>
        <input
          name="email"
          type="email"
          autoComplete="email"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          required
          placeholder="consultant@securexia.fr"
          className="input-field"
        />
      </label>

      <label className="flex flex-col gap-1 text-xs">
        <span className="font-medium text-gray-700">Mot de passe</span>
        <div className="relative">
          <input
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            required
            placeholder="••••••••"
            className="input-field pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword(v => !v)}
            aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            title={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            tabIndex={-1}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted transition-colors hover:text-gray-700 focus-ring"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
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
