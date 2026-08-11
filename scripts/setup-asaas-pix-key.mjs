import { config } from "dotenv";
import { resolve } from "node:path";

config({ path: resolve(process.cwd(), ".env.local"), quiet: true });

const API_URL = (process.env.ASAAS_API_URL || "https://api.asaas.com").replace(/\/$/, "");
const API_KEY = (process.env.ASAAS_API_KEY || "").replace(/^['"]|['"]$/g, "");

async function asaas(path, init = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      access_token: API_KEY,
      ...(init.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

console.log("=== List Pix keys ===");
const list = await asaas("/v3/pix/addressKeys");
console.log(list.status, JSON.stringify(list.data, null, 2).slice(0, 1500));

console.log("\n=== Create EVP Pix key ===");
const created = await asaas("/v3/pix/addressKeys", {
  method: "POST",
  body: JSON.stringify({ type: "EVP" }),
});
console.log(created.status, JSON.stringify(created.data, null, 2).slice(0, 1500));
