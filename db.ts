import mysql from "mysql2/promise";

/**
 * Storage for the app's shared state (one row per key, JSON string value) plus a
 * per-key `ver` counter that goes up on every write. Clients poll the counters
 * (cheap) and fetch only the keys that changed, which is what makes edits show up
 * on every device within a couple of seconds without refreshing the page.
 *
 * If no MySQL credentials are configured (local development / tests) an in-memory
 * store with the exact same behaviour is used instead.
 */

let pool: mysql.Pool | null = null;

function getPool(): mysql.Pool | null {
  if (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_NAME) {
    return null;
  }
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME,
      port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      connectTimeout: 8000,
      enableKeepAlive: true,
      keepAliveInitialDelay: 10000,
    });
  }
  return pool;
}

// ---- in-memory fallback (dev/tests) ----
const mem = new Map<string, { value: string; ver: number }>();

export function isDbConfigured(): boolean {
  return getPool() !== null;
}

export async function ensureTable(): Promise<void> {
  const p = getPool();
  if (!p) return;
  await p.query(
    `CREATE TABLE IF NOT EXISTS app_state (
      state_key VARCHAR(191) PRIMARY KEY,
      state_value LONGTEXT NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
  );
  const [cols] = await p.query("SHOW COLUMNS FROM app_state LIKE 'ver'");
  if ((cols as any[]).length === 0) {
    await p.query("ALTER TABLE app_state ADD COLUMN ver BIGINT NOT NULL DEFAULT 1");
  }
}

export async function getAllState(): Promise<Record<string, string>> {
  const p = getPool();
  if (!p) {
    const out: Record<string, string> = {};
    mem.forEach((v, k) => (out[k] = v.value));
    return out;
  }
  const [rows] = await p.query("SELECT state_key, state_value FROM app_state");
  const result: Record<string, string> = {};
  for (const row of rows as any[]) result[row.state_key] = row.state_value;
  return result;
}

export async function getVersions(): Promise<Record<string, number>> {
  const p = getPool();
  if (!p) {
    const out: Record<string, number> = {};
    mem.forEach((v, k) => (out[k] = v.ver));
    return out;
  }
  const [rows] = await p.query("SELECT state_key, ver FROM app_state");
  const out: Record<string, number> = {};
  for (const row of rows as any[]) out[row.state_key] = Number(row.ver);
  return out;
}

export async function getKey(key: string): Promise<{ value: string; ver: number } | null> {
  const p = getPool();
  if (!p) return mem.get(key) || null;
  const [rows] = await p.query("SELECT state_value, ver FROM app_state WHERE state_key = ?", [key]);
  const r = (rows as any[])[0];
  return r ? { value: r.state_value, ver: Number(r.ver) } : null;
}

/**
 * Atomically read-modify-write one key. `fn` receives the current value (or null)
 * and returns the new value. Concurrent writers are serialized (row lock), so two
 * people saving at the same moment never overwrite each other's changes.
 */
export async function updateKey(
  key: string,
  fn: (current: string | null) => string
): Promise<{ value: string; ver: number }> {
  const p = getPool();
  if (!p) {
    const cur = mem.get(key);
    const value = fn(cur ? cur.value : null);
    const ver = (cur ? cur.ver : 0) + 1;
    mem.set(key, { value, ver });
    return { value, ver };
  }
  const conn = await p.getConnection();
  try {
    await conn.beginTransaction();
    const [rows] = await conn.query("SELECT state_value, ver FROM app_state WHERE state_key = ? FOR UPDATE", [key]);
    const row = (rows as any[])[0];
    const value = fn(row ? row.state_value : null);
    let ver: number;
    if (row) {
      ver = Number(row.ver) + 1;
      await conn.query("UPDATE app_state SET state_value = ?, ver = ? WHERE state_key = ?", [value, ver, key]);
    } else {
      ver = 1;
      await conn.query("INSERT INTO app_state (state_key, state_value, ver) VALUES (?, ?, ?)", [key, value, ver]);
    }
    await conn.commit();
    return { value, ver };
  } catch (err) {
    try {
      await conn.rollback();
    } catch {
      /* ignore */
    }
    throw err;
  } finally {
    conn.release();
  }
}

export async function setState(key: string, value: string): Promise<{ value: string; ver: number }> {
  return updateKey(key, () => value);
}
