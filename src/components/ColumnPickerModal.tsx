import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { SlidersHorizontal, Check, Eye, RotateCcw, X } from 'lucide-react';

export interface ColumnDefinition {
  id: string;
  label: string;
  defaultVisible: boolean;
  required?: boolean;
}

export const ALL_COLUMNS: ColumnDefinition[] = [
  { id: 'name', label: 'اسم العميل', defaultVisible: true, required: true },
  { id: 'phone', label: 'رقم الهاتف والتواصل', defaultVisible: true, required: true },
  { id: 'status_actions', label: 'أزرار كول ستاتس (تحديث الحالة)', defaultVisible: true, required: true },
  { id: 'followup', label: 'ميعاد الفولو اب والمتابعة', defaultVisible: true },
  { id: 'project', label: 'اسم المشروع', defaultVisible: true },
  { id: 'source', label: 'مصدر الداتا', defaultVisible: true },
  { id: 'priority', label: 'الأولوية', defaultVisible: true },
  { id: 'assigned_user', label: 'الموظف المسؤول', defaultVisible: true },
  { id: 'email_address', label: 'البريد والعنوان', defaultVisible: true },
  { id: 'notes_history', label: 'الملاحظات وسجل المحادثات', defaultVisible: true },
];

interface ColumnPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ColumnPickerModal: React.FC<ColumnPickerModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, updateVisibleColumns, themeMode } = useApp();
  const isLight = themeMode === 'light';

  const defaultColumnIds = ALL_COLUMNS.map(c => c.id);
  const currentColumns = currentUser.visibleColumns && currentUser.visibleColumns.length > 0
    ? currentUser.visibleColumns
    : defaultColumnIds;

  const [selectedCols, setSelectedCols] = useState<string[]>(currentColumns);

  const modalRef = useFocusTrap<HTMLDivElement>({
    isActive: isOpen,
    onClose,
  });

  if (!isOpen) return null;

  const handleToggleColumn = (colId: string) => {
    const col = ALL_COLUMNS.find(c => c.id === colId);
    if (col?.required) return; // Prevent disabling required columns

    setSelectedCols(prev =>
      prev.includes(colId) ? prev.filter(id => id !== colId) : [...prev, colId]
    );
  };

  const handleSave = () => {
    updateVisibleColumns(selectedCols);
    onClose();
  };

  const handleReset = () => {
    setSelectedCols(defaultColumnIds);
    updateVisibleColumns(defaultColumnIds);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
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
        className={`w-full max-w-md rounded-3xl border shadow-2xl overflow-hidden ${
          isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#000000] border-[#2A6B5C]/40 text-slate-100'
        }`}
      >
        
        {/* Header */}
        <div className={`p-4 border-b flex items-center justify-between ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#1c1c1e] border-[#2A6B5C]/30'
        }`}>
          <div className="flex items-center gap-2">
            <SlidersHorizontal className={`w-5 h-5 ${isLight ? 'text-slate-700' : 'text-[#2A6B5C]'}`} />
            <div>
              <h3 className={`font-black text-sm ${isLight ? 'text-slate-900' : 'text-[#D1E4DE]'}`}>
                تخصيص أعمدة شيت العملاء
              </h3>
              <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-200/80'}`}>
                اختر الأعمدة التي تود رؤيتها وحفظها في ملفك الشخصي
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition ${
              isLight ? 'text-slate-500 hover:bg-slate-200' : 'text-slate-300 hover:bg-slate-900'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content list of columns */}
        <div className="p-5 space-y-2 max-h-96 overflow-y-auto">
          {ALL_COLUMNS.map(col => {
            const isChecked = selectedCols.includes(col.id);
            return (
              <label
                key={col.id}
                onClick={() => handleToggleColumn(col.id)}
                className={`flex items-center justify-between p-3 rounded-2xl border transition cursor-pointer ${
                  isChecked
                    ? isLight
                      ? 'bg-slate-50 border-slate-300 text-slate-900'
                      : 'bg-[#1c1c1e] border-[#2A6B5C]/60 text-[#A8CCC0]'
                    : isLight
                    ? 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                    : 'bg-slate-950/40 border-slate-900/60 text-slate-400/60 hover:bg-slate-900/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-lg flex items-center justify-center border transition ${
                    isChecked
                      ? isLight
                        ? 'bg-slate-700 border-slate-700 text-white'
                        : 'bg-[#2A6B5C] border-[#2A6B5C] text-white'
                      : isLight
                      ? 'border-slate-300 bg-white'
                      : 'border-slate-800 bg-slate-950'
                  }`}>
                    {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                  <span className="text-xs font-bold">{col.label}</span>
                </div>

                {col.required && (
                  <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                    isLight ? 'bg-slate-200 text-slate-700' : 'bg-slate-900 text-slate-300'
                  }`}>
                    أساسي إجباري
                  </span>
                )}
              </label>
            );
          })}
        </div>

        {/* Footer actions */}
        <div className={`p-4 border-t flex items-center justify-between gap-2 ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#051A11] border-[#2A6B5C]/20'
        }`}>
          <button
            type="button"
            onClick={handleReset}
            className={`px-3 py-2 text-xs font-bold rounded-xl transition flex items-center gap-1.5 ${
              isLight ? 'text-slate-600 hover:bg-slate-200' : 'text-slate-300 hover:bg-slate-900/50'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>استعادة الافتراضي</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                isLight ? 'bg-slate-200 text-slate-700 hover:bg-slate-300' : 'bg-slate-950 text-slate-300 hover:bg-slate-900'
              }`}
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={handleSave}
              className={`px-5 py-2 rounded-xl text-xs font-black transition shadow-lg ${
                isLight
                  ? 'bg-slate-800 text-white hover:bg-slate-900'
                  : 'bg-[#2A6B5C] text-white hover:bg-[#7AB0A0]'
              }`}
            >
              حفظ التفضيلات
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
