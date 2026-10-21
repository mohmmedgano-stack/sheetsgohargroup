import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { ClientLead, CallStatus } from '../types';
import {
  PhoneCall,
  CheckCircle2,
  X,
  Mic,
  MicOff,
  Clock,
  Calendar,
  Sparkles,
  MessageSquare,
  AlertCircle,
  PhoneOff,
  UserX,
  FileCheck,
  Send,
} from 'lucide-react';
import { toLocalDateStr } from '../utils/dates';

interface CallReasonModalProps {
  isOpen: boolean;
  client: ClientLead | null;
  selectedStatus: CallStatus | null;
  onClose: () => void;
  onConfirm: (status: CallStatus, reason: string, followUpDate?: string, followUpTime?: string, isVoice?: boolean) => void;
}

const PRESET_REASONS: Record<CallStatus, string[]> = {
  'مهتم': [
    'طلب إرسال البروشور والمساحات والأسعار عبر الواتساب فوراً',
    'مهتم بشراء وحدة كاش ويريد معرفة نسبة الخصم المتاحة',
    'حدد موعد لزيارة مقر الشركة ومعاينة الموقع يوم الجمعة القادم',
    'طلب جدول أقساط 7 سنوات لمشروع Wada Bay رأس الحكمة',
    'مهتم بالاستثمار في الوحدات الطبية بمشروع Health Capital',
  ],
  'هرجع اكلمه تاني': [
    'في اجتماع حالياً وطلب إعادة الاتصال بعد الساعة 6 مساءً',
    'طلب التواصل غداً لمناقشة العرض مع شريكه في العمل',
    'مسافر خارج مصر وسيعود الأسبوع القادم للمتابعة',
    'طلب إرسال التفاصيل أولاً على الواتساب ثم الاتصال به لاحقاً',
    'طلب مهلة 48 ساعة لدراسة الميزانية ونظام السداد',
  ],
  'مشغول دلوقتي': [
    'يقود السيارة وطلب معاودة الاتصال لاحقاً اليوم',
    'في العمل وطلب عدم الاتصال في أوقات الدوام الرسمي',
    'مشغول حالياً وطلب التواصل عبر رسائل الواتساب فقط',
  ],
  'غير متاح': [
    'الهاتف يرن ولكن لا توجد شبكة جيدة / الشبكة تقطع',
    'الرقم يعطي رسالة غير متاح مؤقتاً',
    'خارج نطاق الخدمة، ستتم إعادة المحاولة بعد ساعة',
  ],
  'مغلق': [
    'الهاتف مغلق تماماً، تمت جدولة إعادة الاتصال غداً',
    'الهاتف مغلق منذ محاولتين سابقتين',
    'الهاتف مغلق، تم إرسال رسالة ترحيبية على الواتساب',
  ],
  'مش بيرد': [
    'تم الاتصال ورن جرس كامل 3 مرات متتالية دون رد',
    'رن ومردش، تم إرسال رسالة واتساب للتعريف بالمشروع',
    'تم الاتصال في فترات مختلفة من اليوم دون استجابة',
  ],
  'الرقم مقفول': [
    'الرقم مقفول أو بيرن على رسالة غير متاح',
    'الرقم مقفول، تمت جدولة إعادة المحاولة لاحقاً',
    'الرقم مقفول من أكثر من محاولة',
  ],
  'الرقم غلط': [
    'الرقم غير صحيح أو ليس مسجلاً باسم العميل المطلوب',
    'رد شخص آخر وأفاد بأنه لا يعرف صاحب الطلب',
    'الرقم غير موجود بالخدمة أو تم تغييره',
  ],
  'قفل الخط في وشي': [
    'أغلق المكالمة فور سماع اسم الشركة بدون توضيح السبب',
    'رفض التحدث وأغلق الخط بأسلوب حاد',
    'أغلق الخط مباشرة بعد فتح المكالمة',
  ],
  'مش مهتم': [
    'غير مهتم بالاستثمار العقاري في الوقت الحالي',
    'اشترى وحدة بالفعل في مشروع آخر بالساحل الشمالي',
    'الميزانية غير مناسبة ونظام السداد لا يلبي احتياجاته',
    'سجل بالخطأ في إعلانات الفيسبوك ولا يرغب في الشراء',
  ],
  'متعاقد': [
    'تم حجز الوحدة وسداد دفعة جدية الحجز بالمقر',
    'تم توقيع استمارة الحجز وجاري تجهيز العقد النهائي',
    'تم الاتفاق على نظام السداد وتحديد موعد توقيع العقود',
  ],
  'جديد': [
    'تم تسجيل العميل حديثاً وفي انتظار أول مكالمة ترحيبية',
  ],
};

