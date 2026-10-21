import React, { useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { PWAInstallButton } from './PWAInstallButton';
import {
  Menu,
  X,
  Briefcase,
  CalendarDays,
  Sliders,
  ShieldCheck,
  Building2,
  Clock,
  CloudCheck,
  UserPlus,
  Sun,
  Moon,
  LogOut,
  ChevronLeft,
} from 'lucide-react';
import { toLocalDateStr } from '../utils/dates';

interface HamburgerMenuProps {
  activeTab: 'sheet' | 'dashboard' | 'archive' | 'followups' | 'users' | 'projects' | 'cloud';
  setActiveTab: (tab: 'sheet' | 'dashboard' | 'archive' | 'followups' | 'users' | 'projects' | 'cloud') => void;
  onOpenAddClient: () => void;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}

/**
 * Mobile-First HamburgerMenu Component (<768px)
 * Designed for thumb-reach ergonomics, full ARIA accessibility, focus trapping, and keyboard support.
 */
export const HamburgerMenu: React.FC<HamburgerMenuProps> = ({
  activeTab,
  setActiveTab,
  onOpenAddClient,
  isOpen,
  onToggle,
  onClose,
}) => {
  const {
    currentUser,
    visibleClients,
    themeMode,
    toggleTheme,
    logoutUser,
  } = useApp();

  const isLight = themeMode === 'light';
  const triggerButtonRef = useRef<HTMLButtonElement>(null);

  // Focus trap inside the mobile drawer when opened
  const drawerRef = useFocusTrap<HTMLDivElement>({
    isActive: isOpen,
    onClose: () => {
      onClose();
      triggerButtonRef.current?.focus();
    },
  });

  // Calculate today's follow-ups count for thumb badge
  const todayStr = toLocalDateStr();
  const todayFollowUpsCount = visibleClients.filter(
    c => c.followUpDate === todayStr && c.status !== 'متعاقد' && c.status !== 'مش مهتم'
  ).length;

  // Handle escape key to close menu
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
        triggerButtonRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when drawer is open on mobile
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleSelect = (tab: 'sheet' | 'dashboard' | 'archive' | 'followups' | 'users' | 'projects' | 'cloud') => {
    setActiveTab(tab);
    onClose();
  };

  const navItems = [
    {
      id: 'sheet' as const,
      label: 'شيت العملاء الرئيسي',
      sublabel: 'جدول البيانات وإدارة المراحل',
      icon: Briefcase,
      badge: `${visibleClients.length} عميل`,
      show: true,
    },
    {
      id: 'archive' as const,
      label: 'التقويم',
      sublabel: 'جدول المواعيد والمؤرشف',
      icon: CalendarDays,
      show: true,
    },
    {
      id: 'followups' as const,
      label: 'مواعيد اليوم',
      sublabel: 'المتابعات والاتصالات المستحقة',
      icon: Clock,
      badge: todayFollowUpsCount > 0 ? `${todayFollowUpsCount} موعد` : undefined,
      badgeColor: 'bg-red-500 text-white',
      show: true,
    },
    {
      id: 'dashboard' as const,
      label: 'لوحة التقارير والمبيعات',
      sublabel: 'الرسوم البيانية وتحليلات الأداء',
      icon: Sliders,
      show: currentUser.role === 'ADMIN' || currentUser.role === 'SALES_MANAGER',
    },
    {
      id: 'users' as const,
      label: 'فريق العمل والموظفين',
      sublabel: 'توزيع الصلاحيات والمشاريع',
      icon: ShieldCheck,
      show: currentUser.role === 'ADMIN' || currentUser.role === 'SALES_MANAGER',
    },
    {
      id: 'projects' as const,
      label: 'المشاريع العقارية',
      sublabel: 'قائمة المشاريع وإدارة الوحدات',
      icon: Building2,
      show: currentUser.role === 'ADMIN',
    },
    {
      id: 'cloud' as const,
      label: 'المزامنة السحابية',
      sublabel: 'النسخ الاحتياطي والحالة السحابية',
      icon: CloudCheck,
      show: true,
    },
  ];

  return (
    <>
      {/* Accessible Hamburger Trigger Button (Visible only on mobile screen widths <768px) */}
      <button
        ref={triggerButtonRef}
        type="button"
        id="mobile-hamburger-trigger"
        onClick={onToggle}
        aria-label={isOpen ? 'إغلاق القائمة الرئيسية' : 'فتح قائمة التنقل الرئيسية'}
        aria-expanded={isOpen}
        aria-controls="mobile-navigation-menu"
        className={`md:hidden p-2 rounded-xl border transition-all duration-200 flex items-center justify-center cursor-pointer min-w-[44px] min-h-[44px] ${
          isOpen
            ? 'bg-[#4F9282]/20 text-[#7AB0A0] border-[#4F9282]/60 ring-2 ring-[#4F9282]/20'
            : isLight
            ? 'bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-200'
            : 'bg-[#000000] text-[#A8CCC0] border-slate-800/80 hover:bg-[#1c1c1e]'
        }`}
      >
        {isOpen ? <X className="w-5 h-5 text-[#2A6B5C]" /> : <Menu className="w-5 h-5 text-[#2A6B5C]" />}
      </button>

      {/* Accessible Slide-Over / Bottom-Sheet Drawer for Mobile Navigation */}
      {isOpen && (
        <div
          id="mobile-navigation-menu"
          role="dialog"
          aria-modal="true"
          aria-labelledby="mobile-nav-heading"
          className="fixed inset-0 z-50 md:hidden flex flex-col justify-end"
        >
          {/* Backdrop with fade-in */}
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Drawer Panel: Positioned at bottom / lower-center for optimal mobile thumb reach */}
          <div
            ref={drawerRef}
            className={`relative z-10 w-full max-h-[88vh] rounded-t-3xl border-t shadow-2xl flex flex-col overflow-hidden text-right gpu-layer transition-transform transform ${
              isLight
                ? 'bg-white text-slate-900 border-slate-200'
                : 'bg-[#000000] text-slate-100 border-[#2A6B5C]/30'
            }`}
          >
            {/* Grab Handle for intuitive mobile touch feedback */}
            <div className="w-12 h-1.5 rounded-full bg-slate-300 dark:bg-slate-800/80 mx-auto mt-3 mb-1" />

            {/* Header with Title and Close Button */}
            <div className={`p-4 border-b flex items-center justify-between gap-3 ${
              isLight ? 'border-slate-100 bg-slate-50/70' : 'border-slate-900/60 bg-[#000000]/80'
            }`}>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl p-0.5 bg-gradient-to-tr from-[#2A6B5C] to-[#A8CCC0] shadow-sm shrink-0">
                  <img
                    src={currentUser.avatar || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100'}
                    alt={currentUser.name}
                    width={32}
                    height={32}
                    className="w-full h-full rounded-[10px] object-cover"
                  />
                </div>
                <div>
                  <h2 id="mobile-nav-heading" className="text-sm font-black text-[#2A6B5C] dark:text-[#7AB0A0] leading-tight">
                    قائمة جوهر جروب
                  </h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-300 font-medium">
                    مرحباً بك، {currentUser.name}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="إغلاق القائمة"
                className={`p-2 rounded-xl border transition min-w-[44px] min-h-[44px] flex items-center justify-center ${
                  isLight
                    ? 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-900'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Thumb-Reach Ergonomic Quick Action: Add Client */}
            <div className="p-3 border-b border-slate-100 dark:border-slate-900/40">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAddClient();
                }}
                className="w-full py-3 px-4 bg-gradient-to-r from-[#2A6B5C] via-[#5AC8FA] to-[#0051D5] text-slate-950 font-black rounded-xl shadow-md flex items-center justify-center gap-2 text-sm active:scale-[0.98] transition cursor-pointer min-h-[48px]"
              >
                <UserPlus className="w-5 h-5 text-slate-950" />
                <span>إضافة عميل جديد للشيت</span>
              </button>
            </div>

            {/* Navigation Links (Clustered for thumb reach, minimum 48px height per target) */}
            <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto max-h-[50vh]" aria-label="أقسام التطبيق">
              {navItems
                .filter(item => item.show)
                .map(item => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelect(item.id)}
                      className={`w-full min-h-[48px] p-3 rounded-2xl flex items-center justify-between text-right transition-all duration-200 active:scale-[0.99] cursor-pointer ${
                        isActive
                          ? isLight
                            ? 'bg-slate-800 text-white font-bold shadow-sm'
                            : 'bg-gradient-to-r from-[#2A6B5C] to-[#0051D5] text-gray-950 font-black shadow-md'
                          : isLight
                          ? 'bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200/60'
                          : 'bg-[#000000]/90 hover:bg-slate-900/50 text-slate-100 border border-slate-900/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${
                          isActive
                            ? isLight ? 'bg-white/20 text-white' : 'bg-black/20 text-gray-950'
                            : isLight ? 'bg-[#D1E4DE]/80 text-[#081F1A]' : 'bg-slate-900/70 text-[#7AB0A0]'
                        }`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold leading-tight">{item.label}</div>
                          <div className={`text-[10px] ${
                            isActive
                              ? isLight ? 'text-slate-100' : 'text-slate-900/80'
                              : isLight ? 'text-slate-500' : 'text-slate-400/70'
                          }`}>
                            {item.sublabel}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {item.badge && (
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold font-mono ${
                            item.badgeColor || (isActive ? 'bg-black/20 text-white' : 'bg-[#2A6B5C]/20 text-[#7AB0A0]')
                          }`}>
                            {item.badge}
                          </span>
                        )}
                        <ChevronLeft className={`w-4 h-4 ${isActive ? 'text-current' : 'text-slate-400'}`} />
                      </div>
                    </button>
                  );
                })}
            </nav>

            {/* Bottom Utilities Footer for Thumb Reach: Theme toggle, PWA install, Logout */}
            <div className={`p-3 border-t grid grid-cols-2 gap-2 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#04140E] border-slate-900/60'
            }`}>
              <button
                type="button"
                onClick={toggleTheme}
                className={`py-2.5 px-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition cursor-pointer min-h-[44px] ${
                  isLight
                    ? 'bg-white border-slate-300 text-slate-800 hover:bg-slate-100'
                    : 'bg-[#000000] border-slate-800 text-[#A8CCC0] hover:bg-slate-900/60'
                }`}
              >
                {isLight ? <Moon className="w-4 h-4 text-[#1F5447]" /> : <Sun className="w-4 h-4 text-[#7AB0A0]" />}
                <span>{isLight ? 'الوضع الداكن' : 'الوضع النهاري'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  logoutUser();
                }}
                className="py-2.5 px-3 rounded-xl border border-red-600/40 bg-red-600/20 text-red-500 dark:text-red-400 flex items-center justify-center gap-2 text-xs font-bold hover:bg-red-600/30 transition cursor-pointer min-h-[44px]"
              >
                <LogOut className="w-4 h-4" />
                <span>خروج</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
