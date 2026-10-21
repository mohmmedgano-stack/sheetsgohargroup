import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PWAInstallButton } from './PWAInstallButton';
import {
  Table2,
  Clock,
  UserPlus,
  CalendarDays,
  Menu,
  X,
  Sliders,
  ShieldCheck,
  Building2,
  CloudCheck,
  Sun,
  Moon,
  LogOut,
  UploadCloud,
  Bell,
  CheckCircle2,
  UserCheck,
} from 'lucide-react';
import { toLocalDateStr } from '../utils/dates';

interface MobileBottomNavProps {
  activeTab: 'sheet' | 'dashboard' | 'archive' | 'followups' | 'users' | 'projects' | 'cloud';
  setActiveTab: (tab: 'sheet' | 'dashboard' | 'archive' | 'followups' | 'users' | 'projects' | 'cloud') => void;
  onOpenAddClient: () => void;
  onOpenImportExport: () => void;
  onOpenNotificationCenter: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  setActiveTab,
  onOpenAddClient,
  onOpenImportExport,
  onOpenNotificationCenter,
}) => {
  const {
    currentUser,
    visibleClients,
    unreadNotificationsCount,
    themeMode,
    toggleTheme,
    canExport,
    logoutUser,
  } = useApp();

  const [isMoreDrawerOpen, setIsMoreDrawerOpen] = useState(false);
  const isLight = themeMode === 'light';

  const todayStr = toLocalDateStr();
  const todayFollowUpsCount = visibleClients.filter(
    c => c.followUpDate === todayStr && c.status !== 'متعاقد' && c.status !== 'مش مهتم'
  ).length;

  const handleSelectTab = (tab: 'sheet' | 'dashboard' | 'archive' | 'followups' | 'users' | 'projects' | 'cloud') => {
    setActiveTab(tab);
    setIsMoreDrawerOpen(false);
  };

  return (
    <>
      {/* Fixed Bottom Mobile Navigation Bar */}
      <nav
        aria-label="التنقل السريع للهاتف"
        className={`lg:hidden fixed bottom-0 left-0 right-0 z-40 pb-safe gpu-layer transition-colors duration-200 border-t select-none ${
          isLight
            ? 'bg-white/85 backdrop-blur-xl border-black/5 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] text-black'
            : 'bg-black/85 backdrop-blur-xl border-white/10 shadow-[0_-4px_25px_rgba(0,0,0,0.4)] text-white'
        }`}
      >
        <div className="flex items-center justify-around px-2 py-1.5 max-w-lg mx-auto">
          {/* 1. Sheet Tab */}
          <button
            type="button"
            onClick={() => handleSelectTab('sheet')}
            className={`flex flex-col items-center justify-center flex-1 min-h-[48px] py-1 rounded-xl transition-all cursor-pointer ${
              activeTab === 'sheet' && !isMoreDrawerOpen
                ? isLight
                  ? 'text-[var(--ios-blue)] font-bold'
                  : 'text-[var(--ios-blue)] font-bold'
                : isLight
                ? 'text-[var(--ios-label-secondary)]'
                : 'text-white/50'
            }`}
          >
            <div className="relative">
              <Table2 className="w-5 h-5" />
              {activeTab === 'sheet' && !isMoreDrawerOpen && (
                <span className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full ${
                  isLight ? 'bg-[var(--ios-blue)]' : 'bg-[var(--ios-blue)]'
                }`} />
              )}
            </div>
            <span className="text-[11px] mt-1 tracking-tight">الشيت</span>
          </button>

          {/* 2. Follow-ups Tab */}
          <button
            type="button"
            onClick={() => handleSelectTab('followups')}
            className={`flex flex-col items-center justify-center flex-1 min-h-[48px] py-1 rounded-xl transition-all cursor-pointer ${
              activeTab === 'followups' && !isMoreDrawerOpen
                ? isLight
                  ? 'text-[var(--ios-blue)] font-bold'
                  : 'text-[var(--ios-blue)] font-bold'
                : isLight
                ? 'text-[var(--ios-label-secondary)]'
                : 'text-white/50'
            }`}
          >
            <div className="relative">
              <Clock className="w-5 h-5" />
              {todayFollowUpsCount > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full min-w-[16px] text-center shadow-sm">
                  {todayFollowUpsCount}
                </span>
              )}
              {activeTab === 'followups' && !isMoreDrawerOpen && (
                <span className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full ${
                  isLight ? 'bg-[var(--ios-blue)]' : 'bg-[var(--ios-blue)]'
                }`} />
              )}
            </div>
            <span className="text-[11px] mt-1 tracking-tight">المتابعات</span>
          </button>

          {/* 3. CENTER CTA: Quick Add Client Button */}
          <div className="flex flex-col items-center justify-center px-1">
            <button
              type="button"
              onClick={onOpenAddClient}
              className="group relative -top-3 w-12 h-12 rounded-full bg-[var(--ios-blue)] text-white flex items-center justify-center shadow-lg shadow-[var(--ios-blue)]/30 active:scale-95 transition-transform duration-150 border-2 border-white/80 cursor-pointer"
              title="إضافة عميل جديد سريع"
              aria-label="إضافة عميل جديد"
            >
              <UserPlus className="w-5 h-5 text-white" />
            </button>
            <span className={`text-[10px] -mt-2 font-bold ${
              isLight ? 'text-[var(--ios-blue)]' : 'text-[var(--ios-blue)]'
            }`}>
              إضافة
            </span>
          </div>

          {/* 4. Archive Tab */}
          <button
            type="button"
            onClick={() => handleSelectTab('archive')}
            className={`flex flex-col items-center justify-center flex-1 min-h-[48px] py-1 rounded-xl transition-all cursor-pointer ${
              activeTab === 'archive' && !isMoreDrawerOpen
                ? isLight
                  ? 'text-[var(--ios-blue)] font-bold'
                  : 'text-[var(--ios-blue)] font-bold'
                : isLight
                ? 'text-[var(--ios-label-secondary)]'
                : 'text-white/50'
            }`}
          >
            <div className="relative">
              <CalendarDays className="w-5 h-5" />
              {activeTab === 'archive' && !isMoreDrawerOpen && (
                <span className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full ${
                  isLight ? 'bg-[var(--ios-blue)]' : 'bg-[var(--ios-blue)]'
                }`} />
              )}
            </div>
            <span className="text-[11px] mt-1 tracking-tight">التقويم</span>
          </button>

          {/* 5. More Menu Drawer Trigger */}
          <button
            type="button"
            onClick={() => setIsMoreDrawerOpen(prev => !prev)}
            className={`flex flex-col items-center justify-center flex-1 min-h-[48px] py-1 rounded-xl transition-all cursor-pointer ${
              isMoreDrawerOpen || (['dashboard', 'users', 'projects', 'cloud'].includes(activeTab))
                ? isLight
                  ? 'text-[var(--ios-blue)] font-bold'
                  : 'text-[var(--ios-blue)] font-bold'
                : isLight
                ? 'text-[var(--ios-label-secondary)]'
                : 'text-white/50'
            }`}
          >
            <div className="relative">
              {isMoreDrawerOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              {unreadNotificationsCount > 0 && (
                <span className="absolute -top-1 -right-1.5 w-2 h-2 rounded-full bg-red-500" />
              )}
            </div>
            <span className="text-[11px] mt-1 tracking-tight">المزيد</span>
          </button>
        </div>
      </nav>

      {/* Slide-up "More" Drawer for Mobile */}
      {isMoreDrawerOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex flex-col justify-end lg:hidden animate-fadeIn"
          onClick={e => {
            if (e.target === e.currentTarget) setIsMoreDrawerOpen(false);
          }}
          data-modal-backdrop="true"
        >
          <div
            data-modal-container="true"
            className={`w-full max-h-[85dvh] overflow-y-auto rounded-t-3xl border-t p-5 pb-safe space-y-4 shadow-2xl transition-all transform animate-slideUp ${
              isLight
                ? 'bg-white border-black/5 text-black'
                : 'bg-[#1c1c1e] border-white/10 text-white'
            }`}
          >
            {/* Drawer Pull Handle & Header */}
            <div className="flex flex-col items-center gap-2 border-b pb-3 border-black/10">
              <div className="w-12 h-1 rounded-full bg-slate-400/40" />
              <div className="w-full flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    width={36}
                    height={36}
                    className="w-9 h-9 rounded-full object-cover border border-black/5"
                  />
                  <div>
                    <div className="font-bold text-xs flex items-center gap-1.5">
                      <span>{currentUser.name}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        currentUser.role === 'ADMIN' ? 'bg-[var(--ios-blue)] text-white' : 'bg-[var(--ios-blue)] text-white'
                      }`}>
                        {currentUser.role === 'ADMIN' ? 'مدير عام' : currentUser.role === 'SALES_MANAGER' ? 'مدير مبيعات' : 'سيلز عقاري'}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">@{currentUser.username}</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMoreDrawerOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white"
                  aria-label="إغلاق القائمة"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Quick Action Buttons Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              {(currentUser.role === 'ADMIN' || currentUser.role === 'SALES_MANAGER') && (
                <>
                  <button
                    type="button"
                    onClick={() => handleSelectTab('dashboard')}
                    className={`p-3 rounded-2xl border flex items-center gap-2.5 font-bold transition text-right cursor-pointer ${
                      activeTab === 'dashboard'
                        ? isLight
                          ? 'bg-[var(--ios-blue)] text-white border-[var(--ios-blue)]'
                          : 'bg-[var(--ios-blue)] text-white border-[var(--ios-blue)]'
                        : isLight
                        ? 'bg-black/[0.04] border-transparent text-black'
                        : 'bg-white/[0.06] border-transparent text-white'
                    }`}
                  >
                    <Sliders className="w-4 h-4 shrink-0" />
                    <div className="flex flex-col">
                      <span>لوحة التقارير</span>
                      <span className="text-[10px] opacity-70 font-normal">إحصائيات المبيعات</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectTab('users')}
                    className={`p-3 rounded-2xl border flex items-center gap-2.5 font-bold transition text-right cursor-pointer ${
                      activeTab === 'users'
                        ? isLight
                          ? 'bg-[var(--ios-blue)] text-white border-[var(--ios-blue)]'
                          : 'bg-[var(--ios-blue)] text-white border-[var(--ios-blue)]'
                        : isLight
                        ? 'bg-black/[0.04] border-transparent text-black'
                        : 'bg-white/[0.06] border-transparent text-white'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    <div className="flex flex-col">
                      <span>فريق العمل</span>
                      <span className="text-[10px] opacity-70 font-normal">إدارة الموظفين</span>
                    </div>
                  </button>
                </>
              )}

              {currentUser.role === 'ADMIN' && (
                <button
                  type="button"
                  onClick={() => handleSelectTab('projects')}
                  className={`p-3 rounded-2xl border flex items-center gap-2.5 font-bold transition text-right cursor-pointer ${
                    activeTab === 'projects'
                      ? isLight
                        ? 'bg-[var(--ios-blue)] text-white border-[var(--ios-blue)]'
                        : 'bg-[var(--ios-blue)] text-white border-[var(--ios-blue)]'
                      : isLight
                      ? 'bg-black/[0.04] border-transparent text-black'
                      : 'bg-white/[0.06] border-transparent text-white'
                  }`}
                >
                  <Building2 className="w-4 h-4 shrink-0" />
                  <div className="flex flex-col">
                    <span>المشاريع</span>
                    <span className="text-[10px] opacity-70 font-normal">إضافة وحذف</span>
                  </div>
                </button>
              )}

              <button
                type="button"
                onClick={() => handleSelectTab('cloud')}
                className={`p-3 rounded-2xl border flex items-center gap-2.5 font-bold transition text-right cursor-pointer ${
                  activeTab === 'cloud'
                    ? isLight
                      ? 'bg-[var(--ios-blue)] text-white border-[var(--ios-blue)]'
                      : 'bg-[var(--ios-blue)] text-white border-[var(--ios-blue)]'
                    : isLight
                    ? 'bg-black/[0.04] border-transparent text-black'
                    : 'bg-white/[0.06] border-transparent text-white'
                }`}
              >
                <CloudCheck className="w-4 h-4 shrink-0 text-[var(--ios-blue)]" />
                <div className="flex flex-col">
                  <span>المزامنة السحابية</span>
                  <span className="text-[10px] opacity-70 font-normal">Google Sheets</span>
                </div>
              </button>

              {canExport && (
                <button
                  type="button"
                  onClick={() => {
                    setIsMoreDrawerOpen(false);
                    onOpenImportExport();
                  }}
                  className={`p-3 rounded-2xl border flex items-center gap-2.5 font-bold transition text-right cursor-pointer ${
                    isLight
                      ? 'bg-black/[0.04] border-transparent text-black'
                      : 'bg-white/[0.06] border-transparent text-white'
                  }`}
                >
                  <UploadCloud className="w-4 h-4 shrink-0 text-[var(--ios-blue)]" />
                  <div className="flex flex-col">
                    <span>استيراد وتصدير</span>
                    <span className="text-[10px] opacity-70 font-normal">ملفات إكسل CSV</span>
                  </div>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setIsMoreDrawerOpen(false);
                  onOpenNotificationCenter();
                }}
                className={`p-3 rounded-2xl border flex items-center gap-2.5 font-bold transition text-right cursor-pointer ${
                  isLight
                    ? 'bg-black/[0.04] border-transparent text-black'
                    : 'bg-white/[0.06] border-transparent text-white'
                }`}
              >
                <div className="relative">
                  <Bell className="w-4 h-4 shrink-0 text-[var(--ios-blue)]" />
                  {unreadNotificationsCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500" />
                  )}
                </div>
                <div className="flex flex-col">
                  <span>مركز التنبيهات</span>
                  <span className="text-[10px] opacity-70 font-normal">{unreadNotificationsCount} إشعار جديد</span>
                </div>
              </button>
            </div>

            {/* Install Desktop / Mobile App */}
            <div>
              <PWAInstallButton variant="button" />
            </div>

            {/* Appearance & System Controls */}
            <div className={`p-3 rounded-2xl border flex items-center justify-between ${
              isLight ? 'bg-black/[0.04] border-transparent' : 'bg-white/[0.06] border-transparent'
            }`}>
              <div className="flex items-center gap-2.5">
                {isLight ? (
                  <Sun className="w-5 h-5 text-[var(--ios-blue)]" />
                ) : (
                  <Moon className="w-5 h-5 text-[var(--ios-blue)]" />
                )}
                <div>
                  <div className="text-xs font-bold">مظهر النظام</div>
                  <div className="text-[10px] text-slate-400">
                    {isLight ? 'الوضع النهاري المضيء' : 'الوضع الليلي الزمردي'}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={toggleTheme}
                className={`px-3 py-2 text-xs font-bold rounded-xl border flex items-center gap-1.5 cursor-pointer ${
                  isLight
                    ? 'bg-white border-black/10 text-black shadow-sm'
                    : 'bg-white/10 border-white/10 text-white'
                }`}
              >
                {isLight ? 'تفعيل الداكن' : 'تفعيل المضيء'}
              </button>
            </div>

            {/* Logout Action */}
            <button
              type="button"
              onClick={() => {
                setIsMoreDrawerOpen(false);
                logoutUser();
              }}
              className="w-full min-h-[48px] py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-2xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <LogOut className="w-4 h-4" />
              <span>تسجيل الخروج من الحساب</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
};
