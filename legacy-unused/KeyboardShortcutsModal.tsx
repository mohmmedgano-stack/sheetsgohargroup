import React from 'react';
import { useApp } from '../context/AppContext';
import { Keyboard, X, Command, Sparkles } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { themeMode } = useApp();
  const isLight = themeMode === 'light';

  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Alt + 1', description: 'التبديل إلى شيت الداتا والعملاء (Spreadsheet)' },
    { key: 'Alt + 2', description: 'التبديل إلى لوحة التحكم الإدارية (Dashboard & KPIs)' },
    { key: 'Alt + 3', description: 'التبديل إلى جدول مواعيد الفولو اب (Follow-ups)' },
    { key: 'Alt + 4', description: 'التبديل إلى إدارة المشاريع العقارية (Projects)' },
    { key: 'Alt + 5', description: 'التبديل إلى إدارة الفريق والمستخدمين (Team & Users)' },
    { key: 'Alt + N', description: 'فتح نافذة إضافة عميل جديد بسرعة (Add New Client)' },
    { key: 'Alt + D', description: 'التبديل بين الوضع المظلم الفاخر والنهاري (Dark / Light Mode)' },
    { key: 'Alt + T', description: 'فتح قوالب الرسائل الجاهزة للواتساب (Message Templates)' },
    { key: 'Esc', description: 'إغلاق أي نافذة منبثقة مفتوحة حالياً (Close Modal)' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4" dir="rtl">
      <div className={`relative w-full max-w-md rounded-3xl border-2 shadow-2xl overflow-hidden transition-all ${
        isLight
          ? 'bg-white border-[#4F9282]/60 text-slate-900 shadow-slate-400/50'
          : 'bg-[#000000] border-[#2A6B5C]/60 text-slate-100 shadow-2xl'
      }`}>
        
        {/* Header */}
        <div className={`p-5 border-b flex items-center justify-between ${
          isLight
            ? 'bg-gradient-to-r from-[#EAF3F0] to-slate-50 border-slate-200'
            : 'bg-gradient-to-r from-[#1c1c1e] to-[#000000] border-[#2A6B5C]/30'
        }`}>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-[#2A6B5C] to-[#2A6B5C] text-gray-950 rounded-2xl shadow-lg">
              <Keyboard className="w-6 h-6" />
            </div>
            <div>
              <h3 className={`text-base font-black ${isLight ? 'text-[#1c1c1e]' : 'text-[#7AB0A0]'}`}>
                اختصارات لوحة المفاتيح السريعة
              </h3>
              <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-200/80'}`}>
                تسريع إنجاز المهام والتنقل الاحترافي بين الشاشات
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

        {/* Shortcuts List */}
        <div className="p-5 space-y-2.5 max-h-96 overflow-y-auto text-xs">
          {shortcuts.map((sc, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-2xl border flex items-center justify-between gap-3 ${
                isLight
                  ? 'bg-slate-50 border-slate-200 text-slate-800'
                  : 'bg-[#000000] border-[#2A6B5C]/20 text-slate-100'
              }`}
            >
              <span className="font-medium">{sc.description}</span>
              <kbd className="px-2.5 py-1 bg-[#2A6B5C] text-white font-mono font-black text-xs rounded-lg shadow-sm shrink-0">
                {sc.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="p-3 border-t text-center text-[11px] opacity-70">
          اضغط على <kbd className="font-mono font-bold">Esc</kbd> في أي وقت للرجوع
        </div>

      </div>
    </div>
  );
};
