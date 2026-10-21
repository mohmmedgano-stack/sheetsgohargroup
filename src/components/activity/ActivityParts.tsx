import React, { useState } from 'react';
import { Building, Clock, Phone, UserCircle2 } from 'lucide-react';
import { User } from '../../types';
import { ActivityItem, ROLE_LABEL, statusChip } from '../../utils/activity';
import { formatTime } from '../../utils/interactionDate';

/** دايرة الصورة (أو أول حرف من الاسم لو الصورة مش موجودة/باظت) */
export const Avatar: React.FC<{ user: User; size?: number }> = ({ user, size = 36 }) => {
  const [failed, setFailed] = useState(false);
  const style = { width: size, height: size };
  if (user.avatar && !failed) {
    return (
      <img
        src={user.avatar}
        alt=""
        style={style}
        className="rounded-full object-cover shrink-0 border border-slate-200"
        onError={() => setFailed(true)}
      />
    );
  }
  return (
    <div
      style={style}
      className="rounded-full bg-emerald-700 text-white font-black flex items-center justify-center shrink-0 text-sm"
    >
      {user.name.trim().charAt(0)}
    </div>
  );
};

interface AccountChipsProps {
  users: User[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  /** عدّاد صغير على كل حساب (مثلاً تفاعلات اليوم) */
  badge?: (user: User) => number;
  showAll?: boolean;
}

/** كل الحسابات ظاهرة قدامك — اضغط على أي واحد */
export const AccountChips: React.FC<AccountChipsProps> = ({ users, selectedId, onSelect, badge, showAll }) => (
  <div className="flex flex-wrap gap-2">
    {showAll && (
      <button
        type="button"
        onClick={() => onSelect(null)}
        className={`px-4 py-2 rounded-full border text-sm font-bold transition ${
          selectedId === null
            ? 'bg-emerald-700 text-white border-emerald-700 shadow'
            : 'bg-white text-slate-700 border-slate-300 hover:border-emerald-500'
        }`}
      >
        الكل
      </button>
    )}
    {users.map(u => {
      const active = selectedId === u.id;
      const n = badge ? badge(u) : 0;
      return (
        <button
          key={u.id}
          type="button"
          onClick={() => onSelect(u.id)}
          className={`flex items-center gap-1.5 sm:gap-2 pr-1 sm:pr-1.5 pl-2.5 sm:pl-3 py-1 sm:py-1.5 rounded-full border text-xs sm:text-sm font-bold transition max-w-full ${
            active
              ? 'bg-emerald-700 text-white border-emerald-700 shadow'
              : 'bg-white text-slate-800 border-slate-300 hover:border-emerald-500'
          }`}
        >
          <Avatar user={u} size={26} />
          <span className="truncate max-w-[6.2rem] sm:max-w-[14rem]">{u.name}</span>
          {n > 0 && (
            <span
              className={`min-w-[1.4rem] h-[1.4rem] px-1 rounded-full text-[11px] flex items-center justify-center font-black ${
                active ? 'bg-white text-emerald-800' : 'bg-emerald-600 text-white'
              }`}
            >
              {n}
            </span>
          )}
        </button>
      );
    })}
  </div>
);

export const roleLabel = (u: User) =>
  `${ROLE_LABEL[u.role] || u.role}${u.activeStatus === 'inactive' ? ' • موقوف' : ''}${
    u.activeStatus === 'pending_approval' ? ' • في انتظار الموافقة' : ''
  }`;

/** صف تفاعل واحد */
export const InteractionRow: React.FC<{ item: ActivityItem; showWho?: string; onOpen?: () => void }> = ({ item, showWho, onOpen }) => (
  <div
    onClick={onOpen}
    className={`p-3 rounded-xl border border-slate-200 bg-white flex flex-col gap-1.5 ${onOpen ? 'cursor-pointer hover:border-emerald-500' : ''}`}
  >
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex items-center gap-2 min-w-0">
        <UserCircle2 className="w-4 h-4 shrink-0 text-slate-400" />
        <span className="font-bold text-sm text-slate-900 truncate">{item.clientName}</span>
        <span className="text-[11px] font-mono text-slate-500 flex items-center gap-1" dir="ltr">
          <Phone className="w-3 h-3" />
          {item.phone}
        </span>
      </div>
      <div className="flex items-center gap-2">
        {item.when && (
          <span className="text-[11px] flex items-center gap-1 text-slate-500">
            <Clock className="w-3 h-3" />
            {formatTime(item.when)}
          </span>
        )}
        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${statusChip(item.status)}`}>
          {item.status}
        </span>
      </div>
    </div>
    {item.note && <p className="text-xs leading-relaxed text-slate-700 break-words">{item.note}</p>}
    <div className="text-[10px] flex flex-wrap items-center gap-x-3 text-slate-500">
      <span className="flex items-center gap-1">
        <Building className="w-3 h-3" />
        {item.projectName}
      </span>
      {showWho && <span className="font-bold text-emerald-700">👤 {showWho}</span>}
      {item.isVoiceNote && <span>🎙️ ملاحظة صوتية</span>}
    </div>
  </div>
);

export const StatusSummary: React.FC<{ items: ActivityItem[] }> = ({ items }) => {
  const counts = new Map<string, number>();
  items.forEach(i => counts.set(i.status, (counts.get(i.status) || 0) + 1));
  const sorted = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  if (sorted.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {sorted.map(([st, n]) => (
        <span key={st} className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${statusChip(st as any)}`}>
          {st}: {n}
        </span>
      ))}
    </div>
  );
};

export const Empty: React.FC<{ text: string }> = ({ text }) => (
  <p className="text-xs p-4 rounded-xl border border-dashed border-slate-300 text-slate-500 text-center">{text}</p>
);
