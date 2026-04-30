"use client";

import { LogOut } from "lucide-react";
import { useFormStatus } from "react-dom";
import { signOutAction } from "@/app/login/actions";

export function UserMenu({ email, role }: { email: string; role: string }) {
  return (
    <div className="space-y-2">
      <div className="rounded-md bg-muted-light px-3 py-2">
        <p className="truncate text-xs font-semibold text-navy">{email}</p>
        <p className="text-[10px] uppercase tracking-wider text-muted">{role}</p>
      </div>
      <form action={signOutAction}>
        <SignOutButton />
      </form>
    </div>
  );
}

function SignOutButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition-colors hover:bg-muted-light disabled:opacity-60"
    >
      <LogOut size={14} />
      {pending ? "Déconnexion…" : "Se déconnecter"}
    </button>
  );
}
