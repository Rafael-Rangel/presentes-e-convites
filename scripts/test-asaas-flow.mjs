import { config } from "dotenv";
import { resolve } from "node:path";
import pg from "pg";

config({ path: resolve(process.cwd(), ".env.local"), quiet: true });

const API_URL = (process.env.ASAAS_API_URL || "https://api.asaas.com").replace(/\/$/, "");
const API_KEY = (process.env.ASAAS_API_KEY || "").replace(/^['"]|['"]$/g, "");

async function asaas(path, init = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      access_token: API_KEY,
      "User-Agent": "PresentesConvites/1.0",
      ...(init.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

function dueDate(days = 1) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

const client = new pg.Client({
  host: process.env.SUPABASE_DB_HOST,
  port: Number(process.env.SUPABASE_DB_PORT || 5432),
  database: process.env.SUPABASE_DB_NAME || "postgres",
  user: process.env.SUPABASE_DB_USER || "postgres",
  password: process.env.SUPABASE_DB_PASSWORD,
  ssl: { rejectUnauthorized: false },
});

await client.connect();
const { rows: gifts } = await client.query(
  `select id, name from public.gifts where status = 'active' order by created_at limit 1`,
);
const gift = gifts[0];
if (!gift) throw new Error("Nenhum presente ativo");

console.log("Gift:", gift.name, gift.id);

console.log("\n=== PIX keys ===");
const keys = await asaas("/v3/pix/addressKeys");
console.log(
  "keys:",
  (keys.data?.data || []).map((k) => ({ status: k.status, type: k.type, key: k.key })),
);

console.log("\n=== Create customer ===");
const customer = await asaas("/v3/customers", {
  method: "POST",
  body: JSON.stringify({
    name: "Teste Fluxo Presente",
    email: `fluxo.${Date.now()}@example.com`,
    cpfCnpj: "24971563792",
    mobilePhone: "11988887777",
    notificationDisabled: true,
  }),
});
console.log(customer.status, customer.data?.id || customer.data);

if (!customer.ok) {
  await client.end();
  process.exit(1);
}

console.log("\n=== PIX with dueDate ===");
const pix = await asaas("/v3/payments", {
  method: "POST",
  body: JSON.stringify({
    customer: customer.data.id,
    billingType: "PIX",
    value: 5,
    dueDate: dueDate(1),
    description: `Presente: ${gift.name}`,
    externalReference: `test-pix-${Date.now()}`,
  }),
});
console.log(pix.status, {
  id: pix.data?.id,
  status: pix.data?.status,
  invoiceUrl: pix.data?.invoiceUrl,
  errors: pix.data?.errors,
});

if (pix.ok) {
  const qr = await asaas(`/v3/payments/${pix.data.id}/pixQrCode`);
  console.log("QR:", {
    status: qr.status,
    hasImage: Boolean(qr.data?.encodedImage),
    payloadPreview: qr.data?.payload?.slice(0, 40),
    errors: qr.data?.errors,
  });
}

console.log("\n=== UNDEFINEDIFIED (débito checkout) ===");
const debit = await asaas("/v3/payments", {
  method: "POST",
  body: JSON.stringify({
    customer: customer.data.id,
    billingType: "UNDEFINED",
    value: 5,
    dueDate: dueDate(0),
    description: `Presente debito: ${gift.name}`,
    externalReference: `test-debit-${Date.now()}`,
  }),
});
console.log(debit.status, {
  id: debit.data?.id,
  status: debit.data?.status,
  invoiceUrl: debit.data?.invoiceUrl,
  errors: debit.data?.errors,
});

console.log("\n=== CREDIT_CARD payload validation (cartão de teste) ===");
const credit = await asaas("/v3/payments", {
  method: "POST",
  body: JSON.stringify({
    customer: customer.data.id,
    billingType: "CREDIT_CARD",
    value: 5,
    dueDate: dueDate(0),
    description: `Presente credito: ${gift.name}`,
    externalReference: `test-credit-${Date.now()}`,
    remoteIp: "189.0.0.1",
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
      mobilePhone: "11999990000",
    },
  }),
});
console.log(credit.status, {
  id: credit.data?.id,
  status: credit.data?.status,
  errors: credit.data?.errors,
});

await client.end();
