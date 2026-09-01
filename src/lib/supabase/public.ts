import { createClient } from "@supabase/supabase-js";

/** Client anon para rotas de API (sem cookie de usuário). */
export function createPublicSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    throw new Error("Supabase URL/key não configurados.");
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
