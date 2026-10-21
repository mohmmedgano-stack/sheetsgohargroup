import React, { useMemo, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, PhoneCall, Star, Users } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ClientLead } from '../../types';
import { buildActivity, groupByDay } from '../../utils/activity';
import { formatDayLabel, localDayKey } from '../../utils/interactionDate';
import {
  AccountChips,
  Avatar,
  Empty,
  InteractionRow,
  StatusSummary,
  roleLabel,
} from './ActivityParts';

const shiftDay = (key: string, delta: number) => {
  const [y, m, d] = key.split('-').map(Number);
  return localDayKey(new Date(y, m - 1, d + delta));
};

/** لوحة التحكم المبسطة: كل الحسابات قدامك، اضغط على أي حساب تشوف شغله النهاردة وفي أي يوم فات. */
export const ActivityDashboard: React.FC<{ onOpenHistory?: (c: ClientLead) => void }> = ({ onOpenHistory }) => {
  const { users, clients, currentUser } = useApp();
  const isManager = currentUser.role === 'ADMIN' || currentUser.role === 'SALES_MANAGER';

  const visibleUsers = useMemo(
    () => (isManager ? users : users.filter(u => u.id === currentUser.id)),
    [isManager, users, currentUser.id]
  );

  const todayKey = localDayKey(new Date());
  const [selectedId, setSelectedId] = useState<string | null>(isManager ? null : currentUser.id);
  const [dayKey, setDayKey] = useState(todayKey);

  const activity = useMemo(() => buildActivity(users, clients), [users, clients]);

  const todayCountFor = (uid: string) =>
    (activity.get(uid) || []).filter(i => i.when && localDayKey(i.when) === todayKey).length;

  const totalToday = visibleUsers.reduce((s, u) => s + todayCountFor(u.id), 0);
  const scopedClients = isManager ? clients : clients.filter(c => c.assignedUserId === currentUser.id);
  const interestedNow = scopedClients.filter(c => c.status === 'مهتم').length;

  const selected = visibleUsers.find(u => u.id === selectedId) || null;
  const items = selected ? activity.get(selected.id) || [] : [];
  const byDay = useMemo(() => groupByDay(items), [items]);
  const dayItems = byDay.get(dayKey) || [];
  const activeDays = useMemo(
    () => Array.from(byDay.entries()).sort((a, b) => (a[0] < b[0] ? 1 : -1)).slice(0, 30),
    [byDay]
  );
  const interestedClients = selected
    ? scopedClients.filter(c => c.assignedUserId === selected.id && c.status === 'مهتم')
    : [];

  return (
    <div className="space-y-4 text-slate-900" dir="rtl">
      {/* أرقام سريعة */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <Tile icon={<Users className="w-4 h-4" />} label="عملاء الشيت" value={scopedClients.length} />
        <Tile icon={<Star className="w-4 h-4" />} label="مهتم حالياً" value={interestedNow} />
        <Tile icon={<PhoneCall className="w-4 h-4" />} label="تفاعلات النهاردة" value={totalToday} />
      </div>

      {/* الحسابات */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="font-black text-base mb-1">الحسابات</h2>
        <p className="text-xs text-slate-500 mb-3">اضغط على أي حساب عشان تشوف عمل إيه النهاردة وفي الأيام اللي فاتت.</p>
        <AccountChips
          users={visibleUsers}
          selectedId={selectedId}
          onSelect={id => {
            setSelectedId(id === selectedId && isManager ? null : id);
            setDayKey(todayKey);
          }}
          badge={u => todayCountFor(u.id)}
        />
      </div>

      {/* تقرير الحساب المختار */}
      {selected && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <Avatar user={selected} size={44} />
            <div className="min-w-0">
              <div className="font-black text-base truncate">{selected.name}</div>
              <div className="text-xs text-slate-500">{roleLabel(selected)}</div>
            </div>
          </div>

          {/* التنقل بين الأيام */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setDayKey(shiftDay(dayKey, -1))}
              className="p-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50"
              aria-label="اليوم السابق"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <input
              type="date"
              value={dayKey}
              max={todayKey}
              onChange={e => e.target.value && setDayKey(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm"
            />
            <button
              type="button"
              disabled={dayKey >= todayKey}
              onClick={() => setDayKey(shiftDay(dayKey, 1))}
              className="p-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40"
              aria-label="اليوم التالي"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {dayKey !== todayKey && (
              <button
                type="button"
                onClick={() => setDayKey(todayKey)}
                className="px-3 py-2 rounded-lg bg-emerald-700 text-white text-sm font-bold"
              >
                النهاردة
              </button>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <CalendarDays className="w-4 h-4 text-emerald-700" />
              <h3 className="font-bold text-sm">
                {dayKey === todayKey ? 'عمل إيه النهاردة' : 'عمل إيه يوم'} — {formatDayLabel(dayKey)} ({dayItems.length})
              </h3>
            </div>
            {dayItems.length === 0 ? (
              <Empty text="مفيش أي تفاعل مسجل في اليوم ده." />
            ) : (
              <div className="space-y-2">
                <StatusSummary items={dayItems} />
                {dayItems.map(i => (
                  <InteractionRow key={i.id} item={i} onOpen={onOpenHistory ? () => { const c = clients.find(x => x.id === i.clientId); if (c) onOpenHistory(c); } : undefined} />
                ))}
              </div>
            )}
          </div>

          {/* الأيام اللي اشتغل فيها */}
          {activeDays.length > 0 && (
            <div>
              <h3 className="font-bold text-sm mb-2">الأيام اللي اشتغل فيها (اضغط على يوم)</h3>
              <div className="flex flex-wrap gap-2">
                {activeDays.map(([key, arr]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setDayKey(key)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-bold ${
                      key === dayKey
                        ? 'bg-emerald-700 text-white border-emerald-700'
                        : 'bg-white text-slate-700 border-slate-300 hover:border-emerald-500'
                    }`}
                  >
                    {formatDayLabel(key).replace(/ \d{4}$/, '')} · {arr.length}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* العملاء المهتمين */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-4 h-4 text-amber-500" />
              <h3 className="font-bold text-sm">العملاء المهتمين ({interestedClients.length})</h3>
            </div>
            {interestedClients.length === 0 ? (
              <Empty text="مفيش عملاء مهتمين حالياً عند الحساب ده." />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {interestedClients.map(c => (
                  <div key={c.id} className="p-3 rounded-xl border border-emerald-200 bg-emerald-50">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-sm truncate">{c.name}</span>
                      <span className="text-[11px] font-mono text-slate-600" dir="ltr">{c.phone}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">{c.projectName}</div>
                    {c.notes && <p className="text-xs text-slate-700 mt-1 break-words">{c.notes}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const Tile: React.FC<{ icon: React.ReactNode; label: string; value: number }> = ({ icon, label, value }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-3 sm:p-4 shadow-sm">
    <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-slate-500 font-bold">
      {icon}
      <span className="truncate">{label}</span>
    </div>
    <div className="text-2xl sm:text-3xl font-black text-emerald-800 mt-1">{value}</div>
  </div>
);
