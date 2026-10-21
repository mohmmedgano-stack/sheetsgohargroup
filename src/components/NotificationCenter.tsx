import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { SystemNotification } from '../types';
import {
  Bell,
  CheckCheck,
  Trash2,
  X,
  Clock,
  ShieldAlert,
  UserCheck,
  Sparkles,
  Search,
  Filter,
  Volume2,
  Settings,
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  Eye,
  EyeOff,
  Inbox,
  AlertCircle,
} from 'lucide-react';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings?: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  isOpen,
  onClose,
  onOpenSettings,
}) => {
  const {
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    clearAllNotifications,
    triggerTestNotification,
    themeMode,
  } = useApp();

  const isLight = themeMode === 'light';
  const [filterTab, setFilterTab] = useState<'ALL' | 'UNREAD' | 'FOLLOWUP' | 'SYSTEM'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const modalRef = useFocusTrap<HTMLDivElement>({
    isActive: isOpen,
    onClose,
  });

  // Filter and search notifications
  const filteredNotifications = useMemo(() => {
    return notifications.filter(n => {
      // 1. Tab filter
      if (filterTab === 'UNREAD' && n.isRead) return false;
      if (filterTab === 'FOLLOWUP' && n.type !== 'followup') return false;
      if (filterTab === 'SYSTEM' && n.type !== 'system' && n.type !== 'security') return false;

      // 2. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = n.title.toLowerCase().includes(q);
        const matchMessage = n.message.toLowerCase().includes(q);
        return matchTitle || matchMessage;
      }

      return true;
    });
  }, [notifications, filterTab, searchQuery]);

  const unreadCount = useMemo(() => {
    return notifications.filter(n => !n.isRead).length;
  }, [notifications]);

  if (!isOpen) return null;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'followup':
        return <Clock className="w-4 h-4 text-[#4F9282]" />;
      case 'security':
        return <ShieldAlert className="w-4 h-4 text-red-400" />;
      case 'assignment':
        return <UserCheck className="w-4 h-4 text-[#4F9282]" />;
      default:
        return <Sparkles className="w-4 h-4 text-slate-400" />;
    }
  };

  const getTypeName = (type: string) => {
    switch (type) {
      case 'followup':
        return 'متابعة عميل';
      case 'security':
        return 'أمان ونشاط';
      case 'assignment':
        return 'توزيع عملاء';
      default:
        return 'إشعار نظام';
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
      data-modal-backdrop="true"
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        data-modal-container="true"
        className={`w-full max-w-2xl rounded-3xl p-5 sm:p-6 border shadow-2xl text-right space-y-4 max-h-[90vh] flex flex-col ${
          isLight
            ? 'bg-white text-slate-900 border-slate-200 shadow-slate-400/50'
            : 'bg-[#1c1c1e] text-slate-100 border-[#2A6B5C]/40 shadow-black/90'
        }`}
      >
        {/* Header Bar */}
        <div className={`flex items-center justify-between border-b pb-3.5 shrink-0 ${
          isLight ? 'border-slate-200' : 'border-slate-900/60'
        }`}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-[#2A6B5C] to-[#A8CCC0] text-gray-950 font-bold shadow-md">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className={`font-black text-base sm:text-lg ${isLight ? 'text-slate-900' : 'text-[#D1E4DE]'}`}>
                  مركز الإشعارات والتنبيهات (Notification Center)
                </h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-red-600 text-white shadow-sm font-mono">
                    {unreadCount} جديد
                  </span>
                )}
              </div>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-300/80'}`}>
                سجل كافة التنبيهات المباشرة، مواعيد الفولو اب، والنشاطات الإدارية
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenSettings && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenSettings();
                }}
                className={`p-2 rounded-xl transition flex items-center gap-1.5 text-xs font-bold ${
                  isLight
                    ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    : 'text-slate-300 hover:text-white hover:bg-slate-900/50'
                }`}
                title="إعدادات نغمات وتنبيهات المتصفح"
              >
                <Settings className="w-4 h-4 text-[#2A6B5C]" />
                <span className="hidden sm:inline">إعدادات النغمات</span>
              </button>
            )}

            <button
              onClick={onClose}
              className={`p-2 rounded-xl transition ${
                isLight
                  ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-950'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search & Filter Tabs */}
        <div className="space-y-3 shrink-0">
          {/* Search Box */}
          <div className="relative">
            <input
              type="text"
              placeholder="بحث في سجل التنبيهات والرسائل..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className={`w-full p-2.5 pr-9 text-xs rounded-xl border focus:outline-none transition ${
                isLight
                  ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-[#2A6B5C] focus:bg-white'
                  : 'bg-[#000000] border-slate-900/80 text-slate-100 focus:border-[#4F9282]'
              }`}
            />
            <Search className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute left-3 top-3 text-slate-400 hover:text-slate-200 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filter Tabs & Quick Actions Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {[
                { id: 'ALL', label: `الكل (${notifications.length})` },
                { id: 'UNREAD', label: `غير المقروء (${unreadCount})` },
                { id: 'FOLLOWUP', label: 'متابعات العملاء ⏰' },
                { id: 'SYSTEM', label: 'النظام والأمان 🛡️' },
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilterTab(tab.id as any)}
                  className={`px-3 py-1.5 rounded-xl font-bold transition text-xs cursor-pointer ${
                    filterTab === tab.id
                      ? isLight
                        ? 'bg-[#1c1c1e] text-[#7AB0A0] shadow-sm'
                        : 'bg-[#2A6B5C] text-white shadow-md font-black'
                      : isLight
                      ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      : 'bg-slate-950 text-slate-300 hover:bg-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllNotificationsAsRead}
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition flex items-center gap-1 cursor-pointer ${
                    isLight
                      ? 'bg-[#EAF3F0] text-[#081F1A] border-[#A8CCC0] hover:bg-[#D1E4DE]'
                      : 'bg-slate-900/60 text-[#7AB0A0] border-slate-700/60 hover:bg-slate-900'
                  }`}
                  title="تحديد كافة التنبيهات كمقروءة"
                >
                  <CheckCheck className="w-3.5 h-3.5 text-[#4F9282]" />
                  <span>تحديد الكل كمقروء</span>
                </button>
              )}

              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('هل تريد مسح سجل التنبيهات بالكامل؟')) {
                      clearAllNotifications();
                    }
                  }}
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition flex items-center gap-1 cursor-pointer ${
                    isLight
                      ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                      : 'bg-rose-950/50 text-rose-300 border-rose-800/60 hover:bg-rose-900'
                  }`}
                  title="مسح كافة التنبيهات"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  <span>مسح السجل</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Notifications Stream List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-0.5">
          {filteredNotifications.length === 0 ? (
            <div className={`p-10 text-center rounded-2xl border ${
              isLight ? 'bg-slate-50 border-slate-200 text-slate-500' : 'bg-[#000000] border-slate-900/60 text-slate-400'
            }`}>
              <Inbox className="w-12 h-12 mx-auto mb-2 text-slate-400 opacity-60" />
              <p className="font-bold text-sm">لا توجد تنبيهات تطابق المعايير</p>
              <p className="text-xs opacity-75 mt-1">ستظهر هنا أي تنبيهات واردة أو مواعيد متابعة مجدولة</p>
            </div>
          ) : (
            filteredNotifications.map(notification => (
              <div
                key={notification.id}
                className={`p-3.5 rounded-2xl border transition-all relative flex items-start gap-3 group ${
                  !notification.isRead
                    ? isLight
                      ? 'bg-[#EAF3F0]/70 border-[#7AB0A0] shadow-sm'
                      : 'bg-gradient-to-r from-[#1c1c1e] via-[#092D1E] to-[#000000] border-[#2A6B5C]/50 shadow-md'
                    : isLight
                    ? 'bg-white border-slate-200 hover:bg-slate-50'
                    : 'bg-[#000000] border-slate-900/50 hover:bg-[#0A261B]'
                }`}
              >
                {/* Type Icon Badge */}
                <div className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
                  !notification.isRead
                    ? 'bg-[#2A6B5C] text-white shadow'
                    : isLight
                    ? 'bg-slate-100 text-slate-600'
                    : 'bg-slate-950 text-slate-300 border border-slate-800/60'
                }`}>
                  {getTypeIcon(notification.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <h4 className={`font-black text-xs sm:text-sm ${
                        !notification.isRead
                          ? isLight ? 'text-slate-900' : 'text-[#A8CCC0]'
                          : isLight ? 'text-slate-800' : 'text-slate-200'
                      }`}>
                        {notification.title}
                      </h4>
                      <span className={`text-[10px] px-2 py-0.2 rounded-full font-bold border ${
                        notification.type === 'followup'
                          ? 'bg-[#2A6B5C]/20 text-[#4F9282] border-[#2A6B5C]/30'
                          : notification.type === 'security'
                          ? 'bg-red-500/20 text-red-400 border-red-500/30'
                          : 'bg-slate-500/20 text-slate-400 border-slate-500/30'
                      }`}>
                        {getTypeName(notification.type)}
                      </span>
                    </div>

                    <span className={`text-[10px] font-mono shrink-0 ${
                      isLight ? 'text-slate-400' : 'text-slate-300/70'
                    }`}>
                      {notification.timestamp}
                    </span>
                  </div>

                  <p className={`text-xs mt-1 leading-relaxed ${
                    !notification.isRead
                      ? isLight ? 'text-slate-800 font-medium' : 'text-slate-100'
                      : isLight ? 'text-slate-600' : 'text-slate-300'
                  }`}>
                    {notification.message}
                  </p>

                  {/* Actions Row */}
                  <div className="mt-2.5 pt-2 border-t border-slate-200/40 dark:border-slate-900/40 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {/* Toggle Read/Unread */}
                      <button
                        type="button"
                        onClick={() => markNotificationAsRead(notification.id)}
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-md transition flex items-center gap-1 cursor-pointer ${
                          !notification.isRead
                            ? isLight
                              ? 'bg-slate-100 text-slate-900 hover:bg-slate-200'
                              : 'bg-slate-800 text-slate-100 hover:bg-slate-700'
                            : isLight
                            ? 'text-slate-500 hover:text-slate-800'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-slate-500" />
                        <span>{notification.isRead ? 'مقروء' : 'تحديد كمقروء'}</span>
                      </button>
                    </div>

                    {/* Dismiss / Delete Button */}
                    <button
                      type="button"
                      onClick={() => deleteNotification(notification.id)}
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-md transition flex items-center gap-1 cursor-pointer ${
                        isLight
                          ? 'text-rose-600 hover:bg-rose-50'
                          : 'text-rose-400 hover:bg-rose-950/60'
                      }`}
                      title="تجاهل وحذف هذا الإشعار"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>تجاهل الإشعار</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer info & Test trigger */}
        <div className={`pt-3 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shrink-0 ${
          isLight ? 'border-slate-200' : 'border-slate-900/60'
        }`}>
          <div className="flex items-center gap-2 text-xs">
            <Volume2 className="w-4 h-4 text-[#2A6B5C]" />
            <span className={`text-[11px] ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
              نظام التنبيهات المباشر يعمل تلقائياً مع مواعيد المتابعات المجدولة
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={triggerTestNotification}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center gap-1.5 ${
                isLight
                  ? 'bg-slate-100 border-slate-300 text-slate-800 hover:bg-slate-200'
                  : 'bg-slate-950 border-slate-800 text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Bell className="w-3.5 h-3.5 text-[#4F9282]" />
              <span>إرسال تنبيه تجريبي</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-1.5 text-xs font-black bg-gradient-to-r from-[#2A6B5C] to-[#0060DF] hover:brightness-110 text-gray-950 rounded-xl transition shadow cursor-pointer"
            >
              إغلاق
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
