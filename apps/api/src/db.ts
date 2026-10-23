import { Pool } from "pg";
import { Kysely, PostgresDialect } from "kysely";

function poolConfig() {
  const raw = process.env.DATABASE_URL ?? "";
  try {
    const u = new URL(raw);
    return {
      user: decodeURIComponent(u.username),
      password: decodeURIComponent(u.password),
      host: u.hostname,
      port: Number(u.port || 5432),
      database: decodeURIComponent(u.pathname.replace(/^\//, "")),
    };
  } catch {
    return { connectionString: raw };
  }
}

export const pool = new Pool(poolConfig());

export const db = new Kysely<Record<string, Record<string, unknown>>>({
  dialect: new PostgresDialect({ pool }),
});

export async function checkDatabase(): Promise<boolean> {
  const client = await pool.connect();
  try {
    await client.query("SELECT 1");
    return true;
  } finally {
    client.release();
  }
}
