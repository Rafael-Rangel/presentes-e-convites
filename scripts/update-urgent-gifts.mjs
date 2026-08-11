import pg from "pg";

const client = new pg.Client({
  host: "db.kscvfebeczbmrvachiym.supabase.co",
  port: 5432,
  database: "postgres",
  user: "postgres",
  password: process.env.SUPABASE_DB_PASSWORD,
  ssl: { rejectUnauthorized: false },
});

const urgent = [
  "Geladeira",
  "Fogão",
  "Máquina de lavar",
  "Cama",
  "Sofá",
  "Mesa",
];

await client.connect();
await client.query(`update public.gifts set is_priority = false`);
await client.query(
  `update public.gifts set is_priority = true where name = any($1::text[])`,
  [urgent],
);

// Se ainda não existir "Cadeiras", cria um item urgente simbólico
const { rows } = await client.query(
  `select id from public.gifts where name = 'Cadeiras' limit 1`,
);
if (!rows[0]) {
  await client.query(
    `insert into public.gifts
      (wedding_id, name, description, price, category, quantity, status, is_priority, image_url)
     values
      ('11111111-1111-1111-1111-111111111111',
       'Cadeiras',
       'Conjunto de cadeiras para a sala de jantar',
       800,
       'Casa',
       1,
       'active',
       true,
       'https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=800&q=80')`,
  );
} else {
  await client.query(
    `update public.gifts set is_priority = true where name = 'Cadeiras'`,
  );
}

const list = await client.query(
  `select name, is_priority, price from public.gifts order by is_priority desc, price desc`,
);
console.log(list.rows);
await client.end();
