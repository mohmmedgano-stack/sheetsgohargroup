import React, { useState, useEffect } from 'react';
import { ClientLead, CallStatus } from '../types';
import { useApp } from '../context/AppContext';
import { useFocusTrap } from '../hooks/useFocusTrap';
import {
  History,
  X,
  Phone,
  User,
  Calendar,
  Clock,
  Sparkles,
  Mic,
  MicOff,
  Send,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  MapPin,
} from 'lucide-react';

interface HistoryModalProps {
  client: ClientLead | null;
  onClose: () => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({ client, onClose }) => {
  const { updateClientStatusWithReason, currentUser, themeMode } = useApp();
  const isLight = themeMode === 'light';

  const [newNote, setNewNote] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<CallStatus>('مهتم');
  const [isRecording, setIsRecording] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [recognitionInstance, setRecognitionInstance] = useState<any>(null);

  useEffect(() => {
    if (client) {
      setSelectedStatus(client.status || 'مهتم');
      setNewNote('');
    }
  }, [client]);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechSupported(false);
    }
  }, []);

  const startVoiceRecording = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('متصفحك لا يدعم تحويل الصوت إلى نص مباشرة. يرجى استخدام متصفح Google Chrome.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'ar-EG';
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript.trim()) {
          setNewNote(prev => (prev ? `${prev} ${transcript.trim()}` : transcript.trim()));
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.start();
      setRecognitionInstance(recognition);
    } catch (e) {
      console.error('Speech recognition failed to start:', e);
      setIsRecording(false);
    }
  };

  const stopVoiceRecording = () => {
    if (recognitionInstance) {
      recognitionInstance.stop();
      setIsRecording(false);
    }
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!client || !newNote.trim()) return;

    updateClientStatusWithReason(
      client.id,
      selectedStatus,
      newNote.trim(),
      client.followUpDate,
      client.followUpTime,
      isRecording
    );

    setNewNote('');
    if (isRecording) {
      stopVoiceRecording();
    }
  };

  const modalRef = useFocusTrap<HTMLDivElement>({
    isActive: Boolean(client),
    onClose,
  });

  if (!client) return null;

  const history = client.notesHistory || [];

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
        className={`relative w-full max-w-2xl rounded-3xl border-2 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col ${
          isLight ? 'bg-white border-[#4F9282] text-slate-900' : 'bg-[#000000] border-[#2A6B5C] text-slate-100'
        }`}
      >
        
        {/* Modal Header */}
        <div className={`p-5 border-b flex items-center justify-between shrink-0 ${
          isLight ? 'bg-gradient-to-r from-[#EAF3F0] to-slate-50' : 'bg-[#1c1c1e]'
        }`}>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-[#2A6B5C] to-[#2A6B5C] text-gray-950 rounded-2xl shadow">
              <History className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-base text-[#7AB0A0]">
                سجل رحلة وتفاعلات العميل (Interactive Timeline)
              </h3>
              <p className="text-xs text-slate-200/80">
                تتبع التغيرات الزمنية في حالة العميل وملاحظات المكالمات
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-black/30 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Client Profile Header Badge */}
        <div className={`p-4 border-b shrink-0 flex flex-wrap items-center justify-between gap-3 text-xs ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#000000] border-[#2A6B5C]/20'
        }`}>
          <div>
            <div className="font-extrabold text-sm text-[#4F9282] flex items-center gap-1.5">
              <User className="w-4 h-4" />
              <span>{client.name}</span>
            </div>
            <div className="font-mono text-[11px] opacity-80 mt-0.5">{client.phone}</div>
          </div>

          <div className="flex flex-wrap gap-2 text-[11px]">
            <span className="px-2.5 py-1 rounded-xl bg-[#2A6B5C]/20 text-[#7AB0A0] border border-[#2A6B5C]/40 font-bold">
              المشروع: {client.projectName}
            </span>
            <span className="px-2.5 py-1 rounded-xl bg-slate-500/20 text-slate-300 border border-slate-500/40 font-bold">
              الحالة الحالية: {client.status}
            </span>
            <span className="px-2.5 py-1 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold">
              المسؤول: {client.assignedUserName}
            </span>
          </div>
        </div>

        {/* Modal Body: Timeline & Add Note */}
        <div className="p-5 space-y-6 overflow-y-auto flex-1 text-xs">
          
          {/* Interactive Visual Timeline */}
          <div>
            <h4 className="font-bold text-xs text-[#7AB0A0] flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-[#2A6B5C]" />
              <span>رحلة وتاريخ العميل مع الفريق ({history.length} تفاعل مسجل):</span>
            </h4>

            {history.length === 0 ? (
              <div className={`p-6 rounded-2xl border text-center space-y-2 ${
                isLight ? 'bg-slate-50 border-slate-200 text-slate-500' : 'bg-black/20 border-white/10 text-slate-200/70'
              }`}>
                <p className="font-medium">الملاحظات الحالية المسجلة:</p>
                <p className="font-bold text-[#7AB0A0] text-sm">{client.notes || 'لا توجد ملاحظات سابقة مدونة'}</p>
                <p className="text-[11px] opacity-75">سيتم توثيق كل مكالمة وتغيير حالة في خط زمني تفاعلي هنا.</p>
              </div>
            ) : (
              <div className="relative pr-4 space-y-4 before:absolute before:top-2 before:bottom-2 before:right-1.5 before:w-0.5 before:bg-gradient-to-b before:from-[#4F9282] before:via-slate-400 before:to-transparent">
                {history.map((item, idx) => (
                  <div key={item.id || idx} className="relative group">
                    {/* Timeline Node Icon */}
                    <div className="absolute -right-4 top-1.5 w-3 h-3 rounded-full bg-[#2A6B5C] ring-4 ring-[#000000] shadow" />

                    <div className={`p-3.5 rounded-2xl border transition shadow-md space-y-2 ${
                      isLight
                        ? 'bg-white border-slate-200 text-slate-900'
                        : 'bg-[#1c1c1e] border-[#2A6B5C]/30 text-slate-100'
                    }`}>
                      <div className="flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-[#7AB0A0]">{item.authorName}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                            item.status === 'مهتم' || item.status === 'متعاقد'
                              ? 'bg-slate-500/30 text-slate-300 border border-slate-400/40'
                              : 'bg-[#2A6B5C]/30 text-[#7AB0A0] border border-[#4F9282]/40'
                          }`}>
                            {item.status}
                          </span>
                        </div>

                        <span className="text-[10px] font-mono opacity-75">{item.date}</span>
                      </div>

                      <p className="text-xs leading-relaxed font-medium bg-black/10 p-2.5 rounded-xl border border-white/5">
                        {item.note}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Voice & Quick Note Input Box */}
          <form onSubmit={handleAddNote} className={`p-4 rounded-3xl border shadow-xl space-y-3 ${
            isLight ? 'bg-slate-50 border-slate-300' : 'bg-[#000000] border-[#2A6B5C]/40'
          }`}>
            <div className="flex items-center justify-between">
              <label className="font-bold text-[#7AB0A0] flex items-center gap-1.5 text-xs">
                <Sparkles className="w-3.5 h-3.5 text-[#2A6B5C]" />
                <span>إضافة ملاحظة سريعة أو تسجيل صوتي (Speech-to-Text):</span>
              </label>

              {speechSupported && (
                <button
                  type="button"
                  onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
                  className={`px-3 py-1 rounded-xl font-bold text-xs transition flex items-center gap-1.5 cursor-pointer ${
                    isRecording
                      ? 'bg-red-600 text-white animate-pulse shadow-red-500/50 shadow-lg'
                      : 'bg-[#2A6B5C]/20 text-[#7AB0A0] hover:bg-[#2A6B5C]/30 border border-[#2A6B5C]/40'
                  }`}
                >
                  {isRecording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                  <span>{isRecording ? 'إيقاف التسجيل...' : 'تسجيل صوتي'}</span>
                </button>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <select
                value={selectedStatus}
                onChange={e => setSelectedStatus(e.target.value as CallStatus)}
                className={`p-2.5 rounded-xl border text-xs font-bold ${
                  isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#000000] border-[#2A6B5C]/30 text-[#A8CCC0]'
                }`}
              >
                <option value="مهتم">مهتم ⭐</option>
                <option value="هرجع اكلمه تاني">هرجع اكلمه تاني</option>
                <option value="مشغول دلوقتي">مشغول دلوقتي</option>
                <option value="غير متاح">غير متاح</option>
                <option value="مغلق">مغلق</option>
                <option value="مش بيرد">مش بيرد</option>
                <option value="الرقم غلط">الرقم غلط</option>
                <option value="قفل الخط في وشي">قفل الخط في وشي</option>
                <option value="مش مهتم">مش مهتم</option>
                <option value="متعاقد">متعاقد 🏆</option>
              </select>

              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder={isRecording ? 'جاري الاستماع لصوتك وتسجيل الملاحظة...' : 'اكتب تفاصيل المكالمة أو المقابلة هنا...'}
                  value={newNote}
                  onChange={e => setNewNote(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border text-xs ${
                    isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#000000] border-[#2A6B5C]/30 text-white'
                  }`}
                />
              </div>

              <button
                type="submit"
                disabled={!newNote.trim()}
                className="px-5 py-2.5 bg-[#2A6B5C] hover:bg-[#7AB0A0] text-white font-black text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                <span>إضافة</span>
              </button>
            </div>
          </form>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800/40 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-[#2A6B5C] hover:bg-[#7AB0A0] text-white font-black rounded-xl shadow-lg transition text-xs"
          >
            إغلاق النافذة
          </button>
        </div>

      </div>
    </div>
  );
};
