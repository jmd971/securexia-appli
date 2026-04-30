// src/types/erp.ts
// SECUREXIA — Types métier, constantes, logique NA, algorithme scoring

export const ERP_TYPES = {
  J:"Accueil PA/PH",L:"Salles spectacles",M:"Magasins",N:"Restauration",O:"Hôtels",P:"Salles danse/jeux",
  R:"Enseignement",S:"Bibliothèques",T:"Expositions",U:"Soins/EHPAD",V:"Culte",W:"Bureaux",X:"Sports couverts",
  Y:"Musées",CTS:"Chapiteaux",EF:"Flottants",GA:"Gares",OA:"Hôtels altitude",PA:"Plein air",PS:"Parkings",REF:"Refuges",SG:"Gonflables",
} as const;

export type ErpType = keyof typeof ERP_TYPES;

// ── Sections de contrôle ──
export const SECTIONS = {
  degagements:     { label: "Dégagements & Évacuation",  icon: "🚪", weight: 1.2 },
  moyens_secours:  { label: "Moyens de secours",         icon: "🧯", weight: 1.0 },
  ssi_alarme:      { label: "SSI / Alarme",              icon: "🔔", weight: 1.1 },
  desenfumage:     { label: "Désenfumage",               icon: "💨", weight: 0.9 },
  elec_gaz:        { label: "Installations techniques",  icon: "⚡", weight: 1.0 },
  accessibilite:   { label: "Accessibilité PMR",         icon: "♿", weight: 0.8 },
  locaux_risques:  { label: "Locaux à risques",          icon: "☣️", weight: 0.9 },
  documents:       { label: "Documentation & Registre",  icon: "📋", weight: 0.7 },
} as const;

export type SectionKey = keyof typeof SECTIONS;

// ── Sections NA par type ERP ──
export const NA_SECTIONS: Partial<Record<ErpType, SectionKey[]>> = {
  CTS: ["desenfumage", "accessibilite", "locaux_risques"],
  PA:  ["desenfumage", "ssi_alarme", "locaux_risques"],
  EF:  ["desenfumage", "accessibilite"],
  PS:  ["accessibilite"],
  REF: ["desenfumage", "accessibilite"],
  OA:  ["desenfumage"],
  SG:  ["desenfumage", "accessibilite", "locaux_risques"],
  GA:  ["locaux_risques"],
};

// ── Checklist par défaut ──
export interface ChecklistItemDef {
  id: string;
  label: string;
  gravity: number; // 1-3
}

export const CHECKLIST_ITEMS: Record<SectionKey, ChecklistItemDef[]> = {
  degagements: [
    { id: "d1", label: "Nombre et largeur de dégagements réglementaires", gravity: 3 },
    { id: "d2", label: "Issues de secours dégagées et accessibles", gravity: 3 },
    { id: "d3", label: "Portes ouvrant dans le sens de l'évacuation", gravity: 2 },
    { id: "d4", label: "Barres anti-panique fonctionnelles", gravity: 2 },
    { id: "d5", label: "BAES / éclairage de sécurité conforme", gravity: 2 },
    { id: "d6", label: "Exercices d'évacuation réalisés (2x/an)", gravity: 1 },
  ],
  moyens_secours: [
    { id: "m1", label: "Extincteurs conformes et vérifiés", gravity: 2 },
    { id: "m2", label: "RIA conformes (si applicable)", gravity: 2 },
    { id: "m3", label: "Personnel formé à la sécurité incendie", gravity: 2 },
    { id: "m4", label: "BIE / PI accessibles et conformes", gravity: 1 },
    { id: "m5", label: "DAE accessible et maintenu", gravity: 1 },
  ],
  ssi_alarme: [
    { id: "s1", label: "Alarme fonctionnelle et audible partout", gravity: 3 },
    { id: "s2", label: "Déclencheurs manuels accessibles et signalés", gravity: 2 },
    { id: "s3", label: "Détection automatique fonctionnelle", gravity: 2 },
    { id: "s4", label: "Asservissements conformes (DAS, désenfumage)", gravity: 2 },
    { id: "s5", label: "Formation SSI du personnel exploitant", gravity: 1 },
  ],
  desenfumage: [
    { id: "df1", label: "Fonctionnement correct du désenfumage", gravity: 3 },
    { id: "df2", label: "Commandes manuelles identifiées", gravity: 2 },
    { id: "df3", label: "Ouvrants / exutoires en état", gravity: 2 },
  ],
  elec_gaz: [
    { id: "e1", label: "Tableaux électriques sécurisés et accessibles", gravity: 2 },
    { id: "e2", label: "Absence de surcharge / multiprises", gravity: 2 },
    { id: "e3", label: "Vérification périodique à jour", gravity: 2 },
    { id: "e4", label: "Ventilation chaufferies conforme", gravity: 1 },
    { id: "e5", label: "Organes de coupure identifiés", gravity: 1 },
    { id: "e6", label: "Ascenseur contrôlé et en service", gravity: 2 },
  ],
  accessibilite: [
    { id: "a1", label: "Cheminements PMR conformes", gravity: 1 },
    { id: "a2", label: "Sanitaires adaptés", gravity: 1 },
    { id: "a3", label: "Signalétique PMR en place", gravity: 1 },
  ],
  locaux_risques: [
    { id: "l1", label: "Local électrique conforme", gravity: 2 },
    { id: "l2", label: "Local déchets conforme", gravity: 1 },
    { id: "l3", label: "Stockages combustibles maîtrisés", gravity: 2 },
  ],
  documents: [
    { id: "doc1", label: "Registre de sécurité présent et à jour", gravity: 2 },
    { id: "doc2", label: "Attestations vérifications à jour", gravity: 2 },
    { id: "doc3", label: "Plans d'évacuation affichés et à jour", gravity: 1 },
    { id: "doc4", label: "Prescriptions antérieures levées", gravity: 3 },
  ],
};

