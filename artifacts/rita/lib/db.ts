import { Pool } from "pg";

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    const connStr = process.env.SUPABASE_DATABASE_URL ?? "";
    const needsSsl = connStr.includes("sslmode=require") || connStr.includes("supabase.co");
    pool = new Pool({
      connectionString: connStr,
      ssl: needsSsl ? { rejectUnauthorized: false } : false,
    });
  }
  return pool;
}

export async function query<T = Record<string, unknown>>(
  sql: string,
  params?: unknown[]
): Promise<T[]> {
  const client = getPool();
  const result = await client.query(sql, params);
  return result.rows as T[];
}

export async function queryOne<T = Record<string, unknown>>(
  sql: string,
  params?: unknown[]
): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows[0] ?? null;
}
