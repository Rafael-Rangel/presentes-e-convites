import pg from "pg";
import { config } from "dotenv";
import { resolve } from "node:path";

config({ path: resolve(process.cwd(), ".env.local"), quiet: true });

const gallery = [
  "/wedding/IMG_7636_VSCO.webp",
  "/wedding/IMG_7638_VSCO.webp",
  "/wedding/IMG_7641_VSCO.webp",
  "/wedding/IMG_7645_VSCO.webp",
  "/wedding/IMG_7646_VSCO.webp",
  "/wedding/IMG_7648_VSCO.webp",
  "/wedding/IMG_7651_VSCO.webp",
  "/wedding/IMG_7656_VSCO.webp",
  "/wedding/IMG_7660_VSCO.webp",
  "/wedding/IMG_7669_VSCO.webp",
  "/wedding/IMG_7672_VSCO.webp",
  "/wedding/IMG_7683_VSCO.webp",
];

const settings = {
  couple_names: "Rafael & Adrielly",
  hero_image: "/wedding/IMG_7646_VSCO.webp",
  welcome_message:
    "Com o coração cheio de gratidão, queremos compartilhar com você o início da nossa história para sempre.",
  story:
    "Do pedido ao “sim”, cada instante conosco ganhou mais luz. Rafael e Adrielly celebram o amor que cresceu em encontros, risos e planos, e agora convidam você a viver esse capítulo ao lado deles.",
  ceremony_time: "17:00",
  arrival_time: "16:00",
  reception_time: "",
  address:
    "Estr. do Aterrado do Rio, 105 - Guaratiba, Rio de Janeiro - RJ, 23035-290",
  map_url:
    "https://www.google.com/maps/search/?api=1&query=Casa%20de%20Festas%20Spa%C3%A7o%20Green%20Guaratiba",
  dress_code: "Esporte fino",
  additional_info:
    "Chegue com carinho e vontade de celebrar. Sua presença é o presente mais especial.",
  gallery,
};

const client = new pg.Client({
  host: process.env.SUPABASE_DB_HOST,
  port: Number(process.env.SUPABASE_DB_PORT || 5432),
  database: process.env.SUPABASE_DB_NAME || "postgres",
  user: process.env.SUPABASE_DB_USER || "postgres",
  password: process.env.SUPABASE_DB_PASSWORD,
  ssl: { rejectUnauthorized: false },
});

await client.connect();
await client.query(
  `update public.weddings
   set name = $1, settings = $2::jsonb
   where id = '11111111-1111-1111-1111-111111111111'`,
  ["Rafael & Adrielly", JSON.stringify(settings)],
);
console.log("Updated to WebP paths");
await client.end();
