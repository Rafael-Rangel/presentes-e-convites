import pkg from "@next/env";
const { loadEnvConfig } = pkg;
loadEnvConfig(process.cwd());

const b64 = process.env.ASAAS_API_KEY_B64 || "";
const key = b64 ? Buffer.from(b64, "base64").toString("utf8") : process.env.ASAAS_API_KEY || "";
console.log("b64 length", b64.length);
console.log("decoded length", key.length);
console.log("starts with", JSON.stringify(key.slice(0, 20)));
console.log("valid prefix", key.startsWith("$aact_"));