const STATUS_BADGE_STYLES: Record<CallStatus, { bg: string; text: string; border: string }> = {
  'مهتم': { bg: 'bg-slate-500/20', text: 'text-slate-400', border: 'border-slate-500/50' },
  'هرجع اكلمه تاني': { bg: 'bg-[#2A6B5C]/20', text: 'text-[#4F9282]', border: 'border-[#2A6B5C]/50' },
  'مشغول دلوقتي': { bg: 'bg-[#2A6B5C]/20', text: 'text-[#4F9282]', border: 'border-[#2A6B5C]/50' },
  'غير متاح': { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/50' },
  'مغلق': { bg: 'bg-slate-500/20', text: 'text-slate-300', border: 'border-slate-500/50' },
  'مش بيرد': { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/50' },
  'الرقم مقفول': { bg: 'bg-rose-500/20', text: 'text-rose-400', border: 'border-rose-500/50' },
  'الرقم غلط': { bg: 'bg-rose-500/20', text: 'text-rose-400', border: 'border-rose-500/50' },
  'قفل الخط في وشي': { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/50' },
  'مش مهتم': { bg: 'bg-red-900/30', text: 'text-red-300', border: 'border-red-800/60' },
  'متعاقد': { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/50' },
  'جديد': { bg: 'bg-cyan-500/20', text: 'text-cyan-400', border: 'border-cyan-500/50' },
};

export const CallReasonModal: React.FC<CallReasonModalProps> = ({
  isOpen,
  client,
  selectedStatus,
  onClose,
  onConfirm,
}) => {
  const { themeMode } = useApp();
  const isLight = themeMode === 'light';

  const [reason, setReason] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpTime, setFollowUpTime] = useState('12:00');
  const [isRecording, setIsRecording] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [recognitionInstance, setRecognitionInstance] = useState<any>(null);

  useEffect(() => {
    if (isOpen && selectedStatus) {
      setReason('');
      
      // Auto pre-populate tomorrow's date if callback or interested
      if (selectedStatus === 'هرجع اكلمه تاني' || selectedStatus === 'مهتم') {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        setFollowUpDate(toLocalDateStr(tomorrow));
        setFollowUpTime('14:00');
      } else {
        setFollowUpDate('');
        setFollowUpTime('');
      }

      // Check Speech Recognition API
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        setSpeechSupported(true);
        const recognizer = new SpeechRecognition();
        recognizer.lang = 'ar-EG';
        recognizer.continuous = true;
        recognizer.interimResults = true;

        recognizer.onresult = (event: any) => {
          let transcript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              transcript += event.results[i][0].transcript;
            }
          }
          if (transcript) {
            setReason(prev => (prev ? `${prev} ${transcript.trim()}` : transcript.trim()));
          }
        };

        recognizer.onerror = () => {
          setIsRecording(false);
        };

        recognizer.onend = () => {
          setIsRecording(false);
        };

        setRecognitionInstance(recognizer);
      }
    }
  }, [isOpen, selectedStatus]);

  const modalRef = useFocusTrap<HTMLDivElement>({
    isActive: isOpen && Boolean(client) && Boolean(selectedStatus),
    onClose,
  });

  if (!isOpen || !client || !selectedStatus) return null;

  const toggleVoiceRecording = () => {
    if (!recognitionInstance) return;

    if (isRecording) {
      recognitionInstance.stop();
      setIsRecording(false);
    } else {
      try {
        recognitionInstance.start();
        setIsRecording(true);
      } catch (err) {
        console.error('Speech recognition error:', err);
      }
    }
  };

  const handleSelectPreset = (presetText: string) => {
    setReason(presetText);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isRecording && recognitionInstance) {
      recognitionInstance.stop();
    }
    const finalReason = reason.trim() || `تم تحديث الحالة إلى "${selectedStatus}" بواسطة الموظف`;
    onConfirm(selectedStatus, finalReason, followUpDate || undefined, followUpTime || undefined, isRecording);
    onClose();
  };

  const statusStyle = STATUS_BADGE_STYLES[selectedStatus] || STATUS_BADGE_STYLES['جديد'];
  const presets = PRESET_REASONS[selectedStatus] || [];
  const needsFollowUpSchedule = selectedStatus === 'هرجع اكلمه تاني' || selectedStatus === 'مهتم';

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
        className={`relative w-full max-w-lg rounded-3xl border-2 shadow-2xl overflow-hidden transition-all max-h-[90vh] flex flex-col ${
          isLight
            ? 'bg-white border-[#4F9282]/60 text-slate-900 shadow-slate-400/50'
            : 'bg-[#000000] border-[#2A6B5C]/60 text-slate-100 shadow-2xl'
        }`}
      >
        
        {/* Header */}
        <div className={`p-5 border-b flex items-center justify-between shrink-0 ${
          isLight
            ? 'bg-gradient-to-r from-[#EAF3F0] to-slate-50 border-slate-200'
            : 'bg-gradient-to-r from-[#1c1c1e] to-[#000000] border-[#2A6B5C]/30'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-2xl border ${statusStyle.bg} ${statusStyle.border} ${statusStyle.text}`}>
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className={`text-base font-extrabold ${isLight ? 'text-[#1c1c1e]' : 'text-[#7AB0A0]'}`}>
                  تدوين سبب وتفاصيل المكالمة
                </h3>
                <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                  {selectedStatus}
                </span>
              </div>
              <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-600' : 'text-slate-200/80'}`}>
                العميل: <strong className="text-[#4F9282] font-bold">{client.name}</strong> | المشروع: {client.projectName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-xl transition ${isLight ? 'hover:bg-slate-200 text-slate-500' : 'hover:bg-slate-900 text-slate-300'}`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
          
          {/* Client Quick Card */}
          <div className={`p-3 rounded-2xl border flex flex-wrap justify-between items-center gap-2 text-xs ${
            isLight
              ? 'bg-[#EAF3F0]/70 border-[#A8CCC0] text-[#041310]'
              : 'bg-[#000000] border-[#2A6B5C]/20 text-[#A8CCC0]'
          }`}>
            <span><strong>رقم الهاتف:</strong> <span className="font-mono dir-ltr inline-block font-bold">{client.phone}</span></span>
            <span><strong>المصدر:</strong> {client.source}</span>
            <span><strong>المسؤول:</strong> {client.assignedUserName}</span>
          </div>

          {/* Quick Preset Reason Chips */}
          {presets.length > 0 && (
            <div className="space-y-1.5">
              <label className={`block font-bold text-xs flex items-center gap-1.5 ${isLight ? 'text-slate-700' : 'text-slate-200'}`}>
                <Sparkles className="w-3.5 h-3.5 text-[#4F9282]" />
                <span>أسباب سريعة مقترحة (اضغط لاختيار فوري):</span>
              </label>
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1">
                {presets.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-medium text-right transition ${
                      reason === preset
                        ? isLight
                          ? 'bg-[#1c1c1e] text-[#7AB0A0] border-[#1c1c1e] font-bold shadow-sm'
                          : 'bg-[#2A6B5C] text-white border-[#7AB0A0] font-bold shadow-md'
                        : isLight
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                        : 'bg-[#1c1c1e]/80 hover:bg-[#1c1c1e] text-slate-100 border-slate-800/80'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Reason Text Area with Voice Speech-to-Text Button */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className={`font-bold text-xs ${isLight ? 'text-slate-800' : 'text-slate-100'}`}>
                اكتب تفاصيل الكومنت أو سبب الحالة (يظهر للمدير العام ومدير المبيعات):
              </label>
              {speechSupported && (
                <button
                  type="button"
                  onClick={toggleVoiceRecording}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-xl font-bold transition text-[11px] ${
                    isRecording
                      ? 'bg-red-600 text-white animate-pulse shadow-lg'
                      : isLight
                      ? 'bg-[#D1E4DE] text-[#081F1A] hover:bg-[#A8CCC0] border border-[#7AB0A0]'
                      : 'bg-slate-950 text-[#7AB0A0] hover:bg-slate-900 border border-[#2A6B5C]/40'
                  }`}
                  title="تسجيل الملاحظة صوتياً وتحويلها لنص عربي فوري"
                >
                  {isRecording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5 text-[#4F9282]" />}
                  <span>{isRecording ? 'إيقاف التسجيل...' : 'تسجيل صوتي 🎙️'}</span>
                </button>
              )}
            </div>

            <textarea
              rows={3}
              required
              placeholder="اكتب هنا سبب تغيير الحالة وتفاصيل ما دار في المكالمة بدقة..."
              value={reason}
              onChange={e => setReason(e.target.value)}
              className={`w-full p-3 rounded-2xl border text-xs font-medium transition focus:outline-none focus:ring-2 focus:ring-[#2A6B5C] ${
                isLight
                  ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                  : 'bg-[#000000] border-[#2A6B5C]/30 text-white placeholder-slate-300/40'
              }`}
            />
          </div>

          {/* Follow-Up Date & Time (Conditional for Callback / Interested) */}
          {needsFollowUpSchedule && (
            <div className={`p-3.5 rounded-2xl border space-y-3 ${
              isLight
                ? 'bg-[#EAF3F0]/70 border-[#A8CCC0] text-[#041310]'
                : 'bg-[#1c1c1e]/60 border-[#2A6B5C]/30 text-[#D1E4DE]'
            }`}>
              <div className="flex items-center gap-2 font-bold text-xs text-[#4F9282]">
                <Clock className="w-4 h-4" />
                <span>تحديد موعد الفولو اب القادم:</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold mb-1 opacity-90">تاريخ المتابعة:</label>
                  <input
                    type="date"
                    value={followUpDate}
                    onChange={e => setFollowUpDate(e.target.value)}
                    className={`w-full p-2 rounded-xl border text-xs ${
                      isLight
                        ? 'bg-white border-slate-300 text-slate-900'
                        : 'bg-[#000000] border-[#2A6B5C]/30 text-white'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold mb-1 opacity-90">وقت المتابعة:</label>
                  <input
                    type="time"
                    value={followUpTime}
                    onChange={e => setFollowUpTime(e.target.value)}
                    className={`w-full p-2 rounded-xl border text-xs ${
                      isLight
                        ? 'bg-white border-slate-300 text-slate-900'
                        : 'bg-[#000000] border-[#2A6B5C]/30 text-white'
                    }`}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className={`pt-3 border-t flex items-center justify-end gap-2 shrink-0 ${
            isLight ? 'border-slate-200' : 'border-[#2A6B5C]/20'
          }`}>
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2.5 rounded-xl font-bold transition ${
                isLight
                  ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  : 'bg-slate-950/80 text-slate-200 hover:bg-slate-900'
              }`}
            >
              إلغاء
            </button>
            <button
              type="submit"
              className={`px-6 py-2.5 font-black rounded-xl shadow-lg transition flex items-center gap-2 ${
                isLight
                  ? 'bg-[#1c1c1e] text-[#A8CCC0] hover:bg-[#000000]'
                  : 'bg-[#2A6B5C] text-white hover:bg-[#7AB0A0]'
              }`}
            >
              <Send className="w-4 h-4 rotate-180" />
              <span>حفظ وتحديث الحالة مع الكومنت</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
