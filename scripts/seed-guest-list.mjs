import pg from "pg";
import { config } from "dotenv";
import { resolve } from "node:path";
import slugify from "slugify";

config({ path: resolve(process.cwd(), ".env.local"), quiet: true });

const WEDDING_ID = "11111111-1111-1111-1111-111111111111";
const SEAT_PRICE = 175;
const VENUE_COURTESY = 24;

/** @type {Record<string, { name: string; pays?: boolean }[]>} */
const LISTS = {
  "Convidados Adrielly": [
    "Ecy",
    "Celso",
    "Andressa",
    "Tia Cláudia",
    "Josimar",
    "Tia Cristiane",
    "Israel",
    "Thays",
    "Sulamita",
    "Tailana",
    "Tia Catia",
    "Juninho",
    "Rebeca",
    "Mariana",
    "Maicon",
    "Bernardo",
    "Talita",
    "Thiago",
    "Thaina",
    "Matheus",
    "Tatiane",
    "Guilherme",
    "Enzo",
    "Tailane",
    "Juninho",
    "Marlom",
    "Miriam",
    "Miguel",
    "Vitor",
    "Cris",
    "André",
    "Marizete",
    "Maria Luiza",
    "Leonardo",
    "Tia Flávia",
    "Tio Eraldo",
    "Tia Lígia",
    "Guilia",
    "Lais",
    "Millena",
    "Raquel",
    "Thaina",
    "Noivo",
    "Dominique",
    "Mãe do Yago",
    "Mãe Ester",
    "Pai da Ester",
    "Monique",
    "Adriano",
    "Sr. João",
    "Dona Daniela",
    "Alicia",
    "Ana Alicia",
    "Fran",
    "Bessa",
  ].map((name) => ({ name })),

  Crianças: [
    { name: "Thiago" },
    { name: "Artur" },
    { name: "Filho 2 de Thais", pays: false },
    { name: "Filho 1 Sulamita", pays: false },
    { name: "Bernardo" },
    { name: "João Pedro" },
    { name: "Maria Clara", pays: false },
    { name: "Elena", pays: false },
    { name: "João Márcio" },
    { name: "Levi" },
    { name: "Luna", pays: false },
    { name: "Romeu" },
  ],

  Pais: [
    "Viviane",
    "Edmar",
    "Giovana",
    "Isabela",
    "Manu",
    "Tia Catia",
    "Stefani",
    "Pai da Estefani",
    "Mãe da Estefani",
    "Alexandre",
    "Esposa de Alexandre",
    "Filho de Alexandre",
    "Ayessa",
    "Fabiano",
    "Filha da Ayessa",
    "Leonardo",
    "Esposa",
    "Filha de Leonardo",
    "Paulo",
    "Sonia",
    "Djalma",
    "Esposa Djalma",
    "Daniele",
    "Mãe de Daniele",
  ].map((name) => ({ name, pays: false })),

  "Crianças de cerimônia": [
    { name: "Alana" },
    { name: "Alice", pays: false },
    { name: "Julia", pays: false },
    { name: "Débora" },
    { name: "Ravi", pays: false },
    { name: "Isadora", pays: false },
    { name: "Nathan", pays: false },
  ],

  Padrinhos: [
    "Danielle",
    "Matheus",
    "Cassia",
    "Marcelo",
    "Carla",
    "Lucas",
    "Anna Paula",
    "Luan",
    "Reni",
    "Nilton",
    "Pastor Ivo",
    "Hozana",
    "Matheus",
    "Andreza",
    "Roberto",
    "Thays",
    "Gabriel",
    "Ana Luiza",
    "Elis",
    "Alex",
  ].map((name) => ({ name })),

  Demoiselles: [
    "Luana",
    "Thaynara",
    "Ester",
    "Gabi",
    "Larissa",
    "Giovanna",
    "Aline",
    "Carla",
    "Alessandra",
    "Márcia",
  ].map((name) => ({ name })),

  "Amigos dos noivos": [
    "Yan",
    "Yago",
    "Marcio",
    "Ataliba",
    "Nathan",
  ].map((name) => ({ name })),

  "Convidados Rafael": [
    "Gustavo",
    "Tati",
    "Willian",
    "Guilherme",
    "Gaspar",
    "Davidson",
    "Mãe",
    "Jéssica",
    "Rayssa",
    "Leandro",
    "Esposa Assembleana",
    "Giovanna",
    "Clarinha",
    "Matheus",
    "Luiza Vídeo",
    "Duda Rosa",
    "João Guilherme",
    "Mãe",
    "Seu Roberto",
    "Tia Isa",
    "Wilian",
    "Dalvanni",
    "Joaquim",
    "Fernanda",
    "Gracinda",
    "Namorado da vó",
    "Edson",
    "Vera",
    "Talita",
    "Tio Anderson",
    "Mulher do Anderson",
    "João",
    "Lucas",
    "David",
    "Tio Mazio",
    "Jennifer",
    "Gustavo Albuquerque",
    "Pastor Carlos",
    "Pastora Graciane",
    "Paulo",
    "Mônica",
    "Cabral",
    "Daniel",
    "Namorada",
    "Pastor Rodrigão",
    "Filha do Rodrigão",
    "Pr. Esposa",
  ].map((name) => ({ name })),

  Banda: ["Danizinha", "Jean", "Violino"].map((name) => ({ name })),
};

