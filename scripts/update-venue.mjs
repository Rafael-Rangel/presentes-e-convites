import pg from "pg";
import { config } from "dotenv";
import { resolve } from "node:path";

config({ path: resolve(process.cwd(), ".env.local"), quiet: true });

const WEDDING_ID = "11111111-1111-1111-1111-111111111111";
const location = "Casa de Festas Spaço Green";
const address =
  "Estr. do Aterrado do Rio, 105 - Guaratiba, Rio de Janeiro - RJ, 23035-290";
const mapUrl =
  "https://www.google.com/maps/search/?api=1&query=" +
  encodeURIComponent(
    "Casa de Festas Spaço Green Estr. do Aterrado do Rio, 105 Guaratiba Rio de Janeiro",
  );

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

const settings = {
  ...(rows[0]?.settings || {}),
  ceremony_time: "17:00",
  arrival_time: "16:00",
  reception_time: "",
  address,
  map_url: mapUrl,
};

await client.query(
  `update public.weddings
   set location = $1,
       settings = $2::jsonb
   where id = $3`,
  [location, JSON.stringify(settings), WEDDING_ID],
);

console.log({
  location,
  address,
  ceremony_time: settings.ceremony_time,
  arrival_time: settings.arrival_time,
  map_url: mapUrl,
});

await client.end();
