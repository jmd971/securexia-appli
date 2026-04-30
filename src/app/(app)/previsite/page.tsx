import Link from "next/link";
import { redirect } from "next/navigation";
import { ClipboardCheck, ArrowRight } from "lucide-react";
import { Topbar } from "@/components/layout/Topbar";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ScoreBadge } from "@/components/ui/ScoreBadge";
import { getCurrentSession } from "@/lib/auth/session";
import { getErpsForClient } from "@/lib/data/erp-queries";
import { ERP_TYPES } from "@/types/erp";

export const dynamic = "force-dynamic";

export default async function PrevisitePage() {
  const session = await getCurrentSession();
  if (!session) redirect("/login");

  const erps = await getErpsForClient(session.clientId);

  return (
    <>
      <Topbar
        title="Pré-visites"
        subtitle="Sélectionnez un ERP pour démarrer ou poursuivre une pré-visite terrain"
      />
      <div className="flex-1 p-6">
        <Card
          title="ERP du parc"
          subtitle="Le module de saisie terrain (checklist OK/NOK/NA + photos) sera ajouté à l'étape suivante."
          bodyClassName="p-0"
        >
          {erps.length === 0 ? (
            <div className="p-5">
              <EmptyState
                title="Aucun ERP enregistré"
                description="Créez d'abord un ERP dans le Parc."
              />
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {erps.map(erp => (
                <li key={erp.id} className="flex items-center justify-between gap-4 px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-md bg-navy/10 text-navy">
                      <ClipboardCheck size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-navy">{erp.nom}</p>
                      <p className="text-xs text-muted">
                        {erp.commune} · Type {erp.typeErp} —{" "}
                        {ERP_TYPES[erp.typeErp as keyof typeof ERP_TYPES] ?? ""} · Cat. {erp.categorie}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {erp.scores.hasData && <ScoreBadge score={erp.scores.global} size="sm" />}
                    <Link
                      href={`/erp/${erp.id}`}
                      className="inline-flex items-center gap-1 text-xs font-medium text-navy hover:underline"
                    >
                      Fiche ERP <ArrowRight size={12} />
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
