import { createAsaasPayment } from "@/lib/asaas";
import { dbQuery } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  giftId: z.string().uuid(),
  amount: z.number().positive(),
  payerName: z.string().min(2),
  payerEmail: z.string().email().optional().nullable(),
  payerPhone: z.string().optional().nullable(),
  payerCpfCnpj: z.string().min(11, "CPF/CNPJ obrigatório"),
  guestSlug: z.string().optional().nullable(),
  paymentMethod: z.enum(["pix", "credit", "debit"]),
  remoteIp: z.string().optional().nullable(),
  creditCard: z
    .object({
      holderName: z.string().min(2),
      number: z.string().min(13),
      expiryMonth: z.string().min(1),
      expiryYear: z.string().min(2),
      ccv: z.string().min(3),
    })
    .optional(),
  creditCardHolderInfo: z
    .object({
      name: z.string().min(2),
      email: z.string().email(),
      cpfCnpj: z.string().min(11),
      postalCode: z.string().min(8),
      addressNumber: z.string().min(1),
      phone: z.string().min(10),
    })
    .optional(),
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

export async function POST(request: NextRequest) {
  let contributionId: string | null = null;

  try {
    const body = await request.json();
    const input = schema.parse(body);

    if (input.paymentMethod === "credit") {
      if (!input.creditCard || !input.creditCardHolderInfo) {
        return NextResponse.json(
          { error: "Preencha os dados do cartão para pagar." },
          { status: 400 },
        );
      }
      if (!input.payerEmail && !input.creditCardHolderInfo.email) {
        return NextResponse.json(
          { error: "E-mail é obrigatório para pagamento com cartão." },
          { status: 400 },
        );
      }
    }

    const gifts = await dbQuery<{
      id: string;
      wedding_id: string;
      name: string;
      price: string;
      status: string;
    }>(
      "select id, wedding_id, name, price, status from public.gifts where id = $1",
      [input.giftId],
    );

    const gift = gifts[0];
    if (!gift || gift.status === "hidden") {
      return NextResponse.json({ error: "Presente não encontrado." }, { status: 404 });
    }

    const raisedRows = await dbQuery<{ raised: string }>(
      `select coalesce(sum(amount),0)::text as raised
       from public.gift_contributions
       where gift_id = $1 and payment_status = 'paid'`,
      [gift.id],
    );
    const raised = Number(raisedRows[0]?.raised || 0);
    const remaining = Number(gift.price) - raised;
    if (input.amount > remaining + 0.009) {
      return NextResponse.json(
        { error: `Valor máximo restante: R$ ${remaining.toFixed(2)}` },
        { status: 400 },
      );
    }

    let guestId: string | null = null;
    if (input.guestSlug) {
      const guests = await dbQuery<{ id: string }>(
        "select id from public.guests where slug = $1 limit 1",
        [input.guestSlug],
      );
      guestId = guests[0]?.id || null;
    }

    // Débito não existe como billingType na Asaas — usa checkout hospedado (UNDEFINED).
    // Crédito cobra direto. Pix gera QR.
    const billingType =
      input.paymentMethod === "pix"
        ? "PIX"
        : input.paymentMethod === "credit"
          ? "CREDIT_CARD"
          : "UNDEFINED";

    const paymentMethodDb =
      input.paymentMethod === "pix"
        ? "pix"
        : input.paymentMethod === "debit"
          ? "debit"
          : "credit";

    const contributionRows = await dbQuery<{ id: string }>(
      `insert into public.gift_contributions
        (wedding_id, gift_id, guest_id, payer_name, amount, payment_method, payment_status)
       values ($1,$2,$3,$4,$5,$6,'pending')
       returning id`,
      [
        gift.wedding_id,
        gift.id,
        guestId,
        input.payerName,
        input.amount,
        paymentMethodDb,
      ],
    );

    contributionId = contributionRows[0].id;

    const asaas = await createAsaasPayment({
      customerName: input.payerName,
      customerEmail: input.payerEmail || input.creditCardHolderInfo?.email,
      customerPhone: input.payerPhone || input.creditCardHolderInfo?.phone,
      customerCpfCnpj: input.payerCpfCnpj || input.creditCardHolderInfo?.cpfCnpj,
      value: input.amount,
      billingType,
      description: `Presente: ${gift.name}`,
      externalReference: contributionId,
      remoteIp: input.remoteIp || clientIp(request),
      creditCard: input.creditCard,
      creditCardHolderInfo: input.creditCardHolderInfo
        ? {
            ...input.creditCardHolderInfo,
            email: input.creditCardHolderInfo.email || input.payerEmail || "",
            phone: input.creditCardHolderInfo.phone || input.payerPhone || "",
          }
        : undefined,
    });

    await dbQuery(
      `update public.gift_contributions
       set asaas_payment_id = $1,
           pix_qr_code = $2,
           pix_copy_paste = $3,
           invoice_url = $4,
           payment_status = case
             when $5 in ('RECEIVED','CONFIRMED') then 'paid'
             else payment_status
           end,
           paid_at = case
             when $5 in ('RECEIVED','CONFIRMED') then now()
             else paid_at
           end
       where id = $6`,
      [
        asaas.payment.id,
        asaas.pixQrCode,
        asaas.pixCopyPaste,
        asaas.invoiceUrl,
        asaas.payment.status,
        contributionId,
      ],
    );

    if (["RECEIVED", "CONFIRMED"].includes(asaas.payment.status)) {
      await dbQuery("select public.refresh_gift_completion($1)", [gift.id]);
    }

    return NextResponse.json({
      contributionId,
      paymentId: asaas.payment.id,
      status: asaas.payment.status,
      billingType,
      pixQrCode: asaas.pixQrCode,
      pixCopyPaste: asaas.pixCopyPaste,
      invoiceUrl: asaas.invoiceUrl,
      requiresRedirect: billingType === "UNDEFINED" || (!asaas.pixQrCode && !asaas.pixCopyPaste && Boolean(asaas.invoiceUrl)),
    });
  } catch (error) {
    if (contributionId) {
      try {
        await dbQuery(
          `update public.gift_contributions
           set payment_status = 'failed'
           where id = $1 and payment_status = 'pending'`,
          [contributionId],
        );
      } catch {
        // ignore cleanup errors
      }
    }

    let message =
      error instanceof Error ? error.message : "Erro ao criar pagamento";

    if (message.toLowerCase().includes("cartão") || message.toLowerCase().includes("creditcard") || message.toLowerCase().includes("nao autorizada") || message.toLowerCase().includes("não autorizada")) {
      message =
        "Cartão não autorizado pela operadora. Confira os dados ou tente outro cartão. Em produção, cartões de teste da Asaas não funcionam.";
    }

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
