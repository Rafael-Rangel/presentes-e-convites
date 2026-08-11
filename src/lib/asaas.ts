function getAsaasApiKey() {
  const encoded = (process.env.ASAAS_API_KEY_B64 || "").trim();
  if (encoded) {
    return Buffer.from(encoded, "base64").toString("utf8").trim();
  }

  let key = (process.env.ASAAS_API_KEY || "").replace(/^['"]|['"]$/g, "").trim();
  // Next.js interpreta $$ como $ literal no .env
  if (key.startsWith("$$")) key = key.slice(1);
  return key;
}

function getAsaasApiUrl() {
  return (process.env.ASAAS_API_URL || "https://api.asaas.com").replace(/\/$/, "");
}

export type AsaasBillingType = "PIX" | "CREDIT_CARD" | "UNDEFINED";

type CreatePaymentInput = {
  customerName: string;
  customerEmail?: string | null;
  customerPhone?: string | null;
  customerCpfCnpj?: string | null;
  value: number;
  billingType: AsaasBillingType;
  description: string;
  externalReference: string;
  remoteIp?: string | null;
  creditCard?: {
    holderName: string;
    number: string;
    expiryMonth: string;
    expiryYear: string;
    ccv: string;
  };
  creditCardHolderInfo?: {
    name: string;
    email: string;
    cpfCnpj: string;
    postalCode: string;
    addressNumber: string;
    phone: string;
    mobilePhone?: string;
  };
};

function todayPlusDays(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function onlyDigits(value?: string | null) {
  return (value || "").replace(/\D/g, "");
}

async function asaasFetch(path: string, init?: RequestInit) {
  const apiKey = getAsaasApiKey();
  if (!apiKey) {
    throw new Error("ASAAS_API_KEY não configurada.");
  }

  const res = await fetch(`${getAsaasApiUrl()}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      access_token: apiKey,
      "User-Agent": "PresentesConvites/1.0",
      ...(init?.headers || {}),
    },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      data?.errors?.map((e: { description?: string }) => e.description).filter(Boolean).join(" | ") ||
      data?.message ||
      `Erro Asaas (${res.status})`;
    throw new Error(message);
  }
  return data;
}

export async function ensurePixKey() {
  const listed = await asaasFetch("/v3/pix/addressKeys?limit=10");
  const active = (listed?.data || []).find(
    (key: { status?: string }) => key.status === "ACTIVE",
  );
  if (active) return active;

  return asaasFetch("/v3/pix/addressKeys", {
    method: "POST",
    body: JSON.stringify({ type: "EVP" }),
  });
}

export async function findOrCreateCustomer(input: {
  name: string;
  email?: string | null;
  phone?: string | null;
  cpfCnpj?: string | null;
}) {
  const email = input.email?.trim() || undefined;
  const cpfCnpj = onlyDigits(input.cpfCnpj) || undefined;
  const mobilePhone = onlyDigits(input.phone) || undefined;

  if (email) {
    const existing = await asaasFetch(
      `/v3/customers?email=${encodeURIComponent(email)}`,
    );
    if (existing?.data?.[0]?.id) {
      const customer = existing.data[0];
      if ((!customer.cpfCnpj && cpfCnpj) || (!customer.mobilePhone && mobilePhone)) {
        return asaasFetch(`/v3/customers/${customer.id}`, {
          method: "PUT",
          body: JSON.stringify({
            cpfCnpj: customer.cpfCnpj || cpfCnpj,
            mobilePhone: customer.mobilePhone || mobilePhone,
          }),
        });
      }
      return customer;
    }
  }

  return asaasFetch("/v3/customers", {
    method: "POST",
    body: JSON.stringify({
      name: input.name,
      email,
      cpfCnpj,
      mobilePhone,
      notificationDisabled: true,
    }),
  });
}

export async function createAsaasPayment(input: CreatePaymentInput) {
  if (input.billingType === "PIX") {
    try {
      await ensurePixKey();
    } catch {
      // Continua: invoiceUrl ainda funciona como fallback.
    }
  }

  const customer = await findOrCreateCustomer({
    name: input.customerName,
    email: input.customerEmail,
    phone: input.customerPhone,
    cpfCnpj:
      input.customerCpfCnpj ||
      input.creditCardHolderInfo?.cpfCnpj ||
      null,
  });

  const payload: Record<string, unknown> = {
    customer: customer.id,
    billingType: input.billingType,
    value: Number(input.value.toFixed(2)),
    dueDate: todayPlusDays(input.billingType === "PIX" ? 1 : 0),
    description: input.description.slice(0, 500),
    externalReference: input.externalReference,
  };

  if (input.billingType === "CREDIT_CARD") {
    if (!input.creditCard || !input.creditCardHolderInfo) {
      throw new Error("Dados do cartão incompletos.");
    }
    if (!input.remoteIp) {
      throw new Error("IP do pagador é obrigatório para cartão.");
    }

    payload.creditCard = {
      holderName: input.creditCard.holderName,
      number: onlyDigits(input.creditCard.number),
      expiryMonth: input.creditCard.expiryMonth.padStart(2, "0"),
      expiryYear: input.creditCard.expiryYear.length === 2
        ? `20${input.creditCard.expiryYear}`
        : input.creditCard.expiryYear,
      ccv: onlyDigits(input.creditCard.ccv),
    };
    payload.creditCardHolderInfo = {
      name: input.creditCardHolderInfo.name,
      email: input.creditCardHolderInfo.email,
      cpfCnpj: onlyDigits(input.creditCardHolderInfo.cpfCnpj),
      postalCode: onlyDigits(input.creditCardHolderInfo.postalCode),
      addressNumber: input.creditCardHolderInfo.addressNumber,
      phone: onlyDigits(input.creditCardHolderInfo.phone),
      mobilePhone: onlyDigits(
        input.creditCardHolderInfo.mobilePhone ||
          input.creditCardHolderInfo.phone,
      ),
    };
    payload.remoteIp = input.remoteIp;
  }

  const payment = await asaasFetch("/v3/payments", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  let pixQrCode: string | null = null;
  let pixCopyPaste: string | null = null;

  if (input.billingType === "PIX" && payment?.id) {
    try {
      const pix = await asaasFetch(`/v3/payments/${payment.id}/pixQrCode`);
      pixQrCode = pix?.encodedImage || null;
      pixCopyPaste = pix?.payload || null;
    } catch (error) {
      // Fallback: usuário ainda pode pagar pela invoiceUrl da Asaas.
      console.error("Falha ao obter QR Pix:", error);
    }
  }

  return {
    payment,
    pixQrCode,
    pixCopyPaste,
    invoiceUrl: payment?.invoiceUrl || payment?.bankSlipUrl || null,
  };
}

export async function getAsaasPayment(paymentId: string) {
  return asaasFetch(`/v3/payments/${paymentId}`);
}
