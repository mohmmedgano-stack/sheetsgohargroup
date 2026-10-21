import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ClientLead } from '../../types';
import { ActivityItem, buildActivity, groupByDay } from '../../utils/activity';
import { formatDayLabel, localDayKey } from '../../utils/interactionDate';
import { AccountChips, Empty, InteractionRow, StatusSummary } from './ActivityParts';

const WEEK = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];

/** التقويم: كل الحسابات ظاهرة، اضغط على حساب (أو "الكل") ثم على أي يوم تشوف الشغل. */
export const ActivityCalendar: React.FC<{ onOpenHistory?: (c: ClientLead) => void }> = ({ onOpenHistory }) => {
  const { users, clients, currentUser } = useApp();
  const isManager = currentUser.role === 'ADMIN' || currentUser.role === 'SALES_MANAGER';
  const visibleUsers = useMemo(
    () => (isManager ? users : users.filter(u => u.id === currentUser.id)),
    [isManager, users, currentUser.id]
  );

  const todayKey = localDayKey(new Date());
  const [selectedId, setSelectedId] = useState<string | null>(isManager ? null : currentUser.id);
  const [dayKey, setDayKey] = useState(todayKey);
  const [month, setMonth] = useState(() => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), 1);
  });

  const activity = useMemo(() => buildActivity(users, clients), [users, clients]);

  // كل التفاعلات في النطاق المختار، مع اسم صاحبها
  const scoped = useMemo(() => {
    const out: Array<ActivityItem & { who: string }> = [];
    visibleUsers.forEach(u => {
      if (selectedId && u.id !== selectedId) return;
      (activity.get(u.id) || []).forEach(i => out.push({ ...i, who: u.name }));
    });
    return out;
  }, [visibleUsers, selectedId, activity]);

  const byDay = useMemo(() => groupByDay(scoped) as Map<string, Array<ActivityItem & { who: string }>>, [scoped]);

  const cells = useMemo(() => {
    const y = month.getFullYear();
    const m = month.getMonth();
    const first = new Date(y, m, 1);
    const lead = (first.getDay() + 1) % 7; // السبت = 0
    const days = new Date(y, m + 1, 0).getDate();
    const arr: Array<string | null> = Array(lead).fill(null);
    for (let d = 1; d <= days; d++) arr.push(localDayKey(new Date(y, m, d)));
    while (arr.length % 7) arr.push(null);
    return arr;
  }, [month]);

  const dayItems = byDay.get(dayKey) || [];
  const monthTitle = month.toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-4 text-slate-900" dir="rtl">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="font-black text-base mb-1">التقويم</h2>
        <p className="text-xs text-slate-500 mb-3">اختار حساب (أو "الكل") ثم اضغط على أي يوم تشوف اتعمل فيه إيه.</p>
        <AccountChips users={visibleUsers} selectedId={selectedId} onSelect={setSelectedId} showAll={isManager} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[340px_minmax(0,1fr)] items-start">
      <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm lg:sticky lg:top-24">
        <div className="flex items-center justify-between mb-3">
          <button
            type="button"
            onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
            className="p-2 rounded-lg border border-slate-300 hover:bg-slate-50"
            aria-label="الشهر السابق"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <div className="font-black text-sm sm:text-base">{monthTitle}</div>
          <button
            type="button"
            onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
            className="p-2 rounded-lg border border-slate-300 hover:bg-slate-50"
            aria-label="الشهر التالي"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-[10px] sm:text-xs font-bold text-slate-500 mb-1">
          {WEEK.map(w => (
            <div key={w} className="truncate">{w}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((key, idx) => {
            if (!key) return <div key={`e${idx}`} />;
            const n = byDay.get(key)?.length || 0;
            const isSel = key === dayKey;
            const isToday = key === todayKey;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setDayKey(key)}
                className={`relative h-10 sm:h-11 rounded-lg border text-xs font-bold flex flex-col items-center justify-center transition ${
                  isSel
                    ? 'bg-emerald-700 text-white border-emerald-700 shadow'
                    : n > 0
                    ? 'bg-emerald-50 border-emerald-300 text-slate-900 hover:border-emerald-600'
                    : 'bg-white border-slate-200 text-slate-500 hover:border-slate-400'
                } ${isToday && !isSel ? 'ring-2 ring-amber-400' : ''}`}
              >
                <span>{Number(key.slice(8))}</span>
                {n > 0 && (
                  <span
                    className={`text-[9px] sm:text-[10px] leading-none mt-0.5 px-1 rounded-full ${
                      isSel ? 'bg-white text-emerald-800' : 'bg-emerald-600 text-white'
                    }`}
                  >
                    {n}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3 min-w-0">
        <h3 className="font-bold text-sm">
          {formatDayLabel(dayKey)} ({dayItems.length} تفاعل)
        </h3>
        {dayItems.length === 0 ? (
          <Empty text="مفيش أي تفاعل مسجل في اليوم ده." />
        ) : (
          <>
            <StatusSummary items={dayItems} />
            <div className="space-y-2">
              {dayItems.map(i => (
                <InteractionRow key={i.id} item={i} showWho={selectedId ? undefined : i.who} onOpen={onOpenHistory ? () => { const c = clients.find(x => x.id === i.clientId); if (c) onOpenHistory(c); } : undefined} />
              ))}
            </div>
          </>
        )}
      </div>
      </div>
    </div>
  );
};
