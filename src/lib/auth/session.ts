// src/lib/auth/session.ts
// Récupère la session utilisateur côté serveur. En production, Supabase est requis.
// Le mode démo (sans Supabase) reste possible en dev local en posant
// NEXT_PUBLIC_DEMO_MODE=true dans .env.local.

import prisma from "@/lib/db/prisma";
import { getAuthContext, AuthContext } from "@/lib/auth/middleware";

const DEMO_MODE =
  process.env.NEXT_PUBLIC_DEMO_MODE === "true" &&
  process.env.NODE_ENV !== "production";

export async function getCurrentSession(): Promise<AuthContext | null> {
  const auth = await getAuthContext().catch(() => null);
  if (auth) return auth;

  if (!DEMO_MODE) return null;

  const user = await prisma.user.findFirst({
    where: { role: "consultant" },
    orderBy: { createdAt: "asc" },
  });
  if (!user) return null;

  return {
    userId: user.id,
    clientId: user.clientId,
    email: user.email,
    role: "consultant",
    authId: user.authId ?? "demo",
  };
}

export async function requireSession(): Promise<AuthContext> {
  const session = await getCurrentSession();
  if (!session) throw new Error("Session requise");
  return session;
}
