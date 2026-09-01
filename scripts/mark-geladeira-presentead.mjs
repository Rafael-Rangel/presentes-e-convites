import pg from "pg";

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
  `update public.gifts
   set status = 'completed', updated_at = now()
   where name ilike 'Geladeira'
   returning id, name, status, is_priority`,
);

if (!rows.length) {
  console.error("Presente Geladeira não encontrado.");
  process.exitCode = 1;
} else {
  console.log("Geladeira marcada como presenteado:", rows[0]);
}

await client.end();
