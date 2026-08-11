import fs from "node:fs";
import path from "node:path";
import pg from "pg";

const password = process.env.SUPABASE_DB_PASSWORD;
if (!password) throw new Error('SUPABASE_DB_PASSWORD is required');
const hosts = [
  {
    label: "direct",
    config: {
      host: "db.kscvfebeczbmrvachiym.supabase.co",
      port: 5432,
      database: "postgres",
      user: "postgres",
      password,
      ssl: { rejectUnauthorized: false },
    },
  },
  {
    label: "pooler-session",
    config: {
      host: "aws-0-sa-east-1.pooler.supabase.com",
      port: 5432,
      database: "postgres",
      user: "postgres.kscvfebeczbmrvachiym",
      password,
      ssl: { rejectUnauthorized: false },
    },
  },
  {
    label: "pooler-transaction",
    config: {
      host: "aws-0-sa-east-1.pooler.supabase.com",
      port: 6543,
      database: "postgres",
      user: "postgres.kscvfebeczbmrvachiym",
      password,
      ssl: { rejectUnauthorized: false },
    },
  },
];

const sqlPath = path.join(process.cwd(), "supabase/migrations/001_initial.sql");
const sql = fs.readFileSync(sqlPath, "utf8");

let lastError;
for (const target of hosts) {
  const client = new pg.Client(target.config);
  try {
    console.log(`Trying ${target.label}...`);
    await client.connect();
    await client.query(sql);
    console.log(`Migration applied via ${target.label}`);
    await client.end();
    process.exit(0);
  } catch (error) {
    lastError = error;
    console.error(`${target.label} failed:`, error.message);
    try {
      await client.end();
    } catch {
      // ignore
    }
  }
}

console.error("All connection attempts failed.");
if (lastError) console.error(lastError);
process.exit(1);
