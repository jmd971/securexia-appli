import { NextResponse } from "next/server";
import { withSession } from "@/lib/auth/api";
import { logAction } from "@/lib/auth/middleware";
import prisma from "@/lib/db/prisma";
import { prescriptionUpdateSchema } from "@/lib/validation/schemas";

export const PATCH = withSession(async (req, ctx, params) => {
  const id = params?.id;
  if (!id) return NextResponse.json({ error: "ID requis" }, { status: 400 });

  const owned = await prisma.prescription.findFirst({
    where: { id, visite: { erp: { clientId: ctx.clientId } } },
    select: { id: true },
  });
  if (!owned) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = prescriptionUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides", issues: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;
  const echeance = data.echeance ? new Date(data.echeance) : undefined;
  const updated = await prisma.prescription.update({
    where: { id },
    data: { ...data, echeance },
  });
  await logAction(ctx.userId, "prescription.update", "prescription", id, data);
  return NextResponse.json({ data: updated });
}, { roles: ["consultant", "admin"] });

export const DELETE = withSession(async (_req, ctx, params) => {
  const id = params?.id;
  if (!id) return NextResponse.json({ error: "ID requis" }, { status: 400 });
  const owned = await prisma.prescription.findFirst({
    where: { id, visite: { erp: { clientId: ctx.clientId } } },
    select: { id: true },
  });
  if (!owned) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  await prisma.prescription.delete({ where: { id } });
  await logAction(ctx.userId, "prescription.delete", "prescription", id);
  return NextResponse.json({ ok: true });
}, { roles: ["consultant", "admin"] });
