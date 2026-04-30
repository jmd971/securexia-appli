// prisma/seed.ts — Données de démo réalistes (Les Abymes, Guadeloupe)
// Exécuter : npm run db:seed
//
// Crée :
//  - 1 client "Ville des Abymes"
//  - 3 utilisateurs Supabase Auth (consultant, admin, lecteur) liés en base
//  - 6 ERP variés et des prescriptions issues de vrais PV
//
// Variables d'environnement requises :
//  - DATABASE_URL / DIRECT_URL                 (Prisma)
//  - NEXT_PUBLIC_SUPABASE_URL                  (création des comptes Auth)
//  - SUPABASE_SERVICE_ROLE_KEY                 (création des comptes Auth)
//  - SECUREXIA_SEED_PASSWORD (optionnel)       Mot de passe par défaut. Défaut : Demo!1234

import { PrismaClient, UserRole } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";

const prisma = new PrismaClient();

const DEFAULT_PASSWORD = process.env.SECUREXIA_SEED_PASSWORD || "Demo!1234";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const admin = SUPABASE_URL && SERVICE_KEY
  ? createClient(SUPABASE_URL, SERVICE_KEY, { auth: { autoRefreshToken: false, persistSession: false } })
  : null;

const SEED_USERS: { email: string; nom: string; role: UserRole }[] = [
  { email: "consultant@securexia.fr", nom: "Jean-Marc THÉODORE",      role: "consultant" },
  { email: "dst@abymes.gp",           nom: "Marie-Claire FÉLICITÉ",   role: "admin"      },
  { email: "elu@abymes.gp",           nom: "Patrick DUFRESNE",        role: "lecteur"    },
];

async function ensureAuthUser(email: string): Promise<string | null> {
  if (!admin) {
    console.warn(`   ⚠ Supabase admin non configuré — saut de la création Auth pour ${email}`);
    return null;
  }
  // Cherche un utilisateur existant
  const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  const existing = list?.users.find(u => u.email?.toLowerCase() === email.toLowerCase());
  if (existing) return existing.id;

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: DEFAULT_PASSWORD,
    email_confirm: true,
  });
  if (error) {
    console.error(`   ❌ Erreur création Auth pour ${email}:`, error.message);
    return null;
  }
  return data.user.id;
}

