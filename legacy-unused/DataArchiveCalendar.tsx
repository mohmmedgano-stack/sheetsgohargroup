import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { ClientLead } from '../types';
import {
  Calendar as CalendarIcon,
  ChevronRight,
  ChevronLeft,
  Search,
  Phone,
  MessageCircle,
  Clock,
  UserCheck,
  Building2,
  FolderArchive,
  ArrowRight,
  Sparkles,
  FileText,
  CalendarDays,
  Flame,
  Star,
  CheckCircle2,
  RotateCcw
} from 'lucide-react';

interface DataArchiveCalendarProps {
  onSelectClientForFollowUp: (client: ClientLead) => void;
  onOpenHistoryModal: (client: ClientLead) => void;
}

export const DataArchiveCalendar: React.FC<DataArchiveCalendarProps> = ({
  onSelectClientForFollowUp,
  onOpenHistoryModal,
}) => {
  const {
    currentUser,
    users,
    projects,
    visibleClients = [],
    updateClient,
    updateClientStatus,
    themeMode,
  } = useApp();

  const isLight = themeMode === 'light';
  const allVisibleClients = visibleClients;

  // Helper to format date to YYYY-MM-DD
  const getTodayStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getYesterdayStr = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayStr = getTodayStr();

  // State: selected date (default is today's date)
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [viewMonth, setViewMonth] = useState<Date>(new Date());
  const [searchArchive, setSearchArchive] = useState('');
  const [selectedProjectFilter, setSelectedProjectFilter] = useState('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');
  const [selectedUserFilter, setSelectedUserFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState<'day' | 'month_overview'>('day');

  // Extract client date key (checking createdAt or lastInteractionDate or followUpDate)
  const getClientDate = (c: ClientLead): string => {
    if (c.createdAt) {
      return c.createdAt.slice(0, 10);
    }
    if (c.lastInteractionDate) {
      return c.lastInteractionDate.slice(0, 10);
    }
    return '';
  };

  // Group clients count by date for calendar badges
  const leadsCountByDate = useMemo(() => {
    const map: Record<string, { total: number; contacted: number; interested: number }> = {};
    allVisibleClients.forEach(c => {
      const dateKey = getClientDate(c);
      if (dateKey) {
        if (!map[dateKey]) {
          map[dateKey] = { total: 0, contacted: 0, interested: 0 };
        }
        map[dateKey].total += 1;
        if (c.status && c.status !== 'جديد') {
          map[dateKey].contacted += 1;
        }
        if (c.status === 'مهتم') {
          map[dateKey].interested += 1;
        }
      }
    });
    return map;
  }, [allVisibleClients]);

  // List of active recorded dates sorted newest first
  const activeDatesList = useMemo(() => {
    return Object.keys(leadsCountByDate)
      .map(dateStr => ({
        dateStr,
        total: leadsCountByDate[dateStr]?.total || 0,
        contacted: leadsCountByDate[dateStr]?.contacted || 0,
        interested: leadsCountByDate[dateStr]?.interested || 0,
      }))
      .filter(item => item.total > 0)
      .sort((a, b) => b.dateStr.localeCompare(a.dateStr));
  }, [leadsCountByDate]);

  // Clients matching the selected date
  const clientsForSelectedDate = useMemo(() => {
    return allVisibleClients.filter(c => {
      const dateKey = getClientDate(c);
      // If user selected a specific date or 'ALL'
      const matchDate = selectedDate === 'ALL' || dateKey === selectedDate;
      if (!matchDate) return false;

      // Project filter
      if (selectedProjectFilter !== 'ALL' && c.projectName !== selectedProjectFilter) return false;

      // Status filter
      if (selectedStatusFilter !== 'ALL' && c.status !== selectedStatusFilter) return false;

      // User filter (for admin)
      if (selectedUserFilter !== 'ALL' && c.assignedUserId !== selectedUserFilter) return false;

      // Search filter
      if (searchArchive.trim()) {
        const q = searchArchive.toLowerCase().trim();
        const matchName = c.name.toLowerCase().includes(q);
        const matchPhone = c.phone.includes(q);
        const matchNotes = c.notes?.toLowerCase().includes(q) || false;
        const matchProj = c.projectName.toLowerCase().includes(q);
        const matchUser = c.assignedUserName.toLowerCase().includes(q);
        return matchName || matchPhone || matchNotes || matchProj || matchUser;
      }

      return true;
    });
  }, [allVisibleClients, selectedDate, selectedProjectFilter, selectedStatusFilter, selectedUserFilter, searchArchive]);

  // Calculate day stats
  const dayStats = useMemo(() => {
    const total = clientsForSelectedDate.length;
    const interested = clientsForSelectedDate.filter(c => c.status === 'مهتم').length;
    const callback = clientsForSelectedDate.filter(c => c.status === 'هرجع اكلمه تاني').length;
    const busy = clientsForSelectedDate.filter(c => c.status === 'مشغول دلوقتي').length;
    const unreachable = clientsForSelectedDate.filter(c => c.status === 'غير متاح' || c.status === 'مغلق' || c.status === 'قفل الخط في وشي').length;
    const notInterested = clientsForSelectedDate.filter(c => c.status === 'مش مهتم').length;
    const contacted = clientsForSelectedDate.filter(c => c.status && c.status !== 'جديد').length;

    return {
      total,
      contacted,
      interested,
      callback,
      busy,
      unreachable,
      notInterested,
      completionRate: total > 0 ? Math.round((contacted / total) * 100) : 0,
    };
  }, [clientsForSelectedDate]);

  // Generate calendar days for viewMonth
  const calendarGridDays = useMemo(() => {
    const year = viewMonth.getFullYear();
    const month = viewMonth.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const daysInMonth = lastDayOfMonth.getDate();
    // Sunday is 0, Saturday is 6 in JS
    const startingDayOfWeek = firstDayOfMonth.getDay();

    const days: Array<{
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      leadsData?: { total: number; contacted: number; interested: number };
    }> = [];

    // Previous month padding
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const dayNum = prevMonthLastDay - i;
      const prevDate = new Date(year, month - 1, dayNum);
      const y = prevDate.getFullYear();
      const m = String(prevDate.getMonth() + 1).padStart(2, '0');
      const d = String(dayNum).padStart(2, '0');
      const dateStr = `${y}-${m}-${d}`;
      days.push({
        dateStr,
        dayNumber: dayNum,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        leadsData: leadsCountByDate[dateStr],
      });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const y = year;
      const m = String(month + 1).padStart(2, '0');
      const d = String(i).padStart(2, '0');
      const dateStr = `${y}-${m}-${d}`;
      days.push({
        dateStr,
        dayNumber: i,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
        leadsData: leadsCountByDate[dateStr],
      });
    }

    // Next month padding
    const remainingCells = 42 - days.length;
    for (let i = 1; i <= remainingCells; i++) {
      const nextDate = new Date(year, month + 1, i);
      const y = nextDate.getFullYear();
      const m = String(nextDate.getMonth() + 1).padStart(2, '0');
      const d = String(i).padStart(2, '0');
      const dateStr = `${y}-${m}-${d}`;
      days.push({
        dateStr,
        dayNumber: i,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        leadsData: leadsCountByDate[dateStr],
      });
    }

    return days;
  }, [viewMonth, leadsCountByDate, todayStr]);

  // Navigate calendar months
  const handlePrevMonth = () => {
    setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1));
  };

  // Step day by day
  const handleStepDay = (direction: 'prev' | 'next') => {
    if (selectedDate === 'ALL') {
      setSelectedDate(todayStr);
      return;
    }
    const current = new Date(selectedDate);
    if (isNaN(current.getTime())) {
      setSelectedDate(todayStr);
      return;
    }
    current.setDate(current.getDate() + (direction === 'next' ? 1 : -1));
    const y = current.getFullYear();
    const m = String(current.getMonth() + 1).padStart(2, '0');
    const d = String(current.getDate()).padStart(2, '0');
    const nextDateStr = `${y}-${m}-${d}`;
    setSelectedDate(nextDateStr);
    setViewMonth(new Date(y, current.getMonth(), 1));
  };

  // Arabic date formatter
  const formatArabicDate = (dateStr: string) => {
    if (dateStr === 'ALL') return 'الأرشيف الشامل (جميع التواريخ)';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        return d.toLocaleDateString('ar-EG', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
      }
    } catch {
      // fallback
    }
    return dateStr;
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner Header */}
      <div className={`p-5 sm:p-6 rounded-2xl border shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 ${
        isLight
          ? 'bg-gradient-to-r from-slate-800 via-slate-900 to-slate-950 text-white border-slate-700/50'
          : 'bg-gradient-to-r from-[#000000] via-[#1c1c1e] to-[#000000] text-white border-[#2A6B5C]/40'
      }`}>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-[#2A6B5C] text-white rounded-xl shadow font-bold">
              <CalendarDays className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-[#D1E4DE] flex items-center gap-2">
                <span>أرشيف الداتا والتقويم اليومي</span>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-200 border border-slate-600">
                  تحديث فوري
                </span>
              </h1>
              <p className="text-xs text-slate-200/90 mt-0.5">
                تصفح أرشيف العملاء والأرقام المستلمة يوماً بيوم، والرجوع لأي تاريخ سابق واستعراض الملاحظات وحالات الاتصال.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Date Shortcuts */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setSelectedDate(todayStr);
              setViewMonth(new Date());
            }}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition shadow flex items-center gap-1.5 cursor-pointer ${
              selectedDate === todayStr
                ? 'bg-[#2A6B5C] text-white border-2 border-[#7AB0A0] ring-2 ring-[#4F9282]/40'
                : 'bg-slate-900/80 text-slate-100 hover:bg-slate-800 border border-slate-700/60'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#4F9282]" />
            <span>داتا اليوم (الافتراضي)</span>
          </button>

          <button
            onClick={() => {
              const yest = getYesterdayStr();
              setSelectedDate(yest);
            }}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer ${
              selectedDate === getYesterdayStr()
                ? 'bg-[#2A6B5C] text-white'
                : 'bg-slate-900/60 text-slate-200 hover:bg-slate-800 border border-slate-700/40'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>أمس</span>
          </button>

          <button
            onClick={() => setSelectedDate('ALL')}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer ${
              selectedDate === 'ALL'
                ? 'bg-[#2A6B5C] text-white'
                : 'bg-slate-900/60 text-slate-200 hover:bg-slate-800 border border-slate-700/40'
            }`}
          >
            <FolderArchive className="w-3.5 h-3.5" />
            <span>كل الأرشيف</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Left Calendar Widget & Right Active Day Records */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Calendar Side Panel (4 cols on lg) */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Visual Interactive Month Calendar Card */}
          <div className={`border rounded-2xl p-4 sm:p-5 shadow-xl ${
            isLight
              ? 'bg-white border-slate-200 text-slate-900'
              : 'bg-[#14171D] border-slate-800 text-slate-100'
          }`}>
            <div className={`flex items-center justify-between pb-3.5 border-b ${
              isLight ? 'border-slate-200' : 'border-slate-800'
            }`}>
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-[#2A6B5C]" />
                <h3 className={`font-bold text-sm font-arabic ${
                  isLight ? 'text-slate-900' : 'text-[#A8CCC0]'
                }`}>
                  {viewMonth.toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' })}
                </h3>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={handlePrevMonth}
                  className={`p-1.5 rounded-lg transition ${
                    isLight ? 'hover:bg-slate-100 text-slate-600' : 'hover:bg-slate-800 text-slate-300 hover:text-white'
                  }`}
                  title="الشهر السابق"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMonth(new Date())}
                  className={`px-2 py-1 text-[10px] font-bold rounded transition ${
                    isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-800' : 'bg-slate-800 hover:bg-slate-700 text-[#7AB0A0]'
                  }`}
                  title="الشهر الحالي"
                >
                  اليوم
                </button>
                <button
                  onClick={handleNextMonth}
                  className={`p-1.5 rounded-lg transition ${
                    isLight ? 'hover:bg-slate-100 text-slate-600' : 'hover:bg-slate-800 text-slate-300 hover:text-white'
                  }`}
                  title="الشهر التالي"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Day of week headers */}
            <div className={`grid grid-cols-7 gap-1 text-center text-[11px] font-bold py-2.5 border-b ${
              isLight ? 'text-slate-800 border-slate-200' : 'text-slate-400/90 border-slate-800/80'
            }`}>
              <span>أحد</span>
              <span>إثنين</span>
              <span>ثلاثاء</span>
              <span>أربعاء</span>
              <span>خميس</span>
              <span>جمعة</span>
              <span>سبت</span>
            </div>

            {/* Calendar Days Matrix */}
            <div className="grid grid-cols-7 gap-1 pt-2">
              {calendarGridDays.map((item, idx) => {
                const isSelected = selectedDate === item.dateStr;
                const hasData = item.leadsData && item.leadsData.total > 0;

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedDate(item.dateStr)}
                    className={`h-11 rounded-xl flex flex-col items-center justify-center relative transition text-xs font-semibold cursor-pointer ${
                      isSelected
                        ? 'bg-[#2A6B5C] text-white font-bold shadow-lg ring-2 ring-[#4F9282]'
                        : item.isToday
                        ? (isLight ? 'bg-slate-100 border border-slate-300 text-slate-950 hover:bg-slate-200' : 'bg-slate-950/80 border border-slate-600/80 text-[#7AB0A0] hover:bg-slate-900')
                        : item.isCurrentMonth
                        ? (isLight ? 'hover:bg-slate-100 text-slate-800' : 'hover:bg-slate-800/80 text-slate-200')
                        : (isLight ? 'text-slate-400 hover:bg-slate-50' : 'text-slate-600 hover:bg-slate-900/50')
                    }`}
                  >
                    <span className="leading-none text-[11px]">{item.dayNumber}</span>

                    {/* Data Indicator Pill */}
                    {hasData && (
                      <span
                        className={`text-[9px] px-1 py-0.2 rounded-full font-mono font-bold mt-0.5 leading-tight ${
                          isSelected
                            ? 'bg-gray-950 text-[#7AB0A0]'
                            : (isLight ? 'bg-slate-700 text-white' : 'bg-slate-800/90 text-slate-100 border border-slate-600/60')
                        }`}
                        title={`${item.leadsData?.total} عميل مسجل`}
                      >
                        {item.leadsData?.total}
                      </span>
                    )}

                    {item.isToday && !isSelected && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#4F9282] absolute top-1 left-1" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Custom Direct Date Input */}
            <div className={`mt-4 pt-3.5 border-t space-y-2 ${
              isLight ? 'border-slate-200' : 'border-slate-800'
            }`}>
              <label className={`block text-[11px] font-bold ${
                isLight ? 'text-slate-900' : 'text-slate-300'
              }`}>
                أو اختر تاريخ محدد يدوياً:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={selectedDate === 'ALL' ? '' : selectedDate}
                  onChange={e => {
                    if (e.target.value) {
                      setSelectedDate(e.target.value);
                      const parts = e.target.value.split('-');
                      if (parts.length === 3) {
                        setViewMonth(new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, 1));
                      }
                    }
                  }}
                  className={`flex-1 p-2 border rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#2A6B5C] ${
                    isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-[#000000] border-[#2A6B5C]/30 text-white'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setSelectedDate(todayStr)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                    isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-800' : 'bg-slate-800 hover:bg-slate-700 text-[#7AB0A0]'
                  }`}
                  title="الرجوع لتاريخ اليوم"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>اليوم</span>
                </button>
              </div>
            </div>
          </div>

          {/* Quick Info / Legend */}
          <div className={`border p-4 rounded-2xl text-xs space-y-2.5 ${
            isLight
              ? 'bg-slate-50/60 border-slate-200 text-slate-900'
              : 'bg-[#000000]/90 border-[#2A6B5C]/30 text-slate-100'
          }`}>
            <h4 className={`font-bold flex items-center gap-1.5 ${
              isLight ? 'text-slate-950' : 'text-[#A8CCC0]'
            }`}>
              <Star className="w-4 h-4 text-[#2A6B5C]" />
              <span>دليل أرشيف السيلز:</span>
            </h4>
            <p className={`text-[11px] leading-relaxed ${isLight ? 'text-slate-800' : 'text-slate-200/90'}`}>
              • عند فتح هذا الأرشيف يتم تحميل <strong>داتا تاريخ اليوم</strong> مباشرة.
              <br />
              • الأرقام الصغيرة على التقويم تبيّن عدد العملاء الذين تم استلامهم أو تسجيل نشاط عليهم في ذلك التاريخ.
              <br />
              • يمكنك تعديل الملاحظات وحالات العملاء مباشرة من هذا الأرشيف ليتم حفظها فورياً في الشيت العام.
            </p>
          </div>

        </div>

        {/* Main Content Side: Selected Date Data View (8 cols on lg) */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* Active Date Title & Day Stepper */}
          <div className={`border p-4 sm:p-5 rounded-2xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
            isLight ? 'bg-white border-slate-200' : 'bg-[#14171D] border-slate-800'
          }`}>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xl">📅</span>
                <h2 className={`text-base sm:text-lg font-black ${
                  isLight ? 'text-slate-900' : 'text-[#A8CCC0]'
                }`}>
                  {formatArabicDate(selectedDate)}
                </h2>
                {selectedDate === todayStr && (
                  <span className={`px-2 py-0.5 border text-[10px] font-bold rounded-md ${
                    isLight ? 'bg-slate-100 text-slate-900 border-slate-300' : 'bg-slate-500/20 text-slate-300 border-slate-500/40'
                  }`}>
                    اليوم الحالي
                  </span>
                )}
              </div>
              <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                إجمالي داتا اليوم: <strong className={`font-mono ${isLight ? 'text-slate-800' : 'text-[#7AB0A0]'}`}>{dayStats.total} عميل</strong> | نسبة التواصل المنجز: <strong className={`font-mono ${isLight ? 'text-slate-700' : 'text-slate-400'}`}>{dayStats.completionRate}%</strong>
              </p>
            </div>

            {/* Day by Day Navigator */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleStepDay('prev')}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition flex items-center gap-1 cursor-pointer ${
                  isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-800' : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                }`}
                title="اليوم السابق"
              >
                <ChevronRight className="w-4 h-4 text-[#2A6B5C]" />
                <span>اليوم السابق</span>
              </button>

              <button
                onClick={() => handleStepDay('next')}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition flex items-center gap-1 cursor-pointer ${
                  isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-800' : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                }`}
                title="اليوم التالي"
              >
                <span>اليوم التالي</span>
                <ChevronLeft className="w-4 h-4 text-[#2A6B5C]" />
              </button>
            </div>
          </div>

          {/* Day Metrics Overview Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className={`border p-3 rounded-xl shadow flex items-center gap-3 ${
              isLight ? 'bg-white border-slate-200' : 'bg-[#000000] border-[#2A6B5C]/30'
            }`}>
              <div className={`p-2 rounded-lg font-bold ${isLight ? 'bg-slate-100 text-slate-800' : 'bg-[#2A6B5C]/20 text-[#7AB0A0]'}`}>
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <span className={`text-[10px] block ${isLight ? 'text-slate-500' : 'text-slate-300'}`}>إجمالي عملاء اليوم</span>
                <span className={`text-base font-black font-mono ${isLight ? 'text-slate-900' : 'text-[#A8CCC0]'}`}>{dayStats.total}</span>
              </div>
            </div>

            <div className={`border p-3 rounded-xl shadow flex items-center gap-3 ${
              isLight ? 'bg-white border-slate-200' : 'bg-[#000000] border-[#2A6B5C]/30'
            }`}>
              <div className={`p-2 rounded-lg font-bold ${isLight ? 'bg-slate-100 text-slate-800' : 'bg-slate-500/20 text-slate-300'}`}>
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <span className={`text-[10px] block ${isLight ? 'text-slate-500' : 'text-slate-300'}`}>تم التواصل معهم</span>
                <span className={`text-base font-black font-mono ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>{dayStats.contacted}</span>
              </div>
            </div>

            <div className={`border p-3 rounded-xl shadow flex items-center gap-3 ${
              isLight ? 'bg-white border-slate-200' : 'bg-[#000000] border-[#2A6B5C]/30'
            }`}>
              <div className={`p-2 rounded-lg font-bold ${isLight ? 'bg-[#D1E4DE] text-[#0C2E27]' : 'bg-yellow-500/20 text-yellow-300'}`}>
                <Star className="w-5 h-5" />
              </div>
              <div>
                <span className={`text-[10px] block ${isLight ? 'text-slate-500' : 'text-yellow-300'}`}>عملاء مهتمين ⭐</span>
                <span className={`text-base font-black font-mono ${isLight ? 'text-[#123F36]' : 'text-yellow-200'}`}>{dayStats.interested}</span>
              </div>
            </div>

            <div className={`border p-3 rounded-xl shadow flex items-center gap-3 ${
              isLight ? 'bg-white border-slate-200' : 'bg-[#000000] border-[#2A6B5C]/30'
            }`}>
              <div className={`p-2 rounded-lg font-bold ${isLight ? 'bg-[#D1E4DE] text-[#0C2E27]' : 'bg-[#2A6B5C]/20 text-[#7AB0A0]'}`}>
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <span className={`text-[10px] block ${isLight ? 'text-slate-500' : 'text-[#7AB0A0]'}`}>متابعة / إعادة اتصال</span>
                <span className={`text-base font-black font-mono ${isLight ? 'text-[#123F36]' : 'text-[#A8CCC0]'}`}>{dayStats.callback + dayStats.busy}</span>
              </div>
            </div>
          </div>

          {/* Filtering & Search Bar within Archive */}
          <div className={`p-4 sm:p-5 rounded-2xl border shadow-xl space-y-3.5 ${
            isLight ? 'bg-white border-slate-200' : 'bg-[#000000] border-2 border-[#2A6B5C]/50'
          }`}>
            <div className={`flex flex-col sm:flex-row items-center justify-between gap-3 pb-2.5 border-b ${
              isLight ? 'border-slate-200' : 'border-[#2A6B5C]/30'
            }`}>
              <div className="flex items-center gap-2">
                <Search className={`w-4 h-4 ${isLight ? 'text-slate-800' : 'text-[#2A6B5C]'}`} />
                <span className={`text-sm font-black ${isLight ? 'text-slate-900' : 'text-[#2A6B5C]'}`}>
                  البحث والتصفية في داتا هذا اليوم:
                </span>
              </div>
              <span className={`text-xs font-black px-3 py-1 rounded-full border shadow-inner ${
                isLight ? 'bg-slate-100 text-slate-800 border-slate-300' : 'text-[#2A6B5C] bg-[#1c1c1e] border-[#2A6B5C]/40'
              }`}>
                نتائج البحث: ({clientsForSelectedDate.length}) عميل
              </span>
            </div>

            {/* Filters Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 text-xs">
              {/* Search text input */}
              <div>
                <label className={`block text-xs font-black mb-1.5 flex items-center gap-1 ${
                  isLight ? 'text-slate-700' : 'text-[#2A6B5C]'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isLight ? 'bg-slate-700' : 'bg-[#2A6B5C]'}`}></span>
                  <span>بحث بالاسم / الهاتف:</span>
                </label>
                <input
                  type="text"
                  placeholder="ابحث بالاسم أو الرقم..."
                  value={searchArchive}
                  onChange={e => setSearchArchive(e.target.value)}
                  className={`w-full p-2.5 border rounded-xl font-bold focus:outline-none ${
                    isLight
                      ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-slate-700'
                      : 'bg-[#1c1c1e] border-2 border-[#2A6B5C]/60 text-[#D1E4DE] placeholder-[#A8CCC0]/40 focus:ring-2 focus:ring-[#2A6B5C]'
                  }`}
                />
              </div>

              {/* Project filter */}
              <div>
                <label className={`block text-xs font-black mb-1.5 flex items-center gap-1 ${
                  isLight ? 'text-slate-700' : 'text-[#2A6B5C]'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isLight ? 'bg-slate-700' : 'bg-[#2A6B5C]'}`}></span>
                  <span>المشروع:</span>
                </label>
                <select
                  value={selectedProjectFilter}
                  onChange={e => setSelectedProjectFilter(e.target.value)}
                  className={`w-full p-2.5 border rounded-xl font-bold focus:outline-none cursor-pointer ${
                    isLight
                      ? 'bg-slate-50 border-slate-300 text-slate-900 focus:ring-2 focus:ring-slate-700'
                      : 'bg-[#1c1c1e] border-2 border-[#2A6B5C]/60 text-[#D1E4DE] focus:ring-2 focus:ring-[#2A6B5C]'
                  }`}
                >
                  <option value="ALL" className={isLight ? 'bg-white text-slate-900' : 'bg-[#000000] text-[#A8CCC0]'}>جميع المشاريع</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.name} className={isLight ? 'bg-white text-slate-900' : 'bg-[#000000] text-[#D1E4DE]'}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status filter */}
              <div>
                <label className={`block text-xs font-black mb-1.5 flex items-center gap-1 ${
                  isLight ? 'text-slate-700' : 'text-[#2A6B5C]'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isLight ? 'bg-slate-700' : 'bg-[#2A6B5C]'}`}></span>
                  <span>حالة الاتصال:</span>
                </label>
                <select
                  value={selectedStatusFilter}
                  onChange={e => setSelectedStatusFilter(e.target.value)}
                  className={`w-full p-2.5 border rounded-xl font-bold focus:outline-none cursor-pointer ${
                    isLight
                      ? 'bg-slate-50 border-slate-300 text-slate-900 focus:ring-2 focus:ring-slate-700'
                      : 'bg-[#1c1c1e] border-2 border-[#2A6B5C]/60 text-[#D1E4DE] focus:ring-2 focus:ring-[#2A6B5C]'
                  }`}
                >
                  <option value="ALL" className={isLight ? 'bg-white text-slate-900' : 'bg-[#000000] text-[#A8CCC0]'}>جميع الحالات</option>
                  <option value="مهتم" className={isLight ? 'bg-white text-slate-800 font-bold' : 'bg-[#000000] text-slate-300'}>مهتم ⭐</option>
                  <option value="هرجع اكلمه تاني" className={isLight ? 'bg-white text-[#0C2E27]' : 'bg-[#000000] text-[#7AB0A0]'}>هرجع اكلمه تاني</option>
                  <option value="مشغول دلوقتي" className={isLight ? 'bg-white text-purple-800' : 'bg-[#000000] text-purple-300'}>مشغول دلوقتي</option>
                  <option value="غير متاح" className={isLight ? 'bg-white text-[#0C2E27]' : 'bg-[#000000] text-[#7AB0A0]'}>غير متاح</option>
                  <option value="مغلق" className={isLight ? 'bg-white text-red-800' : 'bg-[#000000] text-red-300'}>مغلق</option>
                  <option value="قفل الخط في وشي" className={isLight ? 'bg-white text-rose-800' : 'bg-[#000000] text-rose-300'}>قفل الخط في وشي</option>
                  <option value="مش مهتم" className={isLight ? 'bg-white text-slate-800' : 'bg-[#000000] text-slate-300'}>مش مهتم</option>
                  <option value="جديد" className={isLight ? 'bg-white text-slate-800' : 'bg-[#000000] text-[#D1E4DE]'}>جديد</option>
                </select>
              </div>

              {/* User filter (if Admin) */}
              {currentUser.role === 'ADMIN' && (
                <div>
                  <label className={`block text-xs font-black mb-1.5 flex items-center gap-1 ${
                    isLight ? 'text-slate-700' : 'text-[#2A6B5C]'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${isLight ? 'bg-slate-700' : 'bg-[#2A6B5C]'}`}></span>
                    <span>الموظف المستلم:</span>
                  </label>
                  <select
                    value={selectedUserFilter}
                    onChange={e => setSelectedUserFilter(e.target.value)}
                    className={`w-full p-2.5 border rounded-xl font-bold focus:outline-none cursor-pointer ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-900 focus:ring-2 focus:ring-slate-700'
                        : 'bg-[#1c1c1e] border-2 border-[#2A6B5C]/60 text-[#D1E4DE] focus:ring-2 focus:ring-[#2A6B5C]'
                    }`}
                  >
                    <option value="ALL" className={isLight ? 'bg-white text-slate-900' : 'bg-[#000000] text-[#A8CCC0]'}>جميع الموظفين</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id} className={isLight ? 'bg-white text-slate-900' : 'bg-[#000000] text-[#D1E4DE]'}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Leads List / Cards for Selected Date */}
          <div className={`border rounded-2xl shadow-xl overflow-hidden ${
            isLight ? 'bg-white border-slate-200' : 'bg-[#14171D] border-slate-800'
          }`}>
            {clientsForSelectedDate.length === 0 ? (
              <div className="p-10 text-center space-y-4">
                <div className={`w-14 h-14 mx-auto rounded-full flex items-center justify-center ${
                  isLight ? 'bg-slate-100 text-slate-500' : 'bg-slate-800/80 text-slate-400'
                }`}>
                  <CalendarDays className="w-7 h-7 text-[#2A6B5C]" />
                </div>
                <div className="space-y-1">
                  <h3 className={`text-base font-bold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                    لا توجد داتا مسجلة في تاريخ ({formatArabicDate(selectedDate)})
                  </h3>
                  <p className={`text-xs max-w-md mx-auto ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    لم يتم تسجيل عملاء في هذا اليوم بالتحديد، أو تم تطبيق فلاتر لم تطابق أية نتائج.
                  </p>
                </div>

                {/* If there are other dates with data, suggest them */}
                {activeDatesList.length > 0 && (
                  <div className={`pt-2 border-t max-w-lg mx-auto space-y-2 ${
                    isLight ? 'border-slate-200' : 'border-slate-800/80'
                  }`}>
                    <span className={`text-[11px] font-bold block ${isLight ? 'text-slate-800' : 'text-[#7AB0A0]'}`}>
                      📌 أو اختر من التواريخ التي تحتوي على داتا مسجلة:
                    </span>
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      {activeDatesList.slice(0, 5).map(item => (
                        <button
                          key={item.dateStr}
                          onClick={() => {
                            setSelectedDate(item.dateStr);
                            const parts = item.dateStr.split('-');
                            if (parts.length === 3) {
                              setViewMonth(new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, 1));
                            }
                          }}
                          className={`px-3 py-1.5 border rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer ${
                            isLight
                              ? 'bg-slate-50 hover:bg-slate-50 text-slate-950 border-slate-300'
                              : 'bg-[#000000] hover:bg-slate-800 text-[#A8CCC0] border-[#2A6B5C]/40'
                          }`}
                        >
                          <span>{item.dateStr}</span>
                          <span className={`px-1.5 py-0.2 text-[10px] rounded-full ${
                            isLight ? 'bg-slate-100 text-slate-900' : 'bg-slate-950 text-slate-300'
                          }`}>
                            ({item.total} عميل)
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                  <button
                    onClick={() => {
                      setSelectedDate('ALL');
                      setSelectedProjectFilter('ALL');
                      setSelectedStatusFilter('ALL');
                      setSelectedUserFilter('ALL');
                      setSearchArchive('');
                    }}
                    className="px-4 py-2 bg-[#2A6B5C] hover:bg-[#4F9282] text-white font-bold text-xs rounded-xl transition inline-flex items-center gap-1.5 cursor-pointer shadow"
                  >
                    <FolderArchive className="w-3.5 h-3.5" />
                    <span>عرض كل الأرشيف الكامل</span>
                  </button>

                  <button
                    onClick={() => {
                      setSelectedDate(todayStr);
                      setSelectedProjectFilter('ALL');
                      setSelectedStatusFilter('ALL');
                      setSelectedUserFilter('ALL');
                      setSearchArchive('');
                    }}
                    className={`px-4 py-2 font-bold text-xs rounded-xl transition inline-flex items-center gap-1.5 cursor-pointer ${
                      isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300' : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                    }`}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>إعادة التعيين لداتا اليوم</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className={`divide-y ${isLight ? 'divide-slate-200' : 'divide-slate-800'}`}>
                {clientsForSelectedDate.map(client => (
                  <div
                    key={client.id}
                    className={`p-4 sm:p-4.5 transition flex flex-col md:flex-row md:items-center justify-between gap-3.5 ${
                      isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-800/50'
                    }`}
                  >
                    {/* Client Main Details */}
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`font-black text-sm ${isLight ? 'text-slate-900' : 'text-[#D1E4DE]'}`}>{client.name}</span>

                        {/* Priority Badge */}
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            client.priority === 'عالي'
                              ? 'bg-red-500/20 text-red-600 border border-red-500/40'
                              : client.priority === 'متوسط'
                              ? 'bg-yellow-500/20 text-yellow-700 border border-yellow-500/40'
                              : (isLight ? 'bg-slate-100 text-slate-600' : 'bg-slate-700 text-slate-300')
                          }`}
                        >
                          {client.priority === 'عالي' ? '🔥 أولوية عالية' : client.priority}
                        </span>

                        {/* Project Badge */}
                        <span className={`px-2 py-0.5 border rounded text-[10px] font-semibold flex items-center gap-1 ${
                          isLight
                            ? 'bg-slate-50 text-slate-900 border-slate-200'
                            : 'bg-slate-950 text-slate-200 border-slate-700/60'
                        }`}>
                          <Building2 className="w-3 h-3 text-[#2A6B5C]" />
                          {client.projectName}
                        </span>

                        {/* Assigned Rep */}
                        {currentUser.role === 'ADMIN' && (
                          <span className={`px-2 py-0.5 rounded text-[10px] flex items-center gap-1 ${
                            isLight ? 'bg-slate-100 text-slate-700' : 'bg-slate-800 text-slate-300'
                          }`}>
                            <UserCheck className="w-3 h-3 text-[#2A6B5C]" />
                            {client.assignedUserName}
                          </span>
                        )}
                      </div>

                      {/* Phone & Source */}
                      <div className={`flex flex-wrap items-center gap-3 text-xs font-mono ${
                        isLight ? 'text-slate-600' : 'text-slate-300'
                      }`}>
                        <span className={`font-bold dir-ltr tracking-wider ${
                          isLight ? 'text-slate-800' : 'text-[#7AB0A0]'
                        }`}>
                          {client.phone}
                        </span>
                        {client.source && (
                          <span className={`text-[11px] font-sans ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                            المصدر: <strong className={isLight ? 'text-slate-800' : 'text-slate-200'}>{client.source}</strong>
                          </span>
                        )}
                        {client.followUpDate && (
                          <span className={`text-[11px] font-sans flex items-center gap-1 ${
                            isLight ? 'text-[#0C2E27]' : 'text-[#7AB0A0]/90'
                          }`}>
                            <Clock className="w-3 h-3 text-[#2A6B5C]" />
                            موعد فولو اب: {client.followUpDate} {client.followUpTime || ''}
                          </span>
                        )}
                      </div>

                      {/* Notes preview */}
                      {client.notes && (
                        <p className={`text-xs p-2 rounded-lg border leading-relaxed ${
                          isLight ? 'bg-slate-50 text-slate-700 border-slate-200' : 'bg-slate-900/80 text-slate-300/90 border-slate-800'
                        }`}>
                          💬 {client.notes}
                        </p>
                      )}
                    </div>

                    {/* Right side: Status dropdown & Quick actions */}
                    <div className="flex flex-wrap md:flex-col items-center md:items-end gap-2 shrink-0">
                      
                      {/* Status Selector */}
                      <select
                        value={client.status}
                        onChange={e => updateClient(client.id, { status: e.target.value as any })}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                          client.status === 'مهتم'
                            ? (isLight ? 'bg-slate-100 text-slate-900 border-slate-300' : 'bg-slate-900/80 text-slate-200 border-slate-500')
                            : client.status === 'هرجع اكلمه تاني'
                            ? (isLight ? 'bg-[#D1E4DE] text-[#081F1A] border-[#7AB0A0]' : 'bg-[#081F1A]/80 text-[#A8CCC0] border-[#2A6B5C]')
                            : client.status === 'مشغول دلوقتي'
                            ? (isLight ? 'bg-[#D1E4DE] text-[#081F1A] border-[#7AB0A0]' : 'bg-[#081F1A]/80 text-[#A8CCC0] border-[#2A6B5C]')
                            : client.status === 'مش مهتم'
                            ? (isLight ? 'bg-red-100 text-red-900 border-red-300' : 'bg-red-950/80 text-red-200 border-red-500')
                            : (isLight ? 'bg-slate-100 text-slate-800 border-slate-300' : 'bg-slate-800 text-slate-200 border-slate-600')
                        }`}
                      >
                        <option value="مهتم">مهتم ⭐</option>
                        <option value="هرجع اكلمه تاني">هرجع اكلمه تاني</option>
                        <option value="مشغول دلوقتي">مشغول دلوقتي</option>
                        <option value="غير متاح">غير متاح</option>
                        <option value="مغلق">مغلق</option>
                        <option value="قفل الخط في وشي">قفل الخط في وشي</option>
                        <option value="مش مهتم">مش مهتم</option>
                        <option value="جديد">جديد</option>
                      </select>

                      {/* Quick Communication Buttons */}
                      <div className="flex items-center gap-1.5">
                        <a
                          href={`tel:${client.phone}`}
                          className="p-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition shadow flex items-center justify-center"
                          title="اتصال هاتفي مباشر"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </a>

                        <a
                          href={`https://wa.me/2${client.phone.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 bg-green-600 hover:bg-green-500 text-white rounded-xl transition shadow flex items-center justify-center"
                          title="محادثة واتساب سريعة"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </a>

                        <button
                          onClick={() => onSelectClientForFollowUp(client)}
                          className={`px-2.5 py-1.5 text-xs font-semibold rounded-xl transition flex items-center gap-1 ${
                            isLight
                              ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300'
                              : 'bg-[#1c1c1e] hover:bg-slate-800 text-[#A8CCC0] border border-[#2A6B5C]/30'
                          }`}
                          title="تحديد موعد فولو اب"
                        >
                          <Clock className="w-3.5 h-3.5" />
                          <span>فولو اب</span>
                        </button>

                        <button
                          onClick={() => onOpenHistoryModal(client)}
                          className={`p-2 rounded-xl transition ${
                            isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white'
                          }`}
                          title="سجل الملاحظات والمكالمات"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
};
