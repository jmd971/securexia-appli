// Server-side data loaders. Tous filtrent par clientId pour respecter
// l'isolation multi-tenant.

import prisma from "@/lib/db/prisma";
import { computeErpScores, ErpScores } from "@/lib/scoring/erp-score";

const VISITE_INCLUDE = {
  checklistItems: { select: { sectionOfficielle: true, statut: true, gravite: true } },
} as const;

export async function getErpsForClient(clientId: string) {
  const erps = await prisma.erp.findMany({
    where: { clientId },
    orderBy: [{ commune: "asc" }, { nom: "asc" }],
    include: {
      visites: {
        select: { id: true, type: true, dateVisite: true, ...VISITE_INCLUDE },
      },
      _count: {
        select: { visites: true },
      },
    },
  });

  const enRetard = await prisma.prescription.findMany({
    where: { statut: "en_retard", visite: { erp: { clientId } } },
    select: { visite: { select: { erpId: true } } },
  });
  const enRetardByErp = new Map<string, number>();
  enRetard.forEach(p => {
    const id = p.visite.erpId;
    enRetardByErp.set(id, (enRetardByErp.get(id) ?? 0) + 1);
  });

  return erps.map(erp => {
    const scores = computeErpScores(erp.typeErp, erp.visites);
    const lastVisite = [...erp.visites]
      .sort((a, b) => (b.dateVisite?.getTime() ?? 0) - (a.dateVisite?.getTime() ?? 0))[0];
    return {
      ...erp,
      scores,
      lastVisiteDate: lastVisite?.dateVisite ?? null,
      prescriptionsEnRetard: enRetardByErp.get(erp.id) ?? 0,
    };
  });
}

export async function getErpById(erpId: string, clientId: string) {
  const erp = await prisma.erp.findFirst({
    where: { id: erpId, clientId },
    include: {
      visites: {
        orderBy: { dateVisite: "desc" },
        include: {
          ...VISITE_INCLUDE,
          prescriptions: { orderBy: { createdAt: "desc" } },
          avis: true,
        },
      },
    },
  });
  if (!erp) return null;
  const scores: ErpScores = computeErpScores(erp.typeErp, erp.visites);
  return { ...erp, scores };
}

export async function getPrescriptionsForClient(clientId: string) {
  return prisma.prescription.findMany({
    where: { visite: { erp: { clientId } } },
    orderBy: [{ statut: "asc" }, { priorite: "desc" }, { createdAt: "desc" }],
    include: {
      visite: {
        include: { erp: { select: { id: true, nom: true, typeErp: true, commune: true } } },
      },
    },
  });
}

export async function getDashboardData(clientId: string) {
  const erps = await getErpsForClient(clientId);
  const prescriptions = await getPrescriptionsForClient(clientId);

  const scored = erps.filter(e => e.scores.hasData);
  const avgScore = scored.length
    ? scored.reduce((s, e) => s + e.scores.global, 0) / scored.length
    : 0;

  const enRetard = prescriptions.filter(p => p.statut === "en_retard").length;
  const critical = prescriptions.filter(
    p => p.priorite === "critique" && p.statut !== "fait",
  ).length;

  return {
    erps,
    prescriptions,
    kpis: {
      total: erps.length,
      avgScore: Math.round(avgScore * 10) / 10,
      enRetard,
      critical,
    },
  };
}
