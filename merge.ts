/** Item-level patch applied on top of whatever is currently stored, so concurrent users never overwrite each other. */
export interface ArrayPatch {
  upserts: any[];
  deletedIds: string[];
}

const same = (a: any, b: any) => JSON.stringify(a) === JSON.stringify(b);
const hasIds = (a: any) => Array.isArray(a) && a.every(x => x && typeof x === "object" && x.id !== undefined);

/**
 * Three-way merge of one item: only the fields THIS device actually changed (compared with the
 * version it last saw, `base`) are applied on top of what is stored now. So a phone that was
 * asleep and still shows an old copy can no longer overwrite a newer status/phone/note.
 */
export function mergeItem(existing: any, mine: any, base: any): any {
  const out: any = { ...existing };
  const keys = new Set<string>([...Object.keys(mine), ...Object.keys(base)]);
  keys.forEach(f => {
    if (same(mine[f], base[f])) return; // not changed by this device
    if (!(f in mine)) { delete out[f]; return; }
    if (hasIds(mine[f]) && hasIds(base[f]) && hasIds(existing[f])) {
      // lists of records with ids (e.g. call notes): keep everyone's entries
      const baseIds = new Map<string, any>(base[f].map((x: any) => [String(x.id), x]));
      const mineIds = new Map<string, any>(mine[f].map((x: any) => [String(x.id), x]));
      const list: any[] = existing[f].filter((x: any) => !(baseIds.has(String(x.id)) && !mineIds.has(String(x.id))));
      const pos = new Map<string, number>(list.map((x: any, i: number) => [String(x.id), i]));
      mine[f].forEach((x: any) => {
        const id = String(x.id);
        if (baseIds.has(id) && same(baseIds.get(id), x)) return;
        if (pos.has(id)) list[pos.get(id)!] = x; else list.unshift(x);
      });
      out[f] = list;
    } else {
      out[f] = mine[f];
    }
  });
  return out;
}

export function applyArrayPatch(currentJson: string | null, patch: ArrayPatch): string {
  let current: any[] = [];
  if (currentJson) {
    try {
      const parsed = JSON.parse(currentJson);
      if (Array.isArray(parsed)) current = parsed;
    } catch {
      current = [];
    }
  }

  const deleted = new Set((patch.deletedIds || []).map(String));
  const upsertById = new Map<string, any>();
  const fresh: any[] = [];
  for (const item of patch.upserts || []) {
    if (!item || item.id === undefined || item.id === null) continue;
    upsertById.set(String(item.id), item);
  }
  const resolve = (existing: any, up: any) => {
    const { __base, ...mine } = up;
    if (existing && typeof __base === "string") {
      try {
        const base = JSON.parse(__base);
        if (base && typeof base === "object") return mergeItem(existing, mine, base);
      } catch { /* fall through: plain replace */ }
    }
    return mine;
  };

  const seen = new Set<string>();
  const out: any[] = [];
  for (const item of current) {
    const id = item && item.id !== undefined ? String(item.id) : null;
    if (id === null) {
      out.push(item);
      continue;
    }
    seen.add(id);
    if (deleted.has(id)) continue;
    out.push(upsertById.has(id) ? resolve(item, upsertById.get(id)) : item);
  }
  upsertById.forEach((item, id) => {
    if (!seen.has(id) && !deleted.has(id)) fresh.push(resolve(null, item));
  });
  // new items go first (the app lists newest first)
  return JSON.stringify([...fresh, ...out]);
}
