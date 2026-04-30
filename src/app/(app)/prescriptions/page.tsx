import { redirect } from "next/navigation";
import { Topbar } from "@/components/layout/Topbar";
import { PrescriptionsClient } from "@/components/prescriptions/PrescriptionsClient";
import { getCurrentSession } from "@/lib/auth/session";
import { getPrescriptionsForClient } from "@/lib/data/erp-queries";

export const dynamic = "force-dynamic";

export default async function PrescriptionsPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/login");

  const data = await getPrescriptionsForClient(session.clientId);

  const rows = data.map(p => ({
    id: p.id,
    description: p.description,
    delai: p.delai,
    responsable: p.responsable,
    priorite: p.priorite,
    statut: p.statut,
    erp: {
      id: p.visite.erp.id,
      nom: p.visite.erp.nom,
      commune: p.visite.erp.commune,
    },
  }));

  const counts = {
    total: rows.length,
    enRetard: rows.filter(r => r.statut === "en_retard").length,
    actives: rows.filter(r => r.statut !== "fait").length,
  };

  return (
    <>
      <Topbar
        title="Prescriptions"
        subtitle={`${counts.actives} actives · ${counts.enRetard} en retard sur ${counts.total} au total`}
      />
      <div className="flex-1 p-6">
        <PrescriptionsClient prescriptions={rows} />
      </div>
    </>
  );
}
