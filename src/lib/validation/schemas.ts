import { z } from "zod";

export const erpCreateSchema = z.object({
  codeErp: z.string().min(1).max(50),
  nom: z.string().min(1).max(255),
  typeErp: z.string().min(1).max(5),
  categorie: z.string().min(1).max(1),
  effectif: z.number().int().positive(),
  natureActivite: z.string().max(255).optional(),
  adresse: z.string().min(1).max(500),
  commune: z.string().min(1).max(255),
  proprietaireNom: z.string().max(255).optional(),
  exploitantNom: z.string().min(1).max(255),
  telephone: z.string().max(20).optional(),
  email: z.string().email().optional().or(z.literal("")),
});
export const erpUpdateSchema = erpCreateSchema.partial();

export const visiteCreateSchema = z.object({
  erpId: z.string().cuid(),
  type: z.enum(["previsite", "commission"]),
  motif: z.string().optional(),
  dateVisite: z.string().optional(),
  heure: z.string().optional(),
});

export const participantSchema = z.object({
  categorie: z.enum(["commission", "etablissement"]),
  nom: z.string().min(1).max(255),
  role: z.string().max(255).optional(),
  organisme: z.string().max(255).optional(),
});

const triState = z.enum(["oui", "non", "na"]).nullable().optional();
export const docRegCheckSchema = z.object({
  registrePresent: z.boolean().nullable().optional(),
  registreAJour: z.boolean().nullable().optional(),
  attestElectricite: triState, attestGaz: triState, attestAscenseurs: triState,
  attestExtincteurs: triState, attestSsi: triState, attestDesenfumage: triState,
  plansIntervention: triState, commentaire: z.string().max(2000).optional(),
});

export const checklistBulkUpdateSchema = z.object({
  items: z.array(z.object({
    id: z.string().cuid(),
    statut: z.enum(["OK", "NOK", "NA"]).nullable(),
    commentaire: z.string().max(1000).optional(),
  })),
});

export const anomalieCreateSchema = z.object({
  niveau: z.enum(["mineure", "majeure"]),
  description: z.string().min(1).max(2000),
  categorie: z.string().max(255).optional(),
});

export const prescriptionCreateSchema = z.object({
  description: z.string().min(1).max(2000),
  delai: z.string().max(255).optional(),
  echeance: z.string().optional(),
  responsable: z.string().max(255).optional(),
  priorite: z.enum(["basse", "moyenne", "haute", "critique"]).default("moyenne"),
});
export const prescriptionUpdateSchema = prescriptionCreateSchema.partial().extend({
  statut: z.enum(["a_faire", "en_cours", "fait", "en_retard"]).optional(),
});

export const avisSchema = z.object({
  avisGlobal: z.enum(["aucune_anomalie", "anomalies_mineures", "anomalies_avec_prescriptions", "manquements_graves"]),
  commentaire: z.string().max(2000).optional(),
  motifs: z.string().max(2000).optional(),
});

export const signatureSchema = z.object({
  role: z.enum(["auditeur", "maitre_ouvrage", "exploitant"]),
  nom: z.string().max(255).optional(),
  imageData: z.string().optional(),
});
