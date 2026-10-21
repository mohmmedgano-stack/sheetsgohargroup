import crypto from "crypto";

/**
 * Passwords: scrypt with a random salt per password (never stored in clear text).
 * Sessions: a signed, HttpOnly cookie. The signature key is JWT_SECRET (set on the host);
 * if it is missing a random key is generated at start-up (sessions then reset on restart).
 */
const SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString("hex");
export const SESSION_COOKIE = "gohar_session";
export const SESSION_MAX_AGE_S = 60 * 60 * 24 * 30; // 30 days

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, 64);
  return `s1$${salt.toString("hex")}$${hash.toString("hex")}`;
}

export function verifyPassword(password: string, stored: string | undefined | null): boolean {
  if (!stored || typeof stored !== "string") return false;
  const parts = stored.split("$");
  if (parts.length !== 3 || parts[0] !== "s1") return false;
  try {
    const salt = Buffer.from(parts[1], "hex");
    const expected = Buffer.from(parts[2], "hex");
    const actual = crypto.scryptSync(password, salt, expected.length);
    return crypto.timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

/** Short fingerprint of the current password hash: changing the password signs every other device out. */
export function passwordStamp(user: any): string {
  const base = String(user?.passwordHash || user?.password || "");
  return crypto.createHash("sha256").update(base).digest("hex").slice(0, 12);
}

const b64u = (buf: Buffer) => buf.toString("base64url");

export function signSession(userId: string, stamp: string): string {
  const payload = b64u(Buffer.from(JSON.stringify({ u: userId, p: stamp, e: Date.now() + SESSION_MAX_AGE_S * 1000 })));
  const sig = b64u(crypto.createHmac("sha256", SECRET).update(payload).digest());
  return `${payload}.${sig}`;
}

export function verifySession(token: string | undefined): { userId: string; stamp: string } | null {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = b64u(crypto.createHmac("sha256", SECRET).update(payload).digest());
  if (!safeEqual(sig, expected)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf-8"));
    if (!data || typeof data.u !== "string" || typeof data.e !== "number" || data.e < Date.now()) return null;
    return { userId: data.u, stamp: String(data.p || "") };
  } catch {
    return null;
  }
}

export function parseCookies(header: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) return out;
  header.split(";").forEach(part => {
    const i = part.indexOf("=");
    if (i < 0) return;
    out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  });
  return out;
}

export function cookieHeader(token: string | null, secure: boolean): string {
  const base = `${SESSION_COOKIE}=${token ? encodeURIComponent(token) : ""}; Path=/; HttpOnly; SameSite=Lax`;
  const age = token ? `; Max-Age=${SESSION_MAX_AGE_S}` : "; Max-Age=0";
  return base + age + (secure ? "; Secure" : "");
}

// ---- simple in-memory brute-force protection (per IP) ----
const fails = new Map<string, { n: number; until: number }>();
export function rateLimited(ip: string): boolean {
  const f = fails.get(ip);
  return !!f && f.n >= 8 && f.until > Date.now();
}
export function recordFail(ip: string) {
  const f = fails.get(ip);
  const now = Date.now();
  if (!f || f.until < now) fails.set(ip, { n: 1, until: now + 10 * 60 * 1000 });
  else f.n += 1;
}
export function clearFails(ip: string) {
  fails.delete(ip);
}
