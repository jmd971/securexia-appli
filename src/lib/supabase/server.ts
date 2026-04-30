// src/lib/supabase/server.ts
// Client Supabase pour Server Components, Server Actions, Route Handlers
// et middleware Next.js. Lit/écrit les cookies de session.

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export function createSupabaseServer() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(c: { name: string; value: string; options: CookieOptions }[]) {
          try {
            c.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Server Components ne peuvent pas modifier les cookies — on ignore.
            // Le middleware refresh la session en amont, donc ce n'est pas bloquant.
          }
        },
      },
    },
  );
}

// Variante pour le middleware Next.js : on doit propager les cookies dans la response.
export function createSupabaseMiddleware(req: NextRequest) {
  const response = NextResponse.next({ request: { headers: req.headers } });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return req.cookies.getAll(); },
        setAll(c: { name: string; value: string; options: CookieOptions }[]) {
          c.forEach(({ name, value }) => req.cookies.set(name, value));
          c.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );
  return { supabase, response };
}
