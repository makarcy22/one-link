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

export async function describeDatabase() {
  let urlInfo: Record<string, unknown> = {};
  try {
    const u = new URL(process.env.DATABASE_URL ?? "");
    urlInfo = {
      protocol: u.protocol,
      username: u.username,
      passwordType: typeof u.password,
      passwordLength: u.password.length,
      hostname: u.hostname,
      port: u.port,
      database: u.pathname,
      rawLength: (process.env.DATABASE_URL ?? "").length,
    };
  } catch (e) {
    urlInfo = { parseError: e instanceof Error ? e.message : String(e) };
  }
  try {
    const client = await pool.connect();
    try {
      await client.query("SELECT 1");
      const tables = await client.query(
        "SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('user','session','account','verification') ORDER BY tablename"
      );
      const opts = pool.options as unknown as Record<string, unknown>;
      return {
        reachable: true,
        error: "",
        authTables: tables.rows.map((r: { tablename: string }) => r.tablename),
        urlPresent: Boolean(process.env.DATABASE_URL),
        urlInfo,
        parsed: {
          user: opts.user,
          host: opts.host,
          port: opts.port,
          database: opts.database,
          passwordType: typeof opts.password,
          passwordLength: typeof opts.password === "string" ? (opts.password as string).length : -1,
        },
      };
    } finally {
      client.release();
    }
  } catch (e) {
    const opts = pool.options as unknown as Record<string, unknown>;
    return {
      reachable: false,
      error: e instanceof Error ? e.message : String(e),
      authTables: [],
      urlPresent: Boolean(process.env.DATABASE_URL),
      urlInfo,
      parsed: {
        user: opts.user,
        host: opts.host,
        port: opts.port,
        database: opts.database,
        passwordType: typeof opts.password,
        passwordLength: typeof opts.password === "string" ? (opts.password as string).length : -1,
      },
    };
  }
}
