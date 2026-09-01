import pg from "pg";
import { config } from "dotenv";
import { resolve } from "node:path";

config({ path: resolve(process.cwd(), ".env.local"), quiet: true });

const WEDDING_ID = "11111111-1111-1111-1111-111111111111";
const hero = "/wedding/hero-invite.webp";

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
  `select settings from public.weddings where id = $1`,
  [WEDDING_ID],
);
const settings = { ...(rows[0]?.settings || {}), hero_image: hero };
await client.query(
  `update public.weddings set settings = $1::jsonb where id = $2`,
  [JSON.stringify(settings), WEDDING_ID],
);
console.log({ hero_image: hero });
await client.end();
