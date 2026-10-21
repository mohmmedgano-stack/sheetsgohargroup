import React, { useState, useEffect, useRef } from 'react';
import { Logo } from './Logo';
import { useApp } from '../context/AppContext';
import { useFocusTrap } from '../hooks/useFocusTrap';
import {
  Bell,
  BellRing,
  Search,
  ShieldCheck,
  User,
  CloudCheck,
  LogOut,
  ChevronDown,
  CheckCircle2,
  Clock,
  Briefcase,
  Sliders,
  CloudUpload,
  Lock,
  Building2,
  UserPlus,
  Image,
  Upload,
  Edit3,
  RotateCcw,
  CalendarDays,
  Sun,
  Moon,
  Volume2,
  Sparkles,
  Camera,
  Check,
  UserCircle,
  RefreshCw,
} from 'lucide-react';
import { BrowserNotificationModal } from './BrowserNotificationModal';
import { NotificationCenter } from './NotificationCenter';
import { PWAInstallButton } from './PWAInstallButton';
import { HamburgerMenu } from './HamburgerMenu';
import { useResponsiveImage } from '../hooks/useResponsiveImage';
import { getNotificationPermission } from '../services/notificationService';
import { compressImageFile } from '../utils/imageCompression';

interface HeaderProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  activeTab: 'sheet' | 'dashboard' | 'archive' | 'followups' | 'users' | 'projects' | 'cloud';
  setActiveTab: (tab: 'sheet' | 'dashboard' | 'archive' | 'followups' | 'users' | 'projects' | 'cloud') => void;
  onOpenAddClient: () => void;
  onOpenLoginModal: () => void;
  onOpenImportExportModal: () => void;
}

