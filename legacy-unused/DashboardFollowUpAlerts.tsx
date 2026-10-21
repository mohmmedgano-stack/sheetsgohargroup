import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { ClientLead, CallStatus, User, Project } from '../types';
import {
  AlertTriangle,
  Clock,
  Flame,
  PhoneCall,
  Calendar,
  UserCheck,
  CheckCircle2,
  Filter,
  Search,
  MessageCircle,
  History,
  ArrowUpRight,
  Sparkles,
  ChevronDown,
  AlertCircle,
  BellRing,
  XCircle,
  Phone,
  RefreshCw,
  Send,
} from 'lucide-react';
import { FollowUpModal } from './FollowUpModal';
import { HistoryModal } from './HistoryModal';
import { BrowserNotificationModal } from './BrowserNotificationModal';
import { toLocalDateStr } from '../utils/dates';

interface DashboardFollowUpAlertsProps {
  clients: ClientLead[];
  users: User[];
  projects: Project[];
}

type AlertLevel = 'CRITICAL' | 'DUE_TODAY' | 'HOT_INTERESTED' | 'NEW_UNCONTACTED';

interface AlertLeadItem {
  client: ClientLead;
  alertLevel: AlertLevel;
  daysSinceLastInteraction: number;
  reason: string;
  badgeLabel: string;
  badgeColor: string;
  isOverdueFollowUpDate: boolean;
  isDueToday: boolean;
}