// ── Scoring Labels ──
export const SCORE_LABELS = ["", "Critique", "Insuffisant", "Passable", "Satisfaisant", "Conforme"] as const;
export const SCORE_COLORS = ["", "#E74C3C", "#E67E22", "#F1C40F", "#3498DB", "#1ABC9C"] as const;

// ── Algorithme de scoring ──

export function scoreFromChecklist(items: { statut: string | null; gravity: number }[]): number {
  let weightedOK = 0, totalWeight = 0;
  items.forEach(item => {
    if (item.statut === "NA") return;
    totalWeight += item.gravity;
    if (item.statut === "OK") weightedOK += item.gravity;
  });
  if (totalWeight === 0) return 5;
  const ratio = weightedOK / totalWeight;
  if (ratio >= 0.95) return 5;
  if (ratio >= 0.80) return 4;
  if (ratio >= 0.60) return 3;
  if (ratio >= 0.40) return 2;
  return 1;
}

export function calcGlobalScore(scores: Partial<Record<SectionKey, number>>, typeErp: string): number {
  const na = NA_SECTIONS[typeErp as ErpType] || [];
  let totalWeight = 0, weightedSum = 0;
  (Object.keys(SECTIONS) as SectionKey[]).forEach(key => {
    if (na.includes(key)) return;
    const s = scores[key];
    if (s != null) { totalWeight += SECTIONS[key].weight; weightedSum += s * SECTIONS[key].weight; }
  });
  return totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 10) / 10 : 0;
}

export function getSectionsNA(typeErp: string): SectionKey[] {
  return NA_SECTIONS[typeErp as ErpType] || [];
}

export function getSectionsApplicables(typeErp: string): SectionKey[] {
  const na = getSectionsNA(typeErp);
  return (Object.keys(SECTIONS) as SectionKey[]).filter(s => !na.includes(s));
}

// ── Avis ──
export const AVIS_OPTIONS = [
  { value: "aucune_anomalie", label: "Aucune anomalie" },
  { value: "anomalies_mineures", label: "Anomalies mineures uniquement" },
  { value: "anomalies_avec_prescriptions", label: "Anomalies avec prescriptions" },
  { value: "manquements_graves", label: "Manquements graves" },
] as const;

// ── Motifs ──
export const MOTIFS_VISITE = [
  { value: "periodique", label: "Visite périodique" },
  { value: "ouverture", label: "Ouverture au public" },
  { value: "reouverture", label: "Réouverture après travaux / fermeture" },
  { value: "inopinee", label: "Visite inopinée" },
  { value: "autre", label: "Autre" },
] as const;
