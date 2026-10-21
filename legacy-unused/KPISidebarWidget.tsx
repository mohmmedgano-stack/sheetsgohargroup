import React from 'react';
import { useApp } from '../context/AppContext';
import {
  Activity,
  PhoneCall,
  TrendingUp,
  Award,
  Clock,
  CheckCircle2,
  Sparkles,
  Zap,
} from 'lucide-react';
import {
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts';
import { toLocalDateStr } from '../utils/dates';

export const KPISidebarWidget: React.FC = () => {
  const { clients, users, currentUser, getDailyProgressForUser, themeMode } = useApp();
  const isLight = themeMode === 'light';

  // Aggregate stats across team
  const totalClients = clients.length;
  const interestedClients = clients.filter(c => c.status === 'مهتم').length;
  const contractedClients = clients.filter(c => c.status === 'متعاقد').length;
  const callbacks = clients.filter(c => c.status === 'هرجع اكلمه تاني').length;
  const pendingTodayFollowUps = clients.filter(
    c => c.followUpDate === toLocalDateStr()
  ).length;

  // Conversion rate to interested & contracted
  const conversionRate = totalClients > 0 ? (((interestedClients + contractedClients) / totalClients) * 100).toFixed(1) : '0';

  // Total calls today across sales reps
  const totalCallsToday = users.reduce((acc, u) => acc + getDailyProgressForUser(u.id).callsToday, 0);
  const totalDailyQuota = users.reduce((acc, u) => acc + (u.dailyQuota || 100), 0) || 500;
  const teamDailyPercentage = Math.min(100, Math.round((totalCallsToday / totalDailyQuota) * 100));

  const radialData = [
    {
      name: 'إنجاز اليوم',
      value: teamDailyPercentage,
      fill: '#2A6B5C',
    },
  ];

  const conversionPieData = [
    { name: 'عقود واهتمام', value: interestedClients + contractedClients || 1, color: '#10B981' },
    { name: 'متابعات قيد التواصل', value: callbacks || 1, color: '#2A6B5C' },
    { name: 'عملاء آخرين', value: Math.max(1, totalClients - (interestedClients + contractedClients + callbacks)), color: '#475569' },
  ];

  return (
    <div className={`p-5 rounded-3xl border shadow-xl space-y-4 ${
      isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#000000] border-slate-800 text-slate-100'
    }`}>
      
      {/* Widget Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/40">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-[#2A6B5C] animate-pulse" />
          <h3 className="font-black text-sm text-[#7AB0A0]">مؤشرات الأداء اللحظية (KPIs)</h3>
        </div>
        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-500/20 text-slate-300 border border-slate-500/40">
          مباشر ⚡
        </span>
      </div>

      {/* Metric 1: Daily Calls with Recharts Gauge */}
      <div className="p-3.5 bg-black/20 rounded-2xl border border-white/5 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold flex items-center gap-1">
            <PhoneCall className="w-3.5 h-3.5 text-[#2A6B5C]" />
            <span>مكالمات اليوم للفريق:</span>
          </span>
          <span className="font-mono font-black text-[#7AB0A0]">{totalCallsToday} / {totalDailyQuota}</span>
        </div>

        <div className="w-full bg-black/40 rounded-full h-2.5 overflow-hidden border border-white/10">
          <div
            className="bg-gradient-to-r from-[#4F9282] to-[#2A6B5C] h-full rounded-full transition-all duration-500"
            style={{ width: `${teamDailyPercentage}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] opacity-75">
          <span>نسبة الإنجاز: {teamDailyPercentage}%</span>
          <span>تارجت اليوم: {totalDailyQuota} كول</span>
        </div>
      </div>

      {/* Metric 2: Conversion Rate with Recharts Donut */}
      <div className="p-3.5 bg-black/20 rounded-2xl border border-white/5 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-slate-400" />
            <span>نسبة التحويل لعقود واهتمام:</span>
          </span>
          <span className="font-mono font-black text-slate-400 text-sm">{conversionRate}%</span>
        </div>

        <div className="h-28 w-full" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={conversionPieData}
                cx="50%"
                cy="50%"
                innerRadius={30}
                outerRadius={45}
                paddingAngle={3}
                dataKey="value"
              >
                {conversionPieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: isLight ? '#FFFFFF' : '#1c1c1e',
                  borderColor: '#2A6B5C',
                  borderRadius: '8px',
                  fontSize: '11px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-2 gap-1 text-[10px]">
          <div className="flex items-center gap-1 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-slate-500" />
            <span>مهتم + متعاقد ({interestedClients + contractedClients})</span>
          </div>
          <div className="flex items-center gap-1 text-[#7AB0A0]">
            <span className="w-2 h-2 rounded-full bg-[#2A6B5C]" />
            <span>متابعات ({callbacks})</span>
          </div>
        </div>
      </div>

      {/* Metric 3: Today's Follow-Ups */}
      <div className="p-3 bg-[#2A6B5C]/10 border border-[#2A6B5C]/30 rounded-2xl flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#4F9282]" />
          <span className="font-bold text-[#A8CCC0]">فولو اب مستحق اليوم:</span>
        </div>
        <span className="font-black font-mono text-[#7AB0A0] text-sm">{pendingTodayFollowUps} موعد</span>
      </div>

    </div>
  );
};
