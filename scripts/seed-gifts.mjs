import pg from "pg";

const weddingId = "11111111-1111-1111-1111-111111111111";

const gifts = [
  ["Geladeira", "Para a cozinha do novo lar", 3500, "Casa", "https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?auto=format&fit=crop&w=800&q=80"],
  ["Fogão", "Fogão completo para o dia a dia", 1800, "Casa", "https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=800&q=80"],
  ["Máquina de lavar", "Praticidade na rotina", 2500, "Casa", "https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?auto=format&fit=crop&w=800&q=80"],
  ["Sofá", "Conforto para a sala", 2000, "Casa", "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80"],
  ["Cama", "Noites tranquilas", 1500, "Casa", "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=800&q=80"],
  ["Guarda-roupa", "Organização do quarto", 2200, "Casa", "https://images.unsplash.com/photo-1558997519-83ea9252edf8?auto=format&fit=crop&w=800&q=80"],
  ["Mesa", "Para refeições em família", 1200, "Casa", "https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=800&q=80"],
  ["TV", "Momentos de lazer", 2800, "Casa", "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=800&q=80"],
  ["Micro-ondas", "Agilidade na cozinha", 700, "Casa", "https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?auto=format&fit=crop&w=800&q=80"],
  ["Jogo de panelas", "Cozinha completa", 450, "Casa", "https://images.unsplash.com/photo-1584990347449-cea5c0f55f0c?auto=format&fit=crop&w=800&q=80"],
  ["Lua de mel", "Contribuição para a viagem dos sonhos", 5000, "Experiências", "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=800&q=80"],
  ["Decoração", "Detalhes que tornam a casa especial", 900, "Casa", "https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&w=800&q=80"],
];

const client = new pg.Client({
  host: "db.kscvfebeczbmrvachiym.supabase.co",
  port: 5432,
  database: "postgres",
  user: "postgres",
  password: process.env.SUPABASE_DB_PASSWORD,
  ssl: { rejectUnauthorized: false },
});

await client.connect();

const { rows } = await client.query(
  "select count(*)::int as count from public.gifts where wedding_id = $1",
  [weddingId],
);

if (rows[0].count === 0) {
  for (const [name, description, price, category, image_url] of gifts) {
    await client.query(
      `insert into public.gifts (wedding_id, name, description, price, category, image_url, status)
       values ($1,$2,$3,$4,$5,$6,'active')`,
      [weddingId, name, description, price, category, image_url],
    );
  }
  console.log(`Seeded ${gifts.length} gifts`);
} else {
  console.log("Gifts already exist, skipping");
}

// Ensure realtime publication
for (const table of ["guests", "gifts", "gift_contributions"]) {
  try {
    await client.query(
      `alter publication supabase_realtime add table public.${table}`,
    );
    console.log(`Realtime enabled for ${table}`);
  } catch (error) {
    console.log(`Realtime ${table}: ${error.message}`);
  }
}

await client.end();
