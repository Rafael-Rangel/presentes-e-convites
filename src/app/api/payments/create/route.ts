import { cardChargeAmount } from "@/lib/asaas-fees";
import { createAsaasPayment } from "@/lib/asaas";
import { buildPixPayload, pixQrImageUrl } from "@/lib/nubank-pix";
import { createPublicSupabase } from "@/lib/supabase/public";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  giftId: z.string().uuid(),
  amount: z.number().positive(),
  payerName: z.string().min(2),
  payerPhone: z.string().min(10, "Telefone obrigatório"),
  payerCpfCnpj: z.string().min(11, "CPF/CNPJ obrigatório"),
  guestSlug: z.string().optional().nullable(),
  paymentMethod: z.enum(["pix", "credit", "debit"]),
  remoteIp: z.string().optional().nullable(),
});

function clientIp(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim();
  return (
    request.headers.get("x-real-ip") ||
    request.headers.get("cf-connecting-ip") ||
    "127.0.0.1"
  );
}

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

export async function POST(request: NextRequest) {
  let contributionId: string | null = null;
  const supabase = createPublicSupabase();

  try {
    const body = await request.json();
    const input = schema.parse(body);
    const phone = onlyDigits(input.payerPhone);
    const cpf = onlyDigits(input.payerCpfCnpj);

    if (phone.length < 10) {
      return NextResponse.json(
        { error: "Informe um telefone válido com DDD." },
        { status: 400 },
      );
    }
    if (cpf.length < 11) {
      return NextResponse.json(
        { error: "Informe um CPF válido." },
        { status: 400 },
      );
    }

    const { data: gift, error: giftError } = await supabase
      .from("gifts")
      .select("id, wedding_id, name, price, status")
      .eq("id", input.giftId)
      .maybeSingle();

    if (giftError) throw new Error(giftError.message);
    if (!gift || gift.status === "hidden") {
      return NextResponse.json({ error: "Presente não encontrado." }, { status: 404 });
    }

    const { data: paidRows, error: paidError } = await supabase
      .from("gift_contributions")
      .select("amount")
      .eq("gift_id", gift.id)
      .eq("payment_status", "paid");

    if (paidError) throw new Error(paidError.message);

    const raised = (paidRows || []).reduce(
      (sum, row) => sum + Number(row.amount || 0),
      0,
    );
    const remaining = Number(gift.price) - raised;
    if (input.amount < 5) {
      return NextResponse.json(
        { error: "O valor mínimo é R$ 5,00." },
        { status: 400 },
      );
    }
    if (input.amount > remaining + 0.009) {
      return NextResponse.json(
        { error: `Valor máximo restante: R$ ${remaining.toFixed(2)}` },
        { status: 400 },
      );
    }

    let guestId: string | null = null;
    if (input.guestSlug) {
      const { data: guest } = await supabase
        .from("guests")
        .select("id")
        .eq("slug", input.guestSlug)
        .maybeSingle();
      guestId = guest?.id || null;
    }

    const paymentMethodDb =
      input.paymentMethod === "pix"
        ? "pix"
        : input.paymentMethod === "debit"
          ? "debit"
          : "credit";

    const { data: createdId, error: createError } = await supabase.rpc(
      "create_pending_contribution",
      {
        p_wedding_id: gift.wedding_id,
        p_gift_id: gift.id,
        p_guest_id: guestId,
        p_payer_name: input.payerName,
        p_amount: input.amount,
        p_payment_method: paymentMethodDb,
        p_payer_phone: phone,
        p_payer_cpf: cpf,
      },
    );

    if (createError) throw new Error(createError.message);
    contributionId = createdId as string;

    if (input.paymentMethod === "pix") {
      const pixCopyPaste = buildPixPayload({
        amount: input.amount,
        txid: contributionId.replace(/-/g, "").slice(0, 25),
        description: gift.name,
      });
      const pixQrCode = pixQrImageUrl(pixCopyPaste);

      const { error: finalizeError } = await supabase.rpc(
        "finalize_contribution_payment",
        {
          p_contribution_id: contributionId,
          p_asaas_payment_id: `nubank-${contributionId.slice(0, 8)}`,
          p_pix_qr_code: pixQrCode,
          p_pix_copy_paste: pixCopyPaste,
          p_invoice_url: "",
          p_asaas_status: "PENDING",
        },
      );

      if (finalizeError) throw new Error(finalizeError.message);

      return NextResponse.json({
        contributionId,
        status: "PENDING",
        billingType: "PIX",
        pixQrCode,
        pixCopyPaste,
        invoiceUrl: null,
        requiresRedirect: false,
      });
    }

    const charged = cardChargeAmount(input.amount, "credit");
    const asaasEmail = `presente.${cpf}@asaas.guest`;

    const asaas = await createAsaasPayment({
      customerName: input.payerName,
      customerEmail: asaasEmail,
      customerPhone: phone,
      customerCpfCnpj: cpf,
      value: charged,
      billingType: "UNDEFINED",
      description: `Presente: ${gift.name}`,
      externalReference: contributionId,
      remoteIp: input.remoteIp || clientIp(request),
    });

    const { error: finalizeError } = await supabase.rpc(
      "finalize_contribution_payment",
      {
        p_contribution_id: contributionId,
        p_asaas_payment_id: asaas.payment.id,
        p_pix_qr_code: asaas.pixQrCode,
        p_pix_copy_paste: asaas.pixCopyPaste,
        p_invoice_url: asaas.invoiceUrl,
        p_asaas_status: asaas.payment.status,
      },
    );

    if (finalizeError) throw new Error(finalizeError.message);

    return NextResponse.json({
      contributionId,
      paymentId: asaas.payment.id,
      status: asaas.payment.status,
      billingType: "UNDEFINED",
      pixQrCode: asaas.pixQrCode,
      pixCopyPaste: asaas.pixCopyPaste,
      invoiceUrl: asaas.invoiceUrl,
      charged,
      requiresRedirect: Boolean(asaas.invoiceUrl),
    });
  } catch (error) {
    if (contributionId) {
      try {
        await supabase.rpc("fail_pending_contribution", {
          p_contribution_id: contributionId,
        });
      } catch {
        // ignore cleanup errors
      }
    }

    const message =
      error instanceof Error ? error.message : "Erro ao criar pagamento";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