function makeSlug(name) {
  return slugify(name, { lower: true, strict: true, locale: "pt" }) || "convidado";
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

await client.query(`
  alter table public.guests
    add column if not exists category text,
    add column if not exists seat_price numeric(12,2) not null default 175,
    add column if not exists is_paying boolean not null default true
`);

await client.query("begin");
try {
  await client.query(
    `update public.gift_contributions set guest_id = null where wedding_id = $1`,
    [WEDDING_ID],
  );
  await client.query(
    `delete from public.invitation_accesses
     where guest_id in (select id from public.guests where wedding_id = $1)`,
    [WEDDING_ID],
  );
  await client.query(`delete from public.guests where wedding_id = $1`, [WEDDING_ID]);

  const usedSlugs = new Set();
  const rows = [];

  for (const [category, people] of Object.entries(LISTS)) {
    for (const person of people) {
      let base = makeSlug(person.name);
      let slug = base;
      let i = 2;
      while (usedSlugs.has(slug)) {
        slug = `${base}-${i}`;
        i += 1;
      }
      usedSlugs.add(slug);
      rows.push({
        category,
        name: person.name,
        slug,
        is_paying: person.pays !== false,
      });
    }
  }

  for (const row of rows) {
    await client.query(
      `insert into public.guests
        (wedding_id, name, slug, category, seat_price, is_paying, notes)
       values ($1, $2, $3, $4, $5, $6, $7)`,
      [
        WEDDING_ID,
        row.name,
        row.slug,
        row.category,
        SEAT_PRICE,
        row.is_paying,
        row.is_paying ? null : "NÃO PAGA",
      ],
    );
  }

  await client.query("commit");

  const counts = Object.fromEntries(
    Object.entries(LISTS).map(([k, v]) => [k, v.length]),
  );
  const total = rows.length;
  const nonPaying = rows.filter((r) => !r.is_paying).length;
  const paying = Math.max(0, total - nonPaying - VENUE_COURTESY);
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/$/, "");

  console.log("Categorias:", counts);
  console.log("TOTAL GERAL:", total);
  console.log("NÃO PAGANTES DA LISTA:", nonPaying);
  console.log("CORTESIA SALÃO:", VENUE_COURTESY);
  console.log("PAGANTES (após cortesia):", paying);
  console.log("VALOR PAGANTES:", paying * SEAT_PRICE);
  console.log(
    "Conferência total:",
    total === 183 ? "OK 183" : `ATENÇÃO total=${total} (esperado 183)`,
  );
  if (appUrl) {
    console.log("Exemplo de link:", `${appUrl}/casamento/${rows[0].slug}`);
  }
} catch (error) {
  await client.query("rollback");
  throw error;
} finally {
  await client.end();
}
