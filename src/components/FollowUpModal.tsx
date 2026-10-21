import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { ClientLead } from '../types';
import { Calendar, Clock, CheckCircle, X, Sparkles, BellRing, Bell, FastForward, RotateCcw } from 'lucide-react';
import { getNotificationPermission, requestNotificationPermission } from '../services/notificationService';
import { toLocalDateStr } from '../utils/dates';

interface FollowUpModalProps {
  client: ClientLead | null;
  onClose: () => void;
}

export const FollowUpModal: React.FC<FollowUpModalProps> = ({ client, onClose }) => {
  const { scheduleFollowUp, themeMode, browserNotificationSettings, updateBrowserNotificationSettings } = useApp();

  const [date, setDate] = useState('');
  const [time, setTime] = useState('12:00');
  const [notes, setNotes] = useState('');
  const [permissionGranted, setPermissionGranted] = useState<boolean>(true);

  useEffect(() => {
    setPermissionGranted(getNotificationPermission() === 'granted');
  }, [client]);

  useEffect(() => {
    if (client) {
      // Default to tomorrow if not set
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const defaultDateStr = toLocalDateStr(tomorrow);

      setDate(client.followUpDate || defaultDateStr);
      setTime(client.followUpTime || '14:00');
      setNotes('');
    }
  }, [client]);

  const modalRef = useFocusTrap<HTMLDivElement>({
    isActive: Boolean(client),
    onClose,
  });

  if (!client) return null;

  const isLight = themeMode === 'light';

  const handleRequestPerm = async () => {
    const granted = await requestNotificationPermission();
    setPermissionGranted(granted);
    if (granted) {
      updateBrowserNotificationSettings({ enabled: true });
    }
  };

  // Quick postponement helpers
  const handleQuickPostpone = (hoursOffset: number, daysOffset: number, customTime?: string) => {
    const target = new Date();
    if (daysOffset > 0) {
      target.setDate(target.getDate() + daysOffset);
    }
    if (hoursOffset > 0) {
      target.setHours(target.getHours() + hoursOffset);
    }

    const year = target.getFullYear();
    const month = String(target.getMonth() + 1).padStart(2, '0');
    const day = String(target.getDate()).padStart(2, '0');
    setDate(`${year}-${month}-${day}`);

    if (customTime) {
      setTime(customTime);
    } else {
      const h = String(target.getHours()).padStart(2, '0');
      const m = String(target.getMinutes()).padStart(2, '0');
      setTime(`${h}:${m}`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) return;

    scheduleFollowUp(client.id, date, time, notes);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4"
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
        className={`rounded-3xl max-w-md w-full p-6 border-2 shadow-2xl text-right space-y-4 ${
          isLight
            ? 'bg-white border-[#4F9282] text-slate-900'
            : 'bg-[#1c1c1e] border-[#2A6B5C] text-slate-100'
        }`}
      >
        
        {/* Header */}
        <div className={`flex items-center justify-between border-b pb-3 ${isLight ? 'border-slate-200' : 'border-[#2A6B5C]/20'}`}>
          <div className="flex items-center gap-2">
            <div className={`p-2.5 rounded-xl ${isLight ? 'bg-[#D1E4DE] text-[#081F1A]' : 'bg-slate-950 text-[#4F9282] border border-[#2A6B5C]/30'}`}>
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`font-black text-base ${isLight ? 'text-slate-900' : 'text-[#A8CCC0]'}`}>
                تحديد / تأجيل ميعاد الفولو اب (Follow-Up)
              </h3>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-200/80'}`}>
                للتواصل مع العميل: {client.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition ${isLight ? 'hover:bg-slate-100 text-slate-400' : 'hover:bg-slate-900 text-slate-300'}`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Client Details Summary */}
        <div className={`p-3 rounded-2xl border text-xs space-y-1 ${
          isLight
            ? 'bg-slate-50/80 border-slate-200 text-slate-950'
            : 'bg-[#000000] border-slate-800/40 text-slate-200'
        }`}>
          <p><strong>رقم العميل:</strong> <span className="font-mono dir-ltr inline-block font-bold">{client.phone}</span></p>
          <p><strong>المشروع:</strong> {client.projectName}</p>
        </div>

        {/* Quick Postpone Pills (خاصية تأجيل المتابعة السريعة) */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-[#7AB0A0] flex items-center gap-1">
            <FastForward className="w-3.5 h-3.5 text-[#2A6B5C]" />
            <span>تأجيل سريع بضغطة زر واحدة (Quick Postpone):</span>
          </label>
          <div className="grid grid-cols-3 gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => handleQuickPostpone(1, 0)}
              className="p-2 rounded-xl bg-black/20 hover:bg-[#2A6B5C]/30 border border-white/10 text-[11px] font-bold transition text-center"
            >
              ⏱️ بعد ساعة
            </button>
            <button
              type="button"
              onClick={() => handleQuickPostpone(2, 0)}
              className="p-2 rounded-xl bg-black/20 hover:bg-[#2A6B5C]/30 border border-white/10 text-[11px] font-bold transition text-center"
            >
              ⏳ بعد ساعتين
            </button>
            <button
              type="button"
              onClick={() => handleQuickPostpone(0, 1, '11:00')}
              className="p-2 rounded-xl bg-black/20 hover:bg-[#2A6B5C]/30 border border-white/10 text-[11px] font-bold transition text-center"
            >
              ☀️ غداً صباحاً
            </button>
            <button
              type="button"
              onClick={() => handleQuickPostpone(0, 1, '18:00')}
              className="p-2 rounded-xl bg-black/20 hover:bg-[#2A6B5C]/30 border border-white/10 text-[11px] font-bold transition text-center"
            >
              🌙 غداً مساءً
            </button>
            <button
              type="button"
              onClick={() => handleQuickPostpone(0, 3, '13:00')}
              className="p-2 rounded-xl bg-black/20 hover:bg-[#2A6B5C]/30 border border-white/10 text-[11px] font-bold transition text-center"
            >
              📅 بعد 3 أيام
            </button>
            <button
              type="button"
              onClick={() => handleQuickPostpone(0, 7, '12:00')}
              className="p-2 rounded-xl bg-black/20 hover:bg-[#2A6B5C]/30 border border-white/10 text-[11px] font-bold transition text-center"
            >
              🗓️ الأسبوع القادم
            </button>
          </div>
        </div>

        {/* Notification Status Alert Notice */}
        <div className={`p-2.5 px-3 rounded-2xl border flex items-center justify-between text-xs ${
          isLight
            ? 'bg-[#EAF3F0] border-[#A8CCC0] text-[#081F1A]'
            : 'bg-[#000000] border-[#2A6B5C]/30 text-[#A8CCC0]'
        }`}>
          <div className="flex items-center gap-2">
            <BellRing className="w-4 h-4 text-[#4F9282] shrink-0 animate-pulse" />
            <span className="text-[11px] leading-tight">
              ستصلك تنبيهات المتصفح مع نغمة صوتية عند اقتراب هذا الموعد 🔔
            </span>
          </div>
          {!permissionGranted && (
            <button
              type="button"
              onClick={handleRequestPerm}
              className="text-[10px] px-2.5 py-1 bg-[#2A6B5C] text-white font-bold rounded-lg hover:bg-[#4F9282] shrink-0"
            >
              تفعيل الإشعار
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={`block font-bold mb-1 ${isLight ? 'text-slate-700' : 'text-slate-100'}`}>تاريخ المتابعة:</label>
              <input
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className={`w-full p-2.5 rounded-xl border transition focus:outline-none focus:ring-2 focus:ring-[#2A6B5C] ${
                  isLight
                    ? 'bg-slate-50 border-slate-300 text-slate-900'
                    : 'bg-[#000000] border-[#2A6B5C]/30 text-white'
                }`}
              />
            </div>

            <div>
              <label className={`block font-bold mb-1 ${isLight ? 'text-slate-700' : 'text-slate-100'}`}>وقت المتابعة:</label>
              <input
                type="time"
                required
                value={time}
                onChange={e => setTime(e.target.value)}
                className={`w-full p-2.5 rounded-xl border transition focus:outline-none focus:ring-2 focus:ring-[#2A6B5C] ${
                  isLight
                    ? 'bg-slate-50 border-slate-300 text-slate-900'
                    : 'bg-[#000000] border-[#2A6B5C]/30 text-white'
                }`}
              />
            </div>
          </div>

          <div>
            <label className={`block font-bold mb-1 ${isLight ? 'text-slate-700' : 'text-slate-100'}`}>ملاحظات الكول / سبب الفولو اب:</label>
            <textarea
              rows={2}
              placeholder="مثال: طلب تفاصيل الأسعار ونظام السداد لمشروع Wada Bay رأس الحكمة..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className={`w-full p-2.5 rounded-xl border transition focus:outline-none focus:ring-2 focus:ring-[#2A6B5C] ${
                isLight
                  ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                  : 'bg-[#000000] border-[#2A6B5C]/30 text-white placeholder-slate-200/50'
              }`}
            />
          </div>

          <div className={`pt-3 border-t flex items-center justify-end gap-2 ${isLight ? 'border-slate-200' : 'border-[#2A6B5C]/20'}`}>
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-xl transition ${
                isLight
                  ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  : 'bg-slate-950/60 text-slate-200 hover:bg-slate-900'
              }`}
            >
              إلغاء
            </button>
            <button
              type="submit"
              className={`px-6 py-2.5 font-bold rounded-xl shadow-md transition ${
                isLight
                  ? 'bg-[#1c1c1e] text-[#A8CCC0] hover:bg-[#000000]'
                  : 'bg-[#2A6B5C] text-white hover:bg-[#7AB0A0]'
              }`}
            >
              تأكيد وحفظ الموعد ✅
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