export const DashboardFollowUpAlerts: React.FC<DashboardFollowUpAlertsProps> = ({
  clients,
  users,
  projects,
}) => {
  const {
    updateClientStatus,
    scheduleFollowUp,
    currentUser,
    themeMode,
    browserNotificationSettings,
    triggerTestNotification,
  } = useApp();

  const isLight = themeMode === 'light';

  // Filter States
  const [selectedAlertFilter, setSelectedAlertFilter] = useState<'ALL' | AlertLevel>('ALL');
  const [selectedRepFilter, setSelectedRepFilter] = useState<string>('ALL');
  const [selectedProjectFilter, setSelectedProjectFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Modals state
  const [selectedFollowUpClient, setSelectedFollowUpClient] = useState<ClientLead | null>(null);
  const [selectedHistoryClient, setSelectedHistoryClient] = useState<ClientLead | null>(null);
  const [showNotificationSettingsModal, setShowNotificationSettingsModal] = useState<boolean>(false);

  // Quick Action Inline state
  const [quickUpdateClientId, setQuickUpdateClientId] = useState<string | null>(null);
  const [quickStatus, setQuickStatus] = useState<CallStatus>('مهتم');
  const [quickNote, setQuickNote] = useState<string>('');

  const todayStr = useMemo(() => toLocalDateStr(), []);
  const nowTime = useMemo(() => new Date().getTime(), []);

  // Compute Alerts list based on last interaction date & follow-up rules
  const alertItems = useMemo<AlertLeadItem[]>(() => {
    const list: AlertLeadItem[] = [];

    clients.forEach(client => {
      // Determine days elapsed since last interaction
      const refDateStr = client.lastInteractionDate || client.createdAt;
      let daysElapsed = 0;
      if (refDateStr) {
        try {
          const d = new Date(refDateStr);
          if (!isNaN(d.getTime())) {
            const diffTime = nowTime - d.getTime();
            daysElapsed = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
          }
        } catch {
          daysElapsed = 0;
        }
      }

      const isFollowUpSet = !!client.followUpDate;
      const isDueToday = client.followUpDate === todayStr;
      const isOverdueFollowUpDate = isFollowUpSet && (client.followUpDate! < todayStr);

      let alertLevel: AlertLevel | null = null;
      let reason = '';
      let badgeLabel = '';
      let badgeColor = '';

      // 1. Critical Overdue:
      if (
        (isOverdueFollowUpDate && (client.status === 'مهتم' || client.status === 'هرجع اكلمه تاني' || client.status === 'مشغول دلوقتي')) ||
        (daysElapsed >= 3 && (client.status === 'مهتم' || client.status === 'هرجع اكلمه تاني'))
      ) {
        alertLevel = 'CRITICAL';
        if (isOverdueFollowUpDate) {
          reason = `فات ميعاد الفولو اب المحدد (${client.followUpDate}) ولم يتم تسجيل مكالمة جديدة`;
          badgeLabel = `تأخر عن الموعد (${client.followUpDate})`;
        } else {
          reason = `مر ${daysElapsed} أيام على آخر تواصل مع العميل دون متابعة جديدة`;
          badgeLabel = `متأخر منذ ${daysElapsed} أيام 🚨`;
        }
        badgeColor = 'bg-rose-950/80 text-rose-300 border-rose-600/60';
      }
      // 2. Due Today:
      else if (isDueToday) {
        alertLevel = 'DUE_TODAY';
        reason = `ميعاد المتابعة والاتصال مجدول لليوم (${client.followUpTime || 'خلال اليوم'})`;
        badgeLabel = `مستحق اليوم (${client.followUpTime || 'اليوم'}) ⏰`;
        badgeColor = 'bg-[#041310]/80 text-[#7AB0A0] border-[#2A6B5C]/60';
      }
      // 3. Hot Interested Lead Pending Check:
      else if (client.status === 'مهتم' && daysElapsed >= 2) {
        alertLevel = 'HOT_INTERESTED';
        reason = `عميل مهتم بمشروع ${client.projectName} لم يتم تحديث تفاصيله منذ ${daysElapsed} يوم`;
        badgeLabel = `عميل مهتم معلق (${daysElapsed} يوم) ⭐`;
        badgeColor = 'bg-slate-950/80 text-slate-300 border-slate-500/60';
      }
      // 4. New Uncontacted Lead:
      else if (client.status === 'جديد' && daysElapsed >= 1) {
        alertLevel = 'NEW_UNCONTACTED';
        reason = `رقم جديد مضاف منذ ${daysElapsed} يوم ولم يتواصل معه الموظف حتى الآن`;
        badgeLabel = `رقم جديد لم يُتصل به (${daysElapsed} يوم) 📞`;
        badgeColor = 'bg-[#041310]/80 text-[#7AB0A0] border-[#2A6B5C]/60';
      }

      if (alertLevel) {
        list.push({
          client,
          alertLevel,
          daysSinceLastInteraction: daysElapsed,
          reason,
          badgeLabel,
          badgeColor,
          isOverdueFollowUpDate,
          isDueToday,
        });
      }
    });

    // Sort: Critical first, then Due Today, then Hot, then newest days
    const orderScore: Record<AlertLevel, number> = {
      CRITICAL: 1,
      DUE_TODAY: 2,
      HOT_INTERESTED: 3,
      NEW_UNCONTACTED: 4,
    };

    return list.sort((a, b) => {
      const scoreDiff = orderScore[a.alertLevel] - orderScore[b.alertLevel];
      if (scoreDiff !== 0) return scoreDiff;
      return b.daysSinceLastInteraction - a.daysSinceLastInteraction;
    });
  }, [clients, todayStr, nowTime]);

  // Aggregate Metrics
  const totalAlertsCount = alertItems.length;
  const criticalCount = alertItems.filter(i => i.alertLevel === 'CRITICAL').length;
  const dueTodayCount = alertItems.filter(i => i.alertLevel === 'DUE_TODAY').length;
  const hotInterestedCount = alertItems.filter(i => i.alertLevel === 'HOT_INTERESTED').length;
  const uncontactedNewCount = alertItems.filter(i => i.alertLevel === 'NEW_UNCONTACTED').length;

  // Filtered Alert List
  const filteredAlerts = useMemo(() => {
    return alertItems.filter(item => {
      const matchesLevel = selectedAlertFilter === 'ALL' || item.alertLevel === selectedAlertFilter;
      const matchesRep = selectedRepFilter === 'ALL' || item.client.assignedUserId === selectedRepFilter;
      const matchesProject = selectedProjectFilter === 'ALL' || item.client.projectName === selectedProjectFilter;

      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        item.client.name.toLowerCase().includes(q) ||
        item.client.phone.includes(q) ||
        item.client.assignedUserName.toLowerCase().includes(q) ||
        item.client.projectName.toLowerCase().includes(q);

      return matchesLevel && matchesRep && matchesProject && matchesSearch;
    });
  }, [alertItems, selectedAlertFilter, selectedRepFilter, selectedProjectFilter, searchQuery]);

  // Sales reps with most pending urgent follow-ups
  const topPendingReps = useMemo(() => {
    const counts: Record<string, { name: string; count: number; critical: number }> = {};
    alertItems.forEach(item => {
      const repId = item.client.assignedUserId;
      const repName = item.client.assignedUserName;
      if (!counts[repId]) {
        counts[repId] = { name: repName, count: 0, critical: 0 };
      }
      counts[repId].count += 1;
      if (item.alertLevel === 'CRITICAL') {
        counts[repId].critical += 1;
      }
    });

    return Object.entries(counts)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.critical - a.critical || b.count - a.count);
  }, [alertItems]);

  // Quick Inline Status Update Handler
  const handleQuickStatusSubmit = (clientId: string) => {
    if (!quickStatus) return;
    updateClientStatus(clientId, quickStatus, quickNote);
    setQuickUpdateClientId(null);
    setQuickNote('');
  };

  // Helper for WhatsApp
  const getWhatsAppLink = (phone: string, clientName: string, projectName: string) => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const formattedPhone = cleanPhone.startsWith('0') ? `2${cleanPhone}` : cleanPhone;
    const msg = encodeURIComponent(`أهلاً بك أستاذ ${clientName}، معك فريق مبيعات شركة جوهر جروب للتطوير العقاري بخصوص استفسارك عن مشروع ${projectName}. حابب أوضح لحضرتك أحدث العروض والمساحات المتاحة.`);
    return `https://wa.me/${formattedPhone}?text=${msg}`;
  };

  return (
    <div className="bg-[#000000] rounded-2xl border-2 border-[#2A6B5C]/50 shadow-2xl overflow-hidden space-y-5 p-5 text-slate-100">
      
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#2A6B5C]/30">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-[#1c1c1e] to-[#000000] text-[#2A6B5C] rounded-2xl border border-[#2A6B5C]/60 shadow-lg relative">
            <BellRing className="w-6 h-6 animate-pulse" />
            {criticalCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] font-mono font-black flex items-center justify-center border border-white">
                !
              </span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-base sm:text-lg font-black text-[#2A6B5C] flex items-center gap-2">
                <span>نظام التنبيهات الذكي والمتابعات الفورية (Smart SLA & Overdue Radar)</span>
              </h2>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-700/60 font-mono">
                {totalAlertsCount} تنبيه معلق
              </span>
            </div>
            <p className="text-xs text-slate-200/90 font-medium mt-0.5">
              رصد حي للعملاء الذين يحتاجون متابعة سريعة بناءً على تاريخ آخر تواصل، مواعيد الفولو اب المتأخرة، والعملاء المهتمين المعلقين.
            </p>
          </div>
        </div>

        {/* Status Indicators Pill & Notification Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {criticalCount > 0 && (
            <span className="px-3 py-1 bg-rose-900/60 text-rose-200 text-xs rounded-xl border border-rose-600/60 font-bold flex items-center gap-1.5 shadow-sm">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span>{criticalCount} حرج متأخر (+3 أيام)</span>
            </span>
          )}
          {dueTodayCount > 0 && (
            <span className="px-3 py-1 bg-[#081F1A]/60 text-[#A8CCC0] text-xs rounded-xl border border-[#2A6B5C]/60 font-bold flex items-center gap-1.5 shadow-sm">
              <Clock className="w-3.5 h-3.5 text-[#4F9282]" />
              <span>{dueTodayCount} مستحق اليوم</span>
            </span>
          )}

          {/* Browser Notifications Settings Pill */}
          <button
            onClick={() => setShowNotificationSettingsModal(true)}
            className="px-3 py-1 bg-[#000000] hover:bg-[#1c1c1e] text-[#2A6B5C] text-xs rounded-xl border border-[#2A6B5C]/50 font-bold flex items-center gap-1.5 transition shadow-sm"
            title="إعدادات وتفعيل إشعارات المتصفح لسطح المكتب"
          >
            <BellRing className="w-3.5 h-3.5 text-[#4F9282] animate-pulse" />
            <span>إشعارات المتصفح 🔔</span>
            <span className="w-2 h-2 rounded-full bg-slate-400"></span>
          </button>
        </div>
      </div>

      {/* KPI Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Total Urgent */}
        <button
          onClick={() => setSelectedAlertFilter('ALL')}
          className={`p-3.5 rounded-xl border text-right transition cursor-pointer ${
            selectedAlertFilter === 'ALL'
              ? 'bg-[#1c1c1e] border-[#2A6B5C] shadow-lg ring-1 ring-[#2A6B5C]'
              : 'bg-[#000000] border-slate-900/60 hover:border-slate-700'
          }`}
        >
          <span className="text-[11px] font-bold text-[#2A6B5C] block">إجمالي تنبيهات المتابعة</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-[#D1E4DE] font-mono">{totalAlertsCount}</span>
            <span className="text-[10px] text-slate-300 font-bold">عميل يحتاج إجراء</span>
          </div>
        </button>

        {/* Critical Overdue */}
        <button
          onClick={() => setSelectedAlertFilter('CRITICAL')}
          className={`p-3.5 rounded-xl border text-right transition cursor-pointer ${
            selectedAlertFilter === 'CRITICAL'
              ? 'bg-rose-950/70 border-rose-500 shadow-lg ring-1 ring-rose-500'
              : 'bg-[#000000] border-rose-900/40 hover:border-rose-700/60'
          }`}
        >
          <span className="text-[11px] font-bold text-rose-400 block flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 inline" />
            <span>متأخر بشدة (+3 أيام)</span>
          </span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-rose-200 font-mono">{criticalCount}</span>
            <span className="text-[10px] text-rose-300 font-bold">أولوية قصوى 🚨</span>
          </div>
        </button>

        {/* Due Today */}
        <button
          onClick={() => setSelectedAlertFilter('DUE_TODAY')}
          className={`p-3.5 rounded-xl border text-right transition cursor-pointer ${
            selectedAlertFilter === 'DUE_TODAY'
              ? 'bg-[#041310]/70 border-[#2A6B5C] shadow-lg ring-1 ring-[#2A6B5C]'
              : 'bg-[#000000] border-[#081F1A]/40 hover:border-[#123F36]/60'
          }`}
        >
          <span className="text-[11px] font-bold text-[#4F9282] block flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 inline" />
            <span>مستحق اليوم</span>
          </span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-[#A8CCC0] font-mono">{dueTodayCount}</span>
            <span className="text-[10px] text-[#7AB0A0] font-bold">مواعيد اليوم ⏰</span>
          </div>
        </button>

        {/* Hot Interested Leads */}
        <button
          onClick={() => setSelectedAlertFilter('HOT_INTERESTED')}
          className={`p-3.5 rounded-xl border text-right transition cursor-pointer ${
            selectedAlertFilter === 'HOT_INTERESTED'
              ? 'bg-slate-950/70 border-slate-400 shadow-lg ring-1 ring-slate-400'
              : 'bg-[#000000] border-slate-900/40 hover:border-slate-700/60'
          }`}
        >
          <span className="text-[11px] font-bold text-slate-400 block flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 inline text-[#4F9282]" />
            <span>عملاء مهتمين معلقين</span>
          </span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-slate-200 font-mono">{hotInterestedCount}</span>
            <span className="text-[10px] text-slate-300 font-bold">فرص ساخنة ⭐</span>
          </div>
        </button>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="bg-[#000000] p-4 rounded-xl border border-[#2A6B5C]/30 space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-2 border-b border-slate-900/60 text-xs">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#2A6B5C]" />
            <span className="font-black text-[#2A6B5C]">تصفية قائمة التنبيهات:</span>
          </div>
          <span className="text-[11px] text-slate-300 font-bold">
            مطابقة ({filteredAlerts.length}) عميل بحاجة لمتابعة
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 text-xs">
          {/* Search Input */}
          <div>
            <label className="block text-[11px] font-black text-[#2A6B5C] mb-1">بحث بالاسم أو الهاتف:</label>
            <div className="relative">
              <input
                type="text"
                placeholder="ابحث عن عميل أو موظف..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full p-2 bg-[#1c1c1e] border border-[#2A6B5C]/40 rounded-xl text-[#D1E4DE] placeholder-slate-300/40 text-xs focus:ring-1 focus:ring-[#2A6B5C] focus:outline-none"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>
          </div>

          {/* Alert Level Filter */}
          <div>
            <label className="block text-[11px] font-black text-[#2A6B5C] mb-1">نوع التنبيه والإلحاح:</label>
            <select
              value={selectedAlertFilter}
              onChange={e => setSelectedAlertFilter(e.target.value as any)}
              className="w-full p-2 bg-[#1c1c1e] border border-[#2A6B5C]/40 rounded-xl text-[#D1E4DE] font-bold text-xs focus:ring-1 focus:ring-[#2A6B5C] focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-[#000000] text-[#A8CCC0]">جميع التنبيهات ({totalAlertsCount})</option>
              <option value="CRITICAL" className="bg-[#000000] text-rose-300">متأخر بشدة +3 أيام ({criticalCount})</option>
              <option value="DUE_TODAY" className="bg-[#000000] text-[#7AB0A0]">مستحق اليوم ({dueTodayCount})</option>
              <option value="HOT_INTERESTED" className="bg-[#000000] text-slate-300">مهتم معلق ({hotInterestedCount})</option>
              <option value="NEW_UNCONTACTED" className="bg-[#000000] text-[#7AB0A0]">أرقام جديدة بدون اتصال ({uncontactedNewCount})</option>
            </select>
          </div>

          {/* Sales Rep Filter */}
          <div>
            <label className="block text-[11px] font-black text-[#2A6B5C] mb-1">موظف المبيعات:</label>
            <select
              value={selectedRepFilter}
              onChange={e => setSelectedRepFilter(e.target.value)}
              className="w-full p-2 bg-[#1c1c1e] border border-[#2A6B5C]/40 rounded-xl text-[#D1E4DE] font-bold text-xs focus:ring-1 focus:ring-[#2A6B5C] focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-[#000000] text-[#A8CCC0]">جميع الموظفين</option>
              {users.filter(u => u.role === 'SALES_REP').map(u => (
                <option key={u.id} value={u.id} className="bg-[#000000] text-[#D1E4DE]">
                  {u.name}
                </option>
              ))}
            </select>
          </div>

          {/* Project Filter */}
          <div>
            <label className="block text-[11px] font-black text-[#2A6B5C] mb-1">المشروع:</label>
            <select
              value={selectedProjectFilter}
              onChange={e => setSelectedProjectFilter(e.target.value)}
              className="w-full p-2 bg-[#1c1c1e] border border-[#2A6B5C]/40 rounded-xl text-[#D1E4DE] font-bold text-xs focus:ring-1 focus:ring-[#2A6B5C] focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-[#000000] text-[#A8CCC0]">جميع المشاريع</option>
              {projects.map(p => (
                <option key={p.id} value={p.name} className="bg-[#000000] text-[#D1E4DE]">
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Alert Cards Feed */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="p-8 text-center bg-[#000000] rounded-xl border border-dashed border-slate-800 space-y-2">
            <CheckCircle2 className="w-10 h-10 text-slate-400 mx-auto" />
            <h4 className="text-sm font-bold text-slate-200">لا توجد تنبيهات متأخرة مطابقة لخيارات الفلترة الحالية</h4>
            <p className="text-xs text-slate-400">
              جميع العملاء تمت متابعتهم ضمن الوقت القياسي، أو تم تعيين مواعيد قادمة لهم بنجاح.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredAlerts.map(item => {
              const { client } = item;
              const isInlineOpen = quickUpdateClientId === client.id;

              return (
                <div
                  key={client.id}
                  className={`p-4 rounded-2xl border transition shadow-md flex flex-col justify-between space-y-3 ${
                    item.alertLevel === 'CRITICAL'
                      ? 'bg-gradient-to-br from-[#1A0C0E] to-[#0D1912] border-rose-600/70 hover:border-rose-500'
                      : item.alertLevel === 'DUE_TODAY'
                      ? 'bg-gradient-to-br from-[#1A1608] to-[#0D1912] border-[#2A6B5C]/70 hover:border-[#4F9282]'
                      : 'bg-gradient-to-br from-[#0B2418] to-[#000000] border-slate-700/60 hover:border-[#2A6B5C]/80'
                  }`}
                >
                  {/* Top Client Row */}
                  <div className="space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-black text-sm text-white flex items-center gap-1.5">
                            <span>{client.name}</span>
                            {client.priority === 'عالي' && (
                              <span className="text-[10px] px-1.5 py-0.2 bg-rose-900 text-rose-200 font-bold rounded">
                                عالي 🔥
                              </span>
                            )}
                          </h3>
                        </div>
                        <span className="font-mono text-xs text-[#2A6B5C] font-bold dir-ltr inline-block mt-0.5">
                          {client.phone}
                        </span>
                      </div>

                      {/* Urgency Badge */}
                      <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border shadow-sm ${item.badgeColor}`}>
                        {item.badgeLabel}
                      </span>
                    </div>

                    {/* Reason description */}
                    <div className="p-2 bg-[#000000]/80 rounded-xl border border-slate-900/50 text-[11px] text-[#A8CCC0] flex items-start gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-[#2A6B5C] shrink-0 mt-0.5" />
                      <span className="leading-snug">{item.reason}</span>
                    </div>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300 pt-1">
                      <div className="flex items-center gap-1 truncate">
                        <span className="text-slate-400 font-bold">المشروع:</span>
                        <span className="truncate">{client.projectName}</span>
                      </div>
                      <div className="flex items-center gap-1 truncate">
                        <span className="text-slate-400 font-bold">المسؤول:</span>
                        <span className="truncate font-bold text-[#7AB0A0]">{client.assignedUserName}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-slate-400 font-bold">الحالة الحالية:</span>
                        <span className="px-1.5 py-0.2 rounded bg-slate-950 text-slate-200 font-bold border border-slate-800 text-[10px]">
                          {client.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-slate-400 font-bold">آخر تواصل:</span>
                        <span className="font-mono text-[10px] text-slate-200">
                          {client.lastInteractionDate || client.createdAt || 'غير محدد'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Inline Quick Status Updater Drawer */}
                  {isInlineOpen && (
                    <div className="p-3 bg-[#1c1c1e] border border-[#2A6B5C]/50 rounded-xl space-y-2 text-xs">
                      <div className="flex items-center justify-between border-b border-slate-700/60 pb-1.5">
                        <span className="font-bold text-[#2A6B5C] flex items-center gap-1">
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>تحديث حالة العميل وتسجيل مكالمة الآن:</span>
                        </span>
                        <button
                          onClick={() => setQuickUpdateClientId(null)}
                          className="text-slate-400 hover:text-white"
                        >
                          ✕
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] text-slate-200 mb-0.5">الحالة الجديدة:</label>
                          <select
                            value={quickStatus}
                            onChange={e => setQuickStatus(e.target.value as CallStatus)}
                            className="w-full p-1.5 bg-[#000000] border border-[#2A6B5C]/40 rounded-lg text-[#D1E4DE] font-bold text-xs"
                          >
                            <option value="مهتم">مهتم ⭐</option>
                            <option value="هرجع اكلمه تاني">هرجع اكلمه تاني</option>
                            <option value="مشغول دلوقتي">مشغول دلوقتي</option>
                            <option value="غير متاح">غير متاح</option>
                            <option value="مغلق">مغلق</option>
                            <option value="قفل الخط في وشي">قفل الخط في وشي</option>
                            <option value="مش مهتم">مش مهتم</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] text-slate-200 mb-0.5">ملاحظة سريعة:</label>
                          <input
                            type="text"
                            placeholder="تم الاتصال وقال..."
                            value={quickNote}
                            onChange={e => setQuickNote(e.target.value)}
                            className="w-full p-1.5 bg-[#000000] border border-[#2A6B5C]/40 rounded-lg text-[#D1E4DE] text-xs placeholder-slate-400"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          onClick={() => setQuickUpdateClientId(null)}
                          className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 text-xs hover:bg-slate-700 cursor-pointer"
                        >
                          إلغاء
                        </button>
                        <button
                          onClick={() => handleQuickStatusSubmit(client.id)}
                          className="px-3 py-1 rounded bg-[#2A6B5C] hover:bg-[#7AB0A0] text-white font-bold text-xs transition flex items-center gap-1 cursor-pointer shadow"
                        >
                          <Send className="w-3 h-3" />
                          <span>حفظ التحديث وتصفير العداد</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Actions Toolbar */}
                  <div className="pt-2 border-t border-slate-900/60 flex flex-wrap items-center justify-between gap-1.5">
                    {/* Direct Contact Buttons */}
                    <div className="flex items-center gap-1.5">
                      <a
                        href={`tel:${client.phone}`}
                        className="px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-sm"
                        title="اتصال هاتفي مباشر"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>اتصال</span>
                      </a>

                      <a
                        href={getWhatsAppLink(client.phone, client.name, client.projectName)}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1.5 bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-600/50 rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-sm"
                        title="محادثة واتساب سريعة"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-slate-400" />
                        <span>واتساب</span>
                      </a>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          setQuickUpdateClientId(isInlineOpen ? null : client.id);
                          setQuickStatus(client.status === 'جديد' ? 'مهتم' : client.status);
                          setQuickNote('');
                        }}
                        className="px-2.5 py-1.5 bg-[#1c1c1e] hover:bg-slate-900 text-[#A8CCC0] border border-[#2A6B5C]/40 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                        title="تحديث الحالة وتسجيل الملاحظات"
                      >
                        <RefreshCw className="w-3 h-3 text-[#2A6B5C]" />
                        <span>تحديث فوري</span>
                      </button>

                      <button
                        onClick={() => setSelectedFollowUpClient(client)}
                        className="px-2.5 py-1.5 bg-[#2A6B5C] hover:bg-[#7AB0A0] text-white font-black rounded-lg text-xs transition flex items-center gap-1 cursor-pointer shadow"
                        title="جدولة ميعاد فولو اب قادم"
                      >
                        <Calendar className="w-3 h-3" />
                        <span>ميعاد فولو اب</span>
                      </button>

                      <button
                        onClick={() => setSelectedHistoryClient(client)}
                        className="p-1.5 bg-[#000000] hover:bg-slate-800 text-slate-300 border border-slate-900 rounded-lg transition cursor-pointer"
                        title="سجل التفاعلات السابقة"
                      >
                        <History className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Summary of Sales Reps Alert Load */}
      {topPendingReps.length > 0 && (
        <div className="p-3.5 bg-[#000000] rounded-xl border border-slate-900/60 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-black text-[#2A6B5C] flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-[#2A6B5C]" />
              <span>توزيع المتابعات المتأخرة على مسؤولي المبيعات:</span>
            </span>
            <span className="text-[11px] text-slate-400">لمساعدة الإدارة في التوجيه والمتابعة المباشرة</span>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {topPendingReps.map(rep => (
              <div
                key={rep.id}
                className="px-3 py-1.5 bg-[#1c1c1e] border border-slate-800 rounded-xl text-xs flex items-center gap-2"
              >
                <span className="font-bold text-slate-100">{rep.name}:</span>
                <span className="px-1.5 py-0.2 bg-[#041310] text-[#7AB0A0] font-mono font-bold text-[10px] rounded-full border border-[#2A6B5C]/40">
                  {rep.count} إجمالي
                </span>
                {rep.critical > 0 && (
                  <span className="px-1.5 py-0.2 bg-rose-950 text-rose-300 font-mono font-black text-[10px] rounded-full border border-rose-600/50">
                    {rep.critical} حرج
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      <FollowUpModal
        client={selectedFollowUpClient}
        onClose={() => setSelectedFollowUpClient(null)}
      />

      <HistoryModal
        client={selectedHistoryClient}
        onClose={() => setSelectedHistoryClient(null)}
      />

      <BrowserNotificationModal
        isOpen={showNotificationSettingsModal}
        onClose={() => setShowNotificationSettingsModal(false)}
      />

    </div>
  );
};
