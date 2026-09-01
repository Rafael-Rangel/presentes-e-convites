import { createAdminClient } from "@/lib/supabase/admin";
import { createPublicSupabase } from "@/lib/supabase/public";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  contributionId: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  try {
    const input = schema.parse(await request.json());

    try {
      const admin = createAdminClient();
      const { data: row, error: fetchError } = await admin
        .from("gift_contributions")
        .select("id, gift_id, payment_method, payment_status")
        .eq("id", input.contributionId)
        .maybeSingle();

      if (fetchError) throw new Error(fetchError.message);
      if (!row || row.payment_method !== "pix") {
        return NextResponse.json(
          { error: "Pagamento Pix não encontrado." },
          { status: 404 },
        );
      }

      if (row.payment_status !== "paid") {
        const { error: updateError } = await admin
          .from("gift_contributions")
          .update({
            payment_status: "paid",
            paid_at: new Date().toISOString(),
          })
          .eq("id", row.id)
          .eq("payment_method", "pix");

        if (updateError) throw new Error(updateError.message);

        const { error: refreshError } = await admin.rpc(
          "refresh_gift_completion",
          { p_gift_id: row.gift_id },
        );
        if (refreshError) throw new Error(refreshError.message);
      }

      return NextResponse.json({ ok: true, status: "paid" });
    } catch {
      const supabase = createPublicSupabase();
      const { error } = await supabase.rpc("mark_pix_paid_by_guest", {
        p_contribution_id: input.contributionId,
      });
      if (error) throw new Error(error.message);
      return NextResponse.json({ ok: true, status: "paid" });
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Não foi possível confirmar.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
