import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { ClientLead, User as UserModel } from '../types';
import {
  Printer,
  FileText,
  Download,
  Calendar,
  MapPin,
  Building,
  User,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Phone,
  X,
  Filter,
  Layers,
  Sparkles,
  RotateCcw,
  Eye,
  Settings,
  Share2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Check,
  Copy,
} from 'lucide-react';
import { toLocalDateStr } from '../utils/dates';

export interface LivePreviewProps {
  paperSize: 'A4' | 'A5';
  pageOrientation: 'portrait' | 'landscape';
  zoomLevel: number;
  reportTitle: string;
  companyTitle?: string;
  companySubtitle?: string;
  currentUser: UserModel | null;
  metrics: {
    total: number;
    interested: number;
    callbacks: number;
    highPriority: number;
    todayCount: number;
    overdueCount: number;
  };
  reportClients: ClientLead[];
  showNotes: boolean;
  isLight: boolean;
  printContainerRef: React.RefObject<HTMLDivElement>;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  onToggleShowNotes: (checked: boolean) => void;
  onOpenSettings: () => void;
  onShareReport: () => void;
  onInstantPrint: () => void;
}

export const LivePreview = React.memo<LivePreviewProps>(({
  paperSize,
  pageOrientation,
  zoomLevel,
  reportTitle,
  companyTitle,
  companySubtitle,
  currentUser,
  metrics,
  reportClients,
  showNotes,
  isLight,
  printContainerRef,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onToggleShowNotes,
  onOpenSettings,
  onShareReport,
  onInstantPrint,
}) => {
  return (
    <div className="space-y-3" id="live-preview-section">
      {/* Zoom & Quick Preview Toolbar */}
      <div className={`p-2.5 rounded-xl border flex flex-wrap items-center justify-between gap-3 text-xs ${
        isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#000000] border-slate-900'
      }`}>
        <div className="flex items-center gap-2">
          <span className="font-bold">مستوى تكبير المعاينة:</span>
          <div className="flex items-center gap-1 bg-black/10 dark:bg-black/30 p-1 rounded-lg">
            <button
              type="button"
              onClick={onZoomOut}
              className="p-1 rounded hover:bg-black/20 text-xs font-bold cursor-pointer transition"
              title="تصغير المعاينة"
              aria-label="تصغير المعاينة"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 font-mono font-bold text-xs">{zoomLevel}%</span>
            <button
              type="button"
              onClick={onZoomIn}
              className="p-1 rounded hover:bg-black/20 text-xs font-bold cursor-pointer transition"
              title="تكبير المعاينة"
              aria-label="تكبير المعاينة"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onZoomReset}
              className="px-2 py-0.5 rounded text-[10px] font-bold hover:bg-black/20 cursor-pointer transition"
              title="إعادة ضبط 100%"
            >
              100%
            </button>
          </div>

          <label className="flex items-center gap-1.5 cursor-pointer font-bold select-none mr-3">
            <input
              type="checkbox"
              checked={showNotes}
              onChange={e => onToggleShowNotes(e.target.checked)}
              className="rounded text-slate-600 focus:ring-slate-500 cursor-pointer"
            />
            <span className="text-xs">إظهار الملاحظات</span>
          </label>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenSettings}
            className="px-3 py-1 bg-slate-200 dark:bg-slate-900/60 rounded-lg text-xs font-bold hover:bg-slate-300 dark:hover:bg-slate-800 transition flex items-center gap-1 cursor-pointer"
          >
            <Filter className="w-3 h-3" />
            <span>تعديل الفلاتر ⚙️</span>
          </button>

          <button
            type="button"
            onClick={onShareReport}
            className="px-3 py-1 bg-slate-600 hover:bg-slate-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-sm"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>مشاركة التقرير 📲</span>
          </button>

          <button
            type="button"
            onClick={onInstantPrint}
            className="px-3 py-1 bg-[#2A6B5C] hover:bg-[#7AB0A0] text-white rounded-lg text-xs font-black transition flex items-center gap-1 cursor-pointer shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>طباعة الآن 🖨️</span>
          </button>
        </div>
      </div>

      {/* Realistic Printable Paper Canvas */}
      <div className="w-full bg-slate-200 dark:bg-slate-950 p-4 sm:p-8 rounded-2xl border border-slate-300 dark:border-slate-950/60 shadow-inner overflow-auto max-h-[66vh] flex justify-center items-start">
        <div
          ref={printContainerRef}
          style={{
            transform: `scale(${zoomLevel / 100})`,
            transformOrigin: 'top center',
          }}
          className={`bg-white text-slate-900 shadow-2xl ring-1 ring-black/15 transition-all duration-200 select-none relative ${
            paperSize === 'A5'
              ? pageOrientation === 'landscape'
                ? 'w-full max-w-[760px] min-h-[520px] p-6 text-[11px]'
                : 'w-full max-w-[540px] min-h-[760px] p-5 text-[10px]'
              : pageOrientation === 'landscape'
              ? 'w-full max-w-[1020px] min-h-[720px] p-8 text-xs'
              : 'w-full max-w-[800px] min-h-[1100px] p-8 sm:p-10 text-xs'
          }`}
        >
          {/* Paper Top Header */}
          <div className="flex items-center justify-between border-b-2 border-slate-950 pb-3 mb-4">
            <div className="text-right">
              <div className="text-base sm:text-xl font-black text-[#1c1c1e]">
                {companyTitle || 'جوهر جروب للاستثمار العقاري'}
              </div>
              <div className="text-xs font-bold text-[#123F36]">
                {companySubtitle || 'Gohar Group Real Estate Investment'}
              </div>
              <div className="text-[10px] text-gray-600 mt-0.5">
                المدير العام: م. أسامة جوهر | إدارة المبيعات والتسويق
              </div>
            </div>

            <div className="text-left">
              <div className="text-sm sm:text-base font-black text-[#1c1c1e]">
                {reportTitle}
              </div>
              <div className="text-[10px] text-gray-500 mt-1 leading-tight">
                تاريخ الطباعة: {new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                <br />
                طبع بواسطة: {currentUser?.name || 'مستخدم النظام'} | مقاس: {paperSize} ({pageOrientation === 'portrait' ? 'رأسي' : 'أفقي'})
              </div>
            </div>
          </div>

          {/* Summary Metric Cards on Paper */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            <div className="bg-slate-50 border border-slate-200 rounded p-2 text-center">
              <div className="text-xs text-slate-500 font-bold">إجمالي العملاء</div>
              <div className="text-base font-black text-[#1c1c1e]">{metrics.total}</div>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded p-2 text-center">
              <div className="text-xs text-slate-700 font-bold">مهتمين ⭐</div>
              <div className="text-base font-black text-slate-800">{metrics.interested}</div>
            </div>
            <div className="bg-[#EAF3F0] border border-[#A8CCC0] rounded p-2 text-center">
              <div className="text-xs text-[#123F36] font-bold">إعادة اتصال 📞</div>
              <div className="text-base font-black text-[#0C2E27]">{metrics.callbacks}</div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded p-2 text-center">
              <div className="text-xs text-red-700 font-bold">أولوية عاجلة 🔥</div>
              <div className="text-base font-black text-red-800">{metrics.highPriority}</div>
            </div>
          </div>

          {/* Clients Leads Table on Paper */}
          <div className="overflow-x-auto mb-6">
            <table className="w-full text-right border-collapse border border-slate-300">
              <thead>
                <tr className="bg-[#1c1c1e] text-white text-[11px]">
                  <th className="p-2 border border-slate-950 text-center w-8">#</th>
                  <th className="p-2 border border-slate-950">اسم العميل</th>
                  <th className="p-2 border border-slate-950">رقم الهاتف</th>
                  <th className="p-2 border border-slate-950">المشروع</th>
                  <th className="p-2 border border-slate-950">المنطقة / العنوان</th>
                  <th className="p-2 border border-slate-950">موعد الفولو اب</th>
                  <th className="p-2 border border-slate-950 text-center">الحالة</th>
                  <th className="p-2 border border-slate-950">الموظف</th>
                  {showNotes && <th className="p-2 border border-slate-950">الملاحظات</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {reportClients.length === 0 ? (
                  <tr>
                    <td colSpan={showNotes ? 9 : 8} className="p-8 text-center text-gray-500">
                      لا توجد بيانات تطابق الفلاتر المحددة حالياً.
                    </td>
                  </tr>
                ) : (
                  reportClients.map((client, idx) => (
                    <tr key={client.id} className={idx % 2 === 1 ? 'bg-slate-50' : 'bg-white'}>
                      <td className="p-1.5 border border-slate-200 text-center font-bold text-gray-500">
                        {idx + 1}
                      </td>
                      <td className="p-1.5 border border-slate-200 font-black text-slate-900">
                        {client.name}
                      </td>
                      <td className="p-1.5 border border-slate-200 font-mono font-bold text-slate-800" dir="ltr">
                        {client.phone}
                      </td>
                      <td className="p-1.5 border border-slate-200 font-bold text-slate-800">
                        {client.projectName || '-'}
                      </td>
                      <td className="p-1.5 border border-slate-200 text-gray-700">
                        {client.address || '-'}
                      </td>
                      <td className="p-1.5 border border-slate-200 font-bold text-[#081F1A]">
                        {client.followUpDate || '-'}
                        {client.followUpTime ? (
                          <div className="text-[10px] text-gray-500">⏰ {client.followUpTime}</div>
                        ) : null}
                      </td>
                      <td className="p-1.5 border border-slate-200 text-center">
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-black border ${
                          client.status === 'مهتم'
                            ? 'bg-slate-100 text-slate-800 border-slate-300'
                            : client.status === 'هرجع اكلمه تاني'
                            ? 'bg-[#D1E4DE] text-[#0C2E27] border-[#7AB0A0]'
                            : 'bg-red-100 text-red-800 border-red-300'
                        }`}>
                          {client.status}
                        </span>
                      </td>
                      <td className="p-1.5 border border-slate-200 text-gray-700 text-[11px]">
                        {client.assignedUserName || '-'}
                      </td>
                      {showNotes && (
                        <td className="p-1.5 border border-slate-200 text-slate-700 text-[10.5px] leading-tight">
                          {client.notes || '-'}
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Paper Footer with Signatures */}
          <div className="border-t border-dashed border-slate-400 pt-4 mt-6 flex items-center justify-between text-[11px] text-gray-600">
            <div>
              <span>منظومة جوهر جروب العقارية الذكية © {new Date().getFullYear()}</span>
              <span className="mr-3">عدد السجلات: {reportClients.length}</span>
              <span className="mr-3">مقاس: {paperSize} ({pageOrientation === 'portrait' ? 'رأسي' : 'أفقي'})</span>
            </div>

            <div className="flex gap-8 text-center">
              <div className="w-28">
                <div>توقيع مسؤول المبيعات</div>
                <div className="border-b border-slate-700 mt-6"></div>
              </div>
              <div className="w-28">
                <div>اعتماد مدير المبيعات</div>
                <div className="border-b border-slate-700 mt-6"></div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
});
LivePreview.displayName = 'LivePreview';

interface FollowUpPrintReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialClients?: ClientLead[];
  initialFilterProject?: string;
  initialFilterStatus?: string;
  initialFilterRegion?: string;
}

const FollowUpPrintReportModalComponent: React.FC<FollowUpPrintReportModalProps> = ({
  isOpen,
  onClose,
  initialClients,
  initialFilterProject,
  initialFilterStatus,
  initialFilterRegion,
}) => {
  // 1. Context Hooks
  const {
    currentUser,
    visibleClients,
    projects,
    users,
    companyTitle,
    companySubtitle,
    themeMode,
  } = useApp();

  // 2. Ref Hooks
  const printContainerRef = useRef<HTMLDivElement>(null);

  // 3. State Hooks (unconditional at top-level)
  const [dateFilter, setDateFilter] = useState<'ALL' | 'TODAY' | 'TOMORROW' | 'WEEK' | 'OVERDUE' | 'CUSTOM'>('TODAY');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [selectedProject, setSelectedProject] = useState<string>(initialFilterProject || 'ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>(initialFilterStatus || 'ALL');
  const [selectedUser, setSelectedUser] = useState<string>(
    currentUser?.role === 'SALES_REP' ? currentUser.id : 'ALL'
  );
  const [selectedRegion, setSelectedRegion] = useState<string>(initialFilterRegion || 'ALL');
  const [reportTitle, setReportTitle] = useState<string>('تقرير المتابعات والاتصالات اليومية');
  const [showNotes, setShowNotes] = useState<boolean>(true);

  // New features state: Live preview tab, paper settings, zoom, and share feedback
  const [activeTab, setActiveTab] = useState<'PREVIEW' | 'SETTINGS'>('PREVIEW');
  const [paperSize, setPaperSize] = useState<'A4' | 'A5'>('A4');
  const [pageOrientation, setPageOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [shareToast, setShareToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  // 4. Custom Hooks
  const modalRef = useFocusTrap<HTMLDivElement>({
    isActive: isOpen,
    onClose,
  });

  // 5. Memoized Values & Calculations (unconditional at top-level)
  const isLight = themeMode === 'light';

  // Memoize date calculations to avoid redundant Date instances on every render
  const { todayStr, tomorrowStr, endOfWeekStr } = useMemo(() => {
    const today = new Date();
    const tStr = toLocalDateStr(today);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tmrStr = toLocalDateStr(tomorrow);

    const endOfWeek = new Date(today);
    endOfWeek.setDate(endOfWeek.getDate() + 7);
    const eowStr = toLocalDateStr(endOfWeek);

    return {
      todayStr: tStr,
      tomorrowStr: tmrStr,
      endOfWeekStr: eowStr,
    };
  }, []);

  // Base list of clients
  const baseClients = useMemo(() => {
    return initialClients && initialClients.length > 0 ? initialClients : visibleClients;
  }, [initialClients, visibleClients]);

  // Extract unique regions/addresses
  const availableRegions = useMemo(() => {
    const set = new Set<string>();
    baseClients.forEach(c => {
      if (c.address && c.address.trim()) {
        const parts = c.address.split(/[-,\/]/);
        const main = parts[0].trim();
        if (main.length > 1) {
          set.add(main);
        }
      }
    });
    return Array.from(set).sort();
  }, [baseClients]);

  // Filtered clients for report
  const reportClients = useMemo(() => {
    return baseClients.filter(c => {
      // 1. Date Filter
      let matchesDate = true;
      if (dateFilter === 'TODAY') {
        matchesDate = c.followUpDate === todayStr;
      } else if (dateFilter === 'TOMORROW') {
        matchesDate = c.followUpDate === tomorrowStr;
      } else if (dateFilter === 'WEEK') {
        matchesDate = !!c.followUpDate && c.followUpDate >= todayStr && c.followUpDate <= endOfWeekStr;
      } else if (dateFilter === 'OVERDUE') {
        matchesDate = !!c.followUpDate && c.followUpDate < todayStr && (c.status === 'مهتم' || c.status === 'هرجع اكلمه تاني');
      } else if (dateFilter === 'CUSTOM') {
        if (customStartDate && customEndDate) {
          matchesDate = !!c.followUpDate && c.followUpDate >= customStartDate && c.followUpDate <= customEndDate;
        } else if (customStartDate) {
          matchesDate = !!c.followUpDate && c.followUpDate >= customStartDate;
        } else if (customEndDate) {
          matchesDate = !!c.followUpDate && c.followUpDate <= customEndDate;
        }
      }

      // 2. Project Filter
      const matchesProject = selectedProject === 'ALL' || c.projectName === selectedProject;

      // 3. Status Filter
      const matchesStatus = selectedStatus === 'ALL' || c.status === selectedStatus;

      // 4. User Filter
      const matchesUser = selectedUser === 'ALL' || c.assignedUserId === selectedUser;

      // 5. Region Filter
      const matchesRegion =
        selectedRegion === 'ALL' ||
        (c.address && c.address.toLowerCase().includes(selectedRegion.toLowerCase()));

      return matchesDate && matchesProject && matchesStatus && matchesUser && matchesRegion;
    }).sort((a, b) => {
      const dateA = `${a.followUpDate || '9999-99-99'} ${a.followUpTime || '00:00'}`;
      const dateB = `${b.followUpDate || '9999-99-99'} ${b.followUpTime || '00:00'}`;
      return dateA.localeCompare(dateB);
    });
  }, [
    baseClients,
    dateFilter,
    todayStr,
    tomorrowStr,
    endOfWeekStr,
    customStartDate,
    customEndDate,
    selectedProject,
    selectedStatus,
    selectedUser,
    selectedRegion,
  ]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const total = reportClients.length;
    const interested = reportClients.filter(c => c.status === 'مهتم').length;
    const callbacks = reportClients.filter(c => c.status === 'هرجع اكلمه تاني').length;
    const highPriority = reportClients.filter(c => c.priority === 'عالي').length;
    const todayCount = reportClients.filter(c => c.followUpDate === todayStr).length;
    const overdueCount = reportClients.filter(c => c.followUpDate && c.followUpDate < todayStr).length;

    return { total, interested, callbacks, highPriority, todayCount, overdueCount };
  }, [reportClients, todayStr]);

  // 6. Side Effects (encapsulated strictly in useEffect)
  // Sync filter props safely without setState during render
  useEffect(() => {
    if (isOpen) {
      if (initialFilterProject && initialFilterProject !== selectedProject) {
        setSelectedProject(initialFilterProject);
      }
      if (initialFilterStatus && initialFilterStatus !== selectedStatus) {
        setSelectedStatus(initialFilterStatus);
      }
      if (initialFilterRegion && initialFilterRegion !== selectedRegion) {
        setSelectedRegion(initialFilterRegion);
      }
      if (currentUser?.role === 'SALES_REP' && currentUser.id !== selectedUser) {
        setSelectedUser(currentUser.id);
      }
    }
  }, [
    isOpen,
    initialFilterProject,
    initialFilterStatus,
    initialFilterRegion,
    currentUser,
    selectedProject,
    selectedStatus,
    selectedRegion,
    selectedUser,
  ]);

  // Clean up any lingering print iframes on unmount
  useEffect(() => {
    return () => {
      const oldIframe = document.getElementById('gohar-print-report-iframe');
      if (oldIframe && oldIframe.parentNode) {
        oldIframe.parentNode.removeChild(oldIframe);
      }
    };
  }, []);

  // 7. Memoized Callbacks (all hooks declared unconditionally above any early return)
  const handleBackdropClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  // Web Share API implementation with clipboard fallback
  const handleShareReport = useCallback(async () => {
    const orientationArabic = pageOrientation === 'portrait' ? 'رأسي (Portrait)' : 'أفقي (Landscape)';
    const company = companyTitle || 'جوهر جروب للاستثمار العقاري';

    const summaryText = [
      `📊 *تقرير متابعات ${company}*`,
      `📋 عنوان التقرير: ${reportTitle}`,
      `📅 التاريخ: ${todayStr}`,
      `🏢 المشروع: ${selectedProject === 'ALL' ? 'جميع المشاريع' : selectedProject}`,
      `📌 الحالة: ${selectedStatus === 'ALL' ? 'جميع الحالات' : selectedStatus}`,
      `📍 المنطقة: ${selectedRegion === 'ALL' ? 'جميع المناطق' : selectedRegion}`,
      `📄 إعدادات الطباعة: مقاس ${paperSize} - اتجاه ${orientationArabic}`,
      `👥 إجمالي المتابعات: ${reportClients.length} عميل`,
      `⭐ عملاء مهتمين: ${metrics.interested} | 📞 إعادة اتصال: ${metrics.callbacks} | 🔥 أولوية عاجلة: ${metrics.highPriority}`,
      `\nأهم العملاء المطلوب متابعتهم:`,
      ...reportClients.slice(0, 8).map((c, idx) =>
        `${idx + 1}. ${c.name} (${c.phone}) - ${c.projectName || 'مشروع عام'} - ${c.status} [${c.followUpDate || 'اليوم'}]`
      ),
      reportClients.length > 8 ? `\n... بالإضافة إلى ${reportClients.length - 8} عميل آخرين بالقائمة.` : '',
      `\nمنظومة جوهر جروب العقارية الذكية © ${new Date().getFullYear()}`,
    ].filter(Boolean).join('\n');

    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: `${reportTitle} - ${company}`,
          text: summaryText,
          url: window.location.href,
        });
        setShareToast({ message: 'تمت مشاركة التقرير بنجاح عبر التطبيقات', type: 'success' });
        setTimeout(() => setShareToast(null), 4000);
        return;
      } catch (err: any) {
        if (err.name === 'AbortError') {
          return;
        }
      }
    }

    // Fallback to clipboard
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(summaryText);
        setShareToast({
          message: 'تم نسخ ملخص التقرير بنجاح للحافظة لمشاركته عبر الواتساب والتطبيقات',
          type: 'success',
        });
        setTimeout(() => setShareToast(null), 4500);
      } else {
        setShareToast({ message: 'خاصية المشاركة غير مدعومة في هذا المتصفح', type: 'info' });
        setTimeout(() => setShareToast(null), 3500);
      }
    } catch (err) {
      setShareToast({ message: 'تعذر نسخ ملخص التقرير', type: 'info' });
      setTimeout(() => setShareToast(null), 3000);
    }
  }, [
    paperSize,
    pageOrientation,
    companyTitle,
    reportTitle,
    todayStr,
    selectedProject,
    selectedStatus,
    selectedRegion,
    reportClients,
    metrics,
  ]);

  const handleInstantPrint = useCallback(() => {
    const printContent = printContainerRef.current;
    if (!printContent) return;

    // Remove any previously existing print iframe to prevent DOM leaks
    const existingIframe = document.getElementById('gohar-print-report-iframe');
    if (existingIframe && existingIframe.parentNode) {
      existingIframe.parentNode.removeChild(existingIframe);
    }

    // Create hidden iframe for clean instant printing
    const iframe = document.createElement('iframe');
    iframe.id = 'gohar-print-report-iframe';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
        <head>
          <meta charset="utf-8" />
          <title>${reportTitle} - ${companyTitle || 'جوهر جروب للاستثمار العقاري'}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap');
            
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }

            body {
              font-family: 'Cairo', sans-serif;
              color: #111827;
              background: #ffffff;
              padding: ${paperSize === 'A5' ? '10px' : '16px'};
              font-size: ${paperSize === 'A5' ? '9.5px' : (pageOrientation === 'landscape' ? '11px' : '12px')};
              line-height: 1.35;
            }

            @page {
              size: ${paperSize} ${pageOrientation};
              margin: ${paperSize === 'A5' ? '6mm' : '10mm'};
            }

            .header-banner {
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-bottom: 3px solid #1c1c1e;
              padding-bottom: ${paperSize === 'A5' ? '8px' : '12px'};
              margin-bottom: ${paperSize === 'A5' ? '10px' : '14px'};
            }

            .company-name {
              font-size: ${paperSize === 'A5' ? '16px' : '20px'};
              font-weight: 900;
              color: #1c1c1e;
            }

            .company-sub {
              font-size: ${paperSize === 'A5' ? '9px' : '11px'};
              color: #B45309;
              font-weight: 700;
            }

            .report-title-box {
              text-align: left;
            }

            .report-title {
              font-size: ${paperSize === 'A5' ? '13px' : '16px'};
              font-weight: 800;
              color: #1c1c1e;
            }

            .report-meta {
              font-size: ${paperSize === 'A5' ? '8px' : '10px'};
              color: #4B5563;
              margin-top: 3px;
            }

            .metrics-grid {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: ${paperSize === 'A5' ? '6px' : '8px'};
              margin-bottom: ${paperSize === 'A5' ? '10px' : '14px'};
            }

            .metric-card {
              background: #F9FAFB;
              border: 1px solid #E5E7EB;
              border-radius: 6px;
              padding: ${paperSize === 'A5' ? '5px 4px' : '7px 6px'};
              text-align: center;
            }

            .metric-value {
              font-size: ${paperSize === 'A5' ? '13px' : '16px'};
              font-weight: 800;
              color: #1c1c1e;
            }

            .metric-label {
              font-size: ${paperSize === 'A5' ? '8px' : '10px'};
              color: #6B7280;
              font-weight: 600;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: ${paperSize === 'A5' ? '12px' : '18px'};
              font-size: ${paperSize === 'A5' ? '8.5px' : (pageOrientation === 'landscape' ? '10px' : '10.5px')};
            }

            th {
              background-color: #1c1c1e;
              color: #ffffff;
              font-weight: 700;
              text-align: right;
              padding: ${paperSize === 'A5' ? '5px 4px' : '7px 6px'};
              border: 1px solid #1c1c1e;
            }

            td {
              padding: ${paperSize === 'A5' ? '4px 3px' : '6px 5px'};
              border: 1px solid #D1D5DB;
              vertical-align: middle;
            }

            tr:nth-child(even) {
              background-color: #F9FAFB;
            }

            .badge {
              display: inline-block;
              padding: 2px 4px;
              border-radius: 4px;
              font-weight: 700;
              font-size: ${paperSize === 'A5' ? '8px' : '9px'};
            }

            .badge-interested {
              background-color: #DEF7EC;
              color: #03543F;
              border: 1px solid #31C48D;
            }

            .badge-callback {
              background-color: #E1EFFE;
              color: #1E429F;
              border: 1px solid #76A9FA;
            }

            .badge-urgent {
              background-color: #FDE8E8;
              color: #9B1C1C;
              border: 1px solid #F98080;
            }

            .notes-text {
              font-size: ${paperSize === 'A5' ? '8px' : '9.5px'};
              color: #374151;
              line-height: 1.25;
            }

            .footer-section {
              margin-top: ${paperSize === 'A5' ? '14px' : '22px'};
              padding-top: ${paperSize === 'A5' ? '8px' : '10px'};
              border-top: 1px dashed #9CA3AF;
              display: flex;
              justify-content: space-between;
              align-items: center;
              font-size: ${paperSize === 'A5' ? '8px' : '9.5px'};
              color: #6B7280;
            }

            .signature-block {
              text-align: center;
              width: ${paperSize === 'A5' ? '110px' : '150px'};
            }

            .signature-line {
              border-bottom: 1px solid #374151;
              margin-top: ${paperSize === 'A5' ? '16px' : '22px'};
            }

            @media print {
              body {
                padding: 0;
              }
              .no-print {
                display: none !important;
              }
            }
          </style>
        </head>
        <body>
          <div class="header-banner">
            <div>
              <div class="company-name">${companyTitle || 'جوهر جروب للاستثمار العقاري'}</div>
              <div class="company-sub">${companySubtitle || 'Gohar Group Real Estate Investment'}</div>
              <div style="font-size: ${paperSize === 'A5' ? '8px' : '10px'}; color: #4B5563; margin-top: 2px;">
                المدير العام: م. أسامة جوهر | إدارة المبيعات والتسويق
              </div>
            </div>
            <div class="report-title-box">
              <div class="report-title">${reportTitle}</div>
              <div class="report-meta">
                تاريخ الطباعة: ${new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                <br />
                طبع بواسطة: ${currentUser.name} (${currentUser.role === 'ADMIN' ? 'مدير عام' : 'مسؤول مبيعات'}) | مقاس: ${paperSize} (${pageOrientation === 'portrait' ? 'رأسي' : 'أفقي'})
              </div>
            </div>
          </div>

          <div class="metrics-grid">
            <div class="metric-card">
              <div class="metric-value">${metrics.total}</div>
              <div class="metric-label">إجمالي العملاء بالقائمة</div>
            </div>
            <div class="metric-card">
              <div class="metric-value" style="color: #046C4E;">${metrics.interested}</div>
              <div class="metric-label">عملاء مهتمين ⭐</div>
            </div>
            <div class="metric-card">
              <div class="metric-value" style="color: #1E429F;">${metrics.callbacks}</div>
              <div class="metric-label">إعادة اتصال 📞</div>
            </div>
            <div class="metric-card">
              <div class="metric-value" style="color: #C81E1E;">${metrics.highPriority}</div>
              <div class="metric-label">أولوية عاجلة 🔥</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 28px; text-align: center;">#</th>
                <th style="width: ${paperSize === 'A5' ? '100px' : '140px'};">اسم العميل</th>
                <th style="width: ${paperSize === 'A5' ? '90px' : '110px'};">رقم الهاتف</th>
                <th style="width: ${paperSize === 'A5' ? '80px' : '100px'};">المشروع</th>
                <th style="width: ${paperSize === 'A5' ? '70px' : '90px'};">المنطقة / العنوان</th>
                <th style="width: ${paperSize === 'A5' ? '85px' : '105px'};">موعد الفولو اب</th>
                <th style="width: ${paperSize === 'A5' ? '65px' : '80px'}; text-align: center;">الحالة</th>
                <th style="width: ${paperSize === 'A5' ? '65px' : '80px'};">الموظف</th>
                ${showNotes ? '<th>آخر الملاحظات والتفاصيل</th>' : ''}
              </tr>
            </thead>
            <tbody>
              ${reportClients.map((client, index) => `
                <tr>
                  <td style="text-align: center; font-weight: bold; color: #4B5563;">${index + 1}</td>
                  <td style="font-weight: 800; color: #111827;">${client.name}</td>
                  <td style="font-family: monospace; font-weight: bold; direction: ltr; text-align: right;">${client.phone}</td>
                  <td style="font-weight: 600; color: #065F46;">${client.projectName || '-'}</td>
                  <td>${client.address || '-'}</td>
                  <td style="font-weight: 700; color: #92400E;">
                    ${client.followUpDate || '-'} ${client.followUpTime ? `<br><small style="color: #4B5563;">⏰ ${client.followUpTime}</small>` : ''}
                  </td>
                  <td style="text-align: center;">
                    <span class="badge ${
                      client.status === 'مهتم'
                        ? 'badge-interested'
                        : client.status === 'هرجع اكلمه تاني'
                        ? 'badge-callback'
                        : 'badge-urgent'
                    }">
                      ${client.status}
                    </span>
                  </td>
                  <td style="font-size: ${paperSize === 'A5' ? '8px' : '10px'};">${client.assignedUserName || '-'}</td>
                  ${showNotes ? `<td class="notes-text">${client.notes || '-'}</td>` : ''}
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="footer-section">
            <div>
              <span>منظومة جوهر جروب العقارية الذكية © ${new Date().getFullYear()}</span>
              <span style="margin-right: 15px;">عدد السجلات المطبوعة: ${reportClients.length}</span>
              <span style="margin-right: 15px;">حجم الصفحة: ${paperSize} (${pageOrientation === 'portrait' ? 'رأسي' : 'أفقي'})</span>
            </div>
            <div style="display: flex; gap: 24px;">
              <div class="signature-block">
                <span>توقيع مسؤول المبيعات</span>
                <div class="signature-line"></div>
              </div>
              <div class="signature-block">
                <span>اعتماد مدير المبيعات</span>
                <div class="signature-line"></div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    doc.open();
    doc.write(htmlContent);
    doc.close();

    iframe.onload = () => {
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => {
          if (iframe && iframe.parentNode) {
            iframe.parentNode.removeChild(iframe);
          }
        }, 1000);
      }, 300);
    };
  }, [
    reportTitle,
    companyTitle,
    companySubtitle,
    currentUser,
    selectedProject,
    metrics,
    showNotes,
    reportClients,
    paperSize,
    pageOrientation,
  ]);

  const handleZoomIn = useCallback(() => {
    setZoomLevel(z => Math.min(140, z + 10));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomLevel(z => Math.max(60, z - 10));
  }, []);

  const handleZoomReset = useCallback(() => {
    setZoomLevel(100);
  }, []);

  const handleToggleShowNotes = useCallback((checked: boolean) => {
    setShowNotes(checked);
  }, []);

  const handleOpenSettings = useCallback(() => {
    setActiveTab('SETTINGS');
  }, []);

  const handleOpenPreview = useCallback(() => {
    setActiveTab('PREVIEW');
  }, []);

  const handlePaperSizeA4 = useCallback(() => {
    setPaperSize('A4');
  }, []);

  const handlePaperSizeA5 = useCallback(() => {
    setPaperSize('A5');
  }, []);

  const handleOrientationPortrait = useCallback(() => {
    setPageOrientation('portrait');
  }, []);

  const handleOrientationLandscape = useCallback(() => {
    setPageOrientation('landscape');
  }, []);

  // 8. Early Return (ONLY after ALL hooks, memos, callbacks, and effects have run)
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-sm animate-fade-in"
      dir="rtl"
      onClick={handleBackdropClick}
      data-modal-backdrop="true"
    >
      {/* Toast Feedback for Sharing */}
      {shareToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[60] px-4 py-2.5 rounded-2xl bg-slate-950 border-2 border-slate-400 text-slate-100 shadow-2xl text-xs font-black flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-slate-300 shrink-0" />
          <span>{shareToast.message}</span>
        </div>
      )}

      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        data-modal-container="true"
        className={`relative w-full max-w-6xl rounded-3xl border-2 shadow-2xl overflow-hidden flex flex-col max-h-[94vh] transition-all ${
          isLight
            ? 'bg-white border-[#4F9282]/50 text-slate-900 shadow-slate-400/50'
            : 'bg-[#000000] border-[#2A6B5C]/60 text-slate-100 shadow-2xl'
        }`}
      >
        
        {/* Modal Header */}
        <div className={`p-3.5 sm:p-4 border-b flex items-center justify-between shrink-0 ${
          isLight
            ? 'bg-gradient-to-r from-[#EAF3F0] to-slate-50 border-slate-200'
            : 'bg-gradient-to-r from-[#000000] to-[#000000] border-[#2A6B5C]/30'
        }`}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-[#2A6B5C] to-[#2A6B5C] text-gray-950 rounded-2xl shadow-lg">
              <Printer className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h3 className={`text-sm sm:text-base font-black ${isLight ? 'text-[#1c1c1e]' : 'text-[#7AB0A0]'}`}>
                تصدير وطباعة تقارير المتابعة اليومية
              </h3>
              <p className={`text-[11px] sm:text-xs ${isLight ? 'text-slate-600' : 'text-slate-200'}`}>
                معاينة حية ومطابقة للورقة قبل الطباعة مع إمكانية المشاركة وتغيير حجم واتجاه الصفحة
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleShareReport}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border shadow-sm ${
                isLight
                  ? 'bg-slate-50 text-slate-800 border-slate-300 hover:bg-slate-100'
                  : 'bg-slate-950/80 text-slate-200 border-slate-700 hover:bg-slate-900'
              }`}
              title="مشاركة التقرير عبر تطبيقات الهاتف أو الحافظة"
            >
              <Share2 className="w-3.5 h-3.5 text-[#2A6B5C]" />
              <span className="hidden sm:inline">مشاركة التقرير 📲</span>
            </button>

            <button
              type="button"
              onClick={handleInstantPrint}
              className="px-4 py-1.5 bg-[#2A6B5C] hover:bg-[#7AB0A0] text-white font-black text-xs rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة فورية 🖨️</span>
            </button>

            <button
              onClick={onClose}
              className={`p-1.5 rounded-xl transition ${
                isLight
                  ? 'hover:bg-slate-200 text-slate-600'
                  : 'hover:bg-slate-900/60 text-slate-300 hover:text-white'
              }`}
              aria-label="إغلاق النافذة"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Top Control Bar: Tab Switcher & Paper Setup */}
        <div className={`px-4 py-2.5 border-b flex flex-wrap items-center justify-between gap-3 text-xs shrink-0 ${
          isLight ? 'bg-slate-100 border-slate-200' : 'bg-[#000000] border-slate-900/60'
        }`}>
          {/* Main View Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/10 dark:bg-black/40">
            <button
              type="button"
              onClick={handleOpenPreview}
              className={`px-3 py-1.5 rounded-lg font-black transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'PREVIEW'
                  ? isLight
                    ? 'bg-[#1c1c1e] text-[#7AB0A0] shadow-sm'
                    : 'bg-[#2A6B5C] text-white shadow-sm'
                  : isLight
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>المعاينة الحية للورقة (Live Sheet) 👁️</span>
            </button>

            <button
              type="button"
              onClick={handleOpenSettings}
              className={`px-3 py-1.5 rounded-lg font-black transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'SETTINGS'
                  ? isLight
                    ? 'bg-[#1c1c1e] text-[#7AB0A0] shadow-sm'
                    : 'bg-[#2A6B5C] text-white shadow-sm'
                  : isLight
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>فلاتر وخيارات التقرير ⚙️</span>
            </button>
          </div>

          {/* Quick Paper Setup Controls */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Paper Size Selector (A4 / A5) */}
            <div className="flex items-center gap-1.5">
              <span className={`text-[11px] font-bold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                حجم الورق:
              </span>
              <div className="flex rounded-lg overflow-hidden border border-slate-300 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handlePaperSizeA4}
                  className={`px-2.5 py-1 text-xs font-black transition cursor-pointer ${
                    paperSize === 'A4'
                      ? 'bg-[#1c1c1e] text-[#7AB0A0] dark:bg-[#2A6B5C] dark:text-white'
                      : isLight ? 'bg-white text-slate-700 hover:bg-slate-50' : 'bg-[#000000] text-slate-200 hover:bg-[#1c1c1e]'
                  }`}
                >
                  A4 (قياسي)
                </button>
                <button
                  type="button"
                  onClick={handlePaperSizeA5}
                  className={`px-2.5 py-1 text-xs font-black transition cursor-pointer ${
                    paperSize === 'A5'
                      ? 'bg-[#1c1c1e] text-[#7AB0A0] dark:bg-[#2A6B5C] dark:text-white'
                      : isLight ? 'bg-white text-slate-700 hover:bg-slate-50' : 'bg-[#000000] text-slate-200 hover:bg-[#1c1c1e]'
                  }`}
                >
                  A5 (مدمج)
                </button>
              </div>
            </div>

            {/* Page Orientation Selector (Portrait / Landscape) */}
            <div className="flex items-center gap-1.5">
              <span className={`text-[11px] font-bold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                اتجاه الصفحة:
              </span>
              <div className="flex rounded-lg overflow-hidden border border-slate-300 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleOrientationPortrait}
                  className={`px-2.5 py-1 text-xs font-black transition cursor-pointer ${
                    pageOrientation === 'portrait'
                      ? 'bg-[#1c1c1e] text-[#7AB0A0] dark:bg-[#2A6B5C] dark:text-white'
                      : isLight ? 'bg-white text-slate-700 hover:bg-slate-50' : 'bg-[#000000] text-slate-200 hover:bg-[#1c1c1e]'
                  }`}
                >
                  📄 رأسي
                </button>
                <button
                  type="button"
                  onClick={handleOrientationLandscape}
                  className={`px-2.5 py-1 text-xs font-black transition cursor-pointer ${
                    pageOrientation === 'landscape'
                      ? 'bg-[#1c1c1e] text-[#7AB0A0] dark:bg-[#2A6B5C] dark:text-white'
                      : isLight ? 'bg-white text-slate-700 hover:bg-slate-50' : 'bg-[#000000] text-slate-200 hover:bg-[#1c1c1e]'
                  }`}
                >
                  📜 أفقي
                </button>
              </div>
            </div>

            {/* Clients Count Badge */}
            <span className={`px-2.5 py-1 rounded-lg text-xs font-black border ${
              isLight
                ? 'bg-slate-100 text-slate-900 border-slate-300'
                : 'bg-slate-950/80 text-[#7AB0A0] border-slate-700'
            }`}>
              العملاء: {reportClients.length}
            </span>
          </div>
        </div>

        {/* Modal Body: Active Tab Content */}
        <div className="p-3 sm:p-5 overflow-y-auto flex-1 space-y-4">
          
          {/* TAB 1: LIVE PREVIEW OF PRINT SHEET */}
          {activeTab === 'PREVIEW' && (
            <LivePreview
              paperSize={paperSize}
              pageOrientation={pageOrientation}
              zoomLevel={zoomLevel}
              reportTitle={reportTitle}
              companyTitle={companyTitle}
              companySubtitle={companySubtitle}
              currentUser={currentUser}
              metrics={metrics}
              reportClients={reportClients}
              showNotes={showNotes}
              isLight={isLight}
              printContainerRef={printContainerRef}
              onZoomIn={handleZoomIn}
              onZoomOut={handleZoomOut}
              onZoomReset={handleZoomReset}
              onToggleShowNotes={handleToggleShowNotes}
              onOpenSettings={handleOpenSettings}
              onShareReport={handleShareReport}
              onInstantPrint={handleInstantPrint}
            />
          )}

          {/* TAB 2: FILTERS & SETTINGS */}
          {activeTab === 'SETTINGS' && (
            <div className="space-y-4">
              {/* Quick Date Filters Bar */}
              <div className={`p-3.5 rounded-2xl border space-y-3 ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#1c1c1e]/70 border-slate-800/40'
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#2A6B5C]" />
                    <span className="text-xs font-black">تصفية تاريخ المتابعة للتقرير:</span>
                  </div>
                  <span className={`text-[11px] font-bold ${isLight ? 'text-slate-800' : 'text-[#7AB0A0]'}`}>
                    العملاء المطابقين للتقرير: ({reportClients.length}) عميل
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                  {[
                    { id: 'TODAY', label: 'متابعات اليوم 📅', desc: todayStr },
                    { id: 'TOMORROW', label: 'متابعات غداً ⏰', desc: tomorrowStr },
                    { id: 'WEEK', label: 'متابعات الأسبوع 🗓️', desc: '7 أيام قادمة' },
                    { id: 'OVERDUE', label: 'المتأخرة العاجلة 🚨', desc: 'فات موعدها' },
                    { id: 'ALL', label: 'جميع المواعيد 📋', desc: 'بدون قيد تاريخ' },
                    { id: 'CUSTOM', label: 'نطاق مخصص ✏️', desc: 'تحديد تواريخ' },
                  ].map(item => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setDateFilter(item.id as any)}
                      className={`p-2.5 rounded-xl text-xs font-bold transition border cursor-pointer text-center ${
                        dateFilter === item.id
                          ? isLight
                            ? 'bg-[#1c1c1e] text-[#7AB0A0] border-[#1c1c1e] shadow-sm'
                            : 'bg-[#2A6B5C] text-white border-[#2A6B5C] shadow'
                          : isLight
                          ? 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          : 'bg-[#000000] text-slate-200 border-slate-900 hover:bg-[#1c1c1e]'
                      }`}
                    >
                      <span className="block text-xs font-bold">{item.label}</span>
                      <span className="block text-[10px] opacity-75 font-mono mt-0.5">{item.desc}</span>
                    </button>
                  ))}
                </div>

                {/* Custom Date Range Picker */}
                {dateFilter === 'CUSTOM' && (
                  <div className={`p-3 rounded-xl border flex flex-wrap items-center gap-3 mt-2 ${
                    isLight ? 'bg-[#EAF3F0] border-[#A8CCC0]' : 'bg-[#000000] border-[#2A6B5C]/30'
                  }`}>
                    <span className="text-xs font-bold text-[#2A6B5C]">من تاريخ:</span>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={e => setCustomStartDate(e.target.value)}
                      className={`p-1.5 rounded-lg text-xs font-bold border ${
                        isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#1c1c1e] border-slate-700 text-[#D1E4DE]'
                      }`}
                    />
                    <span className="text-xs font-bold text-[#2A6B5C]">إلى تاريخ:</span>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={e => setCustomEndDate(e.target.value)}
                      className={`p-1.5 rounded-lg text-xs font-bold border ${
                        isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#1c1c1e] border-slate-700 text-[#D1E4DE]'
                      }`}
                    />
                  </div>
                )}
              </div>

              {/* Secondary Filters: Project, Status, User, Region */}
              <div className={`grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-2xl border ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#1c1c1e]/70 border-slate-800/40'
              }`}>
                {/* Project */}
                <div>
                  <label className={`block text-[11px] font-black mb-1 flex items-center gap-1 ${
                    isLight ? 'text-slate-800' : 'text-[#2A6B5C]'
                  }`}>
                    <Building className="w-3.5 h-3.5" />
                    <span>المشروع:</span>
                  </label>
                  <select
                    value={selectedProject}
                    onChange={e => setSelectedProject(e.target.value)}
                    className={`w-full p-2 rounded-xl text-xs font-bold border ${
                      isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#000000] border-slate-800 text-[#D1E4DE]'
                    }`}
                  >
                    <option value="ALL">جميع المشاريع</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.name}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label className={`block text-[11px] font-black mb-1 flex items-center gap-1 ${
                    isLight ? 'text-slate-800' : 'text-[#2A6B5C]'
                  }`}>
                    <Filter className="w-3.5 h-3.5" />
                    <span>الحالة:</span>
                  </label>
                  <select
                    value={selectedStatus}
                    onChange={e => setSelectedStatus(e.target.value)}
                    className={`w-full p-2 rounded-xl text-xs font-bold border ${
                      isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#000000] border-slate-800 text-[#D1E4DE]'
                    }`}
                  >
                    <option value="ALL">جميع الحالات</option>
                    <option value="مهتم">مهتم ⭐</option>
                    <option value="هرجع اكلمه تاني">هرجع اكلمه تاني 📞</option>
                    <option value="جديد">جديد ✨</option>
                    <option value="مشغول دلوقتي">مشغول دلوقتي</option>
                    <option value="غير متاح">غير متاح</option>
                    <option value="مغلق">مغلق</option>
                  </select>
                </div>

                {/* Region / Location */}
                <div>
                  <label className={`block text-[11px] font-black mb-1 flex items-center gap-1 ${
                    isLight ? 'text-slate-800' : 'text-[#2A6B5C]'
                  }`}>
                    <MapPin className="w-3.5 h-3.5" />
                    <span>المنطقة / العنوان:</span>
                  </label>
                  <select
                    value={selectedRegion}
                    onChange={e => setSelectedRegion(e.target.value)}
                    className={`w-full p-2 rounded-xl text-xs font-bold border ${
                      isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#000000] border-slate-800 text-[#D1E4DE]'
                    }`}
                  >
                    <option value="ALL">جميع المناطق</option>
                    {availableRegions.map(reg => (
                      <option key={reg} value={reg}>
                        {reg}
                      </option>
                    ))}
                  </select>
                </div>

                {/* User */}
                <div>
                  <label className={`block text-[11px] font-black mb-1 flex items-center gap-1 ${
                    isLight ? 'text-slate-800' : 'text-[#2A6B5C]'
                  }`}>
                    <User className="w-3.5 h-3.5" />
                    <span>الموظف:</span>
                  </label>
                  <select
                    value={selectedUser}
                    onChange={e => setSelectedUser(e.target.value)}
                    disabled={currentUser.role === 'SALES_REP'}
                    className={`w-full p-2 rounded-xl text-xs font-bold border ${
                      isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#000000] border-slate-800 text-[#D1E4DE]'
                    }`}
                  >
                    <option value="ALL">جميع الموظفين</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Report Customization Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3 flex-1">
                  <label className="font-bold text-xs shrink-0">عنوان التقرير:</label>
                  <input
                    type="text"
                    value={reportTitle}
                    onChange={e => setReportTitle(e.target.value)}
                    className={`flex-1 p-2 rounded-xl text-xs font-bold border ${
                      isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#000000] border-slate-800 text-[#D1E4DE]'
                    }`}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setActiveTab('PREVIEW')}
                  className="px-4 py-2 bg-gradient-to-r from-slate-600 to-[#1c1c1e] text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-2"
                >
                  <Eye className="w-4 h-4 text-[#7AB0A0]" />
                  <span>عرض المعاينة الحية للتقرير 👁️</span>
                </button>
              </div>

              {/* Data Table Preview in Settings */}
              <div className={`p-4 rounded-2xl border ${
                isLight ? 'bg-white border-slate-200' : 'bg-[#000000] border-slate-900'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-gray-500">معاينة أولية للبيانات المحددة:</span>
                  <span className="text-xs font-black text-slate-500">إجمالي: {reportClients.length} عميل</span>
                </div>
                <div className="overflow-x-auto max-h-56">
                  <table className="w-full text-xs text-right border-collapse">
                    <thead>
                      <tr className={`border-b text-xs ${isLight ? 'bg-slate-100 text-slate-800' : 'bg-[#000000] text-[#7AB0A0]'}`}>
                        <th className="p-2 text-center w-8">#</th>
                        <th className="p-2">اسم العميل</th>
                        <th className="p-2">الهاتف</th>
                        <th className="p-2">المشروع</th>
                        <th className="p-2">الموعد</th>
                        <th className="p-2 text-center">الحالة</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900/20">
                      {reportClients.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-4 text-center text-gray-400">
                            لا توجد متابعات مطابقة
                          </td>
                        </tr>
                      ) : (
                        reportClients.slice(0, 15).map((client, idx) => (
                          <tr key={client.id} className="hover:bg-black/5">
                            <td className="p-1.5 text-center text-gray-400">{idx + 1}</td>
                            <td className="p-1.5 font-bold">{client.name}</td>
                            <td className="p-1.5 font-mono" dir="ltr">{client.phone}</td>
                            <td className="p-1.5 text-slate-500">{client.projectName || '-'}</td>
                            <td className="p-1.5 font-bold text-[#2A6B5C]">{client.followUpDate || '-'}</td>
                            <td className="p-1.5 text-center">
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#1c1c1e] text-slate-200">
                                {client.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                {reportClients.length > 15 && (
                  <div className="p-1.5 text-center text-[11px] text-gray-400">
                    ... بالإضافة إلى {reportClients.length - 15} عميل آخرين سيتم تضمينهم في المعاينة والطباعة
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className={`p-3.5 sm:p-4 border-t flex items-center justify-between shrink-0 ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#000000] border-[#2A6B5C]/30'
        }`}>
          <div className="text-xs text-slate-300 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#2A6B5C] shrink-0" />
            <span className="font-bold">
              مقاس: <strong className="text-[#7AB0A0] font-black">{paperSize}</strong> ({pageOrientation === 'portrait' ? 'رأسي' : 'أفقي'}) | {reportClients.length} عميل
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleShareReport}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border shadow-sm cursor-pointer ${
                isLight
                  ? 'bg-slate-50 text-slate-900 border-slate-300 hover:bg-slate-100'
                  : 'bg-slate-950/90 text-slate-200 border-slate-700 hover:bg-slate-900'
              }`}
            >
              <Share2 className="w-3.5 h-3.5 text-[#2A6B5C]" />
              <span>مشاركة التقرير 📲</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition border cursor-pointer ${
                isLight
                  ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                  : 'bg-slate-950 border-slate-800 text-slate-200 hover:bg-slate-900'
              }`}
            >
              إلغاء
            </button>

            <button
              type="button"
              onClick={handleInstantPrint}
              className="px-5 py-2 bg-[#2A6B5C] hover:bg-[#7AB0A0] text-white text-xs font-black rounded-xl shadow-lg transition flex items-center gap-2 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة فورية / PDF 🖨️</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export const FollowUpPrintReportModal = React.memo<FollowUpPrintReportModalProps>(
  FollowUpPrintReportModalComponent
);
