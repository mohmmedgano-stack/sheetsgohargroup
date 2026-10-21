import { CallStatus, ClientLead, User } from '../types';
import { parseInteractionDate, localDayKey } from './interactionDate';

export interface ActivityItem {
  id: string;
  clientId: string;
  clientName: string;
  phone: string;
  projectName: string;
  status: CallStatus;
  note: string;
  when: Date | null;
  isVoiceNote?: boolean;
}

export const ROLE_LABEL: Record<string, string> = {
  ADMIN: 'مدير عام',
  SALES_MANAGER: 'مدير مبيعات',
  SALES_REP: 'موظف مبيعات',
};

const norm = (s: string | undefined | null) => (s || '').replace(/\s+/g, ' ').trim().toLowerCase();

/** كل تفاعلات كل موظف (الأحدث أولاً) — بتتجمّع من سجل ملاحظات العملاء. */
export function buildActivity(users: User[], clients: ClientLead[]): Map<string, ActivityItem[]> {
  const idByName = new Map<string, string>();
  users.forEach(u => idByName.set(norm(u.name), u.id));

  const result = new Map<string, ActivityItem[]>();
  users.forEach(u => result.set(u.id, []));

  const push = (authorName: string | undefined, item: ActivityItem) => {
    const uid = idByName.get(norm(authorName));
    if (!uid) return;
    result.get(uid)!.push(item);
  };

  clients.forEach(c => {
    if (c.notesHistory && c.notesHistory.length > 0) {
      c.notesHistory.forEach(n =>
        push(n.authorName, {
          id: `${c.id}:${n.id}`,
          clientId: c.id,
          clientName: c.name,
          phone: c.phone,
          projectName: c.projectName,
          status: n.status,
          note: n.note,
          when: parseInteractionDate(n),
          isVoiceNote: n.isVoiceNote,
        })
      );
    } else if (c.notes) {
      // ملاحظة قديمة بدون سجل: بننسبها للموظف المسؤول
      push(c.assignedUserName, {
        id: `legacy-${c.id}`,
        clientId: c.id,
        clientName: c.name,
        phone: c.phone,
        projectName: c.projectName,
        status: c.status,
        note: c.notes,
        when: parseInteractionDate({ date: c.lastInteractionDate || c.updatedAt }),
      });
    }
  });

  result.forEach(list => list.sort((a, b) => (b.when?.getTime() ?? 0) - (a.when?.getTime() ?? 0)));
  return result;
}

export function groupByDay(items: ActivityItem[]): Map<string, ActivityItem[]> {
  const map = new Map<string, ActivityItem[]>();
  items.forEach(i => {
    if (!i.when) return;
    const key = localDayKey(i.when);
    const arr = map.get(key) || [];
    arr.push(i);
    map.set(key, arr);
  });
  return map;
}

export const statusChip = (status: CallStatus): string => {
  const green = 'bg-emerald-100 text-emerald-800 border-emerald-300';
  const red = 'bg-red-100 text-red-800 border-red-300';
  const map: Partial<Record<CallStatus, string>> = {
    'مهتم': green,
    'متعاقد': 'bg-amber-100 text-amber-800 border-amber-300',
    'هرجع اكلمه تاني': 'bg-sky-100 text-sky-800 border-sky-300',
    'مش مهتم': red,
    'الرقم غلط': red,
    'قفل الخط في وشي': red,
  };
  return map[status] || 'bg-slate-100 text-slate-700 border-slate-300';
};
