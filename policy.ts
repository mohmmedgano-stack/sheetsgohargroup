import { applyArrayPatch, ArrayPatch } from "./merge";
import { hashPassword } from "./auth";

/** Who may see / change what. Enforced on the server, so it cannot be bypassed from the browser. */
export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export type Actor = any; // the (unsanitised) user record of the logged-in person

export const ARRAY_KEYS = new Set([
  "gohar_users",
  "gohar_clients",
  "gohar_projects",
  "gohar_notifications",
  "gohar_audit_logs",
  "gohar_performance_reviews",
  "gohar_message_templates",
  "gohar_join_codes",
  "gohar_schedule_plans",
]);
export const VALUE_KEYS = new Set([
  "gohar_cloud_config",
  "gohar_custom_logo",
  "gohar_company_title",
  "gohar_company_subtitle",
]);
export const PUBLIC_KEYS = new Set(["gohar_custom_logo", "gohar_company_title", "gohar_company_subtitle"]);

export const isKnownKey = (k: string) => ARRAY_KEYS.has(k) || VALUE_KEYS.has(k);

const isAdmin = (a: Actor) => a.role === "ADMIN";
const isManager = (a: Actor) => a.role === "ADMIN" || a.role === "SALES_MANAGER";
const canManageTeam = (a: Actor) => isManager(a) || a.permissions?.canManageTeam === true;
const canViewAll = (a: Actor) => isManager(a); // only admin / sales manager see other people's clients and work
const canDeleteClients = (a: Actor) => isManager(a) || a.permissions?.canDeleteClients === true;

export function sanitizeUser(u: any) {
  if (!u || typeof u !== "object") return u;
  const { password, passwordHash, ...rest } = u;
  return rest;
}

