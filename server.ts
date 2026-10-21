import "dotenv/config";
import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import compression from "compression";
import { createServer as createViteServer } from "vite";
import multer from "multer";
import { ensureTable, getAllState, getVersions, getKey, setState, updateKey, isDbConfigured } from "./db";
import {
  hashPassword, verifyPassword, passwordStamp, signSession, verifySession, parseCookies, cookieHeader,
  SESSION_COOKIE, rateLimited, recordFail, clearFails,
} from "./auth";
import {
  ARRAY_KEYS, VALUE_KEYS, PUBLIC_KEYS, isKnownKey, filterRead, applyListWrite, canWriteValue,
  sanitizeUser, HttpError, DEFAULT_SALES_PERMISSIONS, phoneKey,
} from "./policy";

const shareUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 2 * 1024 * 1024 } });

// Extracts a display name and a phone number from either:
// - plain shared text (e.g. WhatsApp contact share: "Ahmed Sales: +20 100 123 4567")
// - a vCard (.vcf) file body (native Contacts app share)
function extractContactFromShare(text: string): { name: string; phone: string } {
  let name = "";
  let phone = "";

  if (text.includes("BEGIN:VCARD")) {
    const fnMatch = text.match(/^FN(?:;[^:]*)?:(.*)$/im);
    const nMatch = text.match(/^N(?:;[^:]*)?:(.*)$/im);
    const telMatch = text.match(/^TEL(?:;[^:]*)?:(.*)$/im);
    if (fnMatch) {
      name = fnMatch[1].trim();
    } else if (nMatch) {
      // N format is Last;First;Middle;Prefix;Suffix
      name = nMatch[1].split(";").filter(Boolean).reverse().join(" ").trim();
    }
    if (telMatch) {
      phone = telMatch[1].trim();
    }
  } else {
    // Plain text share: pull out the first phone-like number, treat the rest as the name
    const phoneMatch = text.match(/(\+?\d[\d\s\-()]{6,}\d)/);
    if (phoneMatch) {
      phone = phoneMatch[1].replace(/[\s\-()]/g, "");
      name = text.replace(phoneMatch[0], "").trim();
    } else {
      name = text.trim();
    }
    // Clean up common separators left over ("Ahmed Sales:" -> "Ahmed Sales")
    name = name.replace(/[:،,\-–]+\s*$/, "").trim();
  }

  return { name, phone };
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  try {
    await ensureTable();
  } catch (err) {
    console.error("Failed to initialize database table:", err);
  }

  app.set("trust proxy", true);

  // One-time: turn clear-text passwords into hashes; create the first admin on an empty database.
  try {
    const row = await getKey("gohar_users");
    if (!row) {
      const pw = process.env.ADMIN_PASSWORD || crypto.randomBytes(6).toString("hex");
      await updateKey("gohar_users", () =>
        JSON.stringify([{
          id: "user-admin", name: "المدير العام", username: process.env.ADMIN_USERNAME || "gohargroup",
          email: "admin@gohargroup.local", role: "ADMIN", activeStatus: "active", passwordHash: hashPassword(pw),
          createdAt: new Date().toISOString().split("T")[0],
          permissions: { ...DEFAULT_SALES_PERMISSIONS, canExport: true, canImport: true, canDeleteClients: true, canViewAllProjects: true, canBulkAssign: true, canManageTeam: true },
        }])
      );
      if (!process.env.ADMIN_PASSWORD) console.log(`[setup] first admin created: ${process.env.ADMIN_USERNAME || "gohargroup"} / ${pw}`);
    } else if (JSON.parse(row.value).some((u: any) => typeof u.password === "string" && !u.passwordHash)) {
      await updateKey("gohar_users", cur => {
        const arr: any[] = JSON.parse(cur || "[]");
        return JSON.stringify(arr.map(u => {
          if (typeof u.password === "string" && !u.passwordHash) {
            const { password, ...rest } = u;
            return { ...rest, passwordHash: hashPassword(password) };
          }
          return u;
        }));
      });
      console.log("[setup] migrated clear-text passwords to hashes");
    }
  } catch (err) {
    console.error("user bootstrap failed:", err);
  }

  // Enable gzip/deflate compression for all text-based HTTP responses
  app.use(
    compression({
      filter: (req, res) => {
        if (req.headers["x-no-compression"]) {
          return false;
        }
        return compression.filter(req, res);
      },
      level: 6,
      threshold: 1024, // only compress responses above 1KB
    })
  );

  app.use(express.json({ limit: "50mb" }));

  // Security & Performance Headers
  app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    res.setHeader("Referrer-Policy", "same-origin");
    next();
  });

  // API endpoints
  app.get("/api/health", (req, res) => {
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.json({
      status: "ok",
      company: "Gohar Group for Real Estate Development",
      timestamp: new Date().toISOString(),
    });
  });

  const noStore = (res: express.Response) => {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
  };

  // ------------------------------------------------------------------
  // Authentication
  // ------------------------------------------------------------------
  const readUsers = async (): Promise<any[]> => {
    const row = await getKey("gohar_users");
    if (!row) return [];
    try {
      const v = JSON.parse(row.value);
      return Array.isArray(v) ? v : [];
    } catch {
      return [];
    }
  };

  const isBlocked = (u: any) => u?.activeStatus === "inactive" || u?.activeStatus === "pending_approval";

  /** The logged-in person (full record), or null. */
  const getActor = async (req: express.Request): Promise<any | null> => {
    const sess = verifySession(parseCookies(req.headers.cookie)[SESSION_COOKIE]);
    if (!sess) return null;
    const user = (await readUsers()).find(u => u && u.id === sess.userId);
    if (!user || isBlocked(user)) return null;
    if (sess.stamp !== passwordStamp(user)) return null; // password changed elsewhere
    return user;
  };

  const requireAuth = async (req: express.Request, res: express.Response): Promise<any | null> => {
    noStore(res);
    try {
      const actor = await getActor(req);
      if (!actor) {
        res.status(401).json({ ok: false, error: "unauthorized" });
        return null;
      }
      return actor;
    } catch (err) {
      console.error("auth failure:", err);
      res.status(500).json({ ok: false });
      return null;
    }
  };

  const isSecure = (req: express.Request) => req.secure || req.headers["x-forwarded-proto"] === "https";
  const startSession = (req: express.Request, res: express.Response, user: any) => {
    res.setHeader("Set-Cookie", cookieHeader(signSession(user.id, passwordStamp(user)), isSecure(req)));
  };
  const clientIp = (req: express.Request) => String(req.headers["x-forwarded-for"] || req.socket.remoteAddress || "").split(",")[0].trim();

  const MSG_BAD = "اسم المستخدم أو كلمة السر غير صحيحة. يرجى التحقق وإعادة المحاولة.";

  app.post("/api/auth/login", async (req, res) => {
    noStore(res);
    const ip = clientIp(req);
    if (rateLimited(ip)) {
      res.status(429).json({ ok: false, message: "محاولات كثيرة خاطئة. حاول مرة أخرى بعد 10 دقائق." });
      return;
    }
    try {
      const identifier = String(req.body?.identifier || "").trim().toLowerCase();
      const password = String(req.body?.password || "").trim();
      const users = await readUsers();
      const user = users.find(
        u => u && ((u.username && String(u.username).toLowerCase() === identifier) || (u.email && String(u.email).toLowerCase() === identifier))
      );
      let ok = false;
      if (user) {
        if (user.passwordHash) ok = verifyPassword(password, user.passwordHash);
        else if (typeof user.password === "string") ok = user.password === password; // legacy, migrated below
      }
      if (!user || !ok) {
        recordFail(ip);
        res.status(401).json({ ok: false, message: MSG_BAD });
        return;
      }
      if (user.activeStatus === "pending_approval") {
        res.status(403).json({ ok: false, message: "حسابك في انتظار موافقة المدير العام أو مدير المبيعات لتفعيل الصلاحيات." });
        return;
      }
      if (user.activeStatus === "inactive") {
        res.status(403).json({ ok: false, message: "تم إيقاف هذا الحساب مؤقتاً، يرجى مراجعة إدارة جوهر جروب." });
        return;
      }
      clearFails(ip);
      let finalUser = user;
      if (!user.passwordHash) {
        const hash = hashPassword(password);
        await updateKey("gohar_users", cur => {
          const arr = JSON.parse(cur || "[]");
          return JSON.stringify(arr.map((u: any) => {
            if (u.id !== user.id) return u;
            const { password: _p, ...rest } = u;
            finalUser = { ...rest, passwordHash: hash };
            return finalUser;
          }));
        });
      }
      startSession(req, res, finalUser);
      res.json({ ok: true });
    } catch (err) {
      console.error("login failed:", err);
      res.status(500).json({ ok: false, message: "تعذر تسجيل الدخول الآن، حاول مرة أخرى." });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    noStore(res);
    res.setHeader("Set-Cookie", cookieHeader(null, isSecure(req)));
    res.json({ ok: true });
  });

  app.get("/api/auth/me", async (req, res) => {
    const actor = await requireAuth(req, res);
    if (actor) res.json({ ok: true, user: sanitizeUser(actor) });
  });

  app.post("/api/auth/register", async (req, res) => {
    noStore(res);
    const ip = clientIp(req);
    if (rateLimited(ip)) {
      res.status(429).json({ ok: false, message: "محاولات كثيرة. حاول مرة أخرى بعد قليل." });
      return;
    }
    try {
      const b = req.body || {};
      const code = String(b.code || "").trim().toUpperCase();
      const name = String(b.name || "").trim();
      const username = String(b.username || "").trim();
      const email = String(b.email || "").trim();
      const password = String(b.password || "");
      if (!name || !username || !email || password.length < 6) {
        res.json({ ok: false, message: "يرجى إدخال الاسم واسم المستخدم والبريد، وكلمة سر لا تقل عن 6 أحرف." });
        return;
      }
      const codesRow = await getKey("gohar_join_codes");
      let codes: any[] = [];
      try { codes = JSON.parse(codesRow?.value || "[]"); } catch { codes = []; }
      const match = codes.find(c => c && String(c.code).toUpperCase() === code);
      if (!match) {
        recordFail(ip);
        res.json({ ok: false, message: "كود الانضمام غير صحيح، يرجى مراجعة المدير العام أو مدير المبيعات" });
        return;
      }
      if (!match.isActive) {
        res.json({ ok: false, message: "هذا الكود غير نشط حالياً أو تم إيقافه من قبل الإدارة" });
        return;
      }
      let duplicate = false;
      const newUser = {
        id: `user-sales-${Date.now()}`,
        name,
        username,
        email,
        phone: String(b.phone || "").trim(),
        role: "SALES_REP",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
        assignedProject: String(b.assignedProject || "").trim() || "Wada Bay رأس الحكمة",
        activeStatus: "pending_approval",
        joinCodeUsed: code,
        createdAt: new Date().toISOString().split("T")[0],
        permissions: { ...DEFAULT_SALES_PERMISSIONS },
        passwordHash: hashPassword(password),
      };
      await updateKey("gohar_users", cur => {
        const arr: any[] = JSON.parse(cur || "[]");
        duplicate = arr.some(
          u => (u.username && String(u.username).toLowerCase() === username.toLowerCase()) || (u.email && String(u.email).toLowerCase() === email.toLowerCase())
        );
        return duplicate ? JSON.stringify(arr) : JSON.stringify([newUser, ...arr]);
      });
      if (duplicate) {
        res.json({ ok: false, message: "اسم المستخدم أو البريد الإلكتروني مسجل مسبقاً في النظام" });
        return;
      }
      res.json({
        ok: true,
        message: "تم إرسال طلب تسجيلك بنجاح! الحساب قيد المراجعة وسيقوم المدير العام أو مدير المبيعات بالموافقة وتحديد الصلاحيات.",
      });
    } catch (err) {
      console.error("register failed:", err);
      res.status(500).json({ ok: false, message: "تعذر إرسال الطلب الآن، حاول مرة أخرى." });
    }
  });

  app.post("/api/auth/change-password", async (req, res) => {
    const actor = await requireAuth(req, res);
    if (!actor) return;
    try {
      const targetId = String(req.body?.userId || actor.id);
      const oldPassword = String(req.body?.oldPassword || "");
      const newPassword = String(req.body?.newPassword || "");
      if (newPassword.length < 6) {
        res.json({ ok: false, message: "كلمة السر الجديدة لا تقل عن 6 أحرف أو أرقام" });
        return;
      }
      const isSelf = targetId === actor.id;
      const manage = actor.role === "ADMIN" || actor.role === "SALES_MANAGER" || actor.permissions?.canManageTeam === true;
      const users = await readUsers();
      const target = users.find(u => u.id === targetId);
      if (!target) {
        res.status(404).json({ ok: false, message: "الحساب غير موجود" });
        return;
      }
      if (isSelf) {
        const okOld = target.passwordHash ? verifyPassword(oldPassword, target.passwordHash) : target.password === oldPassword;
        if (!okOld) {
          res.json({ ok: false, message: "كلمة المرور الحالية غير صحيحة" });
          return;
        }
      } else if (!manage || (target.role === "ADMIN" && actor.role !== "ADMIN")) {
        res.status(403).json({ ok: false, message: "غير مسموح لك بتغيير كلمة سر هذا الحساب" });
        return;
      }
      const hash = hashPassword(newPassword);
      let updated: any = target;
      await updateKey("gohar_users", cur => {
        const arr: any[] = JSON.parse(cur || "[]");
        return JSON.stringify(arr.map(u => {
          if (u.id !== targetId) return u;
          const { password: _p, ...rest } = u;
          updated = { ...rest, passwordHash: hash };
          return updated;
        }));
      });
      if (isSelf) startSession(req, res, updated); // keep this device signed in
      res.json({ ok: true });
    } catch (err) {
      console.error("change-password failed:", err);
      res.status(500).json({ ok: false, message: "تعذر تغيير كلمة السر الآن" });
    }
  });

  // ------------------------------------------------------------------
  // Shared state (every request needs a session; what you get/can change depends on your role)
  // ------------------------------------------------------------------
  app.get("/api/state-versions", async (req, res) => {
    const actor = await requireAuth(req, res);
    if (!actor) return;
    try {
      res.json({ ok: true, versions: await getVersions() });
    } catch (err) {
      console.error("Failed to read versions:", err);
      res.status(500).json({ ok: false });
    }
  });

  app.get("/api/state/:key", async (req, res) => {
    const actor = await requireAuth(req, res);
    if (!actor) return;
    try {
      const { key } = req.params;
      if (!isKnownKey(key)) {
        res.status(404).json({ ok: false });
        return;
      }
      const row = await getKey(key);
      res.json({ ok: true, value: row ? filterRead(key, row.value, actor) || null : null, ver: row ? row.ver : 0 });
    } catch (err) {
      console.error("Failed to read key:", err);
      res.status(500).json({ ok: false });
    }
  });

  const handleStateSave = async (req: express.Request, res: express.Response) => {
    const actor = await requireAuth(req, res);
    if (!actor) return;
    try {
      const { key } = req.params;
      if (!isKnownKey(key)) {
        res.status(404).json({ ok: false });
        return;
      }
      const body = req.body || {};
      const MAX_KEY_SIZE = 4 * 1024 * 1024; // 4MB per key
      if (ARRAY_KEYS.has(key)) {
        if (!body.patch || typeof body.patch !== "object") {
          res.status(400).json({ ok: false, error: "patch required" });
          return;
        }
        // Item-level patch: merged under a row lock with whatever others saved meanwhile.
        const patch = {
          upserts: Array.isArray(body.patch.upserts) ? body.patch.upserts : [],
          deletedIds: Array.isArray(body.patch.deletedIds) ? body.patch.deletedIds : [],
        };
        const rejected: any[] = [];
        const out = await updateKey(key, current => {
          rejected.length = 0;
          const next = applyListWrite(key, current, patch, actor, rejected);
          if (next.length > MAX_KEY_SIZE * 2) throw new Error("too-large");
          return next;
        });
        res.json({ ok: true, value: filterRead(key, out.value, actor), ver: out.ver, rejected });
        return;
      }
      const { value } = body;
      if (typeof value !== "string") {
        res.status(400).json({ ok: false, error: "value must be a string" });
        return;
      }
      if (!canWriteValue(key, actor)) {
        res.status(403).json({ ok: false, error: "forbidden" });
        return;
      }
      if (value.length > MAX_KEY_SIZE) {
        console.error(`Rejected oversized write to "${key}": ${value.length} bytes`);
        res.status(413).json({ ok: false, error: "البيانات كبيرة جدًا - الصور يجب ضغطها قبل الحفظ" });
        return;
      }
      const out = await setState(key, value);
      res.json({ ok: true, ver: out.ver });
    } catch (err) {
      if (err instanceof HttpError) {
        res.status(err.status).json({ ok: false, error: err.message });
        return;
      }
      console.error("Failed to save app state:", err);
      res.status(500).json({ ok: false, error: "Failed to save state" });
    }
  };

  // Full backup of the database (admin only). Open /api/admin/backup while logged in as the general manager.
  app.get("/api/admin/backup", async (req, res) => {
    const actor = await requireAuth(req, res);
    if (!actor) return;
    if (actor.role !== "ADMIN") {
      res.status(403).json({ ok: false });
      return;
    }
    try {
      const all = await getAllState();
      const stamp = new Date().toISOString().replace(/[:T]/g, "-").slice(0, 16);
      res.setHeader("Cache-Control", "no-store");
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename="gohar-backup-${stamp}.json"`);
      res.send(JSON.stringify(all));
    } catch (err) {
      console.error("backup failed:", err);
      res.status(500).json({ ok: false });
    }
  });

  // Is this phone number already in the CRM (for anyone)? Used while adding a client.
  app.get("/api/clients/phone-check", async (req, res) => {
    const actor = await requireAuth(req, res);
    if (!actor) return;
    try {
      noStore(res);
      const k = phoneKey(req.query.phone);
      if (!k) {
        res.json({ ok: true, exists: false });
        return;
      }
      const row = await getKey("gohar_clients");
      const list: any[] = row ? JSON.parse(row.value) : [];
      const hit = list.find(c => phoneKey(c?.phone) === k && String(c?.id) !== String(req.query.excludeId || ""));
      res.json(hit
        ? { ok: true, exists: true, ownerName: hit.assignedUserName || "", addedAt: hit.addedAt || hit.createdAt || "" }
        : { ok: true, exists: false });
    } catch (err) {
      console.error("phone-check failed:", err);
      res.status(500).json({ ok: false });
    }
  });

  app.put("/api/state/:key", handleStateSave);
  // POST mirror: navigator.sendBeacon (used to flush pending saves the instant
  // a tab closes/backgrounds, so nothing is lost) can only send POST requests.
  app.post("/api/state/:key", handleStateSave);

  // Receives a contact shared from WhatsApp or the phone's Contacts app
  // (registered via manifest.json "share_target"), extracts the name and
  // phone number, then redirects into the app with the Add Client form
  // pre-filled - name goes to name, phone goes to phone, same as manual entry.
  app.post("/share-target", shareUpload.any(), (req, res) => {
    try {
      const body: any = req.body || {};
      const files = (req.files as Express.Multer.File[]) || [];

      let combinedText = (body.text || body.title || "").trim();

      // A shared vCard file (from the native Contacts app) takes priority
      const vcfFile = files.find(
        f => f.mimetype.includes("vcard") || f.originalname?.toLowerCase().endsWith(".vcf")
      );
      if (vcfFile) {
        combinedText = vcfFile.buffer.toString("utf-8");
      }

      const { name, phone } = extractContactFromShare(combinedText || "");
      const params = new URLSearchParams();
      if (name) params.set("shared_name", name);
      if (phone) params.set("shared_phone", phone);

      res.redirect(303, `/?${params.toString()}`);
    } catch (err) {
      console.error("Failed to process shared contact:", err);
      res.redirect(303, "/");
    }
  });

  // Backup sync mock API endpoint
  app.post("/api/cloud-sync", async (req, res) => {
    if (!(await requireAuth(req, res))) return;
    res.json({
      success: true,
      provider: "Google Drive",
      syncedAt: new Date().toISOString(),
      message: "Data synced successfully with Gohar Group Cloud Drive",
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");

    // Static assets with immutable long-term caching for hashed files
    app.use(
      "/assets",
      express.static(path.join(distPath, "assets"), {
        maxAge: "1y",
        immutable: true,
        etag: true,
        lastModified: true,
      })
    );

    // Other static files (favicon, manifest, images)
    app.use(
      express.static(distPath, {
        index: false,
        maxAge: 0,
        etag: true,
        lastModified: true,
        setHeaders: (res) => {
          // Everything outside /assets (hashed, immutable) must always be re-checked.
          res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        },
      })
    );

    const indexHtmlPath = path.join(distPath, "index.html");

    app.get("*", async (req, res) => {
      noStore(res);
      try {
        let html = fs.readFileSync(indexHtmlPath, "utf-8");
        const actor = await getActor(req);
        const all = await getAllState();
        const state: Record<string, string> = {};
        for (const k of Object.keys(all)) {
          if (!isKnownKey(k)) continue;
          if (!actor && !PUBLIC_KEYS.has(k)) continue;
          const v = filterRead(k, all[k], actor);
          if (v) state[k] = v;
        }
        // keys the person is allowed to read but that are empty for them still need to exist
        if (actor) {
          for (const k of ARRAY_KEYS) if (all[k] !== undefined && state[k] === undefined) state[k] = "[]";
        }
        const versions = actor ? await getVersions() : {};
        const pub: any = {};
        if (!actor) {
          try {
            pub.projects = JSON.parse(all["gohar_projects"] || "[]").map((p: any) => p?.name).filter(Boolean);
          } catch {
            pub.projects = [];
          }
        }
        const j = (v: any) => JSON.stringify(v).replace(/</g, "\\u003c");
        const injection = `<script>window.__SERVER_STATE__=${j(state)};window.__SERVER_VERSIONS__=${j(versions)};window.__AUTH_USER__=${j(actor ? sanitizeUser(actor) : null)};window.__PUBLIC__=${j(pub)};</script>`;
        html = html.replace("</head>", `${injection}</head>`);
        res.send(html);
      } catch (err) {
        console.error("Failed to render index.html with server state:", err);
        res.status(500).send("Server error");
      }
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Gohar Group CRM Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start Gohar Group CRM Server:", err);
});
