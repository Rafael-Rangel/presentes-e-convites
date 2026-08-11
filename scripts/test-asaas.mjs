import "dotenv/config";
import { config } from "dotenv";
import { resolve } from "node:path";

config({ path: resolve(process.cwd(), ".env.local") });

const rawKey = process.env.ASAAS_API_KEY || "";
const API_URL = (process.env.ASAAS_API_URL || "https://api.asaas.com").replace(/\/$/, "");
const API_KEY = rawKey.replace(/^['"]|['"]$/g, "");

console.log("URL:", API_URL);
console.log("Key length:", API_KEY.length);
console.log("Key starts:", API_KEY.slice(0, 12));
console.log("Key has quotes?", rawKey.startsWith("'") || rawKey.startsWith('"'));

async function asaas(path, init = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      access_token: API_KEY,
      ...(init.headers || {}),
    },
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }
  return { status: res.status, ok: res.ok, data };
}

async function main() {
  console.log("\n=== 1) Auth / account ===");
  const me = await asaas("/v3/myAccount");
  console.log(me.status, JSON.stringify(me.data, null, 2).slice(0, 800));

  console.log("\n=== 2) Create customer ===");
  const customer = await asaas("/v3/customers", {
    method: "POST",
    body: JSON.stringify({
      name: "Teste Convidado Casamento",
      email: `teste.casamento.${Date.now()}@example.com`,
      cpfCnpj: "24971563792",
      mobilePhone: "11999990000",
      notificationDisabled: true,
    }),
  });
  console.log(customer.status, JSON.stringify(customer.data, null, 2).slice(0, 800));
  if (!customer.ok) process.exit(1);

  const customerId = customer.data.id;

  console.log("\n=== 3) PIX payment ===");
  const pix = await asaas("/v3/payments", {
    method: "POST",
    body: JSON.stringify({
      customer: customerId,
      billingType: "PIX",
      value: 5.0,
      dueDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
      description: "Teste Pix presente casamento",
      externalReference: `pix-test-${Date.now()}`,
    }),
  });
  console.log(pix.status, JSON.stringify(pix.data, null, 2).slice(0, 1200));

  if (pix.ok && pix.data.id) {
    const qr = await asaas(`/v3/payments/${pix.data.id}/pixQrCode`);
    console.log("\n=== PIX QR ===");
    console.log(qr.status, {
      hasImage: Boolean(qr.data?.encodedImage),
      payloadLen: qr.data?.payload?.length || 0,
      errors: qr.data?.errors,
    });
  }

  console.log("\n=== 4) CREDIT_CARD payment (Asaas sandbox-like test card on prod may fail) ===");
  const credit = await asaas("/v3/payments", {
    method: "POST",
    body: JSON.stringify({
      customer: customerId,
      billingType: "CREDIT_CARD",
      value: 5.0,
      dueDate: new Date().toISOString().slice(0, 10),
      description: "Teste credito presente casamento",
      externalReference: `credit-test-${Date.now()}`,
      creditCard: {
        holderName: "TESTE CASAMENTO",
        number: "5162306219378829",
        expiryMonth: "05",
        expiryYear: "2031",
        ccv: "318",
      },
      creditCardHolderInfo: {
        name: "Teste Casamento",
        email: "teste.cartao@example.com",
        cpfCnpj: "24971563792",
        postalCode: "01310100",
        addressNumber: "100",
        phone: "11999990000",
      },
      remoteIp: "127.0.0.1",
    }),
  });
  console.log(credit.status, JSON.stringify(credit.data, null, 2).slice(0, 1200));

  console.log("\n=== 5) DEBIT_CARD billingType probe ===");
  const debit = await asaas("/v3/payments", {
    method: "POST",
    body: JSON.stringify({
      customer: customerId,
      billingType: "DEBIT_CARD",
      value: 5.0,
      dueDate: new Date().toISOString().slice(0, 10),
      description: "Teste debito presente casamento",
      externalReference: `debit-test-${Date.now()}`,
      creditCard: {
        holderName: "TESTE CASAMENTO",
        number: "5162306219378829",
        expiryMonth: "05",
        expiryYear: "2031",
        ccv: "318",
      },
      creditCardHolderInfo: {
        name: "Teste Casamento",
        email: "teste.cartao@example.com",
        cpfCnpj: "24971563792",
        postalCode: "01310100",
        addressNumber: "100",
        phone: "11999990000",
      },
      remoteIp: "127.0.0.1",
    }),
  });
  console.log(debit.status, JSON.stringify(debit.data, null, 2).slice(0, 1200));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
