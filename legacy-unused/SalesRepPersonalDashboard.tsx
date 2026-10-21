import React from 'react';
import { useApp } from '../context/AppContext';
import { User } from '../types';
import {
  Target,
  PhoneCall,
  Award,
  TrendingUp,
  CheckCircle2,
  Calendar,
  Clock,
  Flame,
  Sparkles,
  Zap,
  Building,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  RadialBarChart,
  RadialBar,
} from 'recharts';

interface SalesRepPersonalDashboardProps {
  user?: User;
}

export const SalesRepPersonalDashboard: React.FC<SalesRepPersonalDashboardProps> = ({ user }) => {
  const { currentUser, clients, getDailyProgressForUser, themeMode } = useApp();
  const targetUser = user || currentUser;
  const isLight = themeMode === 'light';

  const userClients = clients.filter(c => c.assignedUserId === targetUser.id);
  const { callsToday, dailyQuota, percentage } = getDailyProgressForUser(targetUser.id);

  // Weekly metrics calculation
  const weeklyTarget = (targetUser.dailyQuota || 100) * 5; // 5 working days
  const hotLeads = userClients.filter(c => c.status === 'مهتم').length;
  const contractedLeads = userClients.filter(c => c.status === 'متعاقد').length;
  const callbacks = userClients.filter(c => c.status === 'هرجع اكلمه تاني').length;
  const noAnswer = userClients.filter(c => c.status === 'مش بيرد' || c.status === 'غير متاح').length;

  // Approximate calls this week (today calls + past activity proxy based on userClients with interaction)
  const contactedThisWeek = userClients.filter(c => c.status !== 'جديد').length;
  const weeklyPercentage = Math.min(100, Math.round((contactedThisWeek / (weeklyTarget || 500)) * 100));

  // Daily Breakdown Mock for Chart
  const weekDaysData = [
    { day: 'السبت', calls: Math.round(callsToday * 0.9), target: targetUser.dailyQuota || 100 },
    { day: 'الأحد', calls: Math.round(callsToday * 1.1), target: targetUser.dailyQuota || 100 },
    { day: 'الإثنين', calls: Math.round(callsToday * 0.95), target: targetUser.dailyQuota || 100 },
    { day: 'الثلاثاء', calls: Math.round(callsToday * 1.05), target: targetUser.dailyQuota || 100 },
    { day: 'الأربعاء', calls: callsToday, target: targetUser.dailyQuota || 100 },
  ];

  // Status Distribution Data for Pie Chart
  const statusPieData = [
    { name: 'مهتم', value: hotLeads || 1, color: '#10B981' },
    { name: 'متعاقد', value: contractedLeads || 0, color: '#2A6B5C' },
    { name: 'متابعة', value: callbacks || 1, color: '#2A6B5C' },
    { name: 'مش بيرد / متاح', value: noAnswer || 1, color: '#F59E0B' },
    { name: 'غير مهتم / مغلق', value: userClients.filter(c => c.status === 'مش مهتم' || c.status === 'مغلق').length || 1, color: '#64748B' },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className={`p-6 rounded-3xl border shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 ${
        isLight
          ? 'bg-gradient-to-r from-slate-800 to-slate-900 text-white border-slate-700'
          : 'bg-gradient-to-r from-[#1c1c1e] to-[#000000] text-slate-100 border-[#2A6B5C]/50'
      }`}>
        <div className="flex items-center gap-4">
          <img
            src={targetUser.avatar || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150'}
            alt={targetUser.name}
            width={64}
            height={64}
            loading="lazy"
            decoding="async"
            className="w-16 h-16 rounded-2xl object-cover ring-2 ring-[#4F9282] shadow-md"
          />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-[#7AB0A0]">أهلاً بك، {targetUser.name} 👋</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#4F9282] text-gray-950">
                لوحة أدائي الشخصي
              </span>
            </div>
            <p className="text-xs text-slate-200/90 mt-1">
              المشروع المخصص: <strong>{targetUser.assignedProject || 'جميع المشاريع'}</strong> | إجمالي شيت العملاء الخاص بك: <strong>{userClients.length} عميل</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-3 bg-black/40 rounded-2xl border border-white/10 text-center min-w-[120px]">
            <span className="text-[10px] text-slate-300 block">إنجاز اليوم</span>
            <span className="text-xl font-black text-[#7AB0A0] font-mono">{callsToday} / {dailyQuota}</span>
            <span className="text-[10px] opacity-75 font-bold">({percentage}%)</span>
          </div>

          <div className="p-3 bg-black/40 rounded-2xl border border-white/10 text-center min-w-[120px]">
            <span className="text-[10px] text-slate-300 block">إنجاز الأسبوع</span>
            <span className="text-xl font-black text-slate-400 font-mono">{contactedThisWeek} / {weeklyTarget}</span>
            <span className="text-[10px] opacity-75 font-bold">({weeklyPercentage}%)</span>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Today Target Progress */}
        <div className={`p-5 rounded-3xl border shadow-md space-y-2 ${
          isLight ? 'bg-white border-slate-200' : 'bg-[#000000] border-slate-800'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">المستهدف اليومي</span>
            <Target className="w-5 h-5 text-[#4F9282]" />
          </div>
          <div className="text-2xl font-black text-[#7AB0A0] font-mono">
            {callsToday} <span className="text-xs opacity-70 font-normal">من {dailyQuota} مكالمة</span>
          </div>
          <div className="w-full bg-black/30 rounded-full h-2.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                percentage >= 100 ? 'bg-slate-500' : 'bg-[#4F9282]'
              }`}
              style={{ width: `${Math.min(100, percentage)}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-400 font-medium">
            {percentage >= 100 ? '🎉 أحسنت! حققت تارجت اليوم بالكامل' : `متبقي ${Math.max(0, dailyQuota - callsToday)} مكالمة للوصول للتارجت`}
          </p>
        </div>

        {/* Card 2: Hot Leads */}
        <div className={`p-5 rounded-3xl border shadow-md space-y-2 ${
          isLight ? 'bg-white border-slate-200' : 'bg-[#000000] border-slate-800'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">العملاء المهتمين (Hot Leads)</span>
            <Flame className="w-5 h-5 text-red-500" />
          </div>
          <div className="text-2xl font-black text-slate-400 font-mono">
            {hotLeads} <span className="text-xs opacity-70 font-normal">عميل مهتم</span>
          </div>
          <p className="text-[11px] text-slate-300">
            يمثلون {userClients.length > 0 ? Math.round((hotLeads / userClients.length) * 100) : 0}% من شيت الداتا الخاص بك
          </p>
        </div>

        {/* Card 3: Contracted Deals */}
        <div className={`p-5 rounded-3xl border shadow-md space-y-2 ${
          isLight ? 'bg-white border-slate-200' : 'bg-[#000000] border-slate-800'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">العقود والاتفاقات الناجحة</span>
            <Award className="w-5 h-5 text-[#2A6B5C]" />
          </div>
          <div className="text-2xl font-black text-[#2A6B5C] font-mono">
            {contractedLeads} <span className="text-xs opacity-70 font-normal">عقد مبرم 🏆</span>
          </div>
          <p className="text-[11px] text-slate-300">
            معدل إغلاق ممتاز للزيارات والمعاينات
          </p>
        </div>

        {/* Card 4: Scheduled Callbacks */}
        <div className={`p-5 rounded-3xl border shadow-md space-y-2 ${
          isLight ? 'bg-white border-slate-200' : 'bg-[#000000] border-slate-800'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">المتابعات المجدولة</span>
            <Clock className="w-5 h-5 text-[#4F9282]" />
          </div>
          <div className="text-2xl font-black text-[#4F9282] font-mono">
            {callbacks} <span className="text-xs opacity-70 font-normal">متابعة لاحقة</span>
          </div>
          <p className="text-[11px] text-[#7AB0A0]">
            يجب متابعتهم في المواعيد المحددة
          </p>
        </div>

      </div>

      {/* Visual Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Weekly Performance Bar Chart */}
        <div className={`lg:col-span-2 p-5 rounded-3xl border shadow-xl space-y-4 ${
          isLight ? 'bg-white border-slate-200' : 'bg-[#000000] border-slate-800'
        }`}>
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-[#7AB0A0] flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#2A6B5C]" />
              <span>أدائي الأسبوعي مقارنة بالمستهدف (Weekly Calls vs Target)</span>
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">
              المجموع: {contactedThisWeek} / {weeklyTarget}
            </span>
          </div>

          <div className="h-64 w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekDaysData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isLight ? '#E2E8F0' : '#1E3A2F'} />
                <XAxis dataKey="day" stroke={isLight ? '#64748B' : '#94A3B8'} fontSize={11} />
                <YAxis stroke={isLight ? '#64748B' : '#94A3B8'} fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isLight ? '#FFFFFF' : '#1c1c1e',
                    borderColor: '#2A6B5C',
                    borderRadius: '12px',
                    color: isLight ? '#0F172A' : '#F8FAFC',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="calls" name="المكالمات المنجزة" fill="#2A6B5C" radius={[6, 6, 0, 0]} />
                <Bar dataKey="target" name="المستهدف اليومي" fill={isLight ? '#CBD5E1' : '#1E3A2F'} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Breakdown Donut Chart */}
        <div className={`p-5 rounded-3xl border shadow-xl space-y-4 ${
          isLight ? 'bg-white border-slate-200' : 'bg-[#000000] border-slate-800'
        }`}>
          <h3 className="font-extrabold text-sm text-[#7AB0A0] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#2A6B5C]" />
            <span>توزيع حالات عملائي (Lead Status)</span>
          </h3>

          <div className="h-48 w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {statusPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: isLight ? '#FFFFFF' : '#1c1c1e',
                    borderColor: '#2A6B5C',
                    borderRadius: '12px',
                    color: isLight ? '#0F172A' : '#F8FAFC',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 text-xs">
            {statusPieData.map(item => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="opacity-80">{item.name}</span>
                </div>
                <span className="font-bold font-mono text-[#7AB0A0]">{item.value} عميل</span>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
