import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { ClientLead, CallStatus, PriorityLevel, LeadSource } from '../types';
import {
  Search,
  Plus,
  Filter,
  Phone,
  MessageCircle,
  Mail,
  MapPin,
  Calendar,
  Clock,
  User,
  Building,
  Tag,
  Lock,
  Download,
  Upload,
  CheckCircle,
  XCircle,
  AlertTriangle,
  History,
  PhoneOff,
  Ban,
  PhoneCall,
  Edit2,
  Trash2,
  SlidersHorizontal,
  Layers,
  Sparkles,
  Target,
  CalendarDays,
  RotateCcw,
  X,
  Flame,
  Zap,
  Check,
  ArrowUpDown,
  Printer,
  FileText,
  Award,
  AlertCircle,
  ChevronDown,
  LayoutGrid,
  Table as TableIcon,
} from 'lucide-react';
import { FollowUpPrintReportModal } from './FollowUpPrintReportModal';
import { ErrorBoundary } from './ErrorBoundary';
import { ColumnPickerModal, ALL_COLUMNS } from './ColumnPickerModal';
import { MobileClientCard } from './MobileClientCard';
import { MobileFilterDrawer } from './MobileFilterDrawer';
import { toLocalDateStr, formatAddedAt } from '../utils/dates';

interface SpreadsheetViewProps {
  searchTerm: string;
  onSearchChange?: (term: string) => void;
  onOpenAddClient: () => void;
  onSelectClientForFollowUp: (client: ClientLead) => void;
  onOpenHistoryModal: (client: ClientLead) => void;
  onOpenImportExportModal: () => void;
  onOpenArchive?: () => void;
}

