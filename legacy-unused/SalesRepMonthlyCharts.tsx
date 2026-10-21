import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import { User, ClientLead } from '../types';
import {
  BarChart3,
  TrendingUp,
  Award,
  Users,
  Calendar,
  Sparkles,
  PieChart as PieIcon,
  ChevronDown,
  Target,
  Flame,
  CheckCircle2,
} from 'lucide-react';

interface SalesRepMonthlyChartsProps {
  clients: ClientLead[];
  users: User[];
}

const PALETTE = [
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#2A6B5C', // Blue
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#F97316', // Orange
  '#14B8A6', // Teal
];

export const SalesRepMonthlyCharts: React.FC<SalesRepMonthlyChartsProps> = ({
  clients,
  users,
}) => {
  const { themeMode } = useApp();
  const isLight = themeMode === 'light';

  const salesUsers = useMemo(() => users.filter(u => u.role === 'SALES_REP'), [users]);

  // Current month / year defaults
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed

  // Month filter state
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [chartViewMode, setChartViewMode] = useState<'bar_status' | 'bar_total' | 'trend'>('bar_status');

  // Month options for Arabic display
  const monthsArabic = [
    'يناير (1)',
    'فبراير (2)',
    'مارس (3)',
    'أبريل (4)',
    'مايو (5)',
    'يونيو (6)',
    'يوليو (7)',
    'أغسطس (8)',
    'سبتمبر (9)',
    'أكتوبر (10)',
    'نوفمبر (11)',
    'ديسمبر (12)',
  ];

  // Filter clients belonging to the selected month & year
  const monthlyClients = useMemo(() => {
    return clients.filter(client => {
      const dateStr = client.createdAt || client.lastInteractionDate;
      if (!dateStr) return true; // If no date, include in general pool if needed or fallback
      try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return true;
        return d.getFullYear() === selectedYear && d.getMonth() === selectedMonth;
      } catch {
        return true;
      }
    });
  }, [clients, selectedMonth, selectedYear]);

  // Data per sales representative for the selected month
  const salesRepChartData = useMemo(() => {
    return salesUsers.map((rep, idx) => {
      const repClients = monthlyClients.filter(c => c.assignedUserId === rep.id);
      const totalLeads = repClients.length;
      const interested = repClients.filter(c => c.status === 'مهتم').length;
      const callback = repClients.filter(c => c.status === 'هرجع اكلمه تاني' || c.status === 'مشغول دلوقتي').length;
      const closedOrNoAnswer = repClients.filter(
        c => c.status === 'غير متاح' || c.status === 'مغلق' || c.status === 'قفل الخط في وشي'
      ).length;
      const notInterested = repClients.filter(c => c.status === 'مش مهتم').length;
      const newLeads = repClients.filter(c => c.status === 'جديد').length;

      // Target monthly quota (approx 25 working days * dailyQuota)
      const monthlyTarget = (rep.dailyQuota || 100) * 25;
      const quotaAchievedPct = monthlyTarget > 0 ? Math.min(100, Math.round((totalLeads / monthlyTarget) * 100)) : 0;

      return {
        id: rep.id,
        name: rep.name.replace('(مبيعات)', '').trim(),
        fullName: rep.name,
        avatar: rep.avatar || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150',
        project: rep.assignedProject || 'عام',
        totalLeads,
        interested,
        callback,
        closedOrNoAnswer,
        notInterested,
        newLeads,
        monthlyTarget,
        quotaAchievedPct,
        color: PALETTE[idx % PALETTE.length],
      };
    }).sort((a, b) => b.totalLeads - a.totalLeads);
  }, [salesUsers, monthlyClients]);

  // Top Sales Rep of the Month
  const topSalesRep = useMemo(() => {
    if (salesRepChartData.length === 0) return null;
    return salesRepChartData[0].totalLeads > 0 ? salesRepChartData[0] : null;
  }, [salesRepChartData]);

  // Pie chart data for distribution share
  const pieChartData = useMemo(() => {
    const data = salesRepChartData
      .filter(item => item.totalLeads > 0)
      .map(item => ({
        name: item.name,
        value: item.totalLeads,
        color: item.color,
      }));

    if (data.length === 0) {
      return [{ name: 'لا توجد بيانات', value: 1, color: '#94a3b8' }];
    }
    return data;
  }, [salesRepChartData]);

  // Aggregate monthly totals
  const totalMonthlyLeads = monthlyClients.length;
  const totalInterestedMonthly = monthlyClients.filter(c => c.status === 'مهتم').length;
  const interestRate = totalMonthlyLeads > 0 ? ((totalInterestedMonthly / totalMonthlyLeads) * 100).toFixed(1) : '0';
  const averageLeadsPerRep = salesUsers.length > 0 ? Math.round(totalMonthlyLeads / salesUsers.length) : 0;

  // Custom Tooltip for Recharts Bar Chart
  const CustomBarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#000000] text-white p-3.5 rounded-xl border border-[#2A6B5C]/40 shadow-2xl text-xs space-y-1.5 font-sans text-right dir-rtl">
          <div className="flex items-center justify-between gap-3 border-b border-slate-700/60 pb-1.5">
            <span className="font-black text-[#7AB0A0] text-sm">{data.fullName}</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 text-slate-200 border border-slate-700 font-mono">
              {data.project}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 pt-1 text-[11px]">
            <div className="flex items-center justify-between gap-2">
              <span className="text-gray-300">إجمالي المضاف:</span>
              <strong className="text-[#A8CCC0] font-mono text-xs">{data.totalLeads}</strong>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-300">مهتم ⭐:</span>
              <strong className="text-slate-300 font-mono text-xs">{data.interested}</strong>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[#7AB0A0]">متابعة / إعادة اتصال:</span>
              <strong className="text-[#7AB0A0] font-mono text-xs">{data.callback}</strong>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-300">جديد:</span>
              <strong className="text-slate-200 font-mono text-xs">{data.newLeads}</strong>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-rose-300">غير متاح / مغلق:</span>
              <strong className="text-rose-300 font-mono text-xs">{data.closedOrNoAnswer}</strong>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-red-300">مش مهتم:</span>
              <strong className="text-red-300 font-mono text-xs">{data.notInterested}</strong>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`rounded-2xl border shadow-lg overflow-hidden space-y-5 p-5 ${
      isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#2c2c2e] border-slate-800 text-slate-100'
    }`}>
      
      {/* Top Header & Filter Controls */}
      <div className={`flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b ${
        isLight ? 'border-slate-200' : 'border-slate-800'
      }`}>
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className={`p-2.5 rounded-xl shadow-md ${
              isLight ? 'bg-slate-800 text-[#7AB0A0]' : 'bg-[#000000] text-[#2A6B5C] border border-[#2A6B5C]/30'
            }`}>
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className={`text-base sm:text-lg font-black flex items-center gap-2 ${
                isLight ? 'text-slate-900' : 'text-slate-100'
              }`}>
                <span>إحصائيات ورسوم بيانية لعملاء المبيعات الشهرية</span>
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                  isLight ? 'bg-slate-100 text-slate-900 border-slate-300' : 'bg-slate-950/70 text-slate-300 border-slate-700/50'
                }`}>
                  Recharts Analytics
                </span>
              </h2>
              <p className={`text-xs font-medium ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                رسم بياني تفاعلي يوضح حجم العملاء المضافين والموزعين لكل موظف مبيعات وتفاصيل حالات الاتصال خلال الشهر.
              </p>
            </div>
          </div>
        </div>

        {/* Month Selector & View Mode Switcher */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Month Selector */}
          <div className={`flex items-center gap-1.5 p-1.5 rounded-xl shadow-md ${
            isLight ? 'bg-slate-100 border border-slate-300' : 'bg-[#000000] border-2 border-[#2A6B5C]/50'
          }`}>
            <Calendar className={`w-4 h-4 mr-1 ${isLight ? 'text-slate-800' : 'text-[#2A6B5C]'}`} />
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(Number(e.target.value))}
              className={`font-black text-xs p-1.5 rounded-lg border focus:outline-none cursor-pointer ${
                isLight ? 'bg-white text-slate-800 border-slate-300' : 'bg-[#1c1c1e] text-[#D1E4DE] border-[#2A6B5C]/60'
              }`}
            >
              {monthsArabic.map((mName, idx) => (
                <option key={idx} value={idx} className={isLight ? 'bg-white text-slate-800' : 'bg-[#000000] text-[#D1E4DE]'}>
                  {mName}
                </option>
              ))}
            </select>

            <select
              value={selectedYear}
              onChange={e => setSelectedYear(Number(e.target.value))}
              className={`font-black text-xs p-1.5 rounded-lg border focus:outline-none cursor-pointer font-mono ${
                isLight ? 'bg-white text-slate-800 border-slate-300' : 'bg-[#1c1c1e] text-[#D1E4DE] border-[#2A6B5C]/60'
              }`}
            >
              <option value={2025} className={isLight ? 'bg-white text-slate-800' : 'bg-[#000000] text-[#D1E4DE]'}>2025</option>
              <option value={2026} className={isLight ? 'bg-white text-slate-800' : 'bg-[#000000] text-[#D1E4DE]'}>2026</option>
              <option value={2027} className={isLight ? 'bg-white text-slate-800' : 'bg-[#000000] text-[#D1E4DE]'}>2027</option>
            </select>
          </div>

          {/* Chart Display Mode Buttons */}
          <div className={`flex items-center p-1 rounded-xl border text-xs ${
            isLight ? 'bg-slate-100 border-slate-200' : 'bg-[#1c1c1e] border-slate-800'
          }`}>
            <button
              onClick={() => setChartViewMode('bar_status')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                chartViewMode === 'bar_status'
                  ? (isLight ? 'bg-slate-800 text-white shadow-sm' : 'bg-[#1c1c1e] text-[#7AB0A0] border border-[#2A6B5C]/40 shadow-sm')
                  : (isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-slate-200')
              }`}
            >
              تفصيل الحالات
            </button>
            <button
              onClick={() => setChartViewMode('bar_total')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                chartViewMode === 'bar_total'
                  ? (isLight ? 'bg-slate-800 text-white shadow-sm' : 'bg-[#1c1c1e] text-[#7AB0A0] border border-[#2A6B5C]/40 shadow-sm')
                  : (isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-slate-200')
              }`}
            >
              الإجمالي لكل موظف
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Ribbon for the Selected Month */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Total Monthly Leads */}
        <div className={`p-3.5 rounded-xl border shadow-sm ${
          isLight ? 'bg-slate-50/60 border-slate-200' : 'bg-[#1c1c1e] border-slate-900/40'
        }`}>
          <span className={`text-[11px] font-bold block ${isLight ? 'text-slate-800' : 'text-slate-400'}`}>إجمالي داتا الشهر المحدد</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className={`text-2xl font-black font-mono ${isLight ? 'text-slate-950' : 'text-slate-300'}`}>{totalMonthlyLeads}</span>
            <span className={`text-[10px] font-semibold font-arabic ${isLight ? 'text-slate-700' : 'text-slate-400'}`}>عميل مضاف</span>
          </div>
        </div>

        {/* Interested Leads */}
        <div className={`p-3.5 rounded-xl border shadow-sm ${
          isLight ? 'bg-[#EAF3F0]/60 border-[#A8CCC0]' : 'bg-[#1c1c1e] border-[#081F1A]/40'
        }`}>
          <span className={`text-[11px] font-bold block ${isLight ? 'text-[#081F1A]' : 'text-[#4F9282]'}`}>العملاء المهتمين ⭐</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className={`text-2xl font-black font-mono ${isLight ? 'text-[#041310]' : 'text-[#7AB0A0]'}`}>{totalInterestedMonthly}</span>
            <span className={`text-[10px] font-bold font-mono ${isLight ? 'text-[#0C2E27]' : 'text-[#4F9282]'}`}>({interestRate}%)</span>
          </div>
        </div>

        {/* Average per Sales Rep */}
        <div className={`p-3.5 rounded-xl border shadow-sm ${
          isLight ? 'bg-[#EAF3F0]/60 border-[#A8CCC0]' : 'bg-[#1c1c1e] border-[#081F1A]/40'
        }`}>
          <span className={`text-[11px] font-bold block ${isLight ? 'text-[#081F1A]' : 'text-[#4F9282]'}`}>متوسط الحصة للموظف</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className={`text-2xl font-black font-mono ${isLight ? 'text-[#041310]' : 'text-[#7AB0A0]'}`}>{averageLeadsPerRep}</span>
            <span className={`text-[10px] font-semibold ${isLight ? 'text-[#123F36]' : 'text-[#4F9282]'}`}>عميل / سيلز</span>
          </div>
        </div>

        {/* Top Performer this Month */}
        <div className={`p-3.5 rounded-xl border shadow-sm ${
          isLight ? 'bg-purple-50/60 border-purple-200' : 'bg-[#1c1c1e] border-purple-900/40'
        }`}>
          <span className={`text-[11px] font-bold block flex items-center gap-1 ${isLight ? 'text-purple-900' : 'text-purple-300'}`}>
            <Award className="w-3.5 h-3.5 text-[#2A6B5C] inline" />
            <span>الأعلى استلاماً هذا الشهر</span>
          </span>
          <div className="flex items-baseline justify-between mt-1">
            <span className={`text-sm font-black truncate max-w-[120px] ${isLight ? 'text-purple-950' : 'text-purple-200'}`}>
              {topSalesRep ? topSalesRep.name : '—'}
            </span>
            <span className={`text-xs font-mono font-bold ${isLight ? 'text-purple-800' : 'text-purple-400'}`}>
              {topSalesRep ? `${topSalesRep.totalLeads} عميل` : '0'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* Main Bar Chart (8 cols on lg) */}
        <div className={`lg:col-span-8 p-4 sm:p-5 rounded-2xl border shadow-sm space-y-3 ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#1c1c1e] border-slate-800'
        }`}>
          <div className="flex items-center justify-between">
            <h3 className={`text-xs sm:text-sm font-black flex items-center gap-1.5 ${
              isLight ? 'text-slate-900' : 'text-slate-100'
            }`}>
              <TrendingUp className={`w-4 h-4 ${isLight ? 'text-slate-700' : 'text-slate-400'}`} />
              <span>مقارنة أعداد العملاء بين موظفي المبيعات ({monthsArabic[selectedMonth]} {selectedYear})</span>
            </h3>
            <span className={`text-[10px] font-semibold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              إجمالي {salesRepChartData.length} موظف مبيعات
            </span>
          </div>

          {salesRepChartData.every(d => d.totalLeads === 0) ? (
            <div className={`h-64 flex flex-col items-center justify-center space-y-2 border-2 border-dashed rounded-xl ${
              isLight ? 'border-slate-300 text-slate-400' : 'border-slate-800 text-slate-500'
            }`}>
              <BarChart3 className="w-8 h-8 opacity-60" />
              <p className="text-xs font-bold">لا توجد داتا مسجلة في شهر {monthsArabic[selectedMonth]} {selectedYear}</p>
              <p className="text-[11px]">اختر شهراً آخر أو أضف عملاء جدد لعرض الإحصائيات.</p>
            </div>
          ) : (
            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                {chartViewMode === 'bar_status' ? (
                  <BarChart
                    data={salesRepChartData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 25 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={isLight ? '#e2e8f0' : '#1e293b'} vertical={false} />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: isLight ? '#0f172a' : '#94a3b8', fontSize: 11, fontWeight: 700 }}
                      interval={0}
                      angle={-15}
                      textAnchor="end"
                    />
                    <YAxis tick={{ fill: isLight ? '#64748b' : '#94a3b8', fontSize: 11 }} />
                    <Tooltip content={<CustomBarTooltip />} />
                    <Legend
                      verticalAlign="top"
                      align="right"
                      wrapperStyle={{ paddingBottom: '10px', fontSize: '11px', fontWeight: 600 }}
                    />
                    <Bar dataKey="interested" name="مهتم ⭐" stackId="a" fill="#059669" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="callback" name="متابعة / هرجع اكلمه" stackId="a" fill="#2563eb" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="newLeads" name="جديد" stackId="a" fill="#2A6B5C" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="closedOrNoAnswer" name="مغلق / غير متاح" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="notInterested" name="مش مهتم" stackId="a" fill="#e11d48" radius={[4, 4, 0, 0]} />
                  </BarChart>
                ) : (
                  <BarChart
                    data={salesRepChartData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 25 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={isLight ? '#e2e8f0' : '#1e293b'} vertical={false} />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: isLight ? '#0f172a' : '#94a3b8', fontSize: 11, fontWeight: 700 }}
                      interval={0}
                      angle={-15}
                      textAnchor="end"
                    />
                    <YAxis tick={{ fill: isLight ? '#64748b' : '#94a3b8', fontSize: 11 }} />
                    <Tooltip content={<CustomBarTooltip />} />
                    <Bar dataKey="totalLeads" name="إجمالي العملاء المضافين" fill="#1c1c1e" radius={[6, 6, 0, 0]}>
                      {salesRepChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Pie Chart: Market Share by Sales Rep (4 cols on lg) */}
        <div className={`lg:col-span-4 p-4 sm:p-5 rounded-2xl border shadow-sm space-y-3 flex flex-col justify-between ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#1c1c1e] border-slate-800'
        }`}>
          <div>
            <div className={`flex items-center justify-between pb-2 border-b ${
              isLight ? 'border-slate-200' : 'border-slate-800'
            }`}>
              <h3 className={`text-xs sm:text-sm font-black flex items-center gap-1.5 ${
                isLight ? 'text-slate-900' : 'text-slate-100'
              }`}>
                <PieIcon className="w-4 h-4 text-[#2A6B5C]" />
                <span>نسبة توزيع الداتا (% الحصة)</span>
              </h3>
            </div>

            <div className="h-52 w-full mt-2 relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`pie-cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any, name: any) => [`${value} عميل`, `${name}`]}
                    contentStyle={{
                      backgroundColor: isLight ? '#ffffff' : '#000000',
                      borderColor: isLight ? '#cbd5e1' : '#2A6B5C',
                      color: isLight ? '#0f172a' : '#ffffff',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      direction: 'rtl',
                    }}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>

              {/* Center Total Pill */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                <span className={`text-[10px] font-bold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>الإجمالي</span>
                <span className={`text-sm font-black font-mono ${isLight ? 'text-slate-950' : 'text-slate-300'}`}>{totalMonthlyLeads}</span>
              </div>
            </div>
          </div>

          {/* Mini Legend & Share Table */}
          <div className={`space-y-1.5 max-h-36 overflow-y-auto pr-1 pt-2 border-t ${
            isLight ? 'border-slate-200' : 'border-slate-800'
          }`}>
            {salesRepChartData.map(rep => {
              const pct = totalMonthlyLeads > 0 ? ((rep.totalLeads / totalMonthlyLeads) * 100).toFixed(1) : '0';
              return (
                <div key={rep.id} className={`flex items-center justify-between text-[11px] p-1.5 rounded-lg transition ${
                  isLight ? 'hover:bg-white' : 'hover:bg-[#2c2c2e]'
                }`}>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: rep.color }} />
                    <span className={`font-bold truncate max-w-[100px] ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>{rep.name}</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono font-bold">
                    <span className={isLight ? 'text-slate-900' : 'text-slate-100'}>{rep.totalLeads} عميل</span>
                    <span className={`text-[10px] ${isLight ? 'text-slate-700' : 'text-slate-400'}`}>({pct}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Leaderboard Cards: Sales Reps Detailed Monthly Quota & Ranking */}
      <div className={`pt-2 border-t space-y-2.5 ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
        <div className="flex items-center justify-between">
          <span className={`text-xs font-black flex items-center gap-1.5 ${
            isLight ? 'text-slate-950' : 'text-[#A8CCC0]'
          }`}>
            <Award className="w-4 h-4 text-[#2A6B5C]" />
            <span>ترتيب أداء الموظفين وإنجاز الكوتا خلال شهر {monthsArabic[selectedMonth]} {selectedYear}:</span>
          </span>
          <span className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>مرتبة تنازلياً حسب إجمالي العملاء</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {salesRepChartData.map((rep, idx) => (
            <div
              key={rep.id}
              className={`p-3 rounded-xl border transition shadow-sm space-y-2 ${
                isLight
                  ? 'bg-gradient-to-b from-white to-slate-50 border-slate-200 hover:border-slate-600'
                  : 'bg-gradient-to-b from-[#2c2c2e] to-[#121418] border-slate-800 hover:border-[#2A6B5C]/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img
                    src={rep.avatar}
                    alt={rep.name}
                    width={28}
                    height={28}
                    loading="lazy"
                    decoding="async"
                    className="w-7 h-7 rounded-full object-cover border-2"
                    style={{ borderColor: rep.color }}
                  />
                  <div>
                    <span className={`font-bold text-xs block leading-tight ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>{rep.name}</span>
                    <span className={`text-[9px] block truncate max-w-[80px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{rep.project}</span>
                  </div>
                </div>

                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                  idx === 0
                    ? (isLight ? 'bg-[#D1E4DE] text-[#081F1A] border border-[#7AB0A0]' : 'bg-[#041310]/80 text-[#7AB0A0] border border-[#1F5447]/50')
                    : (isLight ? 'bg-slate-100 text-slate-700' : 'bg-slate-800 text-slate-300')
                }`}>
                  #{idx + 1}
                </span>
              </div>

              {/* Counts & Status Breakdown */}
              <div className={`p-2 rounded-lg border text-[11px] space-y-1 ${
                isLight ? 'bg-white border-slate-100' : 'bg-[#1c1c1e] border-slate-800'
              }`}>
                <div className="flex items-center justify-between font-bold">
                  <span className={isLight ? 'text-slate-600' : 'text-slate-400'}>إجمالي المضاف:</span>
                  <span className={`font-mono text-xs ${isLight ? 'text-slate-950' : 'text-slate-300'}`}>{rep.totalLeads}</span>
                </div>
                <div className="flex items-center justify-between text-[10px]">
                  <span className={`font-bold ${isLight ? 'text-slate-700' : 'text-slate-400'}`}>المهتمين ⭐:</span>
                  <span className={`font-mono font-bold ${isLight ? 'text-slate-800' : 'text-slate-300'}`}>{rep.interested}</span>
                </div>
                <div className="flex items-center justify-between text-[10px]">
                  <span className={`font-bold ${isLight ? 'text-[#123F36]' : 'text-[#4F9282]'}`}>متابعة:</span>
                  <span className={`font-mono font-bold ${isLight ? 'text-[#0C2E27]' : 'text-[#7AB0A0]'}`}>{rep.callback}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
