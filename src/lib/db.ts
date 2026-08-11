import { Pool } from "pg";

const globalForPg = globalThis as unknown as { weddingPool?: Pool };

export function getPool() {
  if (!globalForPg.weddingPool) {
    globalForPg.weddingPool = new Pool({
      host: process.env.SUPABASE_DB_HOST || "db.kscvfebeczbmrvachiym.supabase.co",
      port: Number(process.env.SUPABASE_DB_PORT || 5432),
      database: process.env.SUPABASE_DB_NAME || "postgres",
      user: process.env.SUPABASE_DB_USER || "postgres",
      password: process.env.SUPABASE_DB_PASSWORD,
      ssl: { rejectUnauthorized: false },
      max: 5,
    });
  }
  return globalForPg.weddingPool;
}

export async function dbQuery<T = Record<string, unknown>>(
  text: string,
  params: unknown[] = [],
) {
  const result = await getPool().query(text, params);
  return result.rows as T[];
}
