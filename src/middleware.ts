// src/middleware.ts
// Refresh la session Supabase à chaque requête et protège les routes applicatives.

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseMiddleware } from "@/lib/supabase/server";

const PUBLIC_ROUTES = ["/login", "/auth/callback"];

export async function middleware(req: NextRequest) {
  const { supabase, response } = createSupabaseMiddleware(req);

  // Important : appel à getUser() pour rafraîchir le token expiré.
  const { data: { user } } = await supabase.auth.getUser();

  const { pathname } = req.nextUrl;
  const isPublic = PUBLIC_ROUTES.some(p => pathname.startsWith(p));

  // Non authentifié + route protégée → /login
  if (!user && !isPublic) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // Authentifié + sur /login → /dashboard
  if (user && pathname === "/login") {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    url.searchParams.delete("redirect");
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    // Toutes les routes sauf assets, images, favicon, et fichiers statiques.
    "/((?!_next/static|_next/image|favicon.ico|api/health|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
