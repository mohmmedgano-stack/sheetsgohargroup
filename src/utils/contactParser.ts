/**
 * Turns whatever the person copied (WhatsApp contact cards, iPhone/Android contacts, vCard text,
 * "name phone" lines, a column of numbers…) into clean { name, phone } pairs.
 */
export interface ParsedContact { name: string; phone: string }
export interface ParseResult {
  contacts: ParsedContact[];
  /** numbers that appeared more than once in what was pasted */
  duplicatesInPaste: number;
  /** pieces of text that had no usable phone number */
  skipped: number;
}

const MAX_CONTACTS = 20000;

function clean(text: string): string {
  return text
    .replace(/[٠-٩]/g, d => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, d => String(d.charCodeAt(0) - 0x06f0))
    .replace(/[​-‏‪-‮⁦-⁩﻿­]/g, '')
    .replace(/ /g, ' ')
    .replace(/_\$!<VCard-Separator>!\$_/g, '\n') // WhatsApp joins copied cards with this marker
    .replace(/\r\n?/g, '\n')
    .replace(/\n[ \t]/g, ''); // vCard folded lines
}

/** Egyptian numbers become 01XXXXXXXXX; international numbers keep their +. Returns '' if it is not a phone number. */
export function normalizePhone(raw: string): string {
  let s = raw.replace(/[^\d+]/g, '');
  if (s.startsWith('00')) s = '+' + s.slice(2);
  let digits = s.replace(/\+/g, '');
  if (digits.length < 7 || digits.length > 15) return '';
  if (/(\d)\1{6,}/.test(digits)) return ''; // 0000000…, 01000000000 and other made-up numbers
  if (s.startsWith('+')) {
    if (digits.startsWith('200') && digits.length === 13) return '0' + digits.slice(3);
    if (digits.startsWith('20') && digits.length === 12) return '0' + digits.slice(2);
    return '+' + digits;
  }
  if (digits.startsWith('20') && digits.length === 12 && digits[2] === '1') return '0' + digits.slice(2);
  if (digits.length === 10 && digits[0] === '1') return '0' + digits; // Egyptian mobile without the leading 0
  return digits;
}

const PHONE_RE = /(?:\+|00)?\d[\d\s().\-]{5,}\d/g;

function phonesIn(line: string): { phone: string; text: string }[] {
  const out: { phone: string; text: string }[] = [];
  const m = line.match(PHONE_RE) || [];
  for (const t of m) {
    const p = normalizePhone(t);
    if (p) out.push({ phone: p, text: t });
  }
  return out;
}

