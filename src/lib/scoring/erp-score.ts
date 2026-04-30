// src/lib/scoring/erp-score.ts
// Calcul des scores d'un ERP à partir de ses visites stockées en base.

import {
  CHECKLIST_ITEMS,
  SECTIONS,
  SectionKey,
  calcGlobalScore,
  getSectionsApplicables,
  getSectionsNA,
  scoreFromChecklist,
} from "@/types/erp";

export interface VisiteForScoring {
  id: string;
  type: "previsite" | "commission";
  dateVisite: Date | null;
  checklistItems: { sectionOfficielle: string; statut: string | null; gravite: number | null }[];
}

export interface ErpScores {
  global: number;
  sections: Partial<Record<SectionKey, number>>;
  applicables: SectionKey[];
  na: SectionKey[];
  hasData: boolean;
}

const ITEMS_BY_ID: Record<string, number> = {};
Object.values(CHECKLIST_ITEMS).forEach(items => {
  items.forEach(it => { ITEMS_BY_ID[it.id] = it.gravity; });
});

export function computeErpScores(typeErp: string, visites: VisiteForScoring[]): ErpScores {
  const applicables = getSectionsApplicables(typeErp);
  const na = getSectionsNA(typeErp);

  const latest = [...visites]
    .sort((a, b) => (b.dateVisite?.getTime() ?? 0) - (a.dateVisite?.getTime() ?? 0))[0];

  if (!latest) {
    return { global: 0, sections: {}, applicables, na, hasData: false };
  }

  const sections: Partial<Record<SectionKey, number>> = {};
  applicables.forEach(key => {
    const items = latest.checklistItems
      .filter(i => i.sectionOfficielle === key)
      .map(i => ({ statut: i.statut, gravity: i.gravite ?? 1 }));
    sections[key] = items.length > 0 ? scoreFromChecklist(items) : 0;
  });

  const filled = Object.entries(sections).filter(([, v]) => v && v > 0).length;
  const global = filled > 0 ? calcGlobalScore(sections, typeErp) : 0;

  return { global, sections, applicables, na, hasData: filled > 0 };
}

export function sectionLabel(key: SectionKey): string {
  return SECTIONS[key].label;
}

export function defaultGravityForItem(itemId: string): number {
  return ITEMS_BY_ID[itemId] ?? 1;
}
