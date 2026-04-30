import Link from "next/link";
import {
  Building2,
  Gauge,
  AlertTriangle,
  Flame,
  ArrowRight,
} from "lucide-react";
import { Topbar } from "@/components/layout/Topbar";
import { Card, KpiCard } from "@/components/ui/Card";
import { ScoreBadge } from "@/components/ui/ScoreBadge";
import { StatutBadge } from "@/components/ui/StatutBadge";
import { PrioBadge } from "@/components/ui/PrioBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { getCurrentSession } from "@/lib/auth/session";
import { getDashboardData } from "@/lib/data/erp-queries";
import { ERP_TYPES } from "@/types/erp";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/login");

  const { erps, prescriptions, kpis } = await getDashboardData(session.clientId);

  const erpsAtRisk = [...erps]
    .filter(e => e.scores.hasData)
    .sort((a, b) => a.scores.global - b.scores.global)
    .slice(0, 6);

  const urgentPrescriptions = prescriptions
    .filter(
      p =>
        p.statut === "en_retard" ||
        (p.priorite === "critique" && p.statut !== "fait"),
    )
    .slice(0, 6);

  return (
    <>
      <Topbar
        title="Tableau de bord"
        subtitle={`Pilotage du parc ERP — ${session.email}`}
      />

      <div className="flex-1 space-y-6 p-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            label="ERP suivis"
            value={kpis.total}
            hint="Établissements dans votre parc"
            accent="navy"
            icon={<Building2 size={20} />}
          />
          <KpiCard
            label="Score moyen du parc"
            value={kpis.avgScore > 0 ? `${kpis.avgScore.toFixed(1)}/5` : "—"}
            hint="Moyenne des ERP avec pré-visite"
            accent="success"
            icon={<Gauge size={20} />}
          />
          <KpiCard
            label="Prescriptions en retard"
            value={kpis.enRetard}
            hint="Échéance dépassée"
            accent="danger"
            icon={<AlertTriangle size={20} />}
          />
          <KpiCard
            label="Actions critiques"
            value={kpis.critical}
            hint="Priorité critique non levée"
            accent="warn"
            icon={<Flame size={20} />}
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <Card
            title="ERP les plus à risque"
            subtitle="Triés par score croissant"
            action={
              <Link
                href="/erp"
                className="inline-flex items-center gap-1 text-xs font-medium text-navy hover:underline"
              >
                Voir tout <ArrowRight size={12} />
              </Link>
            }
            bodyClassName="p-0"
          >
            {erpsAtRisk.length === 0 ? (
              <div className="p-5">
                <EmptyState
                  title="Aucune pré-visite réalisée"
                  description="Lancez une pré-visite sur un ERP pour faire apparaître son score ici."
                />
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {erpsAtRisk.map(erp => (
                  <li key={erp.id}>
                    <Link
                      href={`/erp/${erp.id}`}
                      className="flex items-center justify-between gap-4 px-5 py-3 transition-colors hover:bg-muted-light"
                    >
                      <div className="flex items-center gap-3">
                        <ScoreBadge score={erp.scores.global} size="sm" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-navy">{erp.nom}</p>
                          <p className="text-xs text-muted">
                            {erp.commune} · Type {erp.typeErp} · {ERP_TYPES[erp.typeErp as keyof typeof ERP_TYPES] ?? ""} · Cat. {erp.categorie}
                          </p>
                        </div>
                      </div>
                      <ArrowRight size={16} className="text-muted" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card
            title="Prescriptions urgentes"
            subtitle="En retard ou critiques non levées"
            action={
              <Link
                href="/prescriptions"
                className="inline-flex items-center gap-1 text-xs font-medium text-navy hover:underline"
              >
                Voir tout <ArrowRight size={12} />
              </Link>
            }
            bodyClassName="p-0"
          >
            {urgentPrescriptions.length === 0 ? (
              <div className="p-5">
                <EmptyState
                  title="Aucune prescription urgente"
                  description="Vos établissements sont à jour sur leurs prescriptions critiques."
                />
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {urgentPrescriptions.map(p => (
                  <li key={p.id} className="px-5 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="line-clamp-2 text-sm text-gray-800">{p.description}</p>
                        <Link
                          href={`/erp/${p.visite.erp.id}`}
                          className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-navy hover:underline"
                        >
                          {p.visite.erp.nom}
                        </Link>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <StatutBadge statut={p.statut} />
                        <PrioBadge priorite={p.priorite} />
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
