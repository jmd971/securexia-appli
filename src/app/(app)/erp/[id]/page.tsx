import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, FileDown, ClipboardCheck, Building2 } from "lucide-react";
import { Topbar } from "@/components/layout/Topbar";
import { Card } from "@/components/ui/Card";
import { ScoreBadge } from "@/components/ui/ScoreBadge";
import { ScoreBar } from "@/components/ui/ScoreBar";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErpRadarChart } from "@/components/erp/ErpRadarChart";
import { PrescriptionRow } from "@/components/erp/PrescriptionRow";
import { getCurrentSession } from "@/lib/auth/session";
import { getErpById } from "@/lib/data/erp-queries";
import { ERP_TYPES, SECTIONS, SectionKey } from "@/types/erp";

export const dynamic = "force-dynamic";

export default async function ErpDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getCurrentSession();
  if (!session) redirect("/login");
  const { id } = await params;

  const erp = await getErpById(id, session.clientId);
  if (!erp) notFound();

  const lastVisite = erp.visites[0];
  const allPrescriptions = erp.visites.flatMap(v => v.prescriptions ?? []);
  const activePrescriptions = allPrescriptions.filter(p => p.statut !== "fait");

  return (
    <>
      <Topbar
        title={erp.nom}
        subtitle={`${erp.commune} · Type ${erp.typeErp} — ${ERP_TYPES[erp.typeErp as keyof typeof ERP_TYPES] ?? ""} · Cat. ${erp.categorie} · ${erp.effectif} pers.`}
        back={
          <Link
            href="/erp"
            className="inline-flex items-center gap-1 text-xs font-medium text-muted hover:text-navy"
          >
            <ArrowLeft size={12} /> Parc ERP
          </Link>
        }
        action={
          <>
            <Link
              href={`/previsite/${erp.id}`}
              className="btn-secondary inline-flex items-center gap-2"
            >
              <ClipboardCheck size={16} /> Lancer une pré-visite
            </Link>
            <button
              type="button"
              disabled
              title="Disponible après la première pré-visite (P0 — à venir)"
              className="btn-primary inline-flex items-center gap-2 opacity-50"
            >
              <FileDown size={16} /> Dossier PDF
            </button>
          </>
        }
      />

      <div className="flex-1 space-y-6 p-6">
        <div className="grid gap-6 lg:grid-cols-3">
          <Card title="Identification" className="lg:col-span-2">
            <dl className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
              <Field label="Code ERP" value={erp.codeErp} />
              <Field label="Nature de l'activité" value={erp.natureActivite ?? "—"} />
              <Field label="Adresse" value={erp.adresse} />
              <Field label="Commune" value={erp.commune} />
              <Field label="Exploitant" value={erp.exploitantNom} />
              <Field label="Propriétaire" value={erp.proprietaireNom ?? "—"} />
              <Field label="Téléphone" value={erp.telephone ?? "—"} />
              <Field
                label="Dernière visite"
                value={
                  lastVisite?.dateVisite
                    ? new Date(lastVisite.dateVisite).toLocaleDateString("fr-FR")
                    : "Aucune visite"
                }
              />
            </dl>
          </Card>

          <Card title="Score global">
            <div className="flex flex-col items-center gap-3 py-2">
              {erp.scores.hasData ? (
                <>
                  <ScoreBadge score={erp.scores.global} size="lg" showLabel />
                  <p className="text-center text-xs text-muted">
                    Calculé d'après la dernière pré-visite
                  </p>
                </>
              ) : (
                <div className="flex flex-col items-center gap-3 text-center">
                  <Building2 size={32} className="text-muted" />
                  <p className="text-sm font-medium text-navy">Pas encore évalué</p>
                  <p className="text-xs text-muted">
                    Lancez une pré-visite pour générer le score de cet ERP.
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-5">
          <Card title="Scoring par section" className="lg:col-span-3">
            {erp.scores.hasData ? (
              <div className="space-y-4">
                {erp.scores.applicables.map(key => (
                  <ScoreBar
                    key={key}
                    label={SECTIONS[key].label}
                    icon={SECTIONS[key].icon}
                    score={erp.scores.sections[key] ?? 0}
                  />
                ))}
                {erp.scores.na.length > 0 && (
                  <div className="mt-4 rounded-md bg-muted-light px-3 py-2 text-xs text-muted">
                    Sections non applicables pour ce type d'ERP&nbsp;:&nbsp;
                    {erp.scores.na.map(k => SECTIONS[k as SectionKey].label).join(", ")}
                  </div>
                )}
              </div>
            ) : (
              <EmptyState
                title="Aucun scoring disponible"
                description="Le scoring se génère à partir de la première pré-visite."
              />
            )}
          </Card>

          <Card title="Radar de conformité" className="lg:col-span-2">
            {erp.scores.hasData ? (
              <ErpRadarChart
                scores={erp.scores.sections}
                applicables={erp.scores.applicables}
              />
            ) : (
              <EmptyState title="Radar indisponible" description="En attente de la première pré-visite." />
            )}
          </Card>
        </div>

        <Card
          title="Prescriptions actives"
          subtitle={`${activePrescriptions.length} prescription${activePrescriptions.length > 1 ? "s" : ""} en cours`}
          bodyClassName="p-0"
        >
          {activePrescriptions.length === 0 ? (
            <div className="p-5">
              <EmptyState
                title="Aucune prescription active"
                description="Toutes les prescriptions de cet ERP ont été levées."
              />
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {activePrescriptions.map(p => (
                <PrescriptionRow key={p.id} prescription={p} />
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted">{label}</dt>
      <dd className="mt-0.5 text-sm text-gray-800">{value}</dd>
    </div>
  );
}
