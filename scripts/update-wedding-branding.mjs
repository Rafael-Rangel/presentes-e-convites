import pg from "pg";
import { config } from "dotenv";
import { resolve } from "node:path";

config({ path: resolve(process.cwd(), ".env.local"), quiet: true });

const gallery = [
  "/wedding/IMG_7636_VSCO.JPG",
  "/wedding/IMG_7638_VSCO.JPG",
  "/wedding/IMG_7641_VSCO.JPG",
  "/wedding/IMG_7645_VSCO.JPG",
  "/wedding/IMG_7648_VSCO.JPG",
  "/wedding/IMG_7651_VSCO.JPG",
  "/wedding/IMG_7656_VSCO.JPG",
  "/wedding/IMG_7660_VSCO.JPG",
  "/wedding/IMG_7662_VSCO.JPG",
  "/wedding/IMG_7669_VSCO.JPG",
  "/wedding/IMG_7672_VSCO.JPG",
  "/wedding/IMG_7676_VSCO.JPG",
  "/wedding/IMG_7682_VSCO.JPG",
  "/wedding/IMG_7683_VSCO.JPG",
  "/wedding/IMG_7688_VSCO.JPG",
  "/wedding/8ca52091-f99d-4ec2-aca4-4a4dc6f96fdc.jpg",
];

const settings = {
  couple_names: "Rafael & Adrielly",
  hero_image: "/wedding/IMG_7646_VSCO.JPG",
  welcome_message:
    "Com o coração cheio de gratidão, queremos compartilhar com você o início da nossa história para sempre.",
  story:
    "Do pedido ao “sim”, cada instante conosco ganhou mais luz. Rafael e Adrielly celebram o amor que cresceu em encontros, risos e planos — e agora convidam você a viver esse capítulo ao lado deles.",
  ceremony_time: "16:00",
  reception_time: "18:00",
  dress_code: "Esporte fino",
  additional_info:
    "Chegue com carinho e vontade de celebrar. Sua presença é o presente mais especial.",
  gallery,
  map_url: "",
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
   set name = $1,
       location = coalesce(nullif(location, ''), 'A definir'),
       settings = $2::jsonb
   where id = '11111111-1111-1111-1111-111111111111'`,
  ["Rafael & Adrielly", JSON.stringify(settings)],
);
console.log("Wedding updated: Rafael & Adrielly");
await client.end();
