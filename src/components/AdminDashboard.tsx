import React, { useState } from 'react';
import { Shield, Star, Users } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ClientLead } from '../types';
import { ActivityDashboard } from './activity/ActivityDashboard';
import { AuditLogView } from './AuditLogView';
import { SalesPerformanceReviewView } from './SalesPerformanceReviewView';

type Tab = 'ACTIVITY' | 'REVIEWS' | 'AUDIT';

/** لوحة التحكم المبسطة: نشاط الحسابات + (تقييم الأداء) + (سجل الرقابة للمدير العام). */
export const AdminDashboard: React.FC<{ onOpenHistoryModal?: (c: ClientLead) => void }> = ({ onOpenHistoryModal }) => {
  const { currentUser } = useApp();
  const [tab, setTab] = useState<Tab>('ACTIVITY');

  const tabs: Array<{ id: Tab; label: string; icon: React.ReactNode; show: boolean }> = [
    { id: 'ACTIVITY', label: 'نشاط الحسابات', icon: <Users className="w-4 h-4" />, show: true },
    { id: 'REVIEWS', label: 'تقييم الأداء', icon: <Star className="w-4 h-4" />, show: true },
    { id: 'AUDIT', label: 'سجل الرقابة', icon: <Shield className="w-4 h-4" />, show: currentUser.role === 'ADMIN' },
  ];

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs
          .filter(t => t.show)
          .map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`shrink-0 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 border transition ${
                tab === t.id
                  ? 'bg-emerald-700 text-white border-emerald-700 shadow'
                  : 'bg-white text-slate-700 border-slate-300 hover:border-emerald-500'
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
      </div>

      {tab === 'ACTIVITY' && <ActivityDashboard onOpenHistory={onOpenHistoryModal} />}
      {tab === 'REVIEWS' && <SalesPerformanceReviewView />}
      {tab === 'AUDIT' && currentUser.role === 'ADMIN' && <AuditLogView />}
    </div>
  );
};
