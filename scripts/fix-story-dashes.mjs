import pg from "pg";
import { config } from "dotenv";
import { resolve } from "node:path";

config({ path: resolve(process.cwd(), ".env.local"), quiet: true });

const story =
  'Do pedido ao "sim", cada instante conosco ganhou mais luz. Rafael e Adrielly celebram o amor que cresceu em encontros, risos e planos, e agora convidam voce a viver esse capitulo ao lado deles.';

const client = new pg.Client({
  host: process.env.SUPABASE_DB_HOST,
  port: Number(process.env.SUPABASE_DB_PORT || 5432),
  database: process.env.SUPABASE_DB_NAME || "postgres",
  user: process.env.SUPABASE_DB_USER || "postgres",
  password: process.env.SUPABASE_DB_PASSWORD,
  ssl: { rejectUnauthorized: false },
});

await client.connect();

const { rows } = await client.query(
  `select settings->>'story' as story from public.weddings where id = $1`,
  ["11111111-1111-1111-1111-111111111111"],
);

const cleaned = String(rows[0]?.story || story)
  .replaceAll("—", ",")
  .replaceAll("–", ",")
  .replace(/,\s*,/g, ",")
  .replace(/\s+,/g, ",")
  .replace(/planos,\s*e agora/g, "planos, e agora");

// Prefer polished version without dashes
const finalStory =
  'Do pedido ao "sim", cada instante conosco ganhou mais luz. Rafael e Adrielly celebram o amor que cresceu em encontros, risos e planos, e agora convidam você a viver esse capítulo ao lado deles.';

await client.query(
  `update public.weddings
   set settings = jsonb_set(settings, '{story}', to_jsonb($1::text), true)
   where id = $2`,
  [finalStory, "11111111-1111-1111-1111-111111111111"],
);

console.log("story updated");
await client.end();
