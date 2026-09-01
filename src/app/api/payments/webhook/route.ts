import { createPublicSupabase } from "@/lib/supabase/public";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const token =
    request.headers.get("asaas-access-token") ||
    request.nextUrl.searchParams.get("token");

  if (!token || token !== process.env.ASAAS_WEBHOOK_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = await request.json();
    const event = String(payload?.event || "");
    const payment = payload?.payment;
    const paymentId = payment?.id as string | undefined;
    const externalReference = payment?.externalReference as string | undefined;

    if (!paymentId) {
      return NextResponse.json({ ok: true });
    }

    const supabase = createPublicSupabase();
    const { error } = await supabase.rpc("mark_contribution_from_asaas", {
      p_asaas_payment_id: paymentId,
      p_external_reference: externalReference || "",
      p_event: event,
      p_status: String(payment?.status || ""),
    });

    if (error) throw new Error(error.message);

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