async function main() {
  console.log("🌱 Seeding SECUREXIA…");

  // ─── Client ───
  const client = await prisma.client.upsert({
    where: { id: "seed-client-abymes" },
    create: {
      id: "seed-client-abymes",
      type: "collectivite",
      nom: "Ville des Abymes",
      siret: "21971010100015",
    },
    update: {},
  });

  // ─── Utilisateurs (Supabase Auth + Prisma) ───
  let consultantId: string | null = null;
  for (const u of SEED_USERS) {
    const authId = await ensureAuthUser(u.email);
    const dbUser = await prisma.user.upsert({
      where: { email: u.email },
      create: {
        email: u.email,
        nom: u.nom,
        role: u.role,
        clientId: client.id,
        authId: authId ?? undefined,
      },
      update: { nom: u.nom, role: u.role, clientId: client.id, authId: authId ?? undefined },
    });
    if (u.role === "consultant") consultantId = dbUser.id;
  }

  if (!consultantId) {
    throw new Error("Aucun consultant créé — abandon du seed");
  }

  // ─── ERP (idempotent par clientId+codeErp) ───
  const erpsData = [
    { codeErp: "ERP-001", nom: "Groupe Scolaire de Boisvin",   typeErp: "R", categorie: "3", effectif: 386,  natureActivite: "Enseignement sans hébergement (+ type N)", adresse: "Boisvin, 97139",                  commune: "Les Abymes", proprietaireNom: "Ville des Abymes", exploitantNom: "Directrices des écoles", telephone: "0590 82 12 34", conformite: 62 },
    { codeErp: "ERP-002", nom: "Salle Aimé Césaire",           typeErp: "L", categorie: "2", effectif: 800,  natureActivite: "Spectacles et réunions",                   adresse: "45 av. de la Liberté",            commune: "Les Abymes", proprietaireNom: "Ville des Abymes", exploitantNom: "Service Culturel",       telephone: "0590 83 45 67", conformite: 68 },
    { codeErp: "ERP-003", nom: "EHPAD Fleur de Canne",         typeErp: "J", categorie: "3", effectif: 120,  natureActivite: "Hébergement PA dépendantes",               adresse: "45 chemin des Bougainvilliers",   commune: "Les Abymes", proprietaireNom: "CCAS",             exploitantNom: "Dr. Célestine MORIN",    telephone: "0590 82 76 98", conformite: 45 },
    { codeErp: "ERP-004", nom: "Complexe sportif Mandela",     typeErp: "X", categorie: "2", effectif: 1200, natureActivite: "Gymnase et salles de sport",               adresse: "Rue du Stade",                    commune: "Les Abymes", proprietaireNom: "Ville des Abymes", exploitantNom: "Service des Sports",     telephone: "0590 82 55 43", conformite: 90 },
    { codeErp: "ERP-005", nom: "Médiathèque Paul Niger",       typeErp: "S", categorie: "4", effectif: 180,  natureActivite: "Bibliothèque et médiathèque",              adresse: "Place de la Mairie",              commune: "Les Abymes", proprietaireNom: "Ville des Abymes", exploitantNom: "Service Culturel",       telephone: "0590 82 12 90", conformite: 92 },
    { codeErp: "ERP-006", nom: "Mairie annexe Grand-Camp",     typeErp: "W", categorie: "4", effectif: 200,  natureActivite: "Bureaux administratifs",                   adresse: "18 avenue de Grand-Camp",         commune: "Les Abymes", proprietaireNom: "Ville des Abymes", exploitantNom: "Secrétariat Général",    conformite: 78 },
  ];

  const erps = await Promise.all(
    erpsData.map(data =>
      prisma.erp.upsert({
        where: { clientId_codeErp: { clientId: client.id, codeErp: data.codeErp } },
        create: { ...data, clientId: client.id },
        update: data,
      }),
    ),
  );

  // ─── Visites + Prescriptions (recréées proprement à chaque seed) ───
  const erpIds = erps.map(e => e.id);
  await prisma.visite.deleteMany({ where: { erpId: { in: erpIds } } });

  // Boisvin — vraies prescriptions PV 30/01/2025
  const visiteBoisvin = await prisma.visite.create({
    data: {
      erpId: erps[0].id, type: "commission", motif: "periodique",
      dateVisite: new Date("2025-01-30"), heure: "09:00",
      statut: "cloture", createdBy: consultantId,
    },
  });
  await prisma.prescription.createMany({
    data: [
      { visiteId: visiteBoisvin.id, description: "Instruire le personnel sur la conduite en cas d'incendie et l'entraîner à la manœuvre des moyens de secours (Art. MS 72 §1 et R 143-11 du CCH)", delai: "6 mois", responsable: "Directrices",       priorite: "haute",    statut: "en_retard" },
      { visiteId: visiteBoisvin.id, description: "Prévoir la réalisation d'exercices pratiques d'évacuation pour les 2 écoles, trimestriels (Art. R33)",                                            delai: "Permanent",     responsable: "Directrices",       priorite: "haute",    statut: "en_retard" },
      { visiteId: visiteBoisvin.id, description: "Supprimer l'ensemble des fiches multiples et installer des prises de courant fixes adaptées (Art. EL 11 §7)",                                     delai: "3 mois",        responsable: "Service technique", priorite: "haute",    statut: "en_retard" },
      { visiteId: visiteBoisvin.id, description: "Faire contrôler l'ascenseur par un organisme agréé avant remise en service (Art. AS 9)",                                                          delai: "Avant commission", responsable: "Service technique", priorite: "critique", statut: "en_cours"  },
      { visiteId: visiteBoisvin.id, description: "Rendre le DAE accessible pour les 2 écoles en toutes circonstances (Art. R. 157-1 à 4 du CCH)",                                                   delai: "1 mois",        responsable: "Directrices",       priorite: "haute",    statut: "a_faire"   },
      { visiteId: visiteBoisvin.id, description: "Débarrasser les locaux à risques des stockages combustibles (Art. CO 27 et CO 28)",                                                               delai: "Immédiat",      responsable: "Agent technique",   priorite: "critique", statut: "a_faire"   },
      { visiteId: visiteBoisvin.id, description: "Installer un équipement d'alarme perceptible pour les personnes en situation de handicap — flashs sanitaires (Art. GN 8 et MS 64 §3)",            delai: "6 mois",        responsable: "Service technique", priorite: "moyenne",  statut: "a_faire"   },
    ],
  });
  await prisma.avis.create({
    data: {
      visiteId: visiteBoisvin.id,
      avisGlobal: "anomalies_avec_prescriptions",
      commentaire: "Avis favorable avec prescriptions — le niveau de sécurité du public est satisfaisant malgré les observations relevées.",
    },
  });

  // EHPAD — prescriptions en retard
  const visiteEhpad = await prisma.visite.create({
    data: {
      erpId: erps[2].id, type: "commission", motif: "periodique",
      dateVisite: new Date("2023-11-10"), statut: "cloture", createdBy: consultantId,
    },
  });
  await prisma.prescription.createMany({
    data: [
      { visiteId: visiteEhpad.id, description: "Formation SSI personnel soignant",                  delai: "3 mois", responsable: "Dr. MORIN",     priorite: "haute",    statut: "en_retard" },
      { visiteId: visiteEhpad.id, description: "Remplacement détecteurs chambres 12 à 18",          delai: "2 mois", responsable: "SSI ANTILLES",  priorite: "critique", statut: "en_retard" },
      { visiteId: visiteEhpad.id, description: "Plan d'évacuation adapté PMR",                      delai: "3 mois", responsable: "SECUREXIA",     priorite: "haute",    statut: "en_cours"  },
    ],
  });

  // Salle Aimé Césaire
  const visiteCesaire = await prisma.visite.create({
    data: {
      erpId: erps[1].id, type: "commission", motif: "periodique",
      dateVisite: new Date("2023-03-15"), statut: "cloture", createdBy: consultantId,
    },
  });
  await prisma.prescription.createMany({
    data: [
      { visiteId: visiteCesaire.id, description: "Remplacement 2 exutoires désenfumage", delai: "3 mois", responsable: "CLIM'AIR",         priorite: "critique", statut: "en_retard" },
      { visiteId: visiteCesaire.id, description: "Mise à jour registre de sécurité",     delai: "1 mois", responsable: "Service Culturel", priorite: "moyenne",  statut: "fait"      },
    ],
  });

  console.log("✅ Seed terminé.");
  console.log(`   → 1 client, ${SEED_USERS.length} utilisateurs, ${erps.length} ERP, prescriptions réalistes`);
  if (admin) {
    console.log("");
    console.log("🔐 Comptes Supabase Auth créés :");
    SEED_USERS.forEach(u => {
      console.log(`   - ${u.email}  ·  rôle ${u.role}  ·  mot de passe : ${DEFAULT_PASSWORD}`);
    });
    console.log("");
    console.log("⚠️  Changez ces mots de passe via le dashboard Supabase avant la mise en production.");
  }
}

main()
  .catch(err => { console.error(err); process.exit(1); })
  .finally(() => prisma.$disconnect());
