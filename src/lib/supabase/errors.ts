import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

type QueryError = {
  code?: string;
  message?: string;
} | null;

export async function handleSupabaseError(
  error: QueryError,
  options?: { admin?: boolean },
) {
  if (!error) return;

  if (error.code === "PGRST303") {
    const supabase = await createClient();
    await supabase.auth.signOut();
    if (options?.admin) {
      redirect("/admin/login?erro=relogio");
    }
    throw new Error(
      "Sessão inválida. Sincronize a data/hora do Windows e tente de novo.",
    );
  }

  throw new Error(error.message || "Erro ao carregar dados.");
}
