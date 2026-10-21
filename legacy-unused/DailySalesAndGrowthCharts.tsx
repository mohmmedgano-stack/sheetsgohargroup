import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  TrendingUp,
  BarChart3,
  Users,
  Calendar,
  Sparkles,
  ArrowUpRight,
  Flame,
  PieChart as PieIcon,
  CheckCircle2,
  PhoneCall,
  Building,
  Target,
} from 'lucide-react';
import { ClientLead, User } from '../types';
import { toLocalDateStr } from '../utils/dates';

interface DailySalesAndGrowthChartsProps {
  clients?: ClientLead[];
  users?: User[];
}

const COLORS = ['#10B981', '#2A6B5C', '#2A6B5C', '#8B5CF6', '#EC4899', '#F97316', '#06B6D4'];

export const DailySalesAndGrowthCharts: React.FC<DailySalesAndGrowthChartsProps> = () => {
  const { clients, users, allInteractions, themeMode } = useApp();
  const isLight = themeMode === 'light';

  const [timeRange, setTimeRange] = useState<'7' | '14' | '30'>('14');
  const [chartType, setChartType] = useState<'daily_sales' | 'customer_growth' | 'projects'>('daily_sales');

  const rangeDays = parseInt(timeRange, 10);

  // 1. Calculate Daily Sales & Interactions Metrics for the last N days
  const dailyTimeSeriesData = useMemo(() => {
    const daysMap: {
      [dateKey: string]: {
        date: string;
        displayDate: string;
        dayName: string;
        totalCalls: number;
        interested: number;
        followUps: number;
        newClients: number;
        cumulativeClients: number;
      };
    } = {};

    const now = new Date();

    // Initialize all days in range
    for (let i = rangeDays - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateKey = toLocalDateStr(d);
      const dayName = d.toLocaleDateString('ar-EG', { weekday: 'short' });
      const displayDate = `${d.getDate()}/${d.getMonth() + 1}`;

      daysMap[dateKey] = {
        date: dateKey,
        displayDate,
        dayName: `${dayName} ${displayDate}`,
        totalCalls: 0,
        interested: 0,
        followUps: 0,
        newClients: 0,
        cumulativeClients: 0,
      };
    }

    // Populate interactions
    allInteractions.forEach(item => {
      const dateKey = item.date;
      if (daysMap[dateKey]) {
        daysMap[dateKey].totalCalls += 1;
        if (item.status === 'مهتم') {
          daysMap[dateKey].interested += 1;
        }
        if (item.status === 'هرجع اكلمه تاني' || item.status === 'مشغول دلوقتي') {
          daysMap[dateKey].followUps += 1;
        }
      }
    });

    // Populate client creations
    clients.forEach(c => {
      const createdDate = c.createdAt ? c.createdAt.split('T')[0] : c.lastInteractionDate;
      if (createdDate && daysMap[createdDate]) {
        daysMap[createdDate].newClients += 1;
      }
    });

    // Calculate cumulative clients
    let runningTotal = 0;
    const sortedDays = Object.values(daysMap);
    sortedDays.forEach(day => {
      runningTotal += day.newClients;
      day.cumulativeClients = runningTotal;
    });

    return sortedDays;
  }, [allInteractions, clients, rangeDays]);

  // 2. High-level aggregates
  const totalCallsInRange = dailyTimeSeriesData.reduce((acc, d) => acc + d.totalCalls, 0);
  const totalInterestedInRange = dailyTimeSeriesData.reduce((acc, d) => acc + d.interested, 0);
  const totalNewClientsInRange = dailyTimeSeriesData.reduce((acc, d) => acc + d.newClients, 0);
  const avgDailyCalls = rangeDays > 0 ? (totalCallsInRange / rangeDays).toFixed(1) : '0';
  const conversionRate = totalCallsInRange > 0 ? ((totalInterestedInRange / totalCallsInRange) * 100).toFixed(1) : '0';

  // 3. Project Distribution for Recharts
  const projectDistributionData = useMemo(() => {
    const map: { [key: string]: { name: string; total: number; interested: number } } = {};
    clients.forEach(c => {
      const p = c.projectName || 'مشاريع أخرى';
      if (!map[p]) {
        map[p] = { name: p, total: 0, interested: 0 };
      }
      map[p].total += 1;
      if (c.status === 'مهتم') {
        map[p].interested += 1;
      }
    });
    return Object.values(map).sort((a, b) => b.total - a.total).slice(0, 6);
  }, [clients]);

  // 4. Source Distribution for Pie Chart
  const sourceDistributionData = useMemo(() => {
    const map: { [key: string]: number } = {};
    clients.forEach(c => {
      const src = c.source || 'أخرى';
      map[src] = (map[src] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [clients]);

  return (
    <div
      className={`rounded-3xl border shadow-xl overflow-hidden ${
        isLight
          ? 'bg-white border-slate-200 shadow-slate-200/50'
          : 'bg-[#2c2c2e] border-slate-800 shadow-2xl'
      }`}
    >
      {/* Top Header & Range Controls */}
      <div
        className={`p-6 border-b flex flex-col md:flex-row md:items-center justify-between gap-4 ${
          isLight
            ? 'bg-gradient-to-r from-slate-50 to-slate-50/40 border-slate-200'
            : 'bg-gradient-to-r from-[#1c1c1e] to-[#000000] border-slate-800'
        }`}
      >
        <div>
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2.5 rounded-2xl ${
                isLight
                  ? 'bg-slate-800 text-[#7AB0A0]'
                  : 'bg-[#000000] text-[#2A6B5C] border border-[#2A6B5C]/30'
              }`}
            >
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2
                className={`text-lg font-black flex items-center gap-2 ${
                  isLight ? 'text-slate-900' : 'text-slate-100'
                }`}
              >
                <span>لوحة الرسوم البيانية التفاعلية (Recharts Analytics)</span>
                <span className="text-[10px] bg-slate-500/20 text-slate-400 px-2 py-0.5 rounded-full font-bold border border-slate-500/30">
                  مباشر
                </span>
              </h2>
              <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                إحصائيات المبيعات اليومية، تدفق العملاء الجدد، ومعدلات الاهتمام لكل مشروع.
              </p>
            </div>
          </div>
        </div>

        {/* Filters & View Selectors */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Chart Type Tabs */}
          <div
            className={`flex items-center p-1 rounded-xl border text-xs font-bold ${
              isLight ? 'bg-white border-slate-300' : 'bg-[#2c2c2e] border-slate-700'
            }`}
          >
            <button
              onClick={() => setChartType('daily_sales')}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                chartType === 'daily_sales'
                  ? isLight
                    ? 'bg-slate-800 text-[#7AB0A0] shadow-sm'
                    : 'bg-[#2A6B5C] text-white shadow-md font-black'
                  : isLight
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>المبيعات والاتصالات اليومية</span>
            </button>

            <button
              onClick={() => setChartType('customer_growth')}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                chartType === 'customer_growth'
                  ? isLight
                    ? 'bg-slate-800 text-[#7AB0A0] shadow-sm'
                    : 'bg-[#2A6B5C] text-white shadow-md font-black'
                  : isLight
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>نمو العملاء الجدد</span>
            </button>

            <button
              onClick={() => setChartType('projects')}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                chartType === 'projects'
                  ? isLight
                    ? 'bg-slate-800 text-[#7AB0A0] shadow-sm'
                    : 'bg-[#2A6B5C] text-white shadow-md font-black'
                  : isLight
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Building className="w-3.5 h-3.5" />
              <span>توزيع المشاريع والمصادر</span>
            </button>
          </div>

          {/* Time Range Selector */}
          <div
            className={`flex items-center p-1 rounded-xl border text-xs font-bold ${
              isLight ? 'bg-white border-slate-300' : 'bg-[#2c2c2e] border-slate-700'
            }`}
          >
            <button
              onClick={() => setTimeRange('7')}
              className={`px-2.5 py-1.5 rounded-lg transition cursor-pointer ${
                timeRange === '7'
                  ? isLight
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              7 أيام
            </button>
            <button
              onClick={() => setTimeRange('14')}
              className={`px-2.5 py-1.5 rounded-lg transition cursor-pointer ${
                timeRange === '14'
                  ? isLight
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              14 يوم
            </button>
            <button
              onClick={() => setTimeRange('30')}
              className={`px-2.5 py-1.5 rounded-lg transition cursor-pointer ${
                timeRange === '30'
                  ? isLight
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              30 يوم
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Summary Strip */}
      <div
        className={`grid grid-cols-2 md:grid-cols-4 gap-4 p-6 border-b ${
          isLight ? 'bg-slate-50/70 border-slate-200' : 'bg-[#1c1c1e]/50 border-slate-800'
        }`}
      >
        <div
          className={`p-4 rounded-2xl border ${
            isLight
              ? 'bg-white border-slate-200 text-slate-900'
              : 'bg-[#2c2c2e] border-slate-800 text-slate-100'
          }`}
        >
          <span className="text-[11px] font-semibold text-slate-400 block">إجمالي الاتصالات في الفترة</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black">{totalCallsInRange}</span>
            <span className="text-[10px] text-slate-500 font-bold">مكالمة وتحديث</span>
          </div>
        </div>

        <div
          className={`p-4 rounded-2xl border ${
            isLight
              ? 'bg-white border-slate-200 text-slate-900'
              : 'bg-[#2c2c2e] border-slate-800 text-slate-100'
          }`}
        >
          <span className="text-[11px] font-semibold text-slate-500 block">عملاء مهتمين جدد ⭐</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-slate-400">{totalInterestedInRange}</span>
            <span className="text-[10px] text-slate-400 font-bold">Hot Leads</span>
          </div>
        </div>

        <div
          className={`p-4 rounded-2xl border ${
            isLight
              ? 'bg-white border-slate-200 text-slate-900'
              : 'bg-[#2c2c2e] border-slate-800 text-slate-100'
          }`}
        >
          <span className="text-[11px] font-semibold text-[#2A6B5C] block">معدل التحويل (Conversion)</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-[#4F9282]">{conversionRate}%</span>
            <span className="text-[10px] text-slate-400 font-bold">نسبة النجاح</span>
          </div>
        </div>

        <div
          className={`p-4 rounded-2xl border ${
            isLight
              ? 'bg-white border-slate-200 text-slate-900'
              : 'bg-[#2c2c2e] border-slate-800 text-slate-100'
          }`}
        >
          <span className="text-[11px] font-semibold text-[#4F9282] block">متوسط الاتصالات اليومية</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-[#4F9282]">{avgDailyCalls}</span>
            <span className="text-[10px] text-slate-400 font-bold">اتصال / يوم</span>
          </div>
        </div>
      </div>

      {/* Main Chart Canvas Area */}
      <div className="p-6">
        {chartType === 'daily_sales' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-slate-200'}`}>
                معدل الاتصالات اليومية والمبيعات خلال آخر {timeRange} يوماً
              </h3>
              <div className="flex items-center gap-4 text-xs font-semibold">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-slate-500 inline-block" />
                  <span className={isLight ? 'text-slate-700' : 'text-slate-300'}>إجمالي الاتصالات</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-[#2A6B5C] inline-block" />
                  <span className={isLight ? 'text-slate-700' : 'text-slate-300'}>المهتمين ⭐</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-[#2A6B5C] inline-block" />
                  <span className={isLight ? 'text-slate-700' : 'text-slate-300'}>مواعيد الفولو اب</span>
                </span>
              </div>
            </div>

            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={dailyTimeSeriesData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorCalls" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorInterested" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2A6B5C" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#2A6B5C" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorFollowUps" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2A6B5C" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#2A6B5C" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={isLight ? '#E2E8F0' : '#2D3748'}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="dayName"
                    stroke={isLight ? '#64748B' : '#94A3B8'}
                    tick={{ fontSize: 11, fontFamily: 'Cairo' }}
                  />
                  <YAxis
                    stroke={isLight ? '#64748B' : '#94A3B8'}
                    tick={{ fontSize: 11, fontFamily: 'Cairo' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isLight ? '#FFFFFF' : '#2c2c2e',
                      borderColor: isLight ? '#CBD5E1' : '#334155',
                      borderRadius: '12px',
                      fontFamily: 'Cairo',
                      fontSize: '12px',
                      color: isLight ? '#0F172A' : '#F8FAFC',
                      direction: 'rtl',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="totalCalls"
                    name="إجمالي الاتصالات"
                    stroke="#10B981"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorCalls)"
                  />
                  <Area
                    type="monotone"
                    dataKey="interested"
                    name="العملاء المهتمين"
                    stroke="#2A6B5C"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorInterested)"
                  />
                  <Area
                    type="monotone"
                    dataKey="followUps"
                    name="مواعيد الفولو اب"
                    stroke="#2A6B5C"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorFollowUps)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {chartType === 'customer_growth' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-slate-200'}`}>
                منحنى تدفق ونمو العملاء الجدد في النظام (Lead Acquisition Curve)
              </h3>
              <span className="text-xs text-slate-400 font-bold">
                إجمالي الداتا الحالية: {clients.length} عميل
              </span>
            </div>

            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={dailyTimeSeriesData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={isLight ? '#E2E8F0' : '#2D3748'}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="dayName"
                    stroke={isLight ? '#64748B' : '#94A3B8'}
                    tick={{ fontSize: 11, fontFamily: 'Cairo' }}
                  />
                  <YAxis
                    stroke={isLight ? '#64748B' : '#94A3B8'}
                    tick={{ fontSize: 11, fontFamily: 'Cairo' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isLight ? '#FFFFFF' : '#2c2c2e',
                      borderColor: isLight ? '#CBD5E1' : '#334155',
                      borderRadius: '12px',
                      fontFamily: 'Cairo',
                      fontSize: '12px',
                      direction: 'rtl',
                    }}
                  />
                  <Legend
                    wrapperStyle={{ fontFamily: 'Cairo', fontSize: '12px', paddingTop: '10px' }}
                  />
                  <Bar
                    dataKey="newClients"
                    name="عملاء مضافين في هذا اليوم"
                    fill="#10B981"
                    radius={[6, 6, 0, 0]}
                  />
                  <Bar
                    dataKey="interested"
                    name="تم تحويلهم لمهتمين"
                    fill="#2A6B5C"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {chartType === 'projects' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left: Project Bar Chart */}
            <div className="space-y-3">
              <h3 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-slate-200'}`}>
                توزيع العملاء والاهتمام حسب المشروع العقاري
              </h3>
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={projectDistributionData}
                    margin={{ top: 10, right: 20, left: 10, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={isLight ? '#E2E8F0' : '#2D3748'} />
                    <XAxis type="number" stroke={isLight ? '#64748B' : '#94A3B8'} />
                    <YAxis
                      dataKey="name"
                      type="category"
                      width={120}
                      stroke={isLight ? '#64748B' : '#94A3B8'}
                      tick={{ fontSize: 10, fontFamily: 'Cairo' }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isLight ? '#FFFFFF' : '#2c2c2e',
                        borderRadius: '12px',
                        direction: 'rtl',
                      }}
                    />
                    <Bar dataKey="total" name="إجمالي العملاء" fill="#2A6B5C" radius={[0, 6, 6, 0]} />
                    <Bar dataKey="interested" name="المهتمين" fill="#10B981" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Right: Sources Pie Chart */}
            <div className="space-y-3">
              <h3 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-slate-200'}`}>
                نسب مصادر الداتا والإعلانات (Lead Sources)
              </h3>
              <div className="h-[280px] w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sourceDistributionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={4}
                      dataKey="value"
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {sourceDistributionData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isLight ? '#FFFFFF' : '#2c2c2e',
                        borderRadius: '12px',
                        direction: 'rtl',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
