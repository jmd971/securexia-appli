// src/lib/auth/api.ts
// Wrapper API qui utilise getCurrentSession (avec fallback démo) au lieu
// de withAuth() pour permettre de travailler sans Supabase configuré.
// À aligner sur withAuth() dès que l'auth Supabase est en place.

import { NextRequest, NextResponse } from "next/server";
import { AuthContext } from "@/lib/auth/middleware";
import { getCurrentSession } from "@/lib/auth/session";

type ApiHandler = (
  req: NextRequest,
  ctx: AuthContext,
  params?: Record<string, string>,
) => Promise<NextResponse> | NextResponse;

export function withSession(
  handler: ApiHandler,
  options?: { roles?: AuthContext["role"][] },
) {
  return async (
    req: NextRequest,
    routeCtx?: { params: Promise<Record<string, string>> },
  ) => {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    if (options?.roles && !options.roles.includes(session.role)) {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
    }
    const params = routeCtx?.params ? await routeCtx.params : undefined;
    return handler(req, session, params);
  };
}
