import { ShieldCheck } from "lucide-react";
import { LoginForm } from "./LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const { redirect } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted-light px-4">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-navy text-white">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-navy">
              SECURE<span className="text-accent">XIA</span>
            </h1>
            <p className="text-xs text-muted">ERP Sécurité 360°</p>
          </div>
        </div>

        <h2 className="mb-2 text-base font-semibold text-navy">Connexion</h2>
        <p className="mb-5 text-xs text-muted">
          Authentifiez-vous avec votre compte professionnel pour accéder au
          tableau de bord de votre parc ERP.
        </p>

        <LoginForm redirectTo={redirect} />

        <p className="mt-6 text-center text-[11px] text-muted">
          SECUREXIA · Les Abymes, Guadeloupe · contact@securexia.fr
        </p>
      </div>
    </div>
  );
}