function parseArr(json: string | null): any[] {
  if (!json) return [];
  try {
    const v = JSON.parse(json);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

/** What this person is allowed to receive for a key (JSON string in, JSON string out). */
export function filterRead(key: string, json: string, actor: Actor | null): string {
  if (!actor) return PUBLIC_KEYS.has(key) ? json : "";
  switch (key) {
    case "gohar_users":
      return JSON.stringify(parseArr(json).map(sanitizeUser));
    case "gohar_clients":
      return canViewAll(actor) ? json : JSON.stringify(parseArr(json).filter(c => c?.assignedUserId === actor.id));
    case "gohar_join_codes":
      return canManageTeam(actor) ? json : "[]";
    case "gohar_audit_logs":
      return isManager(actor) ? json : "[]";
    case "gohar_performance_reviews":
      return isManager(actor) ? json : JSON.stringify(parseArr(json).filter(r => r?.repId === actor.id));
    case "gohar_cloud_config":
      return isAdmin(actor) ? json : "";
    default:
      return json;
  }
}

/** Checks a list patch against the person's rights and returns the patch that is actually applied. */
/** Same phone number written in different ways (+20, spaces, Arabic digits) gives the same key. */
export function phoneKey(p: unknown): string {
  const digits = String(p ?? "")
    .replace(/[٠-٩]/g, d => String(d.charCodeAt(0) - 0x0660))
    .replace(/\D/g, "");
  return digits.length >= 7 ? digits.slice(-9) : "";
}

export function vetPatch(key: string, current: any[], patch: ArrayPatch, actor: Actor, report?: any[]): ArrayPatch {
  const byId = new Map<string, any>();
  current.forEach(i => i && i.id !== undefined && byId.set(String(i.id), i));
  let upserts = (patch.upserts || []).filter(i => i && i.id !== undefined && i.id !== null);
  let deletedIds = (patch.deletedIds || []).map(String);

  switch (key) {
    case "gohar_users": {
      const manage = canManageTeam(actor);
      const out: any[] = [];
      for (const up of upserts) {
        const id = String(up.id);
        const ex = byId.get(id);
        if (!manage && id !== actor.id) continue;
        if (ex && ex.role === "ADMIN" && !isAdmin(actor) && id !== actor.id) continue;
        const next: any = { ...up };
        delete next.password;
        delete next.passwordHash;
        if (ex) {
          if (ex.passwordHash) next.passwordHash = ex.passwordHash;
          else if (ex.password) next.password = ex.password; // legacy, migrated on next login
          if (!manage) {
            for (const f of ["role", "permissions", "activeStatus", "username", "assignedProject", "joinCodeUsed"]) {
              if (ex[f] === undefined) delete next[f];
              else next[f] = ex[f];
            }
          }
          if (!isAdmin(actor) && next.role === "ADMIN" && ex.role !== "ADMIN") next.role = ex.role;
        } else {
          if (!manage) continue;
          if (!isAdmin(actor) && next.role === "ADMIN") next.role = "SALES_REP";
          const pw = typeof up.password === "string" ? up.password : "";
          if (pw.length < 4) continue; // a new account must come with a password
          next.passwordHash = hashPassword(pw);
        }
        out.push(next);
      }
      upserts = out;
      deletedIds = manage
        ? deletedIds.filter(id => id !== actor.id && !(byId.get(id)?.role === "ADMIN" && !isAdmin(actor)))
        : [];
      break;
    }
    case "gohar_clients": {
      const all = canViewAll(actor);
      if (!all) {
        upserts = upserts.filter(up => {
          const ex = byId.get(String(up.id));
          if (ex) return ex.assignedUserId === actor.id;
          return true;
        }).map(up => {
          const ex = byId.get(String(up.id));
          if (!ex && up.assignedUserId !== actor.id && actor.permissions?.canBulkAssign !== true) return { ...up, assignedUserId: actor.id, assignedUserName: actor.name };
          return up;
        });
      }
      deletedIds = deletedIds.filter(id => {
        const ex = byId.get(id);
        if (!ex) return true;
        if (!all && ex.assignedUserId !== actor.id) return false;
        return canDeleteClients(actor);
      });
      // A phone number can only be added once in the whole CRM: the first one to add it keeps it.
      const taken = new Map<string, any>();
      current.forEach(c => {
        const k = phoneKey(c?.phone);
        if (k && !taken.has(k)) taken.set(k, c);
      });
      const stamp = new Date().toISOString();
      const kept: any[] = [];
      for (const up of upserts) {
        if (byId.has(String(up.id))) { kept.push(up); continue; } // editing an existing client
        const k = phoneKey(up.phone);
        const owner = k ? taken.get(k) : undefined;
        if (owner) {
          report?.push({ id: String(up.id), name: up.name, phone: up.phone, ownerName: owner.assignedUserName || "" });
          continue;
        }
        if (k) taken.set(k, up);
        kept.push({ ...up, addedAt: stamp });
      }
      upserts = kept;
      break;
    }
    case "gohar_join_codes":
      if (!canManageTeam(actor)) throw new HttpError(403, "forbidden");
      break;
    case "gohar_performance_reviews":
      if (!isManager(actor)) throw new HttpError(403, "forbidden");
      break;
    case "gohar_audit_logs":
      if (!isAdmin(actor)) deletedIds = [];
      break;
    case "gohar_projects":
      if (!isManager(actor)) throw new HttpError(403, "forbidden");
      break;
    default:
      break;
  }
  return { upserts, deletedIds };
}

// Lists that only ever grow (newest first): keep them bounded so pages stay fast.
const LIST_CAPS: Record<string, number> = { gohar_notifications: 300, gohar_audit_logs: 3000 };

export function applyListWrite(key: string, currentJson: string | null, patch: ArrayPatch, actor: Actor, report?: any[]): string {
  const vetted = vetPatch(key, parseArr(currentJson), patch, actor, report);
  const next = applyArrayPatch(currentJson, vetted);
  const cap = LIST_CAPS[key];
  if (cap) {
    const arr = parseArr(next);
    if (arr.length > cap) return JSON.stringify(arr.slice(0, cap));
  }
  return next;
}

export function canWriteValue(key: string, actor: Actor): boolean {
  if (key === "gohar_cloud_config") return isAdmin(actor);
  return isManager(actor); // logo / company title / subtitle
}

export const DEFAULT_SALES_PERMISSIONS = {
  canExport: false,
  canImport: false,
  canDeleteClients: false,
  canEditClientDetails: true,
  canViewAllProjects: false,
  canBulkAssign: false,
  canSendWhatsApp: true,
  canRecordVoiceNotes: true,
  canViewDistanceMap: true,
  canManageTeam: false,
};