function tidyName(s: string): string {
  return s
    .replace(/\b(?:tel|mobile|cell|phone|iphone|home|work|main|voice|pref|type)\b\s*[:=;]?/gi, ' ')
    .replace(/[:：،,;|\/•·•]+/g, ' ')
    .replace(/^[\s\-–—]+|[\s\-–—]+$/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function decodeQuotedPrintable(v: string): string {
  try {
    const bytes: number[] = [];
    const s = v.replace(/=\n/g, '');
    for (let i = 0; i < s.length; i++) {
      if (s[i] === '=' && /^[0-9A-Fa-f]{2}$/.test(s.slice(i + 1, i + 3))) {
        bytes.push(parseInt(s.slice(i + 1, i + 3), 16));
        i += 2;
      } else {
        bytes.push(...new TextEncoder().encode(s[i]));
      }
    }
    return new TextDecoder('utf-8').decode(new Uint8Array(bytes));
  } catch {
    return v;
  }
}

const unescapeV = (v: string) => v.replace(/\\n/gi, ' ').replace(/\\([,;\\])/g, '$1');

function parseVCards(text: string): { cards: ParsedContact[]; skipped: number } {
  const cards: ParsedContact[] = [];
  let skipped = 0;
  let cur: { fn: string; n: string; tels: string[] } | null = null;
  const flush = () => {
    if (!cur) return;
    const name = tidyName(cur.fn || cur.n);
    const phone = cur.tels.map(normalizePhone).find(Boolean) || '';
    if (phone) cards.push({ name: name || phone, phone });
    else if (name) skipped++;
    cur = null;
  };
  for (const line of text.split('\n')) {
    const l = line.trim();
    if (!l) continue;
    if (/^BEGIN:VCARD/i.test(l)) { flush(); cur = { fn: '', n: '', tels: [] }; continue; }
    if (/^END:VCARD/i.test(l)) { flush(); continue; }
    const m = l.match(/^(?:[A-Za-z0-9-]+\.)?([A-Za-z-]+)((?:;[^:]*)*):(.*)$/);
    if (!m) continue;
    const prop = m[1].toUpperCase();
    let value = m[3];
    if (/ENCODING=QUOTED-PRINTABLE/i.test(m[2])) value = decodeQuotedPrintable(value);
    if (prop === 'FN' || prop === 'N' || prop === 'TEL') {
      // a new name after a card that already has a number starts a new card (vCards pasted without BEGIN/END)
      if (!cur || ((prop === 'FN' || prop === 'N') && cur.tels.length > 0)) { flush(); cur = { fn: '', n: '', tels: [] }; }
    }
    if (!cur) continue;
    if (prop === 'FN') cur.fn = unescapeV(value);
    else if (prop === 'N') {
      const [family = '', given = '', additional = '', prefix = '', suffix = ''] = value.split(';');
      cur.n = unescapeV([prefix, given, additional, family, suffix].filter(Boolean).join(' '));
    } else if (prop === 'TEL') cur.tels.push(value.replace(/^tel:/i, ''));
  }
  flush();
  return { cards, skipped };
}

function parsePlain(text: string): { list: ParsedContact[]; skipped: number } {
  const list: ParsedContact[] = [];
  let skipped = 0;
  let pendingName = '';
  let pendingPhone = '';
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (!line) continue;
    const found = phonesIn(line);
    let rest = line;
    found.forEach(f => { rest = rest.replace(f.text, ' '); });
    const name = tidyName(rest);
    if (found.length > 1 && !name) {
      found.forEach(f => list.push({ name: f.phone, phone: f.phone })); // a line of bare numbers
      pendingName = '';
    } else if (found.length >= 1 && name) {
      list.push({ name, phone: found[0].phone });
      pendingName = ''; pendingPhone = '';
    } else if (found.length >= 1) {
      if (pendingName) { list.push({ name: pendingName, phone: found[0].phone }); pendingName = ''; }
      else {
        if (pendingPhone) list.push({ name: pendingPhone, phone: pendingPhone });
        pendingPhone = found[0].phone;
      }
    } else if (name) {
      if (pendingPhone) { list.push({ name, phone: pendingPhone }); pendingPhone = ''; }
      else { if (pendingName) skipped++; pendingName = name; }
    }
  }
  if (pendingPhone) list.push({ name: pendingPhone, phone: pendingPhone });
  if (pendingName) skipped++;
  return { list, skipped };
}

export function parseContacts(input: string): ParseResult {
  const text = clean(input).trim();
  if (!text) return { contacts: [], duplicatesInPaste: 0, skipped: 0 };
  const isVCard = /BEGIN:VCARD/i.test(text) || /^(?:[A-Za-z0-9-]+\.)?TEL[;:]/im.test(text);
  let raw: ParsedContact[];
  let skipped = 0;
  if (isVCard) {
    const r = parseVCards(text);
    raw = r.cards; skipped = r.skipped;
  } else {
    const r = parsePlain(text);
    raw = r.list; skipped = r.skipped;
  }
  const seen = new Set<string>();
  const contacts: ParsedContact[] = [];
  let duplicatesInPaste = 0;
  for (const c of raw) {
    const key = c.phone.replace(/\D/g, '').slice(-9);
    if (seen.has(key)) { duplicatesInPaste++; continue; }
    seen.add(key);
    if (contacts.length < MAX_CONTACTS) contacts.push(c);
  }
  return { contacts, duplicatesInPaste, skipped };
}