const PRESET_HEADER_LOGOS = [
  { name: 'شعار ذهبي ثلاثي الأبعاد (افتراضي)', url: null },
  { name: 'شارة جوهر المعمارية الملكية', url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=200' },
  { name: 'أبراج جوهر المودرن', url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=200' },
  { name: 'شعار التطوير العقاري الفاخر', url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=200' },
];

export const PRESET_USER_AVATARS = [
  { id: '1', title: 'تنفيذي أعمال', category: 'رجال', url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=250' },
  { id: '2', title: 'مستشارة أعمال', category: 'سيدات', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=250' },
  { id: '3', title: 'خبير عقاري', category: 'رجال', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=250' },
  { id: '4', title: 'أخصائية مبيعات', category: 'سيدات', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=250' },
  { id: '5', title: 'مدير تنفيذي VIP', category: 'رجال', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=250' },
  { id: '6', title: 'مسؤولة علاقات', category: 'سيدات', url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=250' },
  { id: '7', title: 'قائد فريق مبيعات', category: 'رجال', url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=250' },
  { id: '8', title: 'مستشارة استثمار', category: 'سيدات', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=250' },
  { id: '9', title: 'شخصية 3D ذهبية', category: '3D', url: 'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?w=250' },
  { id: '10', title: 'شخصية 3D أعمال', category: '3D', url: 'https://images.unsplash.com/photo-1628260412297-a3377e45006f?w=250' },
  { id: '11', title: 'رمز بروفايل فاخر', category: 'تصميم', url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=250' },
  { id: '12', title: 'استشاري عقاري', category: 'رجال', url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=250' },
];

export const Header: React.FC<HeaderProps> = ({
  searchTerm,
  onSearchChange,
  activeTab,
  setActiveTab,
  onOpenAddClient,
  onOpenLoginModal,
  onOpenImportExportModal,
}) => {
  const {
    currentUser,
    users,
    setCurrentUser,
    updateUser,
    notifications,
    unreadNotificationsCount,
    markNotificationAsRead,
    clearAllNotifications,
    cloudConfig,
    canExport,
    logoutUser,
    customLogoUrl,
    companyTitle,
    companySubtitle,
    updateLogoSettings,
    themeMode,
    toggleTheme,
    browserNotificationSettings,
    triggerTestNotification,
  } = useApp();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showNotificationSettingsModal, setShowNotificationSettingsModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [showLogoModal, setShowLogoModal] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);

  // Screen width detection for mobile-first conditional rendering (<768px)
  const [isMobileWidth, setIsMobileWidth] = useState<boolean>(() => {
    return typeof window !== 'undefined' ? window.innerWidth < 768 : false;
  });
  const [isHamburgerOpen, setIsHamburgerOpen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia('(max-width: 767px)');
    const handleMediaChange = (e: MediaQueryListEvent | MediaQueryList) => {
      setIsMobileWidth(e.matches);
      if (!e.matches) {
        setIsHamburgerOpen(false);
      }
    };
    handleMediaChange(mql);
    mql.addEventListener('change', handleMediaChange);
    return () => mql.removeEventListener('change', handleMediaChange);
  }, []);

  // Optimized responsive image for current user avatar using useResponsiveImage hook
  const responsiveUserAvatar = useResponsiveImage(
    currentUser.avatar || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150',
    'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150'
  );

  // Avatar Modal local state
  const [selectedAvatar, setSelectedAvatar] = useState<string>(currentUser.avatar || '');
  const [customAvatarUrlInput, setCustomAvatarUrlInput] = useState<string>('');
  const [avatarCategory, setAvatarCategory] = useState<string>('الكل');

  const logoModalRef = useFocusTrap<HTMLDivElement>({
    isActive: showLogoModal,
    onClose: () => setShowLogoModal(false),
  });

  const avatarModalRef = useFocusTrap<HTMLDivElement>({
    isActive: showAvatarModal,
    onClose: () => setShowAvatarModal(false),
  });

  const notificationsRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const actionsMenuRef = useRef<HTMLDivElement>(null);

  // Sync selected avatar when current user changes or modal opens
  useEffect(() => {
    if (currentUser.avatar) {
      setSelectedAvatar(currentUser.avatar);
    }
  }, [currentUser.avatar, showAvatarModal]);

  // Close dropdowns on click outside and on Escape key
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (showNotifications && notificationsRef.current && !notificationsRef.current.contains(target)) {
        setShowNotifications(false);
      }
      if (showUserMenu && userMenuRef.current && !userMenuRef.current.contains(target)) {
        setShowUserMenu(false);
      }
      if (showActionsMenu && actionsMenuRef.current && !actionsMenuRef.current.contains(target)) {
        setShowActionsMenu(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowNotifications(false);
        setShowUserMenu(false);
        setShowActionsMenu(false);
        setShowLogoModal(false);
        setShowAvatarModal(false);
        setShowNotificationSettingsModal(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showNotifications, showUserMenu, showActionsMenu]);

  // Avatar Modal Handlers
  const handleOpenAvatarModal = () => {
    setShowUserMenu(false);
    setSelectedAvatar(currentUser.avatar || '');
    setCustomAvatarUrlInput('');
    setShowAvatarModal(true);
  };

  const handleSaveAvatar = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const finalAvatar = customAvatarUrlInput.trim() || selectedAvatar;
    if (finalAvatar) {
      updateUser(currentUser.id, { avatar: finalAvatar });
    }
    setShowAvatarModal(false);
  };

  const handleLocalAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      compressImageFile(file, 256, 0.8).then(compressed => {
        setSelectedAvatar(compressed);
        setCustomAvatarUrlInput('');
      });
    }
  };

  // Logo modal local state
  const [inputLogoUrl, setInputLogoUrl] = useState<string>(customLogoUrl || '');
  const [inputTitle, setInputTitle] = useState<string>(companyTitle);
  const [inputSubtitle, setInputSubtitle] = useState<string>(companySubtitle);

  const handleOpenLogoModal = () => {
    setShowNotifications(false);
    setShowUserMenu(false);
    setInputLogoUrl(customLogoUrl || '');
    setInputTitle(companyTitle);
    setInputSubtitle(companySubtitle);
    setShowLogoModal(true);
  };

  const handleSaveLogoSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateLogoSettings(inputLogoUrl ? inputLogoUrl : null, inputTitle, inputSubtitle);
    setShowLogoModal(false);
  };

  const handleLocalLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      compressImageFile(file, 384, 0.85).then(compressed => {
        setInputLogoUrl(compressed);
      });
    }
  };

  const isLight = themeMode === 'light';

  return (
    <header className={`sticky top-0 z-40 border-b backdrop-blur-md transition-all duration-200 ${
      isLight
        ? 'bg-white/95 text-slate-900 border-slate-200 shadow-sm'
        : 'bg-[#000000]/95 text-slate-100 border-slate-900/60 shadow-xl'
    }`}>
      <div className="mx-auto px-3 sm:px-5 lg:px-6 max-w-7xl">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-2 sm:gap-4">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 shrink">
            <div className="cursor-pointer min-w-0 transition-transform hover:scale-105" onClick={() => setActiveTab('sheet')}>
              <Logo size={isMobileWidth ? "sm" : "md"} className="min-w-0" />
            </div>
          </div>

          {/* Search Input in Header */}
          <div className="hidden 2xl:flex flex-1 max-w-sm mx-2">
            <div className="relative w-full">
              <Search className={`absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 ${isLight ? 'text-slate-400' : 'text-slate-400'}`} />
              <input
                type="text"
                placeholder="بحث سريع (الاسم، الهاتف، المشروع)..."
                value={searchTerm}
                onChange={e => onSearchChange(e.target.value)}
                className={`w-full pl-8 pr-10 py-2 text-xs rounded-xl transition focus:outline-none focus:ring-2 focus:ring-[#2A6B5C] focus:border-transparent ${
                  isLight
                    ? 'bg-slate-100 border border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white'
                    : 'bg-[#000000] border border-slate-800/80 text-white placeholder-slate-300/40'
                }`}
              />
              <span className={`absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                isLight ? 'bg-white border-slate-200 text-slate-400' : 'bg-black/40 border-slate-800/60 text-slate-400'
              }`}>
                /
              </span>
            </div>
          </div>

          {/* Action Navigation Tabs */}
          <nav className={`hidden md:flex items-center gap-0.5 lg:gap-1 p-1 rounded-2xl border min-w-0 overflow-x-auto no-scrollbar whitespace-nowrap ${
            isLight
              ? 'bg-slate-100/90 border-slate-200'
              : 'bg-[#000000]/90 border-slate-800/60'
          }`}>
            <button
              onClick={() => setActiveTab('sheet')}
              className={`px-2 lg:px-3 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
                activeTab === 'sheet'
                  ? isLight
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'bg-[#2A6B5C] text-white shadow-md font-extrabold'
                  : isLight
                  ? 'text-slate-700 hover:bg-slate-200/80'
                  : 'text-slate-200/80 hover:text-white hover:bg-slate-900/40'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>شيت العملاء</span>
            </button>

            <button
              onClick={() => setActiveTab('archive')}
              className={`px-2 lg:px-3 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
                activeTab === 'archive'
                  ? isLight
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'bg-[#2A6B5C] text-white shadow-md font-extrabold'
                  : isLight
                  ? 'text-slate-700 hover:bg-slate-200/80'
                  : 'text-slate-200/80 hover:text-white hover:bg-slate-900/40'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>التقويم</span>
            </button>

            {(currentUser.role === 'ADMIN' || currentUser.role === 'SALES_MANAGER') && (
              <>
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`px-2 lg:px-3 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
                    activeTab === 'dashboard'
                      ? isLight
                        ? 'bg-slate-800 text-white shadow-sm'
                        : 'bg-[#2A6B5C] text-white shadow-md font-extrabold'
                      : isLight
                      ? 'text-slate-700 hover:bg-slate-200/80'
                      : 'text-slate-200/80 hover:text-white hover:bg-slate-900/40'
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>التقارير</span>
                </button>

                <button
                  onClick={() => setActiveTab('users')}
                  className={`px-2 lg:px-3 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
                    activeTab === 'users'
                      ? isLight
                        ? 'bg-slate-800 text-white shadow-sm'
                        : 'bg-[#2A6B5C] text-white shadow-md font-extrabold'
                      : isLight
                      ? 'text-slate-700 hover:bg-slate-200/80'
                      : 'text-slate-200/80 hover:text-white hover:bg-slate-900/40'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>الفريق</span>
                </button>

                {currentUser.role === 'ADMIN' && (
                  <button
                    onClick={() => setActiveTab('projects')}
                    className={`px-2 lg:px-3 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
                      activeTab === 'projects'
                        ? isLight
                          ? 'bg-slate-800 text-white shadow-sm'
                          : 'bg-[#2A6B5C] text-white shadow-md font-extrabold'
                        : isLight
                        ? 'text-slate-700 hover:bg-slate-200/80'
                        : 'text-slate-200/80 hover:text-white hover:bg-slate-900/40'
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>المشاريع</span>
                  </button>
                )}
              </>
            )}

            <button
              onClick={() => setActiveTab('followups')}
              className={`px-2 lg:px-3 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
                activeTab === 'followups'
                  ? isLight
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'bg-[#2A6B5C] text-white shadow-md font-extrabold'
                  : isLight
                  ? 'text-slate-700 hover:bg-slate-200/80'
                  : 'text-slate-200/80 hover:text-white hover:bg-slate-900/40'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>مواعيد اليوم</span>
            </button>

            <button
              onClick={() => setActiveTab('cloud')}
              className={`px-2 lg:px-3 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
                activeTab === 'cloud'
                  ? isLight
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'bg-[#2A6B5C] text-white shadow-md font-extrabold'
                  : isLight
                  ? 'text-slate-700 hover:bg-slate-200/80'
                  : 'text-slate-200/80 hover:text-white hover:bg-slate-900/40'
              }`}
            >
              <CloudCheck className={`w-3.5 h-3.5 ${isLight ? 'text-[#7AB0A0]' : 'text-[#7AB0A0]'}`} />
              <span>السحابة</span>
            </button>
          </nav>

          {/* Right side controls & User Profile Hub */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            
            {/* Desktop / PWA Install Button */}
            <div className="hidden 2xl:block"><PWAInstallButton variant="header" /></div>

            {/* Mobile-First Optimized Hamburger Menu (<768px) */}
            {isMobileWidth && (
              <HamburgerMenu
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                onOpenAddClient={onOpenAddClient}
                isOpen={isHamburgerOpen}
                onToggle={() => setIsHamburgerOpen(prev => !prev)}
                onClose={() => setIsHamburgerOpen(false)}
              />
            )}

            {/* Unified Client & Data Action Hub Button */}
            <div className="relative" ref={actionsMenuRef}>
              <div className="flex items-center rounded-xl shadow-md overflow-hidden p-0.5 bg-gradient-to-b from-[#B3D9FF]/40 via-[#2A6B5C]/30 to-[#003F9E]/40 border border-[#4F9282]/50 backdrop-blur-md">
                {/* Main Action: Add Client */}
                <button
                  onClick={onOpenAddClient}
                  className="group relative px-3 sm:px-3.5 py-1.5 sm:py-2 bg-gradient-to-r from-[#2A6B5C] via-[#5AC8FA] to-[#0051D5] text-slate-950 text-xs font-black rounded-lg flex items-center gap-1.5 transition-all duration-200 hover:brightness-105 active:scale-98 cursor-pointer shadow-sm"
                  title="إضافة عميل جديد للشيت"
                >
                  <span className="p-1 rounded-md bg-black/10 group-hover:bg-black/15 transition">
                    <UserPlus className="w-3.5 h-3.5 text-slate-950" />
                  </span>
                  <span className="hidden sm:inline tracking-tight">إضافة عميل</span>
                </button>

                {/* Dropdown Toggle for Import / Export and Options */}
                <button
                  onClick={() => setShowActionsMenu(prev => !prev)}
                  className="px-2 py-1.5 sm:py-2 text-[#A8CCC0] hover:text-[#D1E4DE] hover:bg-white/10 rounded-lg flex items-center justify-center transition-all duration-200 cursor-pointer ml-0.5"
                  title="خيارات إضافية (استيراد / تصدير اكسل)"
                >
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showActionsMenu ? 'rotate-180 text-[#7AB0A0]' : ''}`} />
                </button>
              </div>

              {/* Actions Dropdown Menu */}
              {showActionsMenu && (
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
                        setShowActionsMenu(false);
                        onOpenAddClient();
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs rounded-xl transition font-bold text-right cursor-pointer group ${
                        isLight
                          ? 'text-slate-800 hover:bg-[#EAF3F0]/80 hover:text-[#041310]'
                          : 'text-[#D1E4DE] hover:bg-slate-900/60'
                      }`}
                    >
                      <div className="p-1.5 rounded-lg bg-[#4F9282]/20 border border-[#4F9282]/30 text-[#4F9282] group-hover:scale-105 transition">
                        <UserPlus className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold">إضافة عميل جديد</span>
                        <span className="text-[10px] text-slate-400 font-normal">تسجيل مباشر في الشيت</span>
                      </div>
                    </button>

                    {canExport ? (
                      <button
                        onClick={() => {
                          setShowActionsMenu(false);
                          onOpenImportExportModal();
                        }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs rounded-xl transition font-bold text-right cursor-pointer group ${
                          isLight
                            ? 'text-slate-800 hover:bg-slate-50 hover:text-slate-950'
                            : 'text-slate-200 hover:bg-slate-900/60'
                        }`}
                      >
                        <div className="p-1.5 rounded-lg bg-slate-500/20 border border-slate-500/30 text-slate-400 group-hover:scale-105 transition">
                          <CloudUpload className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold">استيراد وتصدير إكسل</span>
                          <span className="text-[10px] text-slate-400/70 font-normal">Excel / CSV سحابي</span>
                        </div>
                      </button>
                    ) : (
                      <div
                        className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs rounded-xl text-right opacity-60 ${
                          isLight ? 'text-slate-500 bg-slate-100' : 'text-slate-300/60 bg-[#000000]'
                        }`}
                        title="خاصية الاستيراد والتصدير معطلة للموظف"
                      >
                        <Lock className="w-3.5 h-3.5 text-[#2A6B5C]" />
                        <span className="text-[11px]">التصدير محظور للموظف</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Trigger Button (انسيابي، عصري وفاخر) */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => {
                  setShowUserMenu(prev => !prev);
                }}
                className={`group relative flex items-center gap-2 sm:gap-2.5 p-1 sm:pl-3.5 sm:pr-2 sm:py-1.5 rounded-2xl transition-all duration-300 shadow-sm border cursor-pointer select-none active:scale-[0.98] ${
                  showUserMenu
                    ? (isLight
                        ? 'bg-[#EAF3F0]/80 border-[#4F9282] ring-2 ring-[#4F9282]/20 shadow-md'
                        : 'bg-[#0A2E1E] border-[#4F9282] ring-2 ring-[#4F9282]/30 shadow-lg shadow-[#2A6B5C]/10')
                    : (isLight
                        ? 'bg-gradient-to-r from-slate-50 to-white hover:from-[#EAF3F0]/40 hover:to-white border-slate-300 hover:border-[#4F9282] hover:shadow-md'
                        : 'bg-gradient-to-r from-[#000000] via-[#08261A] to-[#04140E] hover:from-[#1c1c1e] hover:via-[#092B1D] hover:to-[#000000] border-[#2A6B5C]/40 hover:border-[#4F9282]/80 hover:shadow-lg hover:shadow-[#2A6B5C]/10')
                }`}
                title={`الملف الشخصي: ${currentUser.name} (${currentUser.role === 'ADMIN' ? 'المدير العام' : 'مبيعات'})`}
              >
                {/* Avatar with unread notification badge & live status indicator */}
                <div className="relative shrink-0">
                  <div className="relative rounded-xl overflow-hidden p-0.5 bg-gradient-to-tr from-[#2A6B5C] via-[#A8CCC0] to-[#003F9E] group-hover:scale-105 transition-transform duration-300 shadow-sm">
                    <img
                      src={responsiveUserAvatar.src}
                      srcSet={responsiveUserAvatar.srcSet}
                      sizes="36px"
                      alt={currentUser.name}
                      width={36}
                      height={36}
                      loading="lazy"
                      decoding="async"
                      className="w-8 h-8 sm:w-9 sm:h-9 rounded-[10px] object-cover bg-slate-800 block"
                    />
                  </div>

                  {/* Online status indicator */}
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-slate-500 border-2 border-white dark:border-[#000000] rounded-full shadow-sm"></span>

                  {/* Unread notifications count badge */}
                  {unreadNotificationsCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-600 to-rose-600 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-pulse border-2 border-white shadow-md">
                      {unreadNotificationsCount}
                    </span>
                  )}
                </div>

                {/* User info preview on tablet & desktop */}
                <div className="hidden sm:flex flex-col text-right leading-tight min-w-[70px]">
                  <div className="flex items-center gap-1">
                    <span className={`text-xs font-black truncate max-w-[115px] transition-colors duration-200 ${
                      isLight ? 'text-slate-900 group-hover:text-[#0C2E27]' : 'text-[#D1E4DE] group-hover:text-[#7AB0A0]'
                    }`}>
                      {currentUser.name}
                    </span>
                  </div>
                  <span className={`text-[10px] font-semibold mt-0.5 transition-colors duration-200 ${
                    isLight ? 'text-slate-700' : 'text-slate-300'
                  }`}>
                    {currentUser.role === 'ADMIN' ? '👑 المدير العام' : '💼 مبيعات'}
                  </span>
                </div>

                <div className={`p-1 rounded-lg transition-transform duration-300 ${showUserMenu ? 'rotate-180 bg-[#2A6B5C]/10' : 'group-hover:translate-y-0.5'}`}>
                  <ChevronDown className={`w-3.5 h-3.5 ${isLight ? 'text-slate-600' : 'text-[#7AB0A0]'}`} />
                </div>
              </button>

              {/* Comprehensive User Profile Dropdown Menu */}
              {showUserMenu && (
                <div
                  data-dropdown-container="true"
                  className={`absolute left-0 top-full mt-2 w-80 sm:w-96 rounded-2xl shadow-2xl z-50 overflow-hidden text-right border transition-all animate-in fade-in zoom-in-95 duration-200 ${
                    isLight
                      ? 'bg-white border-slate-200 text-slate-900 shadow-slate-300/80'
                      : 'bg-[#000000] border-[#2A6B5C]/40 text-slate-100 shadow-black/80'
                  }`}
                >
                  {/* 1. Profile Header Card */}
                  <div className={`p-4 border-b flex items-center gap-3.5 relative overflow-hidden ${
                    isLight
                      ? 'bg-gradient-to-r from-slate-50 to-[#EAF3F0]/40 border-slate-200'
                      : 'bg-gradient-to-r from-[#1c1c1e] via-[#08291B] to-[#061E14] border-[#2A6B5C]/20'
                  }`}>
                    {/* Interactive Avatar with Quick Change Overlay */}
                    <div 
                      onClick={handleOpenAvatarModal}
                      className="relative group/avatar cursor-pointer shrink-0"
                      title="انقر لتغيير الصورة الشخصية"
                    >
                      <div className="relative rounded-2xl overflow-hidden p-0.5 bg-gradient-to-tr from-[#2A6B5C] via-[#A8CCC0] to-[#003F9E] shadow-md">
                        <img
                          src={currentUser.avatar || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150'}
                          alt={currentUser.name}
                          width={56}
                          height={56}
                          loading="lazy"
                          decoding="async"
                          className="w-13 h-13 sm:w-14 sm:h-14 rounded-[14px] object-cover bg-slate-800 block group-hover/avatar:brightness-75 transition"
                        />
                      </div>
                      <div className="absolute inset-0 rounded-[14px] bg-black/40 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity">
                        <Camera className="w-5 h-5 text-[#7AB0A0] drop-shadow" />
                      </div>
                      <span className="absolute -bottom-1 -right-1 bg-[#2A6B5C] text-white p-1 rounded-full shadow border-2 border-white dark:border-[#000000]">
                        <Camera className="w-2.5 h-2.5" />
                      </span>
                    </div>

                    <div className="flex-1 overflow-hidden">
                      <div className="flex items-center justify-between gap-1">
                        <p className={`text-sm font-black truncate ${isLight ? 'text-slate-900' : 'text-[#D1E4DE]'}`}>
                          {currentUser.name}
                        </p>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-[#2A6B5C]/20 text-[#2A6B5C] border border-[#2A6B5C]/40 shrink-0">
                          {currentUser.role === 'ADMIN' ? 'المدير العام' : 'مسؤول مبيعات'}
                        </span>
                      </div>
                      <p className={`text-xs font-semibold mt-0.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                        {currentUser.role === 'ADMIN' ? '👑 كامل الصلاحيات الإدارية' : `📍 مشروع: ${currentUser.assignedProject || 'الكل'}`}
                      </p>
                      
                      {/* Change Avatar Direct Trigger Button */}
                      <div className="mt-2 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleOpenAvatarModal}
                          className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border flex items-center gap-1.5 transition cursor-pointer ${
                            isLight
                              ? 'bg-[#D1E4DE]/80 border-[#7AB0A0] text-[#081F1A] hover:bg-[#A8CCC0]'
                              : 'bg-[#2A6B5C]/20 border-[#4F9282]/40 text-[#A8CCC0] hover:bg-[#2A6B5C]/30'
                          }`}
                        >
                          <Camera className="w-3.5 h-3.5 text-[#4F9282]" />
                          <span>تغيير الصورة الشخصية</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 space-y-3 max-h-[75vh] overflow-y-auto">
                    
                    {/* 2. 🌓 Theme Toggle Switch (الوضع النهاري / الليلي) */}
                    <div className={`p-3 rounded-xl border flex items-center justify-between transition ${
                      isLight
                        ? 'bg-slate-50 border-slate-200'
                        : 'bg-[#000000] border-slate-800/70'
                    }`}>
                      <div className="flex items-center gap-2">
                        {isLight ? (
                          <div className="p-2 rounded-lg bg-[#D1E4DE] text-[#081F1A] border border-[#7AB0A0]">
                            <Sun className="w-4 h-4" />
                          </div>
                        ) : (
                          <div className="p-2 rounded-lg bg-slate-950 text-[#7AB0A0] border border-[#2A6B5C]/40">
                            <Moon className="w-4 h-4" />
                          </div>
                        )}
                        <div>
                          <div className="text-xs font-bold">
                            {isLight ? 'الوضع النهاري المضيء' : 'الوضع الليلي الزمردي الداكن'}
                          </div>
                          <div className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                            {isLight ? 'مظهر عالي التباين وواضح' : 'مظهر أنيق ومريح للعين'}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={toggleTheme}
                        className={`px-3 py-1.5 text-xs font-black rounded-lg transition border flex items-center gap-1.5 cursor-pointer ${
                          isLight
                            ? 'bg-slate-900 text-white border-slate-900 hover:bg-slate-800 shadow-sm'
                            : 'bg-[#2A6B5C] text-white border-[#2A6B5C] hover:brightness-110 shadow-md'
                        }`}
                      >
                        {isLight ? (
                          <>
                            <Moon className="w-3.5 h-3.5" />
                            <span>تفعيل الداكن</span>
                          </>
                        ) : (
                          <>
                            <Sun className="w-3.5 h-3.5" />
                            <span>تفعيل النهاري</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* 3. 🔔 Notifications Section (الإشعارات والتنبيهات) */}
                    <div className={`rounded-xl border overflow-hidden transition ${
                      isLight
                        ? 'bg-slate-50 border-slate-200'
                        : 'bg-[#000000] border-slate-800/70'
                    }`}>
                      <div className={`p-2.5 px-3 border-b flex items-center justify-between ${
                        isLight ? 'bg-[#EAF3F0]/80 border-slate-200' : 'bg-[#1c1c1e] border-slate-800/50'
                      }`}>
                        <div className="flex items-center gap-2">
                          <Bell className={`w-4 h-4 ${isLight ? 'text-[#123F36]' : 'text-[#7AB0A0]'}`} />
                          <span className="text-xs font-bold">التنبيهات المباشرة</span>
                          {unreadNotificationsCount > 0 && (
                            <span className="bg-red-600 text-white text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full">
                              {unreadNotificationsCount} جديد
                            </span>
                          )}
                        </div>
                        {unreadNotificationsCount > 0 && (
                          <button
                            onClick={clearAllNotifications}
                            className={`text-[10px] font-bold hover:underline cursor-pointer ${
                              isLight ? 'text-[#0C2E27]' : 'text-[#7AB0A0]'
                            }`}
                          >
                            مسح الكل
                          </button>
                        )}
                      </div>

                      {/* Desktop Browser Notification Quick Bar */}
                      <div className={`p-2.5 px-3 border-b flex items-center justify-between text-xs ${
                        isLight ? 'bg-white border-slate-200' : 'bg-[#000000] border-slate-900/60'
                      }`}>
                        <div className="flex items-center gap-1.5">
                          <BellRing className={`w-3.5 h-3.5 ${browserNotificationSettings.enabled ? 'text-slate-500' : 'text-slate-400'}`} />
                          <span className={`text-[11px] font-bold ${
                            browserNotificationSettings.enabled
                              ? (isLight ? 'text-slate-800' : 'text-slate-300')
                              : (isLight ? 'text-slate-600' : 'text-slate-400')
                          }`}>
                            إشعارات المتصفح (Desktop)
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => triggerTestNotification()}
                            className={`text-[10px] px-2 py-0.5 rounded border font-bold transition cursor-pointer ${
                              isLight
                                ? 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
                                : 'bg-slate-950 border-slate-700/60 text-slate-200 hover:bg-slate-900'
                            }`}
                            title="إرسال تنبيه تجريبي للمتصفح"
                          >
                            اختبار 🔔
                          </button>
                          <button
                            onClick={() => {
                              setShowUserMenu(false);
                              setShowNotificationSettingsModal(true);
                            }}
                            className={`text-[10px] px-2 py-0.5 rounded font-bold transition cursor-pointer ${
                              isLight
                                ? 'bg-slate-800 text-white hover:bg-slate-900'
                                : 'bg-[#2A6B5C] text-white hover:bg-[#7AB0A0]'
                            }`}
                          >
                            إعدادات ⚙️
                          </button>
                        </div>
                      </div>

                      {/* Notifications List */}
                      <div className={`max-h-48 overflow-y-auto divide-y ${
                        isLight ? 'divide-slate-100 bg-white' : 'divide-slate-950/80 bg-[#000000]'
                      }`}>
                        {notifications.length === 0 ? (
                          <div className={`p-4 text-center text-xs ${isLight ? 'text-slate-400' : 'text-slate-400/60'}`}>
                            لا توجد تنبيهات جديدة حالياً
                          </div>
                        ) : (
                          notifications.slice(0, 5).map(n => (
                            <div
                              key={n.id}
                              onClick={() => markNotificationAsRead(n.id)}
                              className={`p-2.5 text-xs transition cursor-pointer flex items-start gap-2 ${
                                isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-900/40'
                              } ${
                                !n.isRead ? (isLight ? 'bg-[#EAF3F0]/70 border-r-2 border-[#2A6B5C]' : 'bg-[#2A6B5C]/10 border-r-2 border-[#2A6B5C]') : ''
                              }`}
                            >
                              <Clock className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${isLight ? 'text-[#1F5447]' : 'text-[#4F9282]'}`} />
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <span className={`font-bold text-[11px] ${isLight ? 'text-slate-900' : 'text-[#A8CCC0]'}`}>{n.title}</span>
                                  <span className={`text-[9px] font-mono ${isLight ? 'text-slate-400' : 'text-slate-400'}`}>{n.timestamp}</span>
                                </div>
                                <p className={`mt-0.5 text-[10px] leading-relaxed line-clamp-2 ${isLight ? 'text-slate-600' : 'text-slate-200/90'}`}>{n.message}</p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Open Full Notification Center Modal */}
                      <div className={`p-2 border-t text-center ${
                        isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#000000] border-slate-950'
                      }`}>
                        <button
                          type="button"
                          onClick={() => {
                            setShowUserMenu(false);
                            setShowNotifications(true);
                          }}
                          className={`w-full py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                            isLight
                              ? 'bg-[#D1E4DE]/70 text-[#041310] hover:bg-[#A8CCC0]/80 border border-[#7AB0A0]'
                              : 'bg-slate-900/60 text-[#7AB0A0] hover:bg-slate-800 border border-slate-700/50'
                          }`}
                        >
                          <Bell className="w-3.5 h-3.5 text-[#2A6B5C]" />
                          <span>فتح مركز الإشعارات بالكامل (Notification Center)</span>
                        </button>
                      </div>
                    </div>

                    {/* 4. Admin Options (Logo and Title Settings) */}
                    {currentUser.role === 'ADMIN' && (
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          handleOpenLogoModal();
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2.5 text-xs rounded-xl transition font-bold border cursor-pointer ${
                          isLight
                            ? 'bg-[#EAF3F0]/80 border-[#A8CCC0] text-[#041310] hover:bg-[#D1E4DE]'
                            : 'bg-[#000000] border-[#2A6B5C]/30 text-[#A8CCC0] hover:bg-[#1c1c1e]'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Image className="w-4 h-4 text-[#2A6B5C]" />
                          <span>تخصيص اللوجو واسم الشركة</span>
                        </div>
                        <span className="text-[10px] opacity-75">تعديل</span>
                      </button>
                    )}

                    {/* 5. 🚪 Logout Button (تسجيل الخروج) */}
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        logoutUser();
                      }}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs text-white bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 rounded-xl transition font-black shadow-md cursor-pointer active:scale-98"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>تسجيل الخروج من الحساب</span>
                    </button>

                  </div>
                </div>
              )}
            </div>

          </div>

        </div>

      </div>

      {/* Logo Customization Modal */}
      {showLogoModal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={e => {
            if (e.target === e.currentTarget) setShowLogoModal(false);
          }}
          data-modal-backdrop="true"
        >
          <div
            ref={logoModalRef}
            role="dialog"
            aria-modal="true"
            data-modal-container="true"
            className="bg-[#2c2c2e] text-slate-100 rounded-2xl max-w-lg w-full p-6 border border-slate-800 shadow-2xl text-right space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-[#4F9282] text-sm sm:text-base flex items-center gap-2">
                <Image className="w-5 h-5 text-[#4F9282]" />
                <span>تخصيص لوجو وهيدر شركة جوهر جروب</span>
              </h3>
              <button
                onClick={() => setShowLogoModal(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            {/* Current Logo Preview Box */}
            <div className="p-4 bg-[#1c1c1e] rounded-xl border border-slate-800 flex flex-col items-center justify-center gap-2">
              <span className="text-[11px] text-slate-400">معاينة الهيدر بالشعار الجديد:</span>
              <Logo size="md" customImage={inputLogoUrl || null} customTitle={inputTitle} customSubtitle={inputSubtitle} />
            </div>

            <form onSubmit={handleSaveLogoSettings} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">اسم الشركة (العنوان الرئيسي بالعربي):</label>
                <input
                  type="text"
                  required
                  value={inputTitle}
                  onChange={e => setInputTitle(e.target.value)}
                  className="w-full p-2.5 bg-[#1c1c1e] border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-[#4F9282]"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">الوصف الفرعي (بالإنجليزي أو العربي):</label>
                <input
                  type="text"
                  required
                  value={inputSubtitle}
                  onChange={e => setInputSubtitle(e.target.value)}
                  className="w-full p-2.5 bg-[#1c1c1e] border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-[#4F9282]"
                />
              </div>

              {/* Preset Logos Select */}
              <div>
                <label className="block text-slate-300 font-bold mb-1.5">نماذج شعارات جاهزة:</label>
                <div className="grid grid-cols-2 gap-2">
                  {PRESET_HEADER_LOGOS.map((preset, idx) => (
                    <button
                      type="button"
                      key={idx}
                      onClick={() => setInputLogoUrl(preset.url || '')}
                      className={`p-2 rounded-lg border text-right transition flex items-center gap-2 ${
                        (preset.url === null && !inputLogoUrl) || (preset.url === inputLogoUrl)
                          ? 'bg-[#4F9282]/20 border-[#4F9282] text-[#7AB0A0]'
                          : 'bg-[#1c1c1e] border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="w-6 h-6 rounded bg-slate-800 flex items-center justify-center shrink-0">
                        {preset.url ? (
                          <img
                            src={preset.url}
                            alt={preset.name}
                            width={24}
                            height={24}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover rounded"
                          />
                        ) : '🏛️'}
                      </div>
                      <span className="text-[11px] font-bold truncate">{preset.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Upload Custom Image or URL */}
              <div className="p-3 bg-[#1c1c1e] rounded-xl border border-slate-800 space-y-2.5">
                <label className="block text-slate-300 font-bold">رفع صورة لوجو مخصصة:</label>
                
                <input
                  type="url"
                  placeholder="رابط صورة مخصص (URL)..."
                  value={inputLogoUrl}
                  onChange={e => setInputLogoUrl(e.target.value)}
                  className="w-full p-2.5 bg-[#2c2c2e] border border-slate-800 rounded-lg text-slate-100 font-mono text-xs focus:outline-none focus:border-[#4F9282]"
                />

                <label className="flex items-center justify-center gap-2 p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg cursor-pointer transition text-xs font-bold border border-slate-700">
                  <Upload className="w-4 h-4 text-[#4F9282]" />
                  <span>اختر ملف صورة من جهازك (PNG / JPG / SVG)</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleLocalLogoUpload} />
                </label>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setInputLogoUrl('');
                    setInputTitle('جوهر جروب للتطوير العقاري');
                    setInputSubtitle('Gohar Group for Real Estate Development');
                  }}
                  className="px-3 py-1.5 text-xs text-[#4F9282] hover:bg-[#041310]/40 rounded flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>استعادة الافتراضي</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowLogoModal(false)}
                    className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#4F9282] text-[#1c1c1e] font-bold rounded-lg hover:bg-[#64B5F6]"
                  >
                    حفظ اللوجو الجديد
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Browser Notification Settings & Test Modal */}
      <BrowserNotificationModal
        isOpen={showNotificationSettingsModal}
        onClose={() => setShowNotificationSettingsModal(false)}
      />

      {/* Avatar Customization Modal (تخصيص وتغيير الصورة الشخصية) */}
      {showAvatarModal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
          onClick={e => {
            if (e.target === e.currentTarget) setShowAvatarModal(false);
          }}
          data-modal-backdrop="true"
        >
          <div
            ref={avatarModalRef}
            role="dialog"
            aria-modal="true"
            data-modal-container="true"
            className={`w-full max-w-xl rounded-2xl p-5 sm:p-6 border shadow-2xl text-right space-y-4 max-h-[90vh] overflow-y-auto ${
              isLight
                ? 'bg-white text-slate-900 border-slate-200 shadow-slate-400/50'
                : 'bg-[#1c1c1e] text-slate-100 border-[#2A6B5C]/40 shadow-black/90'
            }`}
          >
            {/* Modal Title Bar */}
            <div className={`flex items-center justify-between border-b pb-3.5 ${isLight ? 'border-slate-200' : 'border-slate-900/60'}`}>
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-gradient-to-tr from-[#2A6B5C] to-[#A8CCC0] text-gray-950 font-bold shadow-sm">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={`font-black text-sm sm:text-base ${isLight ? 'text-slate-900' : 'text-[#D1E4DE]'}`}>
                    تخصيص الصورة الشخصية
                  </h3>
                  <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-300/80'}`}>
                    اختر من النماذج الاحترافية أو ارفع صورتك الخاصة
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAvatarModal(false)}
                className={`p-1.5 rounded-lg transition ${
                  isLight ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-100' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-950'
                }`}
              >
                ✕
              </button>
            </div>

            {/* Live Real-time Avatar Preview Card */}
            <div className={`p-4 rounded-2xl border flex items-center gap-4 transition ${
              isLight
                ? 'bg-gradient-to-r from-[#EAF3F0]/60 via-slate-50 to-white border-[#A8CCC0]'
                : 'bg-gradient-to-r from-[#000000] via-[#1c1c1e] to-[#000000] border-[#2A6B5C]/30'
            }`}>
              <div className="relative shrink-0">
                <div className="relative rounded-2xl overflow-hidden p-1 bg-gradient-to-tr from-[#2A6B5C] via-[#A8CCC0] to-[#003F9E] shadow-lg">
                  <img
                    src={selectedAvatar || currentUser.avatar || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=250'}
                    alt="معاينة الصورة"
                    width={72}
                    height={72}
                    loading="lazy"
                    decoding="async"
                    className="w-16 h-16 sm:w-18 sm:h-18 rounded-[14px] object-cover bg-slate-800"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=250';
                    }}
                  />
                </div>
                <span className="absolute -bottom-1 -right-1 bg-slate-500 text-white p-1 rounded-full border-2 border-white shadow">
                  <Check className="w-2.5 h-2.5" />
                </span>
              </div>

              <div className="flex-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#2A6B5C]">معاينة البروفايل المباشرة</span>
                <h4 className={`text-base font-black truncate mt-0.5 ${isLight ? 'text-slate-900' : 'text-[#D1E4DE]'}`}>
                  {currentUser.name}
                </h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[11px] px-2 py-0.5 rounded-md font-bold bg-[#2A6B5C]/20 text-[#2A6B5C] border border-[#2A6B5C]/40">
                    {currentUser.role === 'ADMIN' ? 'المدير العام' : 'مسؤول مبيعات'}
                  </span>
                  <span className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-300'}`}>
                    {currentUser.username ? `@${currentUser.username}` : ''}
                  </span>
                </div>
              </div>
            </div>

            {/* Presets Category Filter */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className={`text-xs font-bold ${isLight ? 'text-slate-700' : 'text-slate-200'}`}>
                  نماذج صور شخصية جاهزة:
                </label>
                <div className="flex items-center gap-1">
                  {['الكل', 'رجال', 'سيدات', '3D', 'تصميم'].map((cat) => (
                    <button
                      type="button"
                      key={cat}
                      onClick={() => setAvatarCategory(cat)}
                      className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold transition cursor-pointer ${
                        avatarCategory === cat
                          ? 'bg-[#2A6B5C] text-white shadow-sm'
                          : isLight
                            ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            : 'bg-slate-950 text-slate-300 hover:bg-slate-900'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Avatars Grid */}
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2.5">
                {PRESET_USER_AVATARS.filter(a => avatarCategory === 'الكل' || a.category === avatarCategory).map((avatar) => {
                  const isSelected = selectedAvatar === avatar.url;
                  return (
                    <button
                      type="button"
                      key={avatar.id}
                      onClick={() => {
                        setSelectedAvatar(avatar.url);
                        setCustomAvatarUrlInput('');
                      }}
                      className={`group relative rounded-xl p-1 border transition-all text-center flex flex-col items-center cursor-pointer ${
                        isSelected
                          ? 'bg-[#2A6B5C]/20 border-[#4F9282] ring-2 ring-[#4F9282]/50 scale-105 shadow-md'
                          : isLight
                            ? 'bg-slate-50 border-slate-200 hover:border-[#7AB0A0] hover:bg-[#EAF3F0]/50'
                            : 'bg-[#000000] border-slate-900/60 hover:border-[#4F9282]/50 hover:bg-[#0A2A1E]'
                      }`}
                      title={avatar.title}
                    >
                      <div className="relative w-full aspect-square rounded-lg overflow-hidden mb-1 bg-slate-800">
                        <img
                          src={avatar.url}
                          alt={avatar.title}
                          width={64}
                          height={64}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                        />
                        {isSelected && (
                          <div className="absolute inset-0 bg-[#2A6B5C]/40 flex items-center justify-center">
                            <div className="w-5 h-5 rounded-full bg-white text-gray-950 flex items-center justify-center shadow">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </div>
                          </div>
                        )}
                      </div>
                      <span className={`text-[10px] font-bold truncate w-full px-0.5 ${
                        isSelected ? 'text-[#2A6B5C]' : isLight ? 'text-slate-600' : 'text-slate-300'
                      }`}>
                        {avatar.title}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Upload or Custom URL Section */}
            <div className={`p-3.5 rounded-xl border space-y-3 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#000000] border-slate-900/80'
            }`}>
              <span className={`block text-xs font-bold ${isLight ? 'text-slate-800' : 'text-[#A8CCC0]'}`}>
                أو استخدم صورتك الخاصة:
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Upload from device */}
                <label className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border-2 border-dashed cursor-pointer transition text-center ${
                  isLight
                    ? 'border-slate-300 hover:border-[#2A6B5C] bg-white hover:bg-[#EAF3F0]/30 text-slate-700'
                    : 'border-slate-800/80 hover:border-[#4F9282]/80 bg-[#1c1c1e] hover:bg-[#0D2F22] text-slate-200'
                }`}>
                  <Upload className="w-5 h-5 text-[#2A6B5C]" />
                  <span className="text-xs font-bold">رفع صورة من جهازك</span>
                  <span className="text-[10px] opacity-70">PNG, JPG, WebP حتى 5MB</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLocalAvatarUpload}
                  />
                </label>

                {/* Direct Image URL */}
                <div className="flex flex-col justify-center gap-1.5">
                  <span className="text-[11px] font-bold opacity-80">إدخال رابط صورة خارجي:</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="url"
                      placeholder="https://example.com/photo.jpg"
                      value={customAvatarUrlInput}
                      onChange={e => {
                        setCustomAvatarUrlInput(e.target.value);
                        if (e.target.value.trim()) {
                          setSelectedAvatar(e.target.value.trim());
                        }
                      }}
                      className={`w-full p-2 text-xs rounded-lg border font-mono focus:outline-none focus:border-[#4F9282] ${
                        isLight
                          ? 'bg-white border-slate-300 text-slate-900'
                          : 'bg-[#1c1c1e] border-slate-800 text-slate-100'
                      }`}
                    />
                  </div>
                  <span className="text-[9px] text-slate-400">الصورة تتحدث فور كتابة الرابط</span>
                </div>
              </div>
            </div>

            {/* Modal Action Buttons */}
            <div className={`pt-3 border-t flex items-center justify-between ${
              isLight ? 'border-slate-200' : 'border-slate-900/60'
            }`}>
              <button
                type="button"
                onClick={() => {
                  setSelectedAvatar('https://images.unsplash.com/photo-1560250097-0b93528c311a?w=250');
                  setCustomAvatarUrlInput('');
                }}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                  isLight ? 'text-slate-600 hover:bg-slate-100' : 'text-slate-400 hover:bg-slate-950 hover:text-slate-200'
                }`}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>استعادة الافتراضي</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowAvatarModal(false)}
                  className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
                    isLight
                      ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveAvatar()}
                  className="px-5 py-2 text-xs font-black bg-gradient-to-r from-[#2A6B5C] to-[#0060DF] hover:from-[#5AC8FA] hover:to-[#4F9282] text-gray-950 rounded-xl transition shadow-lg shadow-[#2A6B5C]/20 active:scale-95 cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>حفظ وتطبيق الصورة</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notification Center Modal */}
      <NotificationCenter
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        onOpenSettings={() => setShowNotificationSettingsModal(true)}
      />
    </header>
  );
};
