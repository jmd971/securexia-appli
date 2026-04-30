import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ClipboardCheck } from "lucide-react";
import { Topbar } from "@/components/layout/Topbar";
import { Card } from "@/components/ui/Card";
import { ScoreBar } from "@/components/ui/ScoreBar";
import { getCurrentSession } from "@/lib/auth/session";
import { getErpById } from "@/lib/data/erp-queries";
import { ERP_TYPES, SECTIONS, CHECKLIST_ITEMS } from "@/types/erp";

export const dynamic = "force-dynamic";

export default async function PrevisiteDetailPage({
  params,
}: {
  params: Promise<{ erpId: string }>;
}) {
  const session = await getCurrentSession();
  if (!session) redirect("/login");
  const { erpId } = await params;

  const erp = await getErpById(erpId, session.clientId);
  if (!erp) notFound();

  return (
    <>
      <Topbar
        title={`Pré-visite — ${erp.nom}`}
        subtitle={`${erp.commune} · Type ${erp.typeErp} —
        ${ERP_TYPES[erp.typeErp as keyof typeof ERP_TYPES] ?? ""} · Cat. ${erp.categorie}`}
        back={
          <Link
            href={`/erp/${erp.id}`}
            className="inline-flex items-center gap-1 text-xs font-medium text-muted hover:text-navy"
          >
            <ArrowLeft size={12} /> Fiche ERP
          </Link>
        }
      />

      <div className="flex-1 space-y-6 p-6">
        <Card>
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-navy/10 text-navy">
              <ClipboardCheck size={20} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-navy">Module de saisie en cours d'implémentation</h2>
              <p className="mt-1 text-sm text-muted">
                La saisie OK / NOK / NA par item, le calcul de score temps réel et l'export du
                rapport de pré-visite (avec radar et plan d'actions) seront branchés à l'étape suivante.
                Vous pouvez déjà consulter la structure des sections ci-dessous.
              </p>
            </div>
          </div>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          {erp.scores.applicables.map(key => (
            <Card key={key} title={`${SECTIONS[key].icon} ${SECTIONS[key].label}`}>
              <ScoreBar
                label="Score actuel"
                score={erp.scores.sections[key] ?? 0}
              />
              <ul className="mt-4 space-y-2 text-xs text-gray-700">
                {CHECKLIST_ITEMS[key].map(item => (
                  <li key={item.id} className="flex items-start gap-2">
                    <span className="mt-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-muted-light text-[10px] font-bold text-muted">
                      {item.gravity}
                    </span>
                    <span>{item.label}</span>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}
