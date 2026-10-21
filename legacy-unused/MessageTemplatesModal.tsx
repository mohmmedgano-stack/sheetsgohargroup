import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ClientLead, MessageTemplate } from '../types';
import {
  MessageSquare,
  Copy,
  CheckCircle,
  ExternalLink,
  Plus,
  Trash2,
  Edit2,
  X,
  Sparkles,
  Send,
} from 'lucide-react';

interface MessageTemplatesModalProps {
  isOpen: boolean;
  client?: ClientLead | null;
  onClose: () => void;
}

export const MessageTemplatesModal: React.FC<MessageTemplatesModalProps> = ({
  isOpen,
  client,
  onClose,
}) => {
  const {
    messageTemplates,
    addMessageTemplate,
    deleteMessageTemplate,
    currentUser,
    canManageTeam,
    themeMode,
  } = useApp();

  const isLight = themeMode === 'light';

  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<MessageTemplate['category']>('ترحيب');
  const [newContent, setNewContent] = useState('');

  if (!isOpen) return null;

  const categories = ['ALL', 'ترحيب', 'متابعة', 'عروض_وأسعار', 'اعتذار_إعادة_اتصال', 'عام'];

  const filteredTemplates = messageTemplates.filter(
    tpl => activeCategory === 'ALL' || tpl.category === activeCategory
  );

  const formatTemplateForClient = (rawContent: string): string => {
    return rawContent
      .replace(/{client_name}/g, client ? client.name : 'عميلنا العزيز')
      .replace(/{project_name}/g, client ? client.projectName : 'مشروع جوهر جروب')
      .replace(/{rep_name}/g, currentUser ? currentUser.name : 'مستشار المبيعات')
      .replace(/{phone}/g, client ? client.phone : '');
  };

  const handleCopy = (tpl: MessageTemplate) => {
    const text = formatTemplateForClient(tpl.content);
    navigator.clipboard.writeText(text);
    setCopiedId(tpl.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleSendWhatsApp = (tpl: MessageTemplate) => {
    if (!client) return;
    const text = formatTemplateForClient(tpl.content);
    const cleanPhone = client.phone.replace(/[^\d+]/g, '');
    const phoneWithCode = cleanPhone.startsWith('0')
      ? `2${cleanPhone}`
      : cleanPhone.startsWith('+')
      ? cleanPhone.replace('+', '')
      : cleanPhone;

    const url = `https://wa.me/${phoneWithCode}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleAddTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    addMessageTemplate({
      title: newTitle.trim(),
      category: newCategory,
      content: newContent.trim(),
    });

    setNewTitle('');
    setNewContent('');
    setShowAddForm(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4" dir="rtl">
      <div className={`relative w-full max-w-2xl rounded-3xl border-2 shadow-2xl overflow-hidden transition-all max-h-[90vh] flex flex-col ${
        isLight
          ? 'bg-white border-[#4F9282]/60 text-slate-900 shadow-slate-400/50'
          : 'bg-[#000000] border-[#2A6B5C]/60 text-slate-100 shadow-2xl'
      }`}>
        
        {/* Header */}
        <div className={`p-5 border-b flex items-center justify-between shrink-0 ${
          isLight
            ? 'bg-gradient-to-r from-[#EAF3F0] to-slate-50 border-slate-200'
            : 'bg-gradient-to-r from-[#1c1c1e] to-[#000000] border-[#2A6B5C]/30'
        }`}>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-slate-500 to-green-600 text-white rounded-2xl shadow-lg">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <h3 className={`text-base sm:text-lg font-black ${isLight ? 'text-[#1c1c1e]' : 'text-[#7AB0A0]'}`}>
                قوالب الرسائل الجاهزة للواتساب والتواصل السريع
              </h3>
              <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-200/80'}`}>
                {client ? (
                  <span>المستلم: <strong className="text-[#4F9282] font-bold">{client.name}</strong> ({client.projectName})</span>
                ) : (
                  <span>قوالب معتمدة لردود المبيعات والترحيب بالعروض</span>
                )}
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

        {/* Filter Categories Bar & Add Button */}
        <div className={`p-3 border-b flex flex-wrap items-center justify-between gap-2 shrink-0 ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#000000] border-[#2A6B5C]/20'
        }`}>
          <div className="flex flex-wrap gap-1.5 text-xs">
            {categories.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
                  activeCategory === cat
                    ? isLight
                      ? 'bg-[#1c1c1e] text-[#7AB0A0] shadow-sm'
                      : 'bg-[#2A6B5C] text-white shadow-md'
                    : isLight
                    ? 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-300'
                    : 'bg-[#1c1c1e]/60 text-slate-200 hover:bg-[#1c1c1e] border border-slate-800/60'
                }`}
              >
                {cat === 'ALL' ? 'جميع القوالب' : cat.replace('_', ' ')}
              </button>
            ))}
          </div>

          {canManageTeam && (
            <button
              type="button"
              onClick={() => setShowAddForm(!showAddForm)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                isLight
                  ? 'bg-[#D1E4DE] hover:bg-[#A8CCC0] text-[#081F1A] border border-[#7AB0A0]'
                  : 'bg-slate-950 hover:bg-slate-900 text-[#7AB0A0] border border-[#2A6B5C]/30'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{showAddForm ? 'إغلاق النموذج' : 'إضافة قالب جديد'}</span>
            </button>
          )}
        </div>

        {/* Content Area */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
          
          {/* Add Form */}
          {showAddForm && (
            <form onSubmit={handleAddTemplate} className={`p-4 rounded-2xl border space-y-3 ${
              isLight ? 'bg-[#EAF3F0]/80 border-[#A8CCC0]' : 'bg-[#1c1c1e]/80 border-[#2A6B5C]/40'
            }`}>
              <h4 className="font-bold text-xs text-[#7AB0A0] flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#2A6B5C]" />
                <span>إنشاء قالب رسالة جديد للمبيعات:</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold mb-1">عنوان القالب:</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: رسالة ترحيبية لوحدات Wada Bay..."
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    className={`w-full p-2 rounded-xl border text-xs ${
                      isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#000000] border-[#2A6B5C]/30 text-white'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold mb-1">التصنيف:</label>
                  <select
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value as any)}
                    className={`w-full p-2 rounded-xl border text-xs ${
                      isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#000000] border-[#2A6B5C]/30 text-white'
                    }`}
                  >
                    <option value="ترحيب">ترحيب</option>
                    <option value="متابعة">متابعة</option>
                    <option value="عروض_وأسعار">عروض وأسعار</option>
                    <option value="اعتذار_إعادة_اتصال">اعتذار وإعادة اتصال</option>
                    <option value="عام">عام</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold mb-1">نص الرسالة (يمكن استخدام المتغيرات {'{client_name}'} و {'{project_name}'} و {'{rep_name}'}):</label>
                <textarea
                  rows={3}
                  required
                  placeholder="اكتب نص الرسالة هنا..."
                  value={newContent}
                  onChange={e => setNewContent(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border text-xs ${
                    isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#000000] border-[#2A6B5C]/30 text-white'
                  }`}
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-1.5 rounded-xl text-slate-400 hover:text-slate-200"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#2A6B5C] text-white font-bold rounded-xl hover:bg-[#4F9282] shadow"
                >
                  حفظ القالب
                </button>
              </div>
            </form>
          )}

          {/* Templates Grid */}
          <div className="space-y-3">
            {filteredTemplates.map(tpl => {
              const formattedText = formatTemplateForClient(tpl.content);
              const isCopied = copiedId === tpl.id;

              return (
                <div
                  key={tpl.id}
                  className={`p-4 rounded-2xl border transition space-y-3 ${
                    isLight
                      ? 'bg-slate-50 border-slate-200 hover:border-[#4F9282]/80 shadow-sm'
                      : 'bg-[#000000] border-[#2A6B5C]/20 hover:border-[#2A6B5C]/60 shadow-md'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-xs text-[#7AB0A0]">{tpl.title}</span>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        isLight ? 'bg-slate-100 text-slate-900' : 'bg-slate-900/60 text-slate-200'
                      }`}>
                        {tpl.category.replace('_', ' ')}
                      </span>
                    </div>

                    {canManageTeam && !tpl.isDefault && (
                      <button
                        type="button"
                        onClick={() => deleteMessageTemplate(tpl.id)}
                        className="text-red-400 hover:text-red-300 p-1"
                        title="حذف القالب"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <p className="text-xs leading-relaxed opacity-90 whitespace-pre-line font-medium bg-black/10 p-3 rounded-xl border border-white/5">
                    {formattedText}
                  </p>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleCopy(tpl)}
                      className={`px-3.5 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
                        isCopied
                          ? 'bg-slate-600 text-white shadow-sm'
                          : isLight
                          ? 'bg-white hover:bg-slate-100 text-slate-800 border border-slate-300'
                          : 'bg-slate-950 hover:bg-slate-900 text-slate-100 border border-slate-800'
                      }`}
                    >
                      {isCopied ? <CheckCircle className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{isCopied ? 'تم نسخ النص!' : 'نسخ النص'}</span>
                    </button>

                    {client && (
                      <button
                        type="button"
                        onClick={() => handleSendWhatsApp(tpl)}
                        className="px-4 py-1.5 bg-[#25D366] hover:bg-[#20bd5a] text-white font-black rounded-xl shadow-md transition flex items-center gap-1.5"
                      >
                        <Send className="w-3.5 h-3.5 rotate-180" />
                        <span>إرسال واتساب مباشر للعميل</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

        </div>

      </div>
    </div>
  );
};
