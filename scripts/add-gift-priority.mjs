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

await client.query(`
  alter table public.gifts
  add column if not exists is_priority boolean not null default false
`);

await client.query(`update public.gifts set is_priority = false`);

await client.query(`
  update public.gifts
  set is_priority = true
  where name in ('Lua de mel', 'Geladeira', 'Sofá', 'Cama')
`);

const { rows } = await client.query(
  `select name, is_priority, price
   from public.gifts
   order by is_priority desc, name`,
);
console.log(rows);
await client.end();