export const SpreadsheetView: React.FC<SpreadsheetViewProps> = ({
  searchTerm,
  onSearchChange,
  onOpenAddClient,
  onSelectClientForFollowUp,
  onOpenHistoryModal,
  onOpenImportExportModal,
  onOpenArchive,
}) => {
  const {
    currentUser,
    visibleClients,
    updateClientStatus,
    projects,
    users,
    canExport,
    bulkAssignClients,
    deleteClient,
    deleteSelectedClients,
    clearAllClientsData,
    themeMode,
  } = useApp();

  const isLight = themeMode === 'light';


  // Live Local Search State (synced with parent search)
  const [localSearch, setLocalSearch] = useState<string>(searchTerm || '');

  useEffect(() => {
    setLocalSearch(searchTerm || '');
  }, [searchTerm]);

  const handleSearchChange = (val: string) => {
    setLocalSearch(val);
    if (onSearchChange) {
      onSearchChange(val);
    }
  };

  // Smart Filters state
  const [selectedProject, setSelectedProject] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');
  const [selectedSource, setSelectedSource] = useState<string>('ALL');
  const [selectedUser, setSelectedUser] = useState<string>('ALL');
  const [selectedRegion, setSelectedRegion] = useState<string>('ALL');
  const [selectedFollowUpRange, setSelectedFollowUpRange] = useState<'ALL' | 'TODAY' | 'TOMORROW' | 'WEEK' | 'OVERDUE' | 'NO_FOLLOWUP' | 'CUSTOM'>('ALL');
  const [customFollowUpFrom, setCustomFollowUpFrom] = useState<string>('');
  const [customFollowUpTo, setCustomFollowUpTo] = useState<string>('');
  const [smartPreset, setSmartPreset] = useState<'ALL' | 'INTERESTED_CALLBACK' | 'TODAY_FOLLOWUP' | 'HIGH_PRIORITY' | 'NEW_LEADS' | 'HAS_NOTES'>('ALL');
  const [sortBy, setSortBy] = useState<'DEFAULT' | 'PRIORITY' | 'FOLLOWUP' | 'NAME' | 'PROJECT'>('DEFAULT');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Mobile First Adaptive View Mode: 'cards' or 'table'
  const [isNarrowScreen, setIsNarrowScreen] = useState<boolean>(
    () => typeof window !== 'undefined' && window.innerWidth < 1024
  );
  useEffect(() => {
    const onResize = () => setIsNarrowScreen(window.innerWidth < 1024);
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
    };
  }, []);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      return 'cards';
    }
    const saved = typeof window !== 'undefined' ? localStorage.getItem('gohar_spreadsheet_view_mode') : null;
    return (saved as 'cards' | 'table') || (typeof window !== 'undefined' && window.innerWidth < 1024 ? 'cards' : 'table');
  });

  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState<boolean>(false);
  const [mobileVisibleCount, setMobileVisibleCount] = useState<number>(30);
  const [tableVisibleCount, setTableVisibleCount] = useState<number>(50);
  const tableSentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = tableSentinelRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(es => { if (es[0].isIntersecting) setTableVisibleCount(c => c + 100); }, { rootMargin: '400px' });
    io.observe(el);
    return () => io.disconnect();
  });

  // Active filters count for mobile indicator
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedProject !== 'ALL') count++;
    if (selectedStatus !== 'ALL') count++;
    if (selectedPriority !== 'ALL') count++;
    if (selectedSource !== 'ALL') count++;
    if (selectedUser !== 'ALL') count++;
    if (selectedRegion !== 'ALL') count++;
    if (selectedFollowUpRange !== 'ALL') count++;
    if (sortBy !== 'DEFAULT') count++;
    return count;
  }, [selectedProject, selectedStatus, selectedPriority, selectedSource, selectedUser, selectedRegion, selectedFollowUpRange, sortBy]);

  // Print & PDF Export Modal State
  const [isPrintReportOpen, setIsPrintReportOpen] = useState<boolean>(false);
  const [printReportKey, setPrintReportKey] = useState<number>(0);
  const [isColumnPickerOpen, setIsColumnPickerOpen] = useState<boolean>(false);
  const [showSheetActionsMenu, setShowSheetActionsMenu] = useState<boolean>(false);

  const handleClosePrintReport = useCallback(() => {
    setIsPrintReportOpen(false);
  }, []);

  // User column visibility preferences
  const defaultCols = ALL_COLUMNS.map(c => c.id);
  const visibleCols = currentUser.visibleColumns && currentUser.visibleColumns.length > 0
    ? currentUser.visibleColumns
    : defaultCols;

  const isColVisible = (colId: string) => visibleCols.includes(colId);

  // Bulk Selection State
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>([]);
  const [addedFilter, setAddedFilter] = useState<'all' | 'hour' | 'today' | 'week'>('all');
  const canManageSelection = currentUser.role === 'ADMIN' || currentUser.role === 'SALES_MANAGER' || currentUser.permissions?.canBulkAssign === true || currentUser.permissions?.canDeleteClients === true;
  const canDoBulkAssign = currentUser.role === 'ADMIN' || currentUser.role === 'SALES_MANAGER' || currentUser.permissions?.canBulkAssign === true;
  const canDoBulkDelete = currentUser.role === 'ADMIN' || currentUser.permissions?.canDeleteClients === true;
  const [targetAssignUserId, setTargetAssignUserId] = useState<string>('');

  // Status Colors & Badge Styling Map
  const statusConfig: Record<
    CallStatus,
    { label: string; bg: string; text: string; border: string; icon: any }
  > = {
    'مش مهتم': {
      label: 'مش مهتم',
      bg: 'bg-slate-900/80',
      text: 'text-slate-300',
      border: 'border-slate-700',
      icon: XCircle,
    },
    مغلق: {
      label: 'مغلق',
      bg: 'bg-red-950/70',
      text: 'text-red-200',
      border: 'border-red-800',
      icon: PhoneOff,
    },
    'غير متاح': {
      label: 'غير متاح',
      bg: 'bg-[#041310]/70',
      text: 'text-[#A8CCC0]',
      border: 'border-[#0C2E27]',
      icon: AlertTriangle,
    },
    'قفل الخط في وشي': {
      label: 'قفل الخط في وشي',
      bg: 'bg-rose-950/70',
      text: 'text-rose-200',
      border: 'border-rose-800',
      icon: XCircle,
    },
    'هرجع اكلمه تاني': {
      label: 'هرجع اكلمه تاني',
      bg: 'bg-[#041310]/70',
      text: 'text-[#A8CCC0]',
      border: 'border-[#0C2E27]',
      icon: PhoneCall,
    },
    'مشغول دلوقتي': {
      label: 'مشغول دلوقتي',
      bg: 'bg-purple-950/70',
      text: 'text-purple-200',
      border: 'border-purple-800',
      icon: Clock,
    },
    مهتم: {
      label: 'مهتم ⭐',
      bg: 'bg-[#C49A45]/20',
      text: 'text-[#C49A45] font-bold',
      border: 'border-[#C49A45] ring-1 ring-[#C49A45]/30',
      icon: CheckCircle,
    },
    متعاقد: {
      label: 'متعاقد 🏆',
      bg: 'bg-[#041310]/80',
      text: 'text-[#7AB0A0] font-bold',
      border: 'border-[#2A6B5C] ring-1 ring-[#2A6B5C]/40',
      icon: Award,
    },
    'مش بيرد': {
      label: 'مش بيرد',
      bg: 'bg-orange-950/80',
      text: 'text-orange-200',
      border: 'border-orange-800',
      icon: PhoneOff,
    },
    'الرقم غلط': {
      label: 'الرقم غلط',
      bg: 'bg-red-950/80',
      text: 'text-red-300',
      border: 'border-red-800',
      icon: AlertCircle,
    },
    'الرقم مقفول': {
      label: 'الرقم مقفول',
      bg: 'bg-zinc-800/80',
      text: 'text-zinc-300',
      border: 'border-zinc-600',
      icon: Ban,
    },
    جديد: {
      label: 'جديد',
      bg: 'bg-[#2A6B5C]/20',
      text: 'text-[#7AB0A0] font-semibold',
      border: 'border-[#2A6B5C]/40',
      icon: Sparkles,
    },
  };

  // Real-time Status Counts
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {
      ALL: visibleClients.length,
      مهتم: 0,
      'هرجع اكلمه تاني': 0,
      جديد: 0,
      'مشغول دلوقتي': 0,
      'غير متاح': 0,
      مغلق: 0,
      'قفل الخط في وشي': 0,
      'مش مهتم': 0,
    };
    visibleClients.forEach(c => {
      if (counts[c.status] !== undefined) {
        counts[c.status]++;
      }
    });
    return counts;
  }, [visibleClients]);

  // Real-time Project Counts
  const projectCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: visibleClients.length };
    projects.forEach(p => {
      counts[p.name] = 0;
    });
    visibleClients.forEach(c => {
      counts[c.projectName] = (counts[c.projectName] || 0) + 1;
    });
    return counts;
  }, [visibleClients, projects]);

  const today = new Date();
  const todayStr = toLocalDateStr(today);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = toLocalDateStr(tomorrow);
  const endOfWeek = new Date(today);
  endOfWeek.setDate(endOfWeek.getDate() + 7);
  const endOfWeekStr = toLocalDateStr(endOfWeek);

  // Dynamic Regions List extracted from client addresses
  const availableRegions = useMemo(() => {
    const set = new Set<string>();
    visibleClients.forEach(c => {
      if (c.address && c.address.trim()) {
        const parts = c.address.split(/[-,\/،]/);
        const main = parts[0].trim();
        if (main.length > 1) {
          set.add(main);
        }
      }
    });
    return Array.from(set).sort();
  }, [visibleClients]);

  // Real-time Follow-up Counts
  const followUpCounts = useMemo(() => {
    let todayCount = 0;
    let tomorrowCount = 0;
    let weekCount = 0;
    let overdueCount = 0;
    let hasFollowUpCount = 0;

    visibleClients.forEach(c => {
      if (c.followUpDate) {
        hasFollowUpCount++;
        if (c.followUpDate === todayStr) todayCount++;
        if (c.followUpDate === tomorrowStr) tomorrowCount++;
        if (c.followUpDate >= todayStr && c.followUpDate <= endOfWeekStr) weekCount++;
        if (c.followUpDate < todayStr && (c.status === 'مهتم' || c.status === 'هرجع اكلمه تاني')) overdueCount++;
      }
    });

    return { todayCount, tomorrowCount, weekCount, overdueCount, hasFollowUpCount };
  }, [visibleClients, todayStr, tomorrowStr, endOfWeekStr]);

  useEffect(() => { setTableVisibleCount(50); setMobileVisibleCount(30); }, [viewMode, localSearch]);

  // Filter & Sort Clients Logic
  const filteredClients = useMemo(() => {
    const query = localSearch.trim().toLowerCase();

    let result = visibleClients.filter(c => {
      // Live search across all key attributes
      const matchesSearch =
        !query ||
        c.name.toLowerCase().includes(query) ||
        c.phone.includes(query) ||
        (c.email && c.email.toLowerCase().includes(query)) ||
        (c.address && c.address.toLowerCase().includes(query)) ||
        c.projectName.toLowerCase().includes(query) ||
        c.source.toLowerCase().includes(query) ||
        (c.notes && c.notes.toLowerCase().includes(query)) ||
        (c.followUpDate && c.followUpDate.includes(query)) ||
        (c.assignedUserName && c.assignedUserName.toLowerCase().includes(query));

      // Dropdown & Category filters
      const matchesProject = selectedProject === 'ALL' || c.projectName === selectedProject;
      const matchesStatus = selectedStatus === 'ALL' || c.status === selectedStatus;
      const matchesPriority = selectedPriority === 'ALL' || c.priority === selectedPriority;
      const matchesSource = selectedSource === 'ALL' || c.source === selectedSource;
      const matchesUser = selectedUser === 'ALL' || c.assignedUserId === selectedUser;

      // Region Filter
      const matchesRegion =
        selectedRegion === 'ALL' ||
        (c.address && c.address.toLowerCase().includes(selectedRegion.toLowerCase()));

      // Follow-Up Date Filter
      let matchesFollowUp = true;
      if (selectedFollowUpRange === 'TODAY') {
        matchesFollowUp = c.followUpDate === todayStr;
      } else if (selectedFollowUpRange === 'TOMORROW') {
        matchesFollowUp = c.followUpDate === tomorrowStr;
      } else if (selectedFollowUpRange === 'WEEK') {
        matchesFollowUp = !!c.followUpDate && c.followUpDate >= todayStr && c.followUpDate <= endOfWeekStr;
      } else if (selectedFollowUpRange === 'OVERDUE') {
        matchesFollowUp = !!c.followUpDate && c.followUpDate < todayStr && (c.status === 'مهتم' || c.status === 'هرجع اكلمه تاني');
      } else if (selectedFollowUpRange === 'NO_FOLLOWUP') {
        matchesFollowUp = !c.followUpDate;
      } else if (selectedFollowUpRange === 'CUSTOM') {
        if (customFollowUpFrom && customFollowUpTo) {
          matchesFollowUp = !!c.followUpDate && c.followUpDate >= customFollowUpFrom && c.followUpDate <= customFollowUpTo;
        } else if (customFollowUpFrom) {
          matchesFollowUp = !!c.followUpDate && c.followUpDate >= customFollowUpFrom;
        } else if (customFollowUpTo) {
          matchesFollowUp = !!c.followUpDate && c.followUpDate <= customFollowUpTo;
        }
      }

      // Smart Presets Filter
      let matchesPreset = true;
      if (smartPreset === 'INTERESTED_CALLBACK') {
        matchesPreset = c.status === 'مهتم' || c.status === 'هرجع اكلمه تاني';
      } else if (smartPreset === 'TODAY_FOLLOWUP') {
        matchesPreset = !!c.followUpDate && c.followUpDate >= todayStr;
      } else if (smartPreset === 'HIGH_PRIORITY') {
        matchesPreset = c.priority === 'عالي';
      } else if (smartPreset === 'NEW_LEADS') {
        matchesPreset = c.status === 'جديد' || !c.lastInteractionDate;
      } else if (smartPreset === 'HAS_NOTES') {
        matchesPreset = !!c.notes || (c.notesHistory && c.notesHistory.length > 0);
      }

      return (
        matchesSearch &&
        matchesProject &&
        matchesStatus &&
        matchesPriority &&
        matchesSource &&
        matchesUser &&
        matchesRegion &&
        matchesFollowUp &&
        matchesPreset
      );
    });

    // Latest additions (by the exact time the number was added)
    if (addedFilter !== 'all') {
      const now = Date.now();
      const startOfToday = new Date(); startOfToday.setHours(0, 0, 0, 0);
      const since = addedFilter === 'hour' ? now - 3600_000 : addedFilter === 'today' ? startOfToday.getTime() : now - 7 * 86400_000;
      const at = (c: ClientLead) => new Date(c.addedAt || (c.createdAt ? (c.createdAt.length <= 10 ? c.createdAt + 'T00:00:00' : c.createdAt) : 0)).getTime() || 0;
      result = result.filter(c => at(c) >= since).sort((a, b) => at(b) - at(a));
    }

    // Apply Sorting
    if (sortBy === 'PRIORITY') {
      const priorityWeights: Record<PriorityLevel, number> = {
        عالي: 3,
        متوسط: 2,
        منخفض: 1,
      };
      result = [...result].sort(
        (a, b) => (priorityWeights[b.priority] || 0) - (priorityWeights[a.priority] || 0)
      );
    } else if (sortBy === 'FOLLOWUP') {
      result = [...result].sort((a, b) => {
        if (!a.followUpDate) return 1;
        if (!b.followUpDate) return -1;
        return a.followUpDate.localeCompare(b.followUpDate);
      });
    } else if (sortBy === 'NAME') {
      result = [...result].sort((a, b) => a.name.localeCompare(b.name, 'ar'));
    } else if (sortBy === 'PROJECT') {
      result = [...result].sort((a, b) => a.projectName.localeCompare(b.projectName, 'ar'));
    }

    return result;
  }, [
    addedFilter,
    visibleClients,
    localSearch,
    selectedProject,
    selectedStatus,
    selectedPriority,
    selectedSource,
    selectedUser,
    selectedRegion,
    selectedFollowUpRange,
    customFollowUpFrom,
    customFollowUpTo,
    smartPreset,
    sortBy,
    todayStr,
    tomorrowStr,
    endOfWeekStr,
  ]);

  // Check if any filter is currently active
  const isFilterActive =
    localSearch.trim() !== '' ||
    selectedProject !== 'ALL' ||
    selectedStatus !== 'ALL' ||
    selectedPriority !== 'ALL' ||
    selectedSource !== 'ALL' ||
    selectedUser !== 'ALL' ||
    selectedRegion !== 'ALL' ||
    selectedFollowUpRange !== 'ALL' ||
    customFollowUpFrom !== '' ||
    customFollowUpTo !== '' ||
    smartPreset !== 'ALL' ||
    sortBy !== 'DEFAULT';

  const resetAllFilters = () => {
    handleSearchChange('');
    setSelectedProject('ALL');
    setSelectedStatus('ALL');
    setSelectedPriority('ALL');
    setSelectedSource('ALL');
    setSelectedUser('ALL');
    setSelectedRegion('ALL');
    setSelectedFollowUpRange('ALL');
    setCustomFollowUpFrom('');
    setCustomFollowUpTo('');
    setSmartPreset('ALL');
    setSortBy('DEFAULT');
  };

  // Handle Select All Checkbox
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedClientIds(filteredClients.map(c => c.id));
    } else {
      setSelectedClientIds([]);
    }
  };

  const handleToggleSelectClient = useCallback((id: string) => {
    setSelectedClientIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  }, []);

  // tapping a row selects it (but not when the tap was on a button/field inside it)
  const rowTapSelect = (id: string) => (e: React.MouseEvent) => {
    if (!canManageSelection) return;
    if ((e.target as HTMLElement).closest('button, a, input, select, textarea, label, [contenteditable]')) return;
    handleToggleSelectClient(id);
  };

  // Handle Bulk Assignment Trigger
  const handleApplyBulkAssign = () => {
    if (!targetAssignUserId || selectedClientIds.length === 0) return;
    const targetUser = users.find(u => u.id === targetAssignUserId);
    if (!targetUser) return;

    bulkAssignClients(selectedClientIds, targetUser.id, targetUser.name);
    setSelectedClientIds([]);
    setTargetAssignUserId('');
  };

  return (
    <div className="space-y-4">
      
      {/* Top Luxury Banner & Control Tools */}
      <div className={`p-4 sm:p-5 rounded-2xl border shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
        isLight
          ? 'bg-gradient-to-r from-slate-900 to-[#0A3B26] text-white border-slate-800'
          : 'bg-gradient-to-r from-[#000000] via-[#092B1D] to-[#04150E] text-white border-[#2A6B5C]/30'
      }`}>
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#4F9282]/20 border border-[#4F9282]/40 text-[#7AB0A0]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-black text-[#D1E4DE] flex items-center gap-2">
                <span>{currentUser.role === 'ADMIN' ? 'شيت العملاء العام والمتابعات المباشرة' : `شيت العملاء الخاص بك: (${currentUser.name})`}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-950 border border-slate-600/60 text-slate-300 font-mono">
                  {visibleClients.length} عميل
                </span>
              </h1>
              <p className="text-[11px] text-slate-200/90 mt-0.5">
                {currentUser.role === 'ADMIN'
                  ? 'بصفتك المدير العام، لديك الصلاحية الكاملة لتوزيع العملاء وتصدير الداتا والتحكم في إعدادات النظام.'
                  : `معروض العملاء المخصصين لك في مشروع (${currentUser.assignedProject || 'المحدد'}).`}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {onOpenArchive && (
            <button
              onClick={onOpenArchive}
              className="px-3 py-2 bg-slate-950/80 hover:bg-slate-900 text-[#A8CCC0] border border-[#2A6B5C]/40 font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
              title="فتح أرشيف الداتا والتقويم اليومي"
            >
              <CalendarDays className="w-3.5 h-3.5 text-[#4F9282]" />
              <span>التقويم والأرشيف</span>
            </button>
          )}

          {/* Unified Add Client & Import/Export Split Action Button */}
          <div className="relative">
            <div className="flex items-center rounded-xl shadow-md overflow-hidden p-0.5 bg-gradient-to-b from-[#B3D9FF]/40 via-[#2A6B5C]/30 to-[#003F9E]/40 border border-[#4F9282]/50 backdrop-blur-md">
              <button
                onClick={onOpenAddClient}
                className="group relative px-3 sm:px-3.5 py-1.5 sm:py-2 bg-gradient-to-r from-[#2A6B5C] via-[#5AC8FA] to-[#0051D5] text-gray-950 hover:brightness-105 font-black text-xs rounded-lg flex items-center gap-1.5 transition-all duration-200 active:scale-98 cursor-pointer shadow-sm"
              >
                <span className="p-1 rounded-md bg-black/10 group-hover:bg-black/15 transition">
                  <Plus className="w-3.5 h-3.5" />
                </span>
                <span className="tracking-tight">إضافة عميل جديد</span>
              </button>

              <button
                onClick={() => setShowSheetActionsMenu(prev => !prev)}
                className="px-2 py-1.5 sm:py-2 text-[#A8CCC0] hover:text-[#D1E4DE] hover:bg-white/10 rounded-lg flex items-center justify-center transition-all duration-200 cursor-pointer ml-0.5"
                title="خيارات إضافية (استيراد / تصدير)"
              >
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showSheetActionsMenu ? 'rotate-180 text-[#7AB0A0]' : ''}`} />
              </button>
            </div>

            {/* Dropdown Options */}
            {showSheetActionsMenu && (
              <div
                data-dropdown-container="true"
                className={`absolute left-0 top-full mt-2 w-60 rounded-2xl shadow-2xl z-50 overflow-hidden text-right border transition-all ${
                  isLight
                    ? 'bg-white/95 backdrop-blur-md border-slate-200 text-slate-900 shadow-slate-300/80'
                    : 'bg-[#000000]/95 backdrop-blur-md border-[#2A6B5C]/40 text-slate-100 shadow-black/90'
                }`}
              >
                <div className={`p-2 space-y-1.5 ${isLight ? 'bg-slate-50/70' : 'bg-[#000000]/90'}`}>
                  <button
                    onClick={() => {
                      setShowSheetActionsMenu(false);
                      onOpenAddClient();
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs rounded-xl transition font-bold text-right cursor-pointer group ${
                      isLight ? 'text-slate-800 hover:bg-[#EAF3F0]/80 hover:text-[#041310]' : 'text-[#D1E4DE] hover:bg-slate-900/60'
                    }`}
                  >
                    <div className="p-1.5 rounded-lg bg-[#4F9282]/20 border border-[#4F9282]/30 text-[#4F9282] group-hover:scale-105 transition">
                      <Plus className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold">إضافة عميل جديد</span>
                      <span className="text-[10px] text-slate-400 font-normal">تسجيل بيانات مباشرة</span>
                    </div>
                  </button>

                  {canExport ? (
                    <button
                      onClick={() => {
                        setShowSheetActionsMenu(false);
                        onOpenImportExportModal();
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs rounded-xl transition font-bold text-right cursor-pointer group ${
                        isLight ? 'text-slate-800 hover:bg-slate-50 hover:text-slate-950' : 'text-slate-200 hover:bg-slate-900/60'
                      }`}
                    >
                      <div className="p-1.5 rounded-lg bg-slate-500/20 border border-slate-500/30 text-slate-400 group-hover:scale-105 transition">
                        <Upload className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold">استيراد / تصدير إكسل</span>
                        <span className="text-[10px] text-slate-400/70 font-normal">ملفات Excel و CSV</span>
                      </div>
                    </button>
                  ) : (
                    <div
                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs rounded-xl text-right opacity-60 ${
                        isLight ? 'text-slate-500 bg-slate-100' : 'text-slate-300/60 bg-[#000000]'
                      }`}
                    >
                      <Lock className="w-3.5 h-3.5 text-[#2A6B5C]" />
                      <span className="text-[11px]">التصدير محظور للموظف</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {currentUser.role === 'ADMIN' && (
            <button
              onClick={() => {
                if (confirm('⚠️ هل أنت متأكد من تفريغ ومسح كافة بيانات الداتا في الشيت بالكامل؟\nسيتم مسح كل العملاء المسجلين.')) {
                  clearAllClientsData();
                }
              }}
              className="px-3 py-2 bg-red-950/80 hover:bg-red-900 text-red-200 border border-red-600/40 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-md"
              title="مسح كافة الداتا والعملاء"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-400" />
              <span>مسح الداتا</span>
            </button>
          )}
        </div>
      </div>

      {/* 🚀 Interactive Executive KPI Quick-Metrics Ribbon (Click to filter!) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {/* Metric 1: Total Leads */}
        <div
          onClick={() => {
            setSelectedStatus('ALL');
            setSelectedFollowUpRange('ALL');
          }}
          className={`p-3 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between ${
            selectedStatus === 'ALL' && selectedFollowUpRange === 'ALL'
              ? isLight
                ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-slate-400/40'
                : 'bg-[#1c1c1e] text-[#D1E4DE] border-[#2A6B5C] shadow-lg ring-2 ring-[#2A6B5C]/40'
              : isLight
              ? 'bg-white text-slate-800 border-slate-200 hover:border-slate-300 hover:shadow'
              : 'bg-[#061B12] text-slate-200 border-slate-900/60 hover:border-slate-700/60 hover:bg-[#092519]'
          }`}
        >
          <div className="flex items-center justify-between text-[11px] font-bold">
            <span className="opacity-80">إجمالي الداتا</span>
            <Layers className="w-3.5 h-3.5 text-[#2A6B5C]" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl font-black font-mono">{visibleClients.length}</span>
            <span className="text-[10px] font-bold opacity-75">100%</span>
          </div>
        </div>

        {/* Metric 2: Interested Leads */}
        <div
          onClick={() => {
            setSelectedStatus('مهتم');
            setSelectedFollowUpRange('ALL');
          }}
          className={`p-3 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between ${
            selectedStatus === 'مهتم'
              ? isLight
                ? 'bg-slate-800 text-white border-slate-900 shadow-md ring-2 ring-slate-400/40'
                : 'bg-slate-950 text-slate-100 border-slate-400 shadow-lg ring-2 ring-slate-500/40'
              : isLight
              ? 'bg-white text-slate-900 border-slate-200 hover:border-slate-300 hover:shadow'
              : 'bg-[#061B12] text-slate-200 border-slate-900/60 hover:border-slate-700/60 hover:bg-[#092519]'
          }`}
        >
          <div className="flex items-center justify-between text-[11px] font-bold">
            <span className="opacity-90">عملاء مهتمين ⭐</span>
            <CheckCircle className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl font-black font-mono">{statusCounts['مهتم'] || 0}</span>
            <span className="text-[10px] font-bold opacity-75 font-mono">
              {visibleClients.length > 0 ? Math.round(((statusCounts['مهتم'] || 0) / visibleClients.length) * 100) : 0}%
            </span>
          </div>
        </div>

        {/* Metric 3: Callback Leads */}
        <div
          onClick={() => {
            setSelectedStatus('هرجع اكلمه تاني');
            setSelectedFollowUpRange('ALL');
          }}
          className={`p-3 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between ${
            selectedStatus === 'هرجع اكلمه تاني'
              ? isLight
                ? 'bg-[#0C2E27] text-white border-[#081F1A] shadow-md ring-2 ring-[#4F9282]/40'
                : 'bg-[#041310] text-[#D1E4DE] border-[#4F9282] shadow-lg ring-2 ring-[#2A6B5C]/40'
              : isLight
              ? 'bg-white text-[#081F1A] border-[#A8CCC0] hover:border-[#7AB0A0] hover:shadow'
              : 'bg-[#061B12] text-[#A8CCC0] border-slate-900/60 hover:border-slate-700/60 hover:bg-[#092519]'
          }`}
        >
          <div className="flex items-center justify-between text-[11px] font-bold">
            <span className="opacity-90">هرجع أكلمه 📞</span>
            <PhoneCall className="w-3.5 h-3.5 text-[#4F9282]" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl font-black font-mono">{statusCounts['هرجع اكلمه تاني'] || 0}</span>
            <span className="text-[10px] font-bold opacity-75 font-mono">
              {visibleClients.length > 0 ? Math.round(((statusCounts['هرجع اكلمه تاني'] || 0) / visibleClients.length) * 100) : 0}%
            </span>
          </div>
        </div>

        {/* Metric 4: Due Today */}
        <div
          onClick={() => {
            setSelectedFollowUpRange('TODAY');
            setSelectedStatus('ALL');
          }}
          className={`p-3 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between ${
            selectedFollowUpRange === 'TODAY'
              ? isLight
                ? 'bg-[#1F5447] text-white border-[#123F36] shadow-md ring-2 ring-[#4F9282]/40'
                : 'bg-[#041310] text-[#D1E4DE] border-[#4F9282] shadow-lg ring-2 ring-[#2A6B5C]/40'
              : isLight
              ? 'bg-white text-[#041310] border-[#A8CCC0] hover:border-[#7AB0A0] hover:shadow'
              : 'bg-[#061B12] text-[#A8CCC0] border-slate-900/60 hover:border-slate-700/60 hover:bg-[#092519]'
          }`}
        >
          <div className="flex items-center justify-between text-[11px] font-bold">
            <span className="opacity-90">متابعات اليوم ⏰</span>
            <Clock className="w-3.5 h-3.5 text-[#4F9282]" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl font-black font-mono">{followUpCounts.todayCount}</span>
            <span className="text-[10px] font-bold opacity-75">اليوم</span>
          </div>
        </div>

        {/* Metric 5: Overdue */}
        <div
          onClick={() => {
            setSelectedFollowUpRange('OVERDUE');
            setSelectedStatus('ALL');
          }}
          className={`p-3 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between ${
            selectedFollowUpRange === 'OVERDUE'
              ? isLight
                ? 'bg-rose-700 text-white border-rose-800 shadow-md ring-2 ring-rose-400/40'
                : 'bg-rose-950 text-rose-100 border-rose-400 shadow-lg ring-2 ring-rose-500/40'
              : isLight
              ? 'bg-white text-rose-900 border-rose-200 hover:border-rose-300 hover:shadow'
              : 'bg-[#061B12] text-rose-200 border-slate-900/60 hover:border-slate-700/60 hover:bg-[#092519]'
          }`}
        >
          <div className="flex items-center justify-between text-[11px] font-bold">
            <span className="opacity-90">متأخرة عاجلة 🚨</span>
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl font-black font-mono">{followUpCounts.overdueCount}</span>
            <span className="text-[10px] font-bold opacity-75 font-mono">
              {followUpCounts.overdueCount > 0 ? 'تنبيه' : 'لا يوجد'}
            </span>
          </div>
        </div>

        {/* Metric 6: New Leads */}
        <div
          onClick={() => {
            setSelectedStatus('جديد');
            setSelectedFollowUpRange('ALL');
          }}
          className={`p-3 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between ${
            selectedStatus === 'جديد'
              ? isLight
                ? 'bg-teal-800 text-white border-teal-900 shadow-md ring-2 ring-teal-400/40'
                : 'bg-teal-950 text-teal-100 border-teal-400 shadow-lg ring-2 ring-teal-500/40'
              : isLight
              ? 'bg-white text-teal-900 border-teal-200 hover:border-teal-300 hover:shadow'
              : 'bg-[#061B12] text-teal-200 border-slate-900/60 hover:border-slate-700/60 hover:bg-[#092519]'
          }`}
        >
          <div className="flex items-center justify-between text-[11px] font-bold">
            <span className="opacity-90">عملاء جدد 🟢</span>
            <Sparkles className="w-3.5 h-3.5 text-teal-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl font-black font-mono">{statusCounts['جديد'] || 0}</span>
            <span className="text-[10px] font-bold opacity-75 font-mono">
              {visibleClients.length > 0 ? Math.round(((statusCounts['جديد'] || 0) / visibleClients.length) * 100) : 0}%
            </span>
          </div>
        </div>
      </div>

      {!canExport && (
        <div className={`border px-4 py-2.5 rounded-xl text-xs flex items-center justify-between gap-3 ${
          isLight
            ? 'bg-[#EAF3F0]/80 border-[#A8CCC0] text-[#081F1A]'
            : 'bg-[#2A6B5C]/10 border-[#2A6B5C]/30 text-[#A8CCC0]'
        }`}>
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#2A6B5C] shrink-0" />
            <span>
              <strong>تنبيه الأمان والصلاحيات:</strong> يمنع الموظفين من استيراد أو تصدير أي بيانات عملاء. فقط مدير النظام من يقوم بتصدير الداتا وتوزيعها.
            </span>
          </div>
          <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${
            isLight ? 'bg-[#D1E4DE] text-[#081F1A]' : 'bg-[#2A6B5C]/20 text-[#A8CCC0]'
          }`}>
            نظام حماية الداتا
          </span>
        </div>
      )}

      {/* Smart Live Search & Dynamic Filter Suite */}
      <div className={`p-4 sm:p-5 rounded-2xl border-2 shadow-xl space-y-4 transition-colors ${
        isLight
          ? 'bg-white border-slate-200 text-slate-900 shadow-slate-200/50'
          : 'bg-[#000000] border-[#2A6B5C]/50 shadow-xl'
      }`}>
        
        {/* Header with Results Count & Reset Button */}
        <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b ${
          isLight ? 'border-slate-200' : 'border-[#2A6B5C]/30'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${
              isLight
                ? 'bg-[#EAF3F0] border border-[#7AB0A0] text-[#0C2E27]'
                : 'bg-[#1c1c1e] border border-[#2A6B5C]/40 text-[#2A6B5C]'
            }`}>
              <Search className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-black ${isLight ? 'text-slate-900' : 'text-[#2A6B5C]'}`}>
                  البحث التلقائي والفلاتر الذكية:
                </span>
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                  isLight
                    ? 'text-slate-800 bg-slate-50 border-slate-300'
                    : 'text-slate-300 bg-[#1c1c1e] border-slate-500/30'
                }`}>
                  {filteredClients.length} عميل مطابق
                </span>
              </div>
              <p className={`text-[11px] mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-200/70'}`}>
                تظهر النتائج فور الكتابة وتتحدث لحظياً مع خيارات التصفية السريعة
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={() => setIsColumnPickerOpen(true)}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer border ${
                isLight
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                  : 'bg-slate-950/80 hover:bg-slate-900 text-[#A8CCC0] border-[#2A6B5C]/30'
              }`}
              title="تخصيص وإخفاء/إظهار أعمدة الجدول"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#4F9282]" />
              <span>تخصيص الأعمدة ({visibleCols.length}/{ALL_COLUMNS.length})</span>
            </button>

            <button
              onClick={() => setIsPrintReportOpen(true)}
              className="px-3.5 py-1.5 bg-[#2A6B5C] hover:bg-[#7AB0A0] text-white font-black text-xs rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
              title="طباعة وتصدير تقرير المتابعات اليومية والعملاء PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>تصدير PDF وطباعة التقرير 🖨️</span>
            </button>

            {isFilterActive && (
              <button
                onClick={resetAllFilters}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer border ${
                  isLight
                    ? 'bg-[#D1E4DE] text-[#081F1A] hover:bg-[#A8CCC0] border-[#7AB0A0]'
                    : 'bg-[#2A6B5C]/20 text-[#A8CCC0] hover:bg-[#2A6B5C]/30 border-[#2A6B5C]/40'
                }`}
                title="إلغاء جميع الفلاتر والبحث"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${isLight ? 'text-[#0C2E27]' : 'text-[#7AB0A0]'}`} />
                <span>إعادة ضبط الفلاتر</span>
              </button>
            )}
            <span className={`text-xs font-bold px-3 py-1.5 rounded-xl border ${
              isLight
                ? 'text-slate-800 bg-slate-100 border-slate-300'
                : 'text-[#2A6B5C] bg-[#1c1c1e] border-[#2A6B5C]/40'
            }`}>
              إجمالي الشيت: ({visibleClients.length})
            </span>
          </div>
        </div>

        {/* 1. Live Instant Search Bar */}
        <div className="relative">
          <div className="relative flex items-center">
            <Search className={`absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${
              isLight ? 'text-slate-400' : 'text-[#2A6B5C]'
            }`} />
            <input
              type="text"
              value={localSearch}
              onChange={e => handleSearchChange(e.target.value)}
              placeholder="ابحث فوراً بالاسم، رقم الهاتف، اسم المشروع، المصدر، الملاحظات، أو التاريخ..."
              className={`w-full pr-10 pl-10 py-3 rounded-xl font-bold text-xs transition shadow-inner focus:outline-none focus:ring-2 focus:ring-[#2A6B5C] focus:border-transparent ${
                isLight
                  ? 'bg-slate-50 border-2 border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white'
                  : 'bg-[#1c1c1e] border-2 border-[#2A6B5C]/60 text-[#D1E4DE] placeholder-slate-300/60'
              }`}
            />
            {localSearch && (
              <button
                onClick={() => handleSearchChange('')}
                className={`absolute left-3 top-1/2 -translate-y-1/2 p-1 rounded-lg border transition ${
                  isLight
                    ? 'text-slate-600 hover:text-slate-900 bg-white border-slate-300'
                    : 'text-[#7AB0A0] hover:text-white bg-[#000000] border-[#2A6B5C]/30'
                }`}
                title="مسح نص البحث"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* 2. Smart Quick Filter Pills for Status (تصفية فورية بحالة العميل) */}
        <div className="space-y-1.5">
          <div className={`flex items-center justify-between text-[11px] font-bold ${
            isLight ? 'text-slate-700' : 'text-[#A8CCC0]'
          }`}>
            <span className="flex items-center gap-1.5">
              <Zap className={`w-3.5 h-3.5 ${isLight ? 'text-[#1F5447]' : 'text-[#2A6B5C]'}`} />
              <span>تصفية سريعة بحالة العميل:</span>
            </span>
            <span className={`text-[10px] ${isLight ? 'text-slate-700' : 'text-slate-400'}`}>انقر لتحديد الحالة مباشرة</span>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar touch-scroll sm:flex-wrap text-xs py-0.5">
            <button
              onClick={() => setSelectedStatus('ALL')}
              className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 border text-xs cursor-pointer ${
                selectedStatus === 'ALL'
                  ? isLight
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                    : 'bg-[#2A6B5C] text-white border-[#2A6B5C] shadow-md'
                  : isLight
                  ? 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                  : 'bg-[#1c1c1e] text-[#D1E4DE] border-[#2A6B5C]/30 hover:bg-slate-900/60'
              }`}
            >
              <span>الكل</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                selectedStatus === 'ALL'
                  ? 'bg-white text-slate-900'
                  : isLight ? 'bg-slate-200 text-slate-800' : 'bg-[#000000] text-[#7AB0A0]'
              }`}>
                {statusCounts.ALL}
              </span>
            </button>

            {/* مهتم */}
            <button
              onClick={() => setSelectedStatus(selectedStatus === 'مهتم' ? 'ALL' : 'مهتم')}
              className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 border text-xs cursor-pointer ${
                selectedStatus === 'مهتم'
                  ? 'bg-slate-600 text-white border-slate-400 shadow-md ring-2 ring-slate-500/40'
                  : isLight
                  ? 'bg-slate-50 text-slate-800 border-slate-300 hover:bg-slate-100'
                  : 'bg-[#1c1c1e] text-slate-300 border-slate-700/50 hover:bg-slate-900/60'
              }`}
            >
              <span>مهتم ⭐</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                isLight ? 'bg-slate-200 text-slate-900' : 'bg-slate-950 text-slate-200'
              }`}>
                {statusCounts['مهتم'] || 0}
              </span>
            </button>

            {/* هرجع اكلمه تاني */}
            <button
              onClick={() => setSelectedStatus(selectedStatus === 'هرجع اكلمه تاني' ? 'ALL' : 'هرجع اكلمه تاني')}
              className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 border text-xs cursor-pointer ${
                selectedStatus === 'هرجع اكلمه تاني'
                  ? 'bg-[#1F5447] text-white border-[#4F9282] shadow-md ring-2 ring-[#2A6B5C]/40'
                  : isLight
                  ? 'bg-[#EAF3F0] text-[#0C2E27] border-[#7AB0A0] hover:bg-[#D1E4DE]'
                  : 'bg-[#1c1c1e] text-[#7AB0A0] border-[#123F36]/50 hover:bg-[#041310]/60'
              }`}
            >
              <span>هرجع اكلمه</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                isLight ? 'bg-[#A8CCC0] text-[#081F1A]' : 'bg-[#041310] text-[#A8CCC0]'
              }`}>
                {statusCounts['هرجع اكلمه تاني'] || 0}
              </span>
            </button>

            {/* جديد */}
            <button
              onClick={() => setSelectedStatus(selectedStatus === 'جديد' ? 'ALL' : 'جديد')}
              className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 border text-xs cursor-pointer ${
                selectedStatus === 'جديد'
                  ? 'bg-[#2A6B5C] text-white border-[#4F9282] shadow-md font-bold'
                  : isLight
                  ? 'bg-[#EAF3F0] text-[#081F1A] border-[#7AB0A0] hover:bg-[#D1E4DE]'
                  : 'bg-[#1c1c1e] text-[#7AB0A0] border-[#1F5447]/40 hover:bg-[#041310]/60'
              }`}
            >
              <span>جديد ✨</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                isLight ? 'bg-[#A8CCC0] text-[#081F1A]' : 'bg-[#041310] text-[#A8CCC0]'
              }`}>
                {statusCounts['جديد'] || 0}
              </span>
            </button>

            {/* مشغول */}
            <button
              onClick={() => setSelectedStatus(selectedStatus === 'مشغول دلوقتي' ? 'ALL' : 'مشغول دلوقتي')}
              className={`px-2.5 py-1.5 rounded-xl font-medium transition flex items-center gap-1 border text-xs cursor-pointer ${
                selectedStatus === 'مشغول دلوقتي'
                  ? 'bg-purple-600 text-white border-purple-400 shadow-md'
                  : isLight
                  ? 'bg-purple-50 text-purple-800 border-purple-300 hover:bg-purple-100'
                  : 'bg-[#1c1c1e] text-purple-300 border-purple-800/50 hover:bg-purple-950/50'
              }`}
            >
              <span>مشغول</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                isLight ? 'bg-purple-200 text-purple-900' : 'bg-purple-950 text-purple-200'
              }`}>
                {statusCounts['مشغول دلوقتي'] || 0}
              </span>
            </button>

            {/* غير متاح */}
            <button
              onClick={() => setSelectedStatus(selectedStatus === 'غير متاح' ? 'ALL' : 'غير متاح')}
              className={`px-2.5 py-1.5 rounded-xl font-medium transition flex items-center gap-1 border text-xs cursor-pointer ${
                selectedStatus === 'غير متاح'
                  ? 'bg-[#123F36] text-white border-[#2A6B5C] shadow-md'
                  : isLight
                  ? 'bg-[#EAF3F0] text-[#0C2E27] border-[#7AB0A0] hover:bg-[#D1E4DE]'
                  : 'bg-[#1c1c1e] text-[#7AB0A0] border-[#0C2E27]/50 hover:bg-[#041310]/50'
              }`}
            >
              <span>غير متاح</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                isLight ? 'bg-[#A8CCC0] text-[#081F1A]' : 'bg-[#041310] text-[#A8CCC0]'
              }`}>
                {statusCounts['غير متاح'] || 0}
              </span>
            </button>

            {/* مغلق */}
            <button
              onClick={() => setSelectedStatus(selectedStatus === 'مغلق' ? 'ALL' : 'مغلق')}
              className={`px-2.5 py-1.5 rounded-xl font-medium transition flex items-center gap-1 border text-xs cursor-pointer ${
                selectedStatus === 'مغلق'
                  ? 'bg-red-600 text-white border-red-400 shadow-md'
                  : isLight
                  ? 'bg-red-50 text-red-800 border-red-300 hover:bg-red-100'
                  : 'bg-[#1c1c1e] text-red-300 border-red-800/50 hover:bg-red-950/50'
              }`}
            >
              <span>مغلق</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                isLight ? 'bg-red-200 text-red-900' : 'bg-red-950 text-red-200'
              }`}>
                {statusCounts['مغلق'] || 0}
              </span>
            </button>

            {/* قفل الخط */}
            <button
              onClick={() => setSelectedStatus(selectedStatus === 'قفل الخط في وشي' ? 'ALL' : 'قفل الخط في وشي')}
              className={`px-2.5 py-1.5 rounded-xl font-medium transition flex items-center gap-1 border text-xs cursor-pointer ${
                selectedStatus === 'قفل الخط في وشي'
                  ? 'bg-rose-700 text-white border-rose-400 shadow-md'
                  : isLight
                  ? 'bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100'
                  : 'bg-[#1c1c1e] text-rose-300 border-rose-800/50 hover:bg-rose-950/50'
              }`}
            >
              <span>قفل الخط</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                isLight ? 'bg-rose-200 text-rose-900' : 'bg-rose-950 text-rose-200'
              }`}>
                {statusCounts['قفل الخط في وشي'] || 0}
              </span>
            </button>

            {/* مش مهتم */}
            <button
              onClick={() => setSelectedStatus(selectedStatus === 'مش مهتم' ? 'ALL' : 'مش مهتم')}
              className={`px-2.5 py-1.5 rounded-xl font-medium transition flex items-center gap-1 border text-xs cursor-pointer ${
                selectedStatus === 'مش مهتم'
                  ? 'bg-slate-700 text-white border-slate-400 shadow-md'
                  : isLight
                  ? 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                  : 'bg-[#1c1c1e] text-slate-300 border-slate-700/50 hover:bg-slate-900/50'
              }`}
            >
              <span>مش مهتم</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                isLight ? 'bg-slate-200 text-slate-800' : 'bg-slate-950 text-slate-300'
              }`}>
                {statusCounts['مش مهتم'] || 0}
              </span>
            </button>
          </div>
        </div>

        {/* 3. Smart Quick Filter Pills for Projects (تصفية فورية بالمشروع) */}
        <div className="space-y-1.5 pt-1">
          <div className={`flex items-center justify-between text-[11px] font-bold ${
            isLight ? 'text-slate-700' : 'text-[#A8CCC0]'
          }`}>
            <span className="flex items-center gap-1.5">
              <Building className={`w-3.5 h-3.5 ${isLight ? 'text-[#1F5447]' : 'text-[#2A6B5C]'}`} />
              <span>تصفية سريعة بالمشروع:</span>
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5 text-xs">
            <button
              onClick={() => setSelectedProject('ALL')}
              className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 border text-xs cursor-pointer ${
                selectedProject === 'ALL'
                  ? isLight
                    ? 'bg-slate-800 text-white border-slate-800 shadow-sm'
                    : 'bg-[#2A6B5C] text-white border-[#2A6B5C] shadow'
                  : isLight
                  ? 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                  : 'bg-[#1c1c1e] text-[#D1E4DE] border-[#2A6B5C]/30 hover:bg-slate-900/60'
              }`}
            >
              <span>جميع المشاريع</span>
            </button>
            {projects.map(p => (
              <button
                key={p.id}
                onClick={() => setSelectedProject(selectedProject === p.name ? 'ALL' : p.name)}
                className={`px-3 py-1.5 rounded-xl font-semibold transition flex items-center gap-1.5 border text-xs cursor-pointer ${
                  selectedProject === p.name
                    ? isLight
                      ? 'bg-[#1F5447] text-white font-bold border-[#1F5447] shadow'
                      : 'bg-[#1F5447] text-gray-950 font-bold border-[#7AB0A0] shadow'
                    : isLight
                    ? 'bg-slate-50 text-slate-800 border-slate-300 hover:bg-slate-100'
                    : 'bg-[#1c1c1e] text-[#A8CCC0] border-[#2A6B5C]/30 hover:bg-slate-900/60'
                }`}
              >
                <span>{p.name}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                  selectedProject === p.name
                    ? 'bg-white text-slate-900'
                    : isLight ? 'bg-slate-200 text-slate-700' : 'bg-[#000000] text-slate-300'
                }`}>
                  {projectCounts[p.name] || 0}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* 4. Smart Follow-Up Date Quick Filter Bar (فلترة متقدمة حسب تاريخ وموعد المتابعة) */}
        <div className={`pt-2 border-t space-y-2 ${
          isLight ? 'border-slate-200' : 'border-[#2A6B5C]/20'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className={`text-[11px] font-bold flex items-center gap-1.5 ${
              isLight ? 'text-slate-800' : 'text-[#A8CCC0]'
            }`}>
              <Calendar className={`w-3.5 h-3.5 ${isLight ? 'text-[#1F5447]' : 'text-[#2A6B5C]'}`} />
              <span>تصفية فورية حسب موعد وتاريخ المتابعة (Follow-up Date):</span>
            </span>
            <span className={`text-[10px] ${isLight ? 'text-slate-700' : 'text-slate-400'}`}>
              إجمالي العملاء المجدول لهم مواعيد: ({followUpCounts.hasFollowUpCount})
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5 text-xs">
            <button
              onClick={() => setSelectedFollowUpRange('ALL')}
              className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 border text-xs cursor-pointer ${
                selectedFollowUpRange === 'ALL'
                  ? isLight
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                    : 'bg-[#2A6B5C] text-white border-[#2A6B5C] shadow'
                  : isLight
                  ? 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                  : 'bg-[#1c1c1e] text-[#D1E4DE] border-[#2A6B5C]/30 hover:bg-slate-900/60'
              }`}
            >
              <span>جميع التواريخ</span>
            </button>

            {/* اليوم */}
            <button
              onClick={() => setSelectedFollowUpRange(selectedFollowUpRange === 'TODAY' ? 'ALL' : 'TODAY')}
              className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 border text-xs cursor-pointer ${
                selectedFollowUpRange === 'TODAY'
                  ? 'bg-[#1F5447] text-white border-[#4F9282] shadow-md ring-2 ring-[#2A6B5C]/40'
                  : isLight
                  ? 'bg-[#EAF3F0] text-[#081F1A] border-[#7AB0A0] hover:bg-[#D1E4DE]'
                  : 'bg-[#1c1c1e] text-[#7AB0A0] border-[#1F5447]/50 hover:bg-[#041310]/60'
              }`}
            >
              <span>مواعيد اليوم 📅</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                isLight ? 'bg-[#A8CCC0] text-[#081F1A]' : 'bg-[#041310] text-[#A8CCC0]'
              }`}>
                {followUpCounts.todayCount}
              </span>
            </button>

            {/* غداً */}
            <button
              onClick={() => setSelectedFollowUpRange(selectedFollowUpRange === 'TOMORROW' ? 'ALL' : 'TOMORROW')}
              className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 border text-xs cursor-pointer ${
                selectedFollowUpRange === 'TOMORROW'
                  ? 'bg-[#1F5447] text-white border-[#4F9282] shadow-md ring-2 ring-[#2A6B5C]/40'
                  : isLight
                  ? 'bg-[#EAF3F0] text-[#081F1A] border-[#7AB0A0] hover:bg-[#D1E4DE]'
                  : 'bg-[#1c1c1e] text-[#7AB0A0] border-[#123F36]/50 hover:bg-[#041310]/60'
              }`}
            >
              <span>مواعيد غداً ⏰</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                isLight ? 'bg-[#A8CCC0] text-[#081F1A]' : 'bg-[#041310] text-[#A8CCC0]'
              }`}>
                {followUpCounts.tomorrowCount}
              </span>
            </button>

            {/* هذا الأسبوع */}
            <button
              onClick={() => setSelectedFollowUpRange(selectedFollowUpRange === 'WEEK' ? 'ALL' : 'WEEK')}
              className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 border text-xs cursor-pointer ${
                selectedFollowUpRange === 'WEEK'
                  ? 'bg-slate-600 text-white border-slate-400 shadow-md ring-2 ring-slate-500/40'
                  : isLight
                  ? 'bg-slate-50 text-slate-900 border-slate-300 hover:bg-slate-100'
                  : 'bg-[#1c1c1e] text-slate-300 border-slate-700/50 hover:bg-slate-900/60'
              }`}
            >
              <span>هذا الأسبوع 🗓️</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                isLight ? 'bg-slate-200 text-slate-900' : 'bg-slate-950 text-slate-200'
              }`}>
                {followUpCounts.weekCount}
              </span>
            </button>

            {/* المتابعات المتأخرة */}
            <button
              onClick={() => setSelectedFollowUpRange(selectedFollowUpRange === 'OVERDUE' ? 'ALL' : 'OVERDUE')}
              className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 border text-xs cursor-pointer ${
                selectedFollowUpRange === 'OVERDUE'
                  ? 'bg-red-600 text-white border-red-400 shadow-md ring-2 ring-red-500/40'
                  : isLight
                  ? 'bg-red-50 text-red-900 border-red-300 hover:bg-red-100'
                  : 'bg-[#1c1c1e] text-red-300 border-red-700/50 hover:bg-red-950/60'
              }`}
            >
              <span>متأخرة عاجلة 🚨</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                isLight ? 'bg-red-200 text-red-900' : 'bg-red-950 text-red-200'
              }`}>
                {followUpCounts.overdueCount}
              </span>
            </button>

            {/* بدون موعد متابعة */}
            <button
              onClick={() => setSelectedFollowUpRange(selectedFollowUpRange === 'NO_FOLLOWUP' ? 'ALL' : 'NO_FOLLOWUP')}
              className={`px-3 py-1.5 rounded-xl font-medium transition flex items-center gap-1.5 border text-xs cursor-pointer ${
                selectedFollowUpRange === 'NO_FOLLOWUP'
                  ? 'bg-slate-700 text-white border-slate-500 shadow'
                  : isLight
                  ? 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                  : 'bg-[#1c1c1e] text-slate-300 border-slate-700/50 hover:bg-slate-900/60'
              }`}
            >
              <span>بدون موعد متابعة</span>
            </button>

            {/* نطاق مخصص */}
            <button
              onClick={() => setSelectedFollowUpRange(selectedFollowUpRange === 'CUSTOM' ? 'ALL' : 'CUSTOM')}
              className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 border text-xs cursor-pointer ${
                selectedFollowUpRange === 'CUSTOM'
                  ? 'bg-purple-600 text-white border-purple-400 shadow'
                  : isLight
                  ? 'bg-purple-50 text-purple-900 border-purple-300 hover:bg-purple-100'
                  : 'bg-[#1c1c1e] text-purple-300 border-purple-700/50 hover:bg-purple-950/60'
              }`}
            >
              <span>تاريخ مخصص ✏️</span>
            </button>
          </div>

          {/* Custom Date Range Inputs */}
          {selectedFollowUpRange === 'CUSTOM' && (
            <div className={`p-3 rounded-xl border flex flex-wrap items-center gap-3 ${
              isLight ? 'bg-[#EAF3F0]/80 border-[#7AB0A0]' : 'bg-[#000000] border-[#2A6B5C]/40'
            }`}>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold ${isLight ? 'text-slate-800' : 'text-[#7AB0A0]'}`}>من تاريخ:</span>
                <input
                  type="date"
                  value={customFollowUpFrom}
                  onChange={e => setCustomFollowUpFrom(e.target.value)}
                  className={`p-1.5 rounded-lg text-xs font-bold border ${
                    isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#1c1c1e] border-slate-700 text-[#D1E4DE]'
                  }`}
                />
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold ${isLight ? 'text-slate-800' : 'text-[#7AB0A0]'}`}>إلى تاريخ:</span>
                <input
                  type="date"
                  value={customFollowUpTo}
                  onChange={e => setCustomFollowUpTo(e.target.value)}
                  className={`p-1.5 rounded-lg text-xs font-bold border ${
                    isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#1c1c1e] border-slate-700 text-[#D1E4DE]'
                  }`}
                />
              </div>
              {(customFollowUpFrom || customFollowUpTo) && (
                <button
                  onClick={() => {
                    setCustomFollowUpFrom('');
                    setCustomFollowUpTo('');
                  }}
                  className={`text-xs font-bold underline px-2 py-1 ${
                    isLight ? 'text-[#0C2E27] hover:text-[#041310]' : 'text-[#7AB0A0] hover:text-[#D1E4DE]'
                  }`}
                >
                  مسح التواريخ
                </button>
              )}
            </div>
          )}
        </div>

        {/* 5. Detailed Filters Grid (المشروع، الحالة، المنطقة، موعد المتابعة، المصدر، الأولوية، الموظف، الترتيب) */}
        <button
          type="button"
          onClick={() => setShowAdvancedFilters(prev => !prev)}
          className={`hidden lg:flex items-center gap-1.5 text-xs font-bold pt-2 border-t w-full ${
            isLight ? 'border-slate-200 text-slate-600 hover:text-slate-900' : 'border-[#2A6B5C]/20 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Filter className="w-3.5 h-3.5" />
          <span>{showAdvancedFilters ? 'إخفاء الفلاتر التفصيلية' : 'عرض الفلاتر التفصيلية (المشروع، المنطقة، المصدر، الأولوية، الترتيب...)'}</span>
        </button>
        {showAdvancedFilters && (
        <div className={`hidden lg:grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 text-xs pt-2 border-t ${
          isLight ? 'border-slate-200' : 'border-[#2A6B5C]/20'
        }`}>
          {/* Project Dropdown */}
          <div>
            <label className={`block text-xs font-black mb-1.5 flex items-center gap-1 ${
              isLight ? 'text-slate-800' : 'text-[#2A6B5C]'
            }`}>
              <Building className="w-3.5 h-3.5" />
              <span>المشروع:</span>
            </label>
            <select
              value={selectedProject}
              onChange={e => setSelectedProject(e.target.value)}
              className={`w-full p-2.5 rounded-xl font-bold shadow-sm text-xs cursor-pointer focus:ring-2 focus:ring-[#2A6B5C] ${
                isLight
                  ? 'bg-slate-50 border-2 border-slate-300 text-slate-900'
                  : 'bg-[#1c1c1e] border-2 border-[#2A6B5C]/60 text-[#D1E4DE]'
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

          {/* Status Dropdown Filter */}
          <div>
            <label className={`block text-xs font-black mb-1.5 flex items-center gap-1 ${
              isLight ? 'text-slate-800' : 'text-[#2A6B5C]'
            }`}>
              <Filter className="w-3.5 h-3.5" />
              <span>حالة العميل:</span>
            </label>
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className={`w-full p-2.5 rounded-xl font-bold shadow-sm text-xs cursor-pointer focus:ring-2 focus:ring-[#2A6B5C] ${
                isLight
                  ? 'bg-slate-50 border-2 border-slate-300 text-slate-900'
                  : 'bg-[#1c1c1e] border-2 border-[#2A6B5C]/60 text-[#D1E4DE]'
              }`}
            >
              <option value="ALL">جميع الحالات</option>
              <option value="مهتم">مهتم ⭐</option>
              <option value="هرجع اكلمه تاني">هرجع اكلمه تاني 📞</option>
              <option value="جديد">جديد ✨</option>
              <option value="مشغول دلوقتي">مشغول دلوقتي</option>
              <option value="غير متاح">غير متاح</option>
              <option value="مغلق">مغلق</option>
              <option value="قفل الخط في وشي">قفل الخط</option>
              <option value="مش مهتم">مش مهتم</option>
              <option value="مش بيرد">مش بيرد</option>
              <option value="الرقم مقفول">الرقم مقفول</option>
              <option value="الرقم غلط">الرقم غلط</option>
            </select>
          </div>

          {/* Region / Location Filter */}
          <div>
            <label className={`block text-xs font-black mb-1.5 flex items-center gap-1 ${
              isLight ? 'text-slate-800' : 'text-[#2A6B5C]'
            }`}>
              <MapPin className="w-3.5 h-3.5" />
              <span>المنطقة / العنوان:</span>
            </label>
            <select
              value={selectedRegion}
              onChange={e => setSelectedRegion(e.target.value)}
              className={`w-full p-2.5 rounded-xl font-bold shadow-sm text-xs cursor-pointer focus:ring-2 focus:ring-[#2A6B5C] ${
                isLight
                  ? 'bg-slate-50 border-2 border-slate-300 text-slate-900'
                  : 'bg-[#1c1c1e] border-2 border-[#2A6B5C]/60 text-[#D1E4DE]'
              }`}
            >
              <option value="ALL">جميع المناطق ({availableRegions.length})</option>
              {availableRegions.map(reg => (
                <option key={reg} value={reg}>
                  {reg}
                </option>
              ))}
            </select>
          </div>

          {/* Lead Source Filter */}
          <div>
            <label className={`block text-xs font-black mb-1.5 flex items-center gap-1 ${
              isLight ? 'text-slate-800' : 'text-[#2A6B5C]'
            }`}>
              <Tag className="w-3.5 h-3.5" />
              <span>مصدر الداتا:</span>
            </label>
            <select
              value={selectedSource}
              onChange={e => setSelectedSource(e.target.value)}
              className={`w-full p-2.5 rounded-xl font-bold shadow-sm text-xs cursor-pointer focus:ring-2 focus:ring-[#2A6B5C] ${
                isLight
                  ? 'bg-slate-50 border-2 border-slate-300 text-slate-900'
                  : 'bg-[#1c1c1e] border-2 border-[#2A6B5C]/60 text-[#D1E4DE]'
              }`}
            >
              <option value="ALL">جميع المصادر</option>
              <option value="اعلانات فيسبوك">اعلانات فيسبوك</option>
              <option value="داتا خاصة">داتا خاصة</option>
              <option value="اوت دور">اوت دور</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <label className={`block text-xs font-black mb-1.5 flex items-center gap-1 ${
              isLight ? 'text-slate-800' : 'text-[#2A6B5C]'
            }`}>
              <Flame className="w-3.5 h-3.5" />
              <span>الأولوية:</span>
            </label>
            <select
              value={selectedPriority}
              onChange={e => setSelectedPriority(e.target.value)}
              className={`w-full p-2.5 rounded-xl font-bold shadow-sm text-xs cursor-pointer focus:ring-2 focus:ring-[#2A6B5C] ${
                isLight
                  ? 'bg-slate-50 border-2 border-slate-300 text-slate-900'
                  : 'bg-[#1c1c1e] border-2 border-[#2A6B5C]/60 text-[#D1E4DE]'
              }`}
            >
              <option value="ALL">جميع الأولويات</option>
              <option value="عالي">عالي 🔥</option>
              <option value="متوسط">متوسط</option>
              <option value="منخفض">منخفض</option>
            </select>
          </div>

          {/* Sort By Option */}
          <div>
            <label className={`block text-xs font-black mb-1.5 flex items-center gap-1 ${
              isLight ? 'text-slate-800' : 'text-[#2A6B5C]'
            }`}>
              <ArrowUpDown className={`w-3.5 h-3.5 ${isLight ? 'text-[#1F5447]' : 'text-[#2A6B5C]'}`} />
              <span>ترتيب النتائج:</span>
            </label>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className={`w-full p-2.5 rounded-xl font-bold shadow-sm text-xs cursor-pointer focus:ring-2 focus:ring-[#2A6B5C] ${
                isLight
                  ? 'bg-slate-50 border-2 border-slate-300 text-slate-900'
                  : 'bg-[#1c1c1e] border-2 border-[#2A6B5C]/60 text-[#D1E4DE]'
              }`}
            >
              <option value="DEFAULT">الافتراضي (حسب الإضافة)</option>
              <option value="PRIORITY">الأولوية (الأعلى أولاً 🔥)</option>
              <option value="FOLLOWUP">ميعاد الفولو اب (الأقرب)</option>
              <option value="NAME">أبجدياً بالاسم (أ-ي)</option>
              <option value="PROJECT">اسم المشروع</option>
            </select>
          </div>

          {/* User Filter (Admin View) */}
          {currentUser.role === 'ADMIN' && (
            <div className="col-span-2 sm:col-span-3 md:col-span-6 pt-1 border-t border-slate-900/30">
              <div className="flex items-center gap-3">
                <label className={`text-xs font-black flex items-center gap-1 shrink-0 ${
                  isLight ? 'text-slate-800' : 'text-[#2A6B5C]'
                }`}>
                  <User className="w-3.5 h-3.5" />
                  <span>تصفية بالموظف المسؤول:</span>
                </label>
                <select
                  value={selectedUser}
                  onChange={e => setSelectedUser(e.target.value)}
                  className={`flex-1 p-2 rounded-xl font-bold shadow-sm text-xs cursor-pointer focus:ring-2 focus:ring-[#2A6B5C] ${
                    isLight
                      ? 'bg-slate-50 border-2 border-slate-300 text-slate-900'
                      : 'bg-[#1c1c1e] border-2 border-[#2A6B5C]/60 text-[#D1E4DE]'
                  }`}
                >
                  <option value="ALL">جميع الموظفين</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role === 'ADMIN' ? 'مدير' : 'موظف مبيعات'})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
        )}

        {/* Latest additions + selection tools */}
        {canManageSelection && (
          <div className={`p-3 rounded-xl text-xs border flex flex-wrap items-center gap-2 ${isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#1c1c1e] border-[#2A6B5C]/40 text-[#D1E4DE]'}`}>
            <span className="font-bold">أحدث الإضافات:</span>
            {([['all', 'الكل'], ['hour', 'آخر ساعة'], ['today', 'النهاردة'], ['week', 'آخر ٧ أيام']] as const).map(([k, label]) => (
              <button
                key={k}
                type="button"
                onClick={() => { setAddedFilter(k); setSelectedClientIds([]); }}
                className={`px-2.5 py-1 rounded-full border font-bold transition ${addedFilter === k ? 'bg-[#2A6B5C] text-white border-[#2A6B5C]' : isLight ? 'bg-slate-50 border-slate-300 hover:bg-slate-100' : 'bg-black/30 border-slate-600 hover:bg-black/50'}`}
              >
                {label}
              </button>
            ))}
            <span className="flex-1" />
            <span className="text-[11px] opacity-70">اضغط على أي عميل لتحديده</span>
            <button
              type="button"
              onClick={() => setSelectedClientIds(filteredClients.map(c => c.id))}
              disabled={filteredClients.length === 0}
              className="px-2.5 py-1 rounded-lg bg-[#2A6B5C] text-white font-bold disabled:opacity-40"
            >
              تحديد كل المعروض ({filteredClients.length})
            </button>
          </div>
        )}

        {/* Bulk action bar: transfer to another sales rep / delete */}
        {canManageSelection && selectedClientIds.length > 0 && (
          <div className={`p-3 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs border sticky top-2 z-30 shadow-lg ${
            isLight
              ? 'bg-[#EAF3F0] border-[#7AB0A0] text-[#081F1A]'
              : 'bg-[#1c1c1e] border-[#2A6B5C]/40 text-[#A8CCC0]'
          }`}>
            <span className="font-bold">
              تم تحديد ({selectedClientIds.length}) عميل
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {canDoBulkAssign && (
                <>
                  <select
                    value={targetAssignUserId}
                    onChange={e => setTargetAssignUserId(e.target.value)}
                    className={`p-1.5 rounded-lg text-xs font-semibold border ${
                      isLight
                        ? 'bg-white border-slate-300 text-slate-900'
                        : 'bg-[#000000] border-[#2A6B5C]/50 text-[#D1E4DE]'
                    }`}
                  >
                    <option value="">انقلهم لسيلز...</option>
                    {users.filter(u => u.role === 'SALES_REP' && u.activeStatus === 'active').map(u => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleApplyBulkAssign}
                    disabled={!targetAssignUserId}
                    className="px-3 py-1.5 bg-[#2A6B5C] text-white font-bold rounded-lg hover:bg-[#4F9282] disabled:opacity-50 transition"
                  >
                    نقل
                  </button>
                </>
              )}
              {canDoBulkDelete && (
                <button
                  onClick={() => {
                    if (confirm(`هل أنت متأكد من مسح (${selectedClientIds.length}) عميل المحددين من الشيت؟`)) {
                      deleteSelectedClients(selectedClientIds);
                      setSelectedClientIds([]);
                    }
                  }}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition flex items-center gap-1 cursor-pointer"
                  title="حذف العملاء المحددين"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>مسح ({selectedClientIds.length})</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setSelectedClientIds([])}
                className={`px-3 py-1.5 rounded-lg border font-bold ${isLight ? 'border-slate-400 bg-white' : 'border-slate-600'}`}
              >
                إلغاء التحديد
              </button>
            </div>
          </div>
        )}
      </div>

      {/* View Switcher & Mobile Quick Action Bar */}
      <div className="flex items-center justify-between gap-2 px-1">
        <div className="hidden lg:flex items-center gap-1.5">
          <span className="text-xs font-bold text-slate-400">طريقة العرض:</span>
          <div className={`p-1 rounded-xl border flex items-center gap-1 ${
            isLight ? 'bg-slate-100 border-slate-300' : 'bg-[#1c1c1e] border-slate-800'
          }`}>
            <button
              type="button"
              onClick={() => {
                setViewMode('cards');
                localStorage.setItem('gohar_spreadsheet_view_mode', 'cards');
              }}
              className={`px-2.5 py-1.5 text-xs font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-[#2A6B5C] text-white shadow-sm'
                  : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-300 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>بطاقات ذكية</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setViewMode('table');
                localStorage.setItem('gohar_spreadsheet_view_mode', 'table');
              }}
              className={`px-2.5 py-1.5 text-xs font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-[#2A6B5C] text-white shadow-sm'
                  : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-300 hover:text-white'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>جدول الشيت</span>
            </button>
          </div>
        </div>

        {/* Mobile Filter Trigger Button */}
        <div className="lg:hidden flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsMobileFilterOpen(true)}
            className={`min-h-[40px] px-3.5 py-1.5 rounded-xl border font-bold text-xs flex items-center gap-1.5 cursor-pointer transition shadow-sm active:scale-95 ${
              activeFiltersCount > 0
                ? 'bg-[#2A6B5C] text-white border-[#2A6B5C]'
                : isLight
                ? 'bg-white border-slate-300 text-slate-800'
                : 'bg-[#1c1c1e] border-slate-700 text-[#A8CCC0]'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>فلاتر متقدمة</span>
            {activeFiltersCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-red-600 text-white text-[10px] font-black flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {(isNarrowScreen || viewMode === 'cards') ? (
        <div className="space-y-4">
          {filteredClients.length === 0 ? (
            <div className={`p-10 rounded-2xl border text-center space-y-2 ${
              isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#000000] border-[#2A6B5C]/25 text-slate-200'
            }`}>
              <AlertCircle className="w-8 h-8 text-[#4F9282] mx-auto" />
              <p className="font-bold text-sm">لا يوجد عملاء يطابقون خيارات البحث والفلاتر الحالية</p>
              <p className="text-xs text-slate-400">جرب تغيير كلمات البحث أو إعادة ضبط الفلاتر</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredClients.slice(0, mobileVisibleCount).map(client => (
                  <MobileClientCard
                    key={client.id}
                    client={client}
                    isLight={isLight}
                    canDelete={currentUser.role === 'ADMIN' || !!currentUser.permissions?.canDeleteClients}
                    onStatusChange={updateClientStatus}
                    onSelectForFollowUp={onSelectClientForFollowUp}
                    onOpenHistory={onOpenHistoryModal}
                    onDeleteClient={deleteClient}
                    statusConfig={statusConfig}
                    selected={selectedClientIds.includes(client.id)}
                    onToggleSelect={canManageSelection ? handleToggleSelectClient : undefined}
                  />
                ))}
              </div>

              {/* Load more clients button for ultra-smooth mobile performance */}
              {filteredClients.length > mobileVisibleCount && (
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 pb-2">
                  <span className="text-xs text-slate-400">
                    يتم عرض {Math.min(mobileVisibleCount, filteredClients.length)} من إجمالي {filteredClients.length} عميل
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setMobileVisibleCount(prev => prev + 30)}
                      className="px-5 py-2.5 rounded-xl bg-[#2A6B5C] hover:bg-[#1F5447] text-white font-black text-xs shadow-md transition cursor-pointer active:scale-95"
                    >
                      عرض 30 عميل إضافي (+30)
                    </button>
                    <button
                      type="button"
                      onClick={() => setMobileVisibleCount(filteredClients.length)}
                      className={`px-4 py-2.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
                        isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300' : 'bg-[#1c1c1e] text-[#A8CCC0] border-slate-800'
                      }`}
                    >
                      عرض الكل ({filteredClients.length})
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        /* Spreadsheet Table Container */
        <div className={`rounded-2xl border shadow-xl overflow-hidden ${
        isLight
          ? 'bg-white border-slate-200 shadow-slate-200/50'
          : 'bg-[#000000] border-[#2A6B5C]/30 shadow-2xl'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            
            {/* Header Row Google Sheets Style */}
            <thead>
              <tr className={`text-xs font-bold border-b ${
                isLight
                  ? 'bg-slate-100 text-slate-800 border-slate-200'
                  : 'bg-[#1c1c1e] text-[#A8CCC0] border-[#2A6B5C]/30'
              }`}>
                {currentUser.role === 'ADMIN' && (
                  <th className={`p-3 w-10 text-center border-l ${
                    isLight ? 'border-slate-200' : 'border-slate-900/60'
                  }`}>
                    <input
                      type="checkbox"
                      checked={
                        filteredClients.length > 0 &&
                        selectedClientIds.length === filteredClients.length
                      }
                      onChange={handleSelectAll}
                      className="rounded accent-[#2A6B5C]"
                    />
                  </th>
                )}
                {isColVisible('name') && (
                  <th className={`p-3 border-l min-w-[160px] ${
                    isLight ? 'border-slate-200' : 'border-slate-900/60'
                  }`}>اسم العميل</th>
                )}
                {isColVisible('phone') && (
                  <th className={`p-3 border-l min-w-[130px] ${
                    isLight ? 'border-slate-200' : 'border-slate-900/60'
                  }`}>رقم الهاتف</th>
                )}
                {isColVisible('status_actions') && (
                  <th className={`p-3 border-l min-w-[280px] ${
                    isLight ? 'border-slate-200' : 'border-slate-900/60'
                  }`}>
                    أزرار كول ستاتس (تحديث الحالة بضغطة واحدة)
                  </th>
                )}
                {isColVisible('followup') && (
                  <th className={`p-3 border-l min-w-[150px] ${
                    isLight ? 'border-slate-200' : 'border-slate-900/60'
                  }`}>ميعاد الفولو اب</th>
                )}
                {isColVisible('project') && (
                  <th className={`p-3 border-l min-w-[150px] ${
                    isLight ? 'border-slate-200' : 'border-slate-900/60'
                  }`}>المشروع</th>
                )}
                {isColVisible('source') && (
                  <th className={`p-3 border-l min-w-[110px] ${
                    isLight ? 'border-slate-200' : 'border-slate-900/60'
                  }`}>مصدر الداتا</th>
                )}
                {isColVisible('priority') && (
                  <th className={`p-3 border-l min-w-[90px] ${
                    isLight ? 'border-slate-200' : 'border-slate-900/60'
                  }`}>الأولوية</th>
                )}
                {currentUser.role === 'ADMIN' && isColVisible('assigned_user') && (
                  <th className={`p-3 border-l min-w-[130px] ${
                    isLight ? 'border-slate-200' : 'border-slate-900/60'
                  }`}>الموظف المسؤول</th>
                )}
                {isColVisible('email_address') && (
                  <th className={`p-3 border-l min-w-[180px] ${
                    isLight ? 'border-slate-200' : 'border-slate-900/60'
                  }`}>البريد والعنوان</th>
                )}
                {isColVisible('notes_history') && (
                  <th className={`p-3 border-l min-w-[180px] ${
                    isLight ? 'border-slate-200' : 'border-slate-900/60'
                  }`}>الملاحظات وسجل المحادثات</th>
                )}
                <th className="p-3 min-w-[80px] text-center">إجراءات</th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className={`divide-y text-xs font-sans ${
              isLight ? 'divide-slate-200' : 'divide-slate-900/50'
            }`}>
              {filteredClients.length === 0 ? (
                <tr>
                  <td
                    colSpan={currentUser.role === 'ADMIN' ? 12 : 10}
                    className={`p-12 text-center ${
                      isLight ? 'bg-white text-slate-500' : 'bg-[#000000] text-slate-200/70'
                    }`}
                  >
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Search className={`w-8 h-8 ${isLight ? 'text-slate-400' : 'text-slate-500/50'}`} />
                      <p className={`font-bold ${isLight ? 'text-slate-800' : 'text-[#A8CCC0]'}`}>لا يوجد عملاء يطابقون خيارات البحث أو التصفية الحالية</p>
                      <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400/80'}`}>تأكد من تعديل الفلتر أو إضافة عملاء جدد للشيت</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredClients.slice(0, tableVisibleCount).map((client, idx) => {
                  const StatusBadgeIcon = statusConfig[client.status]?.icon || Sparkles;
                  const isChecked = selectedClientIds.includes(client.id);

                  return (
                    <tr
                      key={client.id}
                      onClick={rowTapSelect(client.id)}
                      className={`transition group ${isChecked ? 'outline outline-2 -outline-offset-2 outline-[#2A6B5C] ' : ''}${canManageSelection ? 'cursor-pointer ' : ''}
                        isLight
                          ? client.status === 'مهتم'
                            ? 'bg-slate-50/70 hover:bg-slate-100/70'
                            : idx % 2 === 0
                            ? 'bg-white hover:bg-slate-50'
                            : 'bg-slate-50/50 hover:bg-slate-100/50'
                          : client.status === 'مهتم'
                          ? 'bg-slate-950/60 hover:bg-[#1c1c1e]'
                          : idx % 2 === 0
                          ? 'bg-[#000000] hover:bg-[#1c1c1e]'
                          : 'bg-[#062015] hover:bg-[#1c1c1e]'
                      }`}
                    >
                      {/* Select Checkbox for Admin */}
                      {currentUser.role === 'ADMIN' && (
                        <td className={`p-3 text-center border-l ${
                          isLight ? 'border-slate-200' : 'border-slate-900/40'
                        }`}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleSelectClient(client.id)}
                            className="rounded accent-[#2A6B5C]"
                          />
                        </td>
                      )}

                      {/* Client Name */}
                      {isColVisible('name') && (
                        <td className={`p-3 font-bold border-l ${
                          isLight
                            ? 'text-slate-900 border-slate-200'
                            : 'text-[#D1E4DE] border-slate-900/40'
                        }`}>
                          <div className="flex items-center gap-1.5">
                            <User className={`w-3.5 h-3.5 ${isLight ? 'text-slate-700' : 'text-[#2A6B5C]'}`} />
                            <span>{client.name}</span>
                          </div>
                        </td>
                      )}

                      {/* Phone Number & WhatsApp */}
                      {isColVisible('phone') && (
                        <td className={`p-3 font-mono dir-ltr text-right border-l ${
                          isLight ? 'border-slate-200' : 'border-slate-900/40'
                        }`}>
                          <div className="flex items-center justify-end gap-2">
                            <a
                              href={`https://wa.me/${client.phone.replace(/[^0-9]/g, '').startsWith('0') ? '20' + client.phone.replace(/[^0-9]/g, '').slice(1) : client.phone.replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`p-1 rounded-md border transition ${
                                isLight
                                  ? 'text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border-slate-300'
                                  : 'text-slate-300 hover:text-slate-100 bg-[#1c1c1e] hover:bg-slate-800 border-slate-700/60'
                              }`}
                              title="محادثة واتساب مباشرة"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </a>
                            <a
                              href={`tel:${client.phone}`}
                              className={`inline-flex items-center gap-1 font-semibold hover:underline ${
                                isLight
                                  ? 'text-slate-800 hover:text-slate-700'
                                  : 'text-slate-200 hover:text-[#7AB0A0]'
                              }`}
                              title="اتصال هاتفي"
                            >
                              <Phone className={`w-3 h-3 ${isLight ? 'text-slate-600' : 'text-slate-400'}`} />
                              <span>{client.phone}</span>
                            </a>
                          </div>
                        </td>
                      )}

                      {/* Explicit Call Status Action Buttons */}
                      {isColVisible('status_actions') && (
                        <td className={`p-2 border-l ${
                          isLight
                            ? 'border-slate-200 bg-slate-50/70'
                            : 'border-slate-900/40 bg-[#051C13]/60'
                        }`}>
                          <div className="flex flex-col gap-1.5">
                            {/* Active Status Display Badge */}
                            <div className="flex items-center justify-between mb-1">
                              <span className={`text-[10px] font-semibold ${
                                isLight ? 'text-slate-500' : 'text-slate-400/80'
                              }`}>الحالة الحالية:</span>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[11px] border flex items-center gap-1 ${
                                  statusConfig[client.status]?.bg
                                } ${statusConfig[client.status]?.text} ${
                                  statusConfig[client.status]?.border
                                }`}
                              >
                                <StatusBadgeIcon className="w-3 h-3" />
                                {client.status}
                                {formatAddedAt(client) && <span className="text-[9px] opacity-80 font-normal">· {formatAddedAt(client)}</span>}
                              </span>
                            </div>

                            {/* The 7 Required Action Buttons */}
                            <div className="grid grid-cols-4 gap-1">
                              {/* 1. مهتم */}
                              <button
                                onClick={() => {
                                  updateClientStatus(client.id, 'مهتم');
                                  onSelectClientForFollowUp(client);
                                }}
                                className={`px-1.5 py-1 text-[10px] font-bold rounded transition border text-center ${
                                  client.status === 'مهتم'
                                    ? 'bg-[#C49A45] text-white border-[#C49A45] shadow-sm'
                                    : isLight
                                    ? 'bg-[#E8DCC4]/40 text-[#8a6a2e] border-[#C49A45]/50 hover:bg-[#E8DCC4]/70'
                                    : 'bg-[#C49A45]/10 text-[#C49A45] border-[#C49A45]/40 hover:bg-[#C49A45]/20'
                                }`}
                                title="تحديد مهتم + إضافة ميعاد فولو اب"
                              >
                                مهتم ⭐
                              </button>

                              {/* 2. هرجع اكلمه تاني */}
                              <button
                                onClick={() => {
                                  updateClientStatus(client.id, 'هرجع اكلمه تاني');
                                  onSelectClientForFollowUp(client);
                                }}
                                className={`px-1.5 py-1 text-[10px] font-semibold rounded transition border text-center ${
                                  client.status === 'هرجع اكلمه تاني'
                                    ? 'bg-[#1F5447] text-white border-[#4F9282]'
                                    : isLight
                                    ? 'bg-[#D1E4DE] text-[#081F1A] border-[#7AB0A0] hover:bg-[#A8CCC0]'
                                    : 'bg-[#041310]/70 text-[#A8CCC0] border-[#0C2E27] hover:bg-[#081F1A]'
                                }`}
                              >
                                هرجع اكلمه
                              </button>

                              {/* 3. مشغول دلوقتي */}
                              <button
                                onClick={() => updateClientStatus(client.id, 'مشغول دلوقتي')}
                                className={`px-1.5 py-1 text-[10px] font-semibold rounded transition border text-center ${
                                  client.status === 'مشغول دلوقتي'
                                    ? 'bg-purple-600 text-white border-purple-400'
                                    : isLight
                                    ? 'bg-purple-100 text-purple-900 border-purple-300 hover:bg-purple-200'
                                    : 'bg-purple-950/70 text-purple-200 border-purple-800 hover:bg-purple-900'
                                }`}
                              >
                                مشغول
                              </button>

                              {/* 4. غير متاح */}
                              <button
                                onClick={() => updateClientStatus(client.id, 'غير متاح')}
                                className={`px-1.5 py-1 text-[10px] font-semibold rounded transition border text-center ${
                                  client.status === 'غير متاح'
                                    ? 'bg-[#1F5447] text-white font-bold border-[#4F9282]'
                                    : isLight
                                    ? 'bg-[#D1E4DE] text-[#081F1A] border-[#7AB0A0] hover:bg-[#A8CCC0]'
                                    : 'bg-[#041310]/70 text-[#A8CCC0] border-[#0C2E27] hover:bg-[#081F1A]'
                                }`}
                              >
                                غير متاح
                              </button>

                              {/* 5. مغلق */}
                              <button
                                onClick={() => updateClientStatus(client.id, 'مغلق')}
                                className={`px-1.5 py-1 text-[10px] font-semibold rounded transition border text-center ${
                                  client.status === 'مغلق'
                                    ? 'bg-red-600 text-white border-red-400'
                                    : isLight
                                    ? 'bg-red-100 text-red-900 border-red-300 hover:bg-red-200'
                                    : 'bg-red-950/70 text-red-200 border-red-800 hover:bg-red-900'
                                }`}
                              >
                                مغلق
                              </button>

                              {/* 6. قفل الخط في وشي */}
                              <button
                                onClick={() => updateClientStatus(client.id, 'قفل الخط في وشي')}
                                className={`px-1.5 py-1 text-[10px] font-semibold rounded transition border text-center ${
                                  client.status === 'قفل الخط في وشي'
                                    ? 'bg-rose-700 text-white border-rose-500'
                                    : isLight
                                    ? 'bg-rose-100 text-rose-900 border-rose-300 hover:bg-rose-200'
                                    : 'bg-rose-950/70 text-rose-200 border-rose-800 hover:bg-rose-900'
                                }`}
                              >
                                قفل الخط
                              </button>

                              {/* 7. مش مهتم */}
                              <button
                                onClick={() => updateClientStatus(client.id, 'مش مهتم')}
                                className={`px-1.5 py-1 text-[10px] font-semibold rounded transition border text-center ${
                                  client.status === 'مش مهتم'
                                    ? 'bg-slate-700 text-white border-slate-500'
                                    : isLight
                                    ? 'bg-slate-200 text-slate-800 border-slate-300 hover:bg-slate-300'
                                    : 'bg-slate-900/80 text-slate-300 border-slate-700 hover:bg-slate-800'
                                }`}
                              >
                                مش مهتم
                              </button>

                              {/* 8. مش بيرد */}
                              <button
                                onClick={() => updateClientStatus(client.id, 'مش بيرد')}
                                className={`px-1.5 py-1 text-[10px] font-semibold rounded transition border text-center ${
                                  client.status === 'مش بيرد'
                                    ? 'bg-orange-600 text-white border-orange-400'
                                    : isLight
                                    ? 'bg-orange-100 text-orange-900 border-orange-300 hover:bg-orange-200'
                                    : 'bg-orange-950/70 text-orange-200 border-orange-800 hover:bg-orange-900'
                                }`}
                              >
                                مش بيرد
                              </button>

                              {/* 9. الرقم مقفول */}
                              <button
                                onClick={() => updateClientStatus(client.id, 'الرقم مقفول')}
                                className={`px-1.5 py-1 text-[10px] font-semibold rounded transition border text-center ${
                                  client.status === 'الرقم مقفول'
                                    ? 'bg-zinc-600 text-white border-zinc-400'
                                    : isLight
                                    ? 'bg-zinc-200 text-zinc-800 border-zinc-300 hover:bg-zinc-300'
                                    : 'bg-zinc-800/80 text-zinc-300 border-zinc-600 hover:bg-zinc-700'
                                }`}
                              >
                                الرقم مقفول
                              </button>

                              {/* 10. الرقم غلط */}
                              <button
                                onClick={() => updateClientStatus(client.id, 'الرقم غلط')}
                                className={`px-1.5 py-1 text-[10px] font-semibold rounded transition border text-center ${
                                  client.status === 'الرقم غلط'
                                    ? 'bg-red-700 text-white border-red-500'
                                    : isLight
                                    ? 'bg-red-100 text-red-900 border-red-300 hover:bg-red-200'
                                    : 'bg-red-950/80 text-red-300 border-red-800 hover:bg-red-900'
                                }`}
                              >
                                الرقم غلط
                              </button>
                            </div>
                          </div>
                        </td>
                      )}

                      {/* Follow-up Date & Time */}
                      {isColVisible('followup') && (
                        <td className={`p-3 border-l ${
                          isLight ? 'border-slate-200' : 'border-slate-900/40'
                        }`}>
                          {client.followUpDate ? (
                            <div className={`flex flex-col gap-1 p-2 rounded-xl border ${
                              isLight
                                ? 'bg-[#EAF3F0] border-[#A8CCC0]'
                                : 'bg-[#1c1c1e] border-[#2A6B5C]/40'
                            }`}>
                              <div className={`flex items-center gap-1 font-bold text-[11px] ${
                                isLight ? 'text-[#081F1A]' : 'text-[#A8CCC0]'
                              }`}>
                                <Calendar className="w-3.5 h-3.5 text-[#2A6B5C]" />
                                <span>{client.followUpDate}</span>
                              </div>
                              {client.followUpTime && (
                                <div className={`flex items-center gap-1 text-[10px] font-mono ${
                                  isLight ? 'text-slate-600' : 'text-slate-300'
                                }}`}>
                                  <Clock className="w-3 h-3 text-[#2A6B5C]" />
                                  <span>{client.followUpTime}</span>
                                </div>
                              )}
                              <button
                                onClick={() => onSelectClientForFollowUp(client)}
                                className={`text-[10px] underline font-bold mt-0.5 text-right cursor-pointer ${
                                  isLight ? 'text-[#123F36] hover:text-[#081F1A]' : 'text-[#7AB0A0] hover:text-[#D1E4DE]'
                                }`}
                              >
                                تعديل الموعد
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => onSelectClientForFollowUp(client)}
                              className={`px-2.5 py-1 text-[11px] rounded-lg border font-semibold transition flex items-center gap-1 cursor-pointer ${
                                isLight
                                  ? 'text-slate-700 bg-slate-100 hover:bg-slate-200 border-slate-300'
                                  : 'text-[#A8CCC0] bg-[#1c1c1e] hover:bg-slate-800 border-[#2A6B5C]/40'
                              }`}
                            >
                              <Calendar className="w-3 h-3 text-[#2A6B5C]" />
                              <span>تحديد موعد</span>
                            </button>
                          )}
                        </td>
                      )}

                      {/* Project Name */}
                      {isColVisible('project') && (
                        <td className={`p-3 border-l ${
                          isLight ? 'border-slate-200 text-slate-800' : 'border-slate-900/40 text-slate-100'
                        }`}>
                          <div className="flex items-center gap-1 font-medium">
                            <Building className="w-3.5 h-3.5 text-[#2A6B5C] shrink-0" />
                            <span>{client.projectName}</span>
                          </div>
                        </td>
                      )}

                      {/* Lead Source */}
                      {isColVisible('source') && (
                        <td className={`p-3 border-l ${
                          isLight ? 'border-slate-200' : 'border-slate-900/40'
                        }`}>
                          <span
                            className={`inline-block px-2 py-0.5 text-[10px] rounded-full font-bold ${
                              client.source === 'اعلانات فيسبوك'
                                ? isLight ? 'bg-[#D1E4DE] text-[#081F1A] border border-[#7AB0A0]' : 'bg-[#041310] text-[#A8CCC0] border border-[#123F36]'
                                : client.source === 'داتا خاصة'
                                ? isLight ? 'bg-[#D1E4DE] text-[#081F1A] border border-[#7AB0A0]' : 'bg-[#041310] text-[#A8CCC0] border border-[#123F36]'
                                : isLight ? 'bg-slate-100 text-slate-900 border border-slate-300' : 'bg-slate-950 text-slate-200 border border-slate-700'
                            }`}
                          >
                            {client.source}
                          </span>
                        </td>
                      )}

                      {/* Priority */}
                      {isColVisible('priority') && (
                        <td className={`p-3 border-l ${
                          isLight ? 'border-slate-200' : 'border-slate-900/40'
                        }`}>
                          <span
                            className={`font-bold ${
                              client.priority === 'عالي'
                                ? 'text-red-600'
                                : client.priority === 'متوسط'
                                ? isLight ? 'text-[#123F36]' : 'text-[#4F9282]'
                                : isLight ? 'text-slate-600' : 'text-slate-400'
                            }`}
                          >
                            {client.priority === 'عالي' ? '🔥 عالي' : client.priority}
                          </span>
                        </td>
                      )}

                      {/* Assigned Sales Rep (Admin view) */}
                      {currentUser.role === 'ADMIN' && isColVisible('assigned_user') && (
                        <td className={`p-3 border-l ${
                          isLight ? 'border-slate-200' : 'border-slate-900/40'
                        }`}>
                          <div className={`flex items-center gap-1 text-[11px] ${
                            isLight ? 'text-slate-700' : 'text-slate-200'
                          }`}>
                            <User className="w-3.5 h-3.5 text-[#2A6B5C]" />
                            <span className="font-semibold">{client.assignedUserName}</span>
                          </div>
                        </td>
                      )}

                      {/* Email & Address */}
                      {isColVisible('email_address') && (
                        <td className={`p-3 border-l ${
                          isLight ? 'border-slate-200 text-slate-700' : 'border-slate-900/40 text-slate-200'
                        }`}>
                          <div className="flex flex-col gap-0.5">
                            {client.email && (
                              <span className={`truncate max-w-[170px] text-[10px] font-mono ${
                                isLight ? 'text-slate-600' : 'text-slate-300'
                              }`}>
                                {client.email}
                              </span>
                            )}
                            <span className={`text-[11px] ${
                              isLight ? 'text-slate-800' : 'text-slate-100'
                            }`}>{client.address || 'القاهرة'}</span>
                          </div>
                        </td>
                      )}

                      {/* Call Notes & History */}
                      {isColVisible('notes_history') && (
                        <td className={`p-3 border-l ${
                          isLight ? 'border-slate-200' : 'border-slate-900/40'
                        }`}>
                          <div className="flex flex-col gap-1">
                            <p className={`text-[11px] line-clamp-2 leading-relaxed ${
                              isLight ? 'text-slate-700' : 'text-slate-100/90'
                            }`}>
                              {client.notes || 'لا توجد ملاحظات سابقة'}
                            </p>
                            <button
                              onClick={() => onOpenHistoryModal(client)}
                              className={`inline-flex items-center gap-1 text-[10px] font-bold hover:underline cursor-pointer ${
                                isLight ? 'text-[#123F36] hover:text-[#081F1A]' : 'text-[#7AB0A0] hover:text-[#D1E4DE]'
                              }`}
                            >
                              <History className="w-3 h-3 text-[#2A6B5C]" />
                              <span>سجل المحادثات ({client.notesHistory?.length || 0})</span>
                            </button>
                          </div>
                        </td>
                      )}

                      {/* Actions */}
                      <td className="p-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => onOpenHistoryModal(client)}
                            className={`p-1.5 rounded-lg transition cursor-pointer ${
                              isLight
                                ? 'text-[#123F36] hover:text-[#081F1A] hover:bg-[#D1E4DE]'
                                : 'text-[#7AB0A0] hover:text-white hover:bg-[#1c1c1e]'
                            }`}
                            title="عرض السجل بالتفصيل"
                          >
                            <History className="w-4 h-4" />
                          </button>
                          {currentUser.role === 'ADMIN' && (
                            <button
                              onClick={() => {
                                if (confirm(`هل أنت تأكد من حذف العميل (${client.name})؟`)) {
                                  deleteClient(client.id);
                                }
                              }}
                              className={`p-1.5 rounded-lg transition cursor-pointer ${
                                isLight
                                  ? 'text-red-600 hover:text-red-800 hover:bg-red-100'
                                  : 'text-red-400 hover:text-red-200 hover:bg-red-950/60'
                              }`}
                              title="حذف العميل"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {filteredClients.length > tableVisibleCount && (
          <div ref={tableSentinelRef} className="p-3 text-center">
            <button
              type="button"
              onClick={() => setTableVisibleCount(c => c + 100)}
              className="px-4 py-2 rounded-lg border border-emerald-600 text-emerald-700 text-xs font-bold hover:bg-emerald-50"
            >
              عرض المزيد ({tableVisibleCount} من {filteredClients.length})
            </button>
          </div>
        )}

        {/* Footer Summary Bar */}
        <div className={`p-3.5 border-t text-xs flex flex-col sm:flex-row items-center justify-between gap-3 ${
          isLight
            ? 'bg-slate-100 border-slate-200 text-slate-700'
            : 'bg-[#1c1c1e] border-[#2A6B5C]/20 text-slate-200'
        }`}>
          <div className="flex flex-wrap items-center gap-4">
            <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-[#D1E4DE]'}`}>
              إجمالي النتائج: {filteredClients.length} عميل
            </span>
            <span className={`font-semibold ${isLight ? 'text-slate-800' : 'text-slate-300'}`}>
              المهتمين: {filteredClients.filter(c => c.status === 'مهتم').length}
            </span>
            <span className={`font-semibold ${isLight ? 'text-[#0C2E27]' : 'text-[#7AB0A0]'}`}>
              المتابعات: {filteredClients.filter(c => c.status === 'هرجع اكلمه تاني').length}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPrintReportOpen(true)}
              className="px-3 py-1.5 bg-[#2A6B5C] hover:bg-[#7AB0A0] text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>طباعة وتصدير PDF</span>
            </button>
            <span className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-[#7AB0A0]/70'}`}>
              شيت تفاعلي أوتوماتيكي - شركة جوهر جروب
            </span>
          </div>
        </div>
      </div>
      )}

      {/* Mobile Filter Bottom Drawer */}
      <MobileFilterDrawer
        isOpen={isMobileFilterOpen}
        onClose={() => setIsMobileFilterOpen(false)}
        isLight={isLight}
        projects={projects}
        users={users}
        availableRegions={availableRegions}
        selectedProject={selectedProject}
        setSelectedProject={setSelectedProject}
        selectedStatus={selectedStatus}
        setSelectedStatus={setSelectedStatus}
        selectedPriority={selectedPriority}
        setSelectedPriority={setSelectedPriority}
        selectedSource={selectedSource}
        setSelectedSource={setSelectedSource}
        selectedUser={selectedUser}
        setSelectedUser={setSelectedUser}
        selectedRegion={selectedRegion}
        setSelectedRegion={setSelectedRegion}
        selectedFollowUpRange={selectedFollowUpRange}
        setSelectedFollowUpRange={setSelectedFollowUpRange}
        sortBy={sortBy}
        setSortBy={setSortBy}
        onResetFilters={resetAllFilters}
        activeFiltersCount={activeFiltersCount}
      />

      {/* Daily Follow-Up & Clients Print/PDF Modal guarded with ErrorBoundary */}
      <ErrorBoundary
        key={printReportKey}
        isModal={true}
        fallbackTitle="تنبيه في تقرير المتابعات والطباعة"
        fallbackMessage="تعذر تحميل نافذة تقرير المتابعات والطباعة. يمكنك الضغط على 'إعادة المحاولة' لإعادة تحميل المكون دون إغلاق المودال، أو إغلاق النافذة."
        onReset={handleClosePrintReport}
        onRetry={() => setPrintReportKey(k => k + 1)}
      >
        <FollowUpPrintReportModal
          isOpen={isPrintReportOpen}
          onClose={handleClosePrintReport}
          initialFilterProject={selectedProject}
          initialFilterStatus={selectedStatus}
          initialFilterRegion={selectedRegion}
        />
      </ErrorBoundary>

      {/* Customizable Table Columns Modal */}
      <ColumnPickerModal
        isOpen={isColumnPickerOpen}
        onClose={() => setIsColumnPickerOpen(false)}
      />
    </div>
  );
};
