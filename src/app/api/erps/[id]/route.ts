import { NextResponse } from "next/server";
import { withSession } from "@/lib/auth/api";
import { logAction, verifyErpOwnership } from "@/lib/auth/middleware";
import prisma from "@/lib/db/prisma";
import { erpUpdateSchema } from "@/lib/validation/schemas";

export const GET = withSession(async (_req, ctx, params) => {
  const id = params?.id;
  if (!id) return NextResponse.json({ error: "ID requis" }, { status: 400 });

  const erp = await prisma.erp.findFirst({
    where: { id, clientId: ctx.clientId },
    include: {
      visites: { orderBy: { dateVisite: "desc" } },
    },
  });
  if (!erp) return NextResponse.json({ error: "ERP introuvable" }, { status: 404 });
  return NextResponse.json({ data: erp });
});

export const PATCH = withSession(async (req, ctx, params) => {
  const id = params?.id;
  if (!id) return NextResponse.json({ error: "ID requis" }, { status: 400 });
  if (!(await verifyErpOwnership(id, ctx.clientId))) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const body = await req.json().catch(() => null);
  const parsed = erpUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides", issues: parsed.error.flatten() }, { status: 400 });
  }
  const updated = await prisma.erp.update({
    where: { id },
    data: parsed.data,
  });
  await logAction(ctx.userId, "erp.update", "erp", id, parsed.data);
  return NextResponse.json({ data: updated });
}, { roles: ["consultant", "admin"] });

export const DELETE = withSession(async (_req, ctx, params) => {
  const id = params?.id;
  if (!id) return NextResponse.json({ error: "ID requis" }, { status: 400 });
  if (!(await verifyErpOwnership(id, ctx.clientId))) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  await prisma.erp.delete({ where: { id } });
  await logAction(ctx.userId, "erp.delete", "erp", id);
  return NextResponse.json({ ok: true });
}, { roles: ["consultant", "admin"] });
