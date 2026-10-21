import React, { useState, useEffect } from 'react';
import { useFocusTrap } from '../hooks/useFocusTrap';
import {
  Bell,
  BellRing,
  Volume2,
  VolumeX,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Sparkles,
  ShieldCheck,
  Zap,
  Info,
  X,
  Play,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  getNotificationPermission,
  requestNotificationPermission,
  sendBrowserNotification,
  playNotificationChime,
} from '../services/notificationService';

interface BrowserNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BrowserNotificationModal: React.FC<BrowserNotificationModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    browserNotificationSettings,
    updateBrowserNotificationSettings,
    themeMode,
  } = useApp();

  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission | 'unsupported'>('default');
  const [testSent, setTestSent] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setPermissionStatus(getNotificationPermission());
    }
  }, [isOpen]);

  const modalRef = useFocusTrap<HTMLDivElement>({
    isActive: isOpen,
    onClose,
  });

  if (!isOpen) return null;

  const isLight = themeMode === 'light';

  const handleRequestPermission = async () => {
    const granted = await requestNotificationPermission();
    const currentPerm = getNotificationPermission();
    setPermissionStatus(currentPerm);

    if (granted) {
      updateBrowserNotificationSettings({ enabled: true });
      sendBrowserNotification('🎉 تم تفعيل إشعارات جوهر جروب بنجاح!', {
        body: 'ستصلك الآن تنبيهات سطح المكتب عند اقتراب مواعيد المتابعات والاتصالات الهامة مع العملاء.',
        soundEnabled: browserNotificationSettings.soundEnabled,
      });
    }
  };

  const handleSendTestNotification = () => {
    if (permissionStatus !== 'granted') {
      handleRequestPermission();
      return;
    }

    sendBrowserNotification('🔔 إشعار تجريبي: متابعة عميل مهم', {
      body: 'المشروع: Wada Bay رأس الحكمة | الموعد: بعد 15 دقيقة\nالعميل: م. أحمد رضوان | الهاتف: 01023456789',
      soundEnabled: browserNotificationSettings.soundEnabled,
      chimeTone: browserNotificationSettings.chimeTone || 'gold',
      chimeVolume: browserNotificationSettings.chimeVolume || 'soft',
    });

    if (browserNotificationSettings.soundEnabled) {
      playNotificationChime(
        browserNotificationSettings.chimeTone || 'gold',
        browserNotificationSettings.chimeVolume || 'soft'
      );
    }

    setTestSent(true);
    setTimeout(() => setTestSent(false), 3000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in"
      dir="rtl"
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
        className={`relative w-full max-w-lg rounded-3xl border-2 shadow-2xl overflow-hidden transition-all ${
          isLight
            ? 'bg-white border-[#4F9282]/50 text-slate-900 shadow-slate-400/50'
            : 'bg-[#1c1c1e] border-[#2A6B5C]/60 text-slate-100 shadow-2xl'
        }`}
      >
        
        {/* Modal Header */}
        <div className={`p-5 border-b flex items-center justify-between ${
          isLight
            ? 'bg-gradient-to-r from-[#EAF3F0] to-slate-50 border-slate-200'
            : 'bg-gradient-to-r from-[#000000] to-[#000000] border-[#2A6B5C]/30'
        }`}>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-[#2A6B5C] to-[#2A6B5C] text-gray-950 rounded-2xl shadow-lg">
              <BellRing className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className={`text-base sm:text-lg font-black ${isLight ? 'text-[#1c1c1e]' : 'text-[#7AB0A0]'}`}>
                إعدادات إشعارات المتصفح الفورية (Desktop Alerts)
              </h3>
              <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-200'}`}>
                تنبيهات سطح المكتب الحية لمواعيد الفولو اب والمتابعات حتى عند إغلاق النافذة
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-xl transition ${
              isLight
                ? 'hover:bg-slate-200 text-slate-600'
                : 'hover:bg-slate-900/60 text-slate-300 hover:text-white'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          
          {/* Permission Status Banner */}
          <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            permissionStatus === 'granted'
              ? isLight
                ? 'bg-slate-50 border-slate-300 text-slate-950'
                : 'bg-slate-950/60 border-slate-500/50 text-slate-200'
              : permissionStatus === 'denied'
              ? isLight
                ? 'bg-red-50 border-red-300 text-red-950'
                : 'bg-red-950/60 border-red-500/50 text-red-200'
              : isLight
              ? 'bg-[#EAF3F0] border-[#7AB0A0] text-[#041310]'
              : 'bg-[#041310]/50 border-[#2A6B5C]/50 text-[#A8CCC0]'
          }`}>
            <div className="flex items-center gap-3">
              {permissionStatus === 'granted' ? (
                <CheckCircle2 className="w-6 h-6 text-slate-500 shrink-0" />
              ) : permissionStatus === 'denied' ? (
                <XCircle className="w-6 h-6 text-red-500 shrink-0" />
              ) : (
                <AlertTriangle className="w-6 h-6 text-[#2A6B5C] shrink-0" />
              )}
              <div>
                <span className="text-xs font-bold block">
                  {permissionStatus === 'granted'
                    ? 'إشعارات المتصفح مفعلة وتعمل بكفاءة ✅'
                    : permissionStatus === 'denied'
                    ? 'تم حظر الإشعارات من إعدادات المتصفح ❌'
                    : 'في انتظار السماح بإشعارات المتصفح ⚠️'}
                </span>
                <span className="text-[11px] opacity-80 block mt-0.5">
                  {permissionStatus === 'granted'
                    ? 'سيقوم النظام بتنبيهك بصوت وإشعار سطح المكتب عند اقتراب أي مكالمة مجدولة.'
                    : permissionStatus === 'denied'
                    ? 'يرجى النقر على أيقونة القفل بجانب شريط العنوان وتفعيل (Notifications / الإشعارات).'
                    : 'اضغط على زر التفعيل أدناه لتلقي التنبيهات المباشرة فوراً.'}
                </span>
              </div>
            </div>

            {permissionStatus !== 'granted' && (
              <button
                onClick={handleRequestPermission}
                className="px-4 py-2 bg-gradient-to-r from-[#2A6B5C] to-[#2A6B5C] hover:from-[#4F9282] hover:to-[#1F5447] text-gray-950 text-xs font-black rounded-xl shadow-lg transition shrink-0 cursor-pointer"
              >
                تفعيل الإشعارات الآن 🔔
              </button>
            )}
          </div>

          {/* Master Enable/Disable Switch */}
          <div className={`p-4 rounded-2xl border flex items-center justify-between ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#000000] border-slate-800/40'
          }`}>
            <div className="flex items-center gap-3">
              <Zap className={`w-5 h-5 ${browserNotificationSettings.enabled ? 'text-[#4F9282]' : 'text-gray-400'}`} />
              <div>
                <span className="text-xs font-bold block">تفعيل التنبيهات التلقائية المباشرة</span>
                <span className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-300/70'}`}>
                  فحص المواعيد تلقائياً كل 30 ثانية وإرسال إشعار سطح المكتب
                </span>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={browserNotificationSettings.enabled}
                onChange={e => {
                  if (e.target.checked && permissionStatus !== 'granted') {
                    handleRequestPermission();
                  } else {
                    updateBrowserNotificationSettings({ enabled: e.target.checked });
                  }
                }}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-600"></div>
            </label>
          </div>

          {/* Reminder Timing Threshold */}
          <div className={`p-4 rounded-2xl border space-y-2.5 ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#000000] border-slate-800/40'
          }`}>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#2A6B5C]" />
              <span className="text-xs font-bold">وقت إرسال التنبيه قبل الموعد:</span>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { value: 0, label: 'عند الموعد تماماً (0 دقيقة)' },
                { value: 15, label: 'قبل 15 دقيقة (موصى به)' },
                { value: 30, label: 'قبل 30 دقيقة' },
                { value: 60, label: 'قبل ساعة كاملة' },
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => updateBrowserNotificationSettings({ advanceMinutes: opt.value })}
                  className={`p-2.5 rounded-xl text-xs font-bold transition border cursor-pointer text-center ${
                    browserNotificationSettings.advanceMinutes === opt.value
                      ? isLight
                        ? 'bg-[#1c1c1e] text-[#7AB0A0] border-[#1c1c1e] shadow-sm'
                        : 'bg-[#2A6B5C] text-white border-[#2A6B5C] shadow-md'
                      : isLight
                      ? 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      : 'bg-[#1c1c1e]/60 text-slate-200 border-slate-800/40 hover:bg-[#1c1c1e]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sound Alert Configuration Box */}
          <div className={`p-4 rounded-2xl border space-y-4 ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#000000] border-slate-800/40'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {browserNotificationSettings.soundEnabled ? (
                  <Volume2 className="w-5 h-5 text-[#4F9282]" />
                ) : (
                  <VolumeX className="w-5 h-5 text-gray-400" />
                )}
                <div>
                  <span className="text-xs font-bold block">التنبيه الصوتي الخفيف لمواعيد المتابعة</span>
                  <span className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-300/70'}`}>
                    عزف رنين خفيف عند ظهور الإشعار لزيادة الانتباه للمهام العاجلة
                  </span>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={browserNotificationSettings.soundEnabled}
                  onChange={e => updateBrowserNotificationSettings({ soundEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-600"></div>
              </label>
            </div>

            {/* Sound Style and Volume Controls when sound enabled */}
            {browserNotificationSettings.soundEnabled && (
              <div className={`pt-3 border-t space-y-3.5 ${
                isLight ? 'border-slate-200' : 'border-slate-800/60'
              }`}>
                {/* Chime Tones */}
                <div>
                  <label className={`block text-[11px] font-bold mb-2 flex items-center justify-between ${
                    isLight ? 'text-slate-700' : 'text-slate-300'
                  }`}>
                    <span>اختر نغمة التنبيه المفضلة:</span>
                    <span className="text-[10px] text-[#2A6B5C] font-normal">اضغط على النغمة لتجربتها فوراً</span>
                  </label>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      { id: 'gold', name: 'رنين ذهبي ملكي', desc: 'نغمات متناسقة صاعدة', icon: '✨' },
                      { id: 'crystal', name: 'بلور كريستالي لطيف', desc: 'رنين ناعم وواضح', icon: '💎' },
                      { id: 'dingdong', name: 'دينج دونج عصري', desc: 'جرس ثنائي كلاسيكي مريح', icon: '🔔' },
                      { id: 'harp', name: 'هارب هادئ متدرج', desc: 'نغمات وترية هادئة', icon: '🎵' },
                    ].map(t => {
                      const isSelected = (browserNotificationSettings.chimeTone || 'gold') === t.id;
                      return (
                        <div
                          key={t.id}
                          onClick={() => {
                            updateBrowserNotificationSettings({ chimeTone: t.id as any });
                            playNotificationChime(t.id as any, browserNotificationSettings.chimeVolume || 'soft');
                          }}
                          className={`p-2.5 rounded-xl border transition flex items-center justify-between gap-2 cursor-pointer ${
                            isSelected
                              ? isLight
                                ? 'bg-[#D1E4DE]/80 border-[#4F9282] text-slate-900 shadow-sm'
                                : 'bg-[#1c1c1e] border-[#2A6B5C] text-[#A8CCC0] shadow-md ring-1 ring-[#4F9282]/40'
                              : isLight
                              ? 'bg-white border-slate-200 hover:bg-slate-100 text-slate-700'
                              : 'bg-[#1c1c1e]/40 border-slate-900/60 hover:bg-[#1c1c1e]/80 text-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-base">{t.icon}</span>
                            <div>
                              <span className="text-xs font-bold block">{t.name}</span>
                              <span className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-300/70'}`}>
                                {t.desc}
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              updateBrowserNotificationSettings({ chimeTone: t.id as any });
                              playNotificationChime(t.id as any, browserNotificationSettings.chimeVolume || 'soft');
                            }}
                            className={`p-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1 transition shrink-0 ${
                              isSelected
                                ? 'bg-[#2A6B5C] text-white shadow'
                                : isLight
                                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                : 'bg-slate-900/70 hover:bg-slate-800 text-[#7AB0A0]'
                            }`}
                            title="تجربة الاستماع"
                          >
                            <Play className="w-2.5 h-2.5 fill-current" />
                            <span>استماع</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Volume Level Selector */}
                <div>
                  <label className={`block text-[11px] font-bold mb-1.5 ${
                    isLight ? 'text-slate-700' : 'text-slate-300'
                  }`}>
                    مستوى ارتفاع الصوت:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'soft', label: 'خفيف وهادئ (موصى به)', badge: 'Soft' },
                      { id: 'medium', label: 'متوسط وواضح', badge: 'Medium' },
                      { id: 'high', label: 'مرتفع للتنبيه القوي', badge: 'High' },
                    ].map(v => {
                      const isSelected = (browserNotificationSettings.chimeVolume || 'soft') === v.id;
                      return (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => {
                            updateBrowserNotificationSettings({ chimeVolume: v.id as any });
                            playNotificationChime(browserNotificationSettings.chimeTone || 'gold', v.id as any);
                          }}
                          className={`p-2 rounded-xl text-xs font-bold transition border cursor-pointer text-center ${
                            isSelected
                              ? isLight
                                ? 'bg-[#1c1c1e] text-[#7AB0A0] border-[#1c1c1e] shadow-sm'
                                : 'bg-[#2A6B5C] text-white border-[#2A6B5C] shadow'
                              : isLight
                              ? 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                              : 'bg-[#1c1c1e]/50 text-slate-200 border-slate-800/40 hover:bg-[#1c1c1e]'
                          }`}
                        >
                          <span className="block text-[11px]">{v.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Overdue Alerts Switch */}
          <div className={`p-4 rounded-2xl border flex items-center justify-between ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#000000] border-slate-800/40'
          }`}>
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-400" />
              <div>
                <span className="text-xs font-bold block">تنبيهات المتابعات المتأخرة والحرجة (Overdue Radar)</span>
                <span className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-300/70'}`}>
                  إرسال إشعار في حال فات ميعاد الاتصال المحدد مع العميل
                </span>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={browserNotificationSettings.notifyOnOverdue}
                onChange={e => updateBrowserNotificationSettings({ notifyOnOverdue: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-600"></div>
            </label>
          </div>

          {/* Test Notification Action */}
          <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            isLight ? 'bg-[#EAF3F0]/70 border-[#A8CCC0]' : 'bg-gradient-to-r from-[#000000] to-[#000000] border-[#2A6B5C]/30'
          }`}>
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-5 h-5 text-[#2A6B5C]" />
              <div>
                <span className="text-xs font-bold block">تجربة إشعار سطح المكتب الآن</span>
                <span className={`text-[11px] ${isLight ? 'text-slate-600' : 'text-slate-300/80'}`}>
                  اضغط لإرسال إشعار حقيقي وعزف النغمة للتحقق من جاهزية جهازك
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSendTestNotification}
              className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer shadow-md ${
                testSent
                  ? 'bg-slate-600 text-white'
                  : 'bg-[#2A6B5C] hover:bg-[#7AB0A0] text-white'
              }`}
            >
              {testSent ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>تم إرسال الإشعار بنجاح!</span>
                </>
              ) : (
                <>
                  <Bell className="w-4 h-4" />
                  <span>إرسال إشعار تجريبي 🔔</span>
                </>
              )}
            </button>
          </div>

        </div>

        {/* Modal Footer */}
        <div className={`p-4 border-t flex items-center justify-between ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#000000] border-[#2A6B5C]/30'
        }`}>
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <ShieldCheck className="w-4 h-4" />
            <span>نظام إشعارات محمي ومخصص لشركة جوهر جروب</span>
          </div>

          <button
            onClick={onClose}
            className="px-6 py-2 bg-[#2A6B5C] hover:bg-[#7AB0A0] text-white text-xs font-bold rounded-xl shadow-lg transition cursor-pointer"
          >
            حفظ وإغلاق
          </button>
        </div>

      </div>
    </div>
  );
};
