import React, { useState, Suspense, lazy, useMemo, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ClientLead } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { MobileBottomNav } from './components/MobileBottomNav';
import { AppStartupScreen } from './components/AppStartupScreen';
import { OfflineBanner } from './components/OfflineBanner';
import { SaveStatusToast } from './components/SaveStatusToast';
import { DuplicateToast } from './components/DuplicateToast';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import {
  SpreadsheetSkeleton,
  AdminSkeleton,
  ProjectsSkeleton,
  DefaultViewSkeleton,
} from './components/ViewSkeletons';

// Code-split dynamic views and modals with webpackPrefetch for instant mobile tab switching
const SpreadsheetView = lazy(() => import(/* webpackPrefetch: true */ './components/SpreadsheetView').then(m => ({ default: m.SpreadsheetView })));
const ActivityCalendar = lazy(() => import('./components/activity/ActivityCalendar').then(m => ({ default: m.ActivityCalendar })));
const AdminDashboard = lazy(() => import(/* webpackPrefetch: true */ './components/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const UserManagement = lazy(() => import(/* webpackPrefetch: true */ './components/UserManagement').then(m => ({ default: m.UserManagement })));
const ProjectManagement = lazy(() => import(/* webpackPrefetch: true */ './components/ProjectManagement').then(m => ({ default: m.ProjectManagement })));
const FollowUpSchedule = lazy(() => import(/* webpackPrefetch: true */ './components/FollowUpSchedule').then(m => ({ default: m.FollowUpSchedule })));
const CloudSyncView = lazy(() => import(/* webpackPrefetch: true */ './components/CloudSyncView').then(m => ({ default: m.CloudSyncView })));
const FollowUpModal = lazy(() => import(/* webpackPrefetch: true */ './components/FollowUpModal').then(m => ({ default: m.FollowUpModal })));
const AddClientModal = lazy(() => import(/* webpackPrefetch: true */ './components/AddClientModal').then(m => ({ default: m.AddClientModal })));
const ImportExportModal = lazy(() => import(/* webpackPrefetch: true */ './components/ImportExportModal').then(m => ({ default: m.ImportExportModal })));
const HistoryModal = lazy(() => import(/* webpackPrefetch: true */ './components/HistoryModal').then(m => ({ default: m.HistoryModal })));
const LoginModal = lazy(() => import(/* webpackPrefetch: true */ './components/LoginModal').then(m => ({ default: m.LoginModal })));
const LoginPage = lazy(() => import(/* webpackPrefetch: true */ './components/LoginPage').then(m => ({ default: m.LoginPage })));
const FollowUpPrintReportModal = lazy(() => import(/* webpackPrefetch: true */ './components/FollowUpPrintReportModal').then(m => ({ default: m.FollowUpPrintReportModal })));
const NotificationCenter = lazy(() => import(/* webpackPrefetch: true */ './components/NotificationCenter').then(m => ({ default: m.NotificationCenter })));

// React.memo optimizations on core structural components to minimize mobile re-render passes
const MemoizedHeader = React.memo(Header);
const MemoizedMobileBottomNav = React.memo(MobileBottomNav);
const MemoizedOfflineBanner = React.memo(OfflineBanner);
const MemoizedAppStartupScreen = React.memo(AppStartupScreen);

interface AppFooterProps {
  isLight: boolean;
}

const AppFooter = React.memo<AppFooterProps>(({ isLight }) => (
  <footer className={`border-t py-3.5 px-4 text-center text-xs transition-colors ${
    isLight ? 'bg-white border-slate-200 text-slate-500' : 'bg-[#080B10] border-slate-800/80 text-slate-400'
  }`}>
    <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-slate-500 animate-pulse"></span>
        <span>
          جميع الحقوق محفوظة © {new Date().getFullYear()} - <strong className={isLight ? 'text-slate-800' : 'text-slate-200'}>شركة جوهر جروب للتطوير العقاري (Gohar Group)</strong>
        </span>
      </div>
      <div className="flex items-center gap-3 text-[11px]">
        <span className="text-[#4F9282] font-bold">
          نظام إدارة الشيتات المباشرة والأمان السحابي
        </span>
      </div>
    </div>
  </footer>
));

const MainContent: React.FC = () => {
  const { currentUser, isAuthenticated, themeMode } = useApp();

  // Startup verification & self-check state
  const [isStartupReady, setIsStartupReady] = useState<boolean>(() => {
    return typeof window !== 'undefined' && sessionStorage.getItem('gohar_startup_ready') === 'true';
  });

  // Online / Offline connectivity detection and recovery
  const { isOnline, isReconnecting, checkServerHealth } = useOnlineStatus();

  // Navigation tab state
  const [activeTab, setActiveTab] = useState<'sheet' | 'dashboard' | 'archive' | 'followups' | 'users' | 'projects' | 'cloud'>('sheet');
  const [searchTerm, setSearchTerm] = useState('');
  const [isWidescreen] = useState<boolean>(() => {
    return typeof window !== 'undefined' && localStorage.getItem('gohar_widescreen_mode') === 'true';
  });

  // Modals state
  const [followUpClient, setFollowUpClient] = useState<ClientLead | null>(null);
  const [historyClient, setHistoryClient] = useState<ClientLead | null>(null);
  const [isAddClientOpen, setIsAddClientOpen] = useState(false);
  const [isImportExportOpen, setIsImportExportOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isPrintReportOpen, setIsPrintReportOpen] = useState(false);
  const [printReportKey, setPrintReportKey] = useState(0);
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);
  const [sharedContact, setSharedContact] = useState<{ name: string; phone: string } | null>(null);

  // Detect a contact shared in from WhatsApp/phone (via the share-target route),
  // pre-fill the Add Client form with it, then clean the URL.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedName = params.get('shared_name');
    const sharedPhone = params.get('shared_phone');
    if (sharedName || sharedPhone) {
      setSharedContact({ name: sharedName || '', phone: sharedPhone || '' });
      setIsAddClientOpen(true);
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, '', cleanUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // High-performance actions object using useMemo instead of scattered duplicate useCallbacks
  // Drastically cuts memory allocations and prevents garbage collection overhead on low-end mobile devices
  const actions = useMemo(() => ({
    handleStartupReady: () => {
      setIsStartupReady(true);
      try {
        sessionStorage.setItem('gohar_startup_ready', 'true');
      } catch {}
    },
    closeAllModals: () => {
      setFollowUpClient(null);
      setHistoryClient(null);
      setIsAddClientOpen(false);
      setIsImportExportOpen(false);
      setIsLoginOpen(false);
      setIsPrintReportOpen(false);
      setIsNotificationCenterOpen(false);
    },
    openAddClient: () => {
      setFollowUpClient(null);
      setHistoryClient(null);
      setIsImportExportOpen(false);
      setIsLoginOpen(false);
      setIsPrintReportOpen(false);
      setIsNotificationCenterOpen(false);
      setIsAddClientOpen(true);
    },
    openLogin: () => {
      setFollowUpClient(null);
      setHistoryClient(null);
      setIsAddClientOpen(false);
      setIsImportExportOpen(false);
      setIsPrintReportOpen(false);
      setIsNotificationCenterOpen(false);
      setIsLoginOpen(true);
    },
    openImportExport: () => {
      setFollowUpClient(null);
      setHistoryClient(null);
      setIsAddClientOpen(false);
      setIsLoginOpen(false);
      setIsPrintReportOpen(false);
      setIsNotificationCenterOpen(false);
      setIsImportExportOpen(true);
    },
    openPrintReport: () => {
      setFollowUpClient(null);
      setHistoryClient(null);
      setIsAddClientOpen(false);
      setIsImportExportOpen(false);
      setIsLoginOpen(false);
      setIsNotificationCenterOpen(false);
      setIsPrintReportOpen(true);
    },
    closePrintReport: () => {
      setIsPrintReportOpen(false);
    },
    selectFollowUp: (client: ClientLead) => {
      setFollowUpClient(client);
      setHistoryClient(null);
      setIsAddClientOpen(false);
      setIsImportExportOpen(false);
      setIsLoginOpen(false);
      setIsPrintReportOpen(false);
      setIsNotificationCenterOpen(false);
    },
    openHistory: (client: ClientLead) => {
      setHistoryClient(client);
      setFollowUpClient(null);
      setIsAddClientOpen(false);
      setIsImportExportOpen(false);
      setIsLoginOpen(false);
      setIsPrintReportOpen(false);
      setIsNotificationCenterOpen(false);
    },
    changeTab: (tab: 'sheet' | 'dashboard' | 'archive' | 'followups' | 'users' | 'projects' | 'cloud') => {
      setFollowUpClient(null);
      setHistoryClient(null);
      setIsAddClientOpen(false);
      setIsImportExportOpen(false);
      setIsLoginOpen(false);
      setIsPrintReportOpen(false);
      setIsNotificationCenterOpen(false);
      setActiveTab(tab);
    },
    openNotificationCenter: () => {
      setIsNotificationCenterOpen(true);
    },
    closeNotificationCenter: () => {
      setIsNotificationCenterOpen(false);
    },
    retryPrintReport: () => {
      setPrintReportKey(k => k + 1);
    },
  }), []);

  // Background idle prefetcher for lazy components: guarantees instant page readiness on mobile
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const prefetchViews = () => {
      try {
        import(/* webpackPrefetch: true */ './components/SpreadsheetView');
        import(/* webpackPrefetch: true */ './components/FollowUpSchedule');
        import(/* webpackPrefetch: true */ './components/ProjectManagement');
        import(/* webpackPrefetch: true */ './components/CloudSyncView');
        import(/* webpackPrefetch: true */ './components/AdminDashboard');
        import(/* webpackPrefetch: true */ './components/UserManagement');
        import(/* webpackPrefetch: true */ './components/AddClientModal');
      } catch {}
    };

    if ('requestIdleCallback' in window) {
      const id = (window as Window & { requestIdleCallback: (cb: IdleRequestCallback, opts?: IdleRequestOptions) => number }).requestIdleCallback(prefetchViews, { timeout: 2000 });
      return () => {
        if ('cancelIdleCallback' in window) {
          (window as Window & { cancelIdleCallback: (id: number) => void }).cancelIdleCallback(id);
        }
      };
    } else {
      const timer = setTimeout(prefetchViews, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  // Global click listener to automatically close modals when clicking outside
  useEffect(() => {
    const hasActiveModal = Boolean(
      isAddClientOpen ||
      isImportExportOpen ||
      isLoginOpen ||
      isPrintReportOpen ||
      followUpClient ||
      historyClient
    );

    if (!hasActiveModal) return;

    const handleGlobalClick = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Element | null;
      if (!target) return;

      const isInsideModal = target.closest('[data-modal-container="true"]');
      const isInsideDropdown = target.closest('[data-dropdown-container="true"]');

      if (!isInsideModal && !isInsideDropdown) {
        actions.closeAllModals();
      }
    };

    document.addEventListener('mousedown', handleGlobalClick);
    document.addEventListener('touchstart', handleGlobalClick);

    return () => {
      document.removeEventListener('mousedown', handleGlobalClick);
      document.removeEventListener('touchstart', handleGlobalClick);
    };
  }, [isAddClientOpen, isImportExportOpen, isLoginOpen, isPrintReportOpen, followUpClient, historyClient, actions]);

  // Keyboard Escape listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        actions.closeAllModals();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [actions]);

  if (!isStartupReady) {
    return <MemoizedAppStartupScreen onReady={actions.handleStartupReady} />;
  }

  if (!isAuthenticated) {
    return (
      <Suspense fallback={<DefaultViewSkeleton label="جاري تحميل بوابة تسجيل الدخول..." />}>
        <LoginPage />
        <MemoizedOfflineBanner
          isOnline={isOnline}
          isReconnecting={isReconnecting}
          onRetry={checkServerHealth}
        />
      </Suspense>
    );
  }

  const isLight = themeMode === 'light';

  return (
    <div className={`min-h-screen flex flex-col font-sans dir-rtl transition-colors duration-200 ${
      isLight ? 'bg-slate-50 text-slate-900' : 'bg-[#0B0F15] text-slate-100'
    }`}>
      
      {/* Top Main Navigation Header */}
      <MemoizedHeader
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        activeTab={activeTab}
        setActiveTab={actions.changeTab}
        onOpenAddClient={actions.openAddClient}
        onOpenLoginModal={actions.openLogin}
        onOpenImportExportModal={actions.openImportExport}
      />

      {/* Main View Area with Mobile Safe Padding */}
      <main className={`flex-1 w-full mx-auto p-2.5 sm:p-4 lg:p-6 transition-all duration-300 pb-28 lg:pb-6 ${
        isWidescreen ? 'max-w-[98%]' : 'max-w-7xl'
      }`}>
        <AnimatePresence mode="wait">
          {activeTab === 'sheet' && (
            <motion.div
              key="sheet"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
            >
              <Suspense fallback={<SpreadsheetSkeleton />}>
                <SpreadsheetView
                  searchTerm={searchTerm}
                  onSearchChange={setSearchTerm}
                  onOpenAddClient={actions.openAddClient}
                  onSelectClientForFollowUp={actions.selectFollowUp}
                  onOpenHistoryModal={actions.openHistory}
                  onOpenImportExportModal={actions.openImportExport}
                  onOpenArchive={() => actions.changeTab('archive')}
                />
              </Suspense>
            </motion.div>
          )}

          {activeTab === 'archive' && (
            <motion.div
              key="archive"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
            >
              <Suspense fallback={<DefaultViewSkeleton label="جاري تحميل التقويم..." />}>
                <ActivityCalendar onOpenHistory={actions.openHistory} />
              </Suspense>
            </motion.div>
          )}

          {activeTab === 'dashboard' && (currentUser.role === 'ADMIN' || currentUser.role === 'SALES_MANAGER') && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
            >
              <Suspense fallback={<AdminSkeleton />}>
                <AdminDashboard onOpenHistoryModal={actions.openHistory} />
              </Suspense>
            </motion.div>
          )}

          {activeTab === 'users' && (currentUser.role === 'ADMIN' || currentUser.role === 'SALES_MANAGER') && (
            <motion.div
              key="users"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
            >
              <Suspense fallback={<AdminSkeleton />}>
                <UserManagement />
              </Suspense>
            </motion.div>
          )}

          {activeTab === 'projects' && (
            <motion.div
              key="projects"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
            >
              <Suspense fallback={<ProjectsSkeleton />}>
                <ProjectManagement />
              </Suspense>
            </motion.div>
          )}

          {activeTab === 'followups' && (
            <motion.div
              key="followups"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
            >
              <Suspense fallback={<DefaultViewSkeleton label="جاري تحميل جدول مواعيد ومتابعات اليوم..." />}>
                <FollowUpSchedule
                  onSelectClientForFollowUp={actions.selectFollowUp}
                  onOpenHistoryModal={actions.openHistory}
                />
              </Suspense>
            </motion.div>
          )}

          {activeTab === 'cloud' && (
            <motion.div
              key="cloud"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
            >
              <Suspense fallback={<DefaultViewSkeleton label="جاري فحص المزامنة السحابية..." />}>
                <CloudSyncView />
              </Suspense>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <AppFooter isLight={isLight} />

      {/* Native-feel Mobile Bottom Navigation */}
      <MemoizedMobileBottomNav
        activeTab={activeTab}
        setActiveTab={actions.changeTab}
        onOpenAddClient={actions.openAddClient}
        onOpenImportExport={actions.openImportExport}
        onOpenNotificationCenter={actions.openNotificationCenter}
      />

      {/* Mobile Notification Center */}
      {isNotificationCenterOpen && (
        <Suspense fallback={null}>
          <NotificationCenter
            isOpen={isNotificationCenterOpen}
            onClose={actions.closeNotificationCenter}
          />
        </Suspense>
      )}

      {/* Modals rendered on-demand with Suspense */}
      {followUpClient && (
        <Suspense fallback={null}>
          <FollowUpModal
            client={followUpClient}
            onClose={actions.closeAllModals}
          />
        </Suspense>
      )}

      {isAddClientOpen && (
        <Suspense fallback={null}>
          <AddClientModal
            isOpen={isAddClientOpen}
            onClose={() => { actions.closeAllModals(); setSharedContact(null); }}
            initialName={sharedContact?.name}
            initialPhone={sharedContact?.phone}
          />
        </Suspense>
      )}

      {isImportExportOpen && (
        <Suspense fallback={null}>
          <ImportExportModal
            isOpen={isImportExportOpen}
            onClose={actions.closeAllModals}
          />
        </Suspense>
      )}

      {historyClient && (
        <Suspense fallback={null}>
          <HistoryModal
            client={historyClient}
            onClose={actions.closeAllModals}
          />
        </Suspense>
      )}

      {isLoginOpen && (
        <Suspense fallback={null}>
          <LoginModal
            isOpen={isLoginOpen}
            onClose={actions.closeAllModals}
          />
        </Suspense>
      )}

      {/* FollowUpPrintReportModal guarded with a dedicated ErrorBoundary */}
      {isPrintReportOpen && (
        <ErrorBoundary
          key={printReportKey}
          isModal={true}
          fallbackTitle="تنبيه في تقرير المتابعات والطباعة"
          fallbackMessage="تعذر تحميل نافذة تقرير المتابعات. يمكنك الضغط على 'إعادة المحاولة' لإعادة تحميل المكون دون إغلاق المودال، أو إغلاق النافذة."
          onReset={actions.closePrintReport}
          onRetry={actions.retryPrintReport}
        >
          <Suspense fallback={null}>
            <FollowUpPrintReportModal
              isOpen={isPrintReportOpen}
              onClose={actions.closePrintReport}
            />
          </Suspense>
        </ErrorBoundary>
      )}

      {/* Real-time Offline Detection & Auto-Recovery Status Banner */}
      <MemoizedOfflineBanner
        isOnline={isOnline}
        isReconnecting={isReconnecting}
        onRetry={checkServerHealth}
      />

      <SaveStatusToast />
      <DuplicateToast />

    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <MainContent />
      </AppProvider>
    </ErrorBoundary>
  );
}
