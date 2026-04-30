// src/lib/auth/middleware.ts
// Auth guard + tenant isolation + audit log pour les Route Handlers.

import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/db/prisma";
import { createSupabaseServer } from "@/lib/supabase/server";

export interface AuthContext {
  userId: string;
  clientId: string;
  email: string;
  role: "consultant" | "admin" | "lecteur";
  authId: string;
}

export async function getAuthContext(): Promise<AuthContext | null> {
  try {
    const supabase = createSupabaseServer();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return null;
    const appUser = await prisma.user.findUnique({
      where: { authId: user.id },
      select: { id: true, clientId: true, email: true, role: true, authId: true },
    });
    if (!appUser) return null;
    return {
      userId: appUser.id,
      clientId: appUser.clientId,
      email: appUser.email,
      role: appUser.role as AuthContext["role"],
      authId: appUser.authId!,
    };
  } catch {
    return null;
  }
}

type ApiHandler = (
  req: NextRequest,
  ctx: AuthContext,
  params?: Record<string, string>,
) => Promise<NextResponse> | NextResponse;

export function withAuth(handler: ApiHandler, options?: { roles?: AuthContext["role"][] }) {
  return async (req: NextRequest, routeCtx?: { params: Promise<Record<string, string>> }) => {
    const auth = await getAuthContext();
    if (!auth) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    if (options?.roles && !options.roles.includes(auth.role)) {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
    }
    const params = routeCtx?.params ? await routeCtx.params : undefined;
    return handler(req, auth, params);
  };
}

export async function verifyErpOwnership(erpId: string, clientId: string): Promise<boolean> {
  const erp = await prisma.erp.findFirst({ where: { id: erpId, clientId }, select: { id: true } });
  return !!erp;
}

export async function verifyVisiteOwnership(visiteId: string, clientId: string): Promise<boolean> {
  const visite = await prisma.visite.findFirst({
    where: { id: visiteId, erp: { clientId } },
    select: { id: true },
  });
  return !!visite;
}

export async function logAction(
  userId: string,
  action: string,
  entite: string,
  entiteId?: string,
  details?: Record<string, unknown>,
  ip?: string,
) {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entite,
        entiteId,
        details: (details ?? Prisma.JsonNull) as Prisma.InputJsonValue,
        ip,
      },
    });
  } catch (e) {
    console.error("[AUDIT]", e);
  }
}
