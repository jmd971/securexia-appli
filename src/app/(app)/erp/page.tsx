import { redirect } from "next/navigation";
import { Topbar } from "@/components/layout/Topbar";
import { ErpListClient } from "@/components/erp/ErpListClient";
import { getCurrentSession } from "@/lib/auth/session";
import { getErpsForClient } from "@/lib/data/erp-queries";

export const dynamic = "force-dynamic";

export default async function ErpListPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/login");

  const erps = await getErpsForClient(session.clientId);

  const rows = erps.map(erp => ({
    id: erp.id,
    nom: erp.nom,
    codeErp: erp.codeErp,
    typeErp: erp.typeErp,
    categorie: erp.categorie,
    effectif: erp.effectif,
    commune: erp.commune,
    exploitantNom: erp.exploitantNom,
    prescriptionsEnRetard: erp.prescriptionsEnRetard,
    scoreGlobal: erp.scores.global,
    hasData: erp.scores.hasData,
  }));

  return (
    <>
      <Topbar
        title="Parc ERP"
        subtitle={`${erps.length} établissement${erps.length > 1 ? "s" : ""} suivi${erps.length > 1 ? "s" : ""}`}
      />
      <div className="flex-1 p-6">
        <ErpListClient erps={rows} />
      </div>
    </>
  );
}
