import { dbQuery } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

const PAID_EVENTS = new Set([
  "PAYMENT_RECEIVED",
  "PAYMENT_CONFIRMED",
  "PAYMENT_RECEIVED_IN_CASH",
]);

const FAILED_EVENTS = new Set([
  "PAYMENT_OVERDUE",
  "PAYMENT_DELETED",
  "PAYMENT_REFUNDED",
  "PAYMENT_REFUND_IN_PROGRESS",
]);

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

    if (PAID_EVENTS.has(event) || ["RECEIVED", "CONFIRMED"].includes(payment?.status)) {
      const rows = await dbQuery<{ id: string; gift_id: string }>(
        `update public.gift_contributions
         set payment_status = 'paid',
             paid_at = coalesce(paid_at, now())
         where asaas_payment_id = $1
            or id::text = $2
         returning id, gift_id`,
        [paymentId, externalReference || ""],
      );

      if (rows[0]?.gift_id) {
        await dbQuery("select public.refresh_gift_completion($1)", [rows[0].gift_id]);
      }
    } else if (FAILED_EVENTS.has(event)) {
      await dbQuery(
        `update public.gift_contributions
         set payment_status = case
           when payment_status = 'paid' then payment_status
           else 'failed'
         end
         where asaas_payment_id = $1`,
        [paymentId],
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
