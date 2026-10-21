import React, { useEffect, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface Rejected { name?: string; phone?: string; ownerName?: string }

/** Shown when the server refused numbers that already exist in the CRM (the first person to add a number keeps it). */
export const DuplicateToast: React.FC = () => {
  const [items, setItems] = useState<Rejected[] | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const onDup = (e: Event) => {
      setItems((e as CustomEvent<Rejected[]>).detail || []);
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => setItems(null), 12000);
    };
    window.addEventListener('gohar:duplicates', onDup);
    return () => {
      window.removeEventListener('gohar:duplicates', onDup);
      if (timer) clearTimeout(timer);
    };
  }, []);

  if (!items || items.length === 0) return null;
  const first = items[0];
  return (
    <div role="alert" dir="rtl" className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] w-[min(92vw,420px)] rounded-2xl bg-white border border-amber-300 shadow-xl p-3.5 text-slate-900 flex items-start gap-2.5">
      <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
      <div className="text-xs leading-relaxed flex-1">
        <div className="font-black text-sm">
          {items.length === 1 ? 'الرقم ده موجود في الـCRM قبل كده ومتضافش' : `${items.length} أرقام موجودة قبل كده ومتضافوش`}
        </div>
        {items.length === 1 ? (
          <div className="mt-1 text-slate-600">
            {first.phone}{first.ownerName ? ` - مسجل عند ${first.ownerName}` : ''}
          </div>
        ) : (
          <ul className="mt-1 text-slate-600 max-h-28 overflow-y-auto">
            {items.slice(0, 20).map((r, i) => (
              <li key={i}>{r.phone}{r.ownerName ? ` - عند ${r.ownerName}` : ''}</li>
            ))}
            {items.length > 20 && <li>... و{items.length - 20} كمان</li>}
          </ul>
        )}
      </div>
      <button type="button" onClick={() => setItems(null)} aria-label="إغلاق" className="text-slate-400 hover:text-slate-700">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
