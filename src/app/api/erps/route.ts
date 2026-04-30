import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { withSession } from "@/lib/auth/api";
import { logAction } from "@/lib/auth/middleware";
import prisma from "@/lib/db/prisma";
import { erpCreateSchema } from "@/lib/validation/schemas";

export const GET = withSession(async (_req, ctx) => {
  const erps = await prisma.erp.findMany({
    where: { clientId: ctx.clientId },
    orderBy: [{ commune: "asc" }, { nom: "asc" }],
  });
  return NextResponse.json({ data: erps });
});

export const POST = withSession(async (req, ctx) => {
  const body = await req.json().catch(() => null);
  const parsed = erpCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides", issues: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;
  try {
    const erp = await prisma.erp.create({
      data: {
        clientId: ctx.clientId,
        codeErp: data.codeErp,
        nom: data.nom,
        typeErp: data.typeErp,
        categorie: data.categorie,
        effectif: data.effectif,
        natureActivite: data.natureActivite,
        adresse: data.adresse,
        commune: data.commune,
        proprietaireNom: data.proprietaireNom,
        exploitantNom: data.exploitantNom,
        telephone: data.telephone,
        email: data.email || null,
      },
    });
    await logAction(ctx.userId, "erp.create", "erp", erp.id, { nom: erp.nom });
    return NextResponse.json({ data: erp }, { status: 201 });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json({ error: "Un ERP avec ce code existe déjà." }, { status: 409 });
    }
    console.error("[POST /api/erps]", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}, { roles: ["consultant", "admin"] });
