import pg from "pg";

const client = new pg.Client({
  host: "db.kscvfebeczbmrvachiym.supabase.co",
  port: 5432,
  database: "postgres",
  user: "postgres",
  password: process.env.SUPABASE_DB_PASSWORD,
  ssl: { rejectUnauthorized: false },
});

await client.connect();
await client.query(
  `insert into public.guests (wedding_id, name, slug, phone)
   values ('11111111-1111-1111-1111-111111111111', 'João da Silva', 'joao-da-silva', '11999990000')
   on conflict do nothing`,
);
const { rows } = await client.query(
  "select name, slug from public.guests order by created_at desc limit 5",
);
console.log(rows);
await client.end();
