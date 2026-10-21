import { formatAddedAt } from '../utils/dates';
import React, { useState, memo } from 'react';
import { ClientLead, CallStatus } from '../types';
import {
  Phone,
  MessageSquare,
  Clock,
  History,
  Building,
  ChevronDown,
  ChevronUp,
  MapPin,
  Mail,
  User,
  Trash2,
  Calendar,
  CheckCircle2,
  Sparkles,
  AlertCircle,
  Copy,
  Check,
} from 'lucide-react';

const STATUS_BUTTONS: {
  status: CallStatus;
  label: string;
  active: string;
  idleLight: string;
  idleDark: string;
}[] = [
  { status: 'مهتم', label: 'مهتم ⭐', active: 'bg-[#C49A45] text-white border-[#C49A45]', idleLight: 'bg-[#E8DCC4]/50 text-[#7a5a1e] border-[#C49A45]/50', idleDark: 'bg-[#C49A45]/10 text-[#E8DCC4] border-[#C49A45]/40' },
  { status: 'هرجع اكلمه تاني', label: 'هرجع أكلمه', active: 'bg-[#2A6B5C] text-white border-[#2A6B5C]', idleLight: 'bg-[#EAF3F0] text-[#123F36] border-[#A8CCC0]', idleDark: 'bg-[#2A6B5C]/15 text-[#A8CCC0] border-[#2A6B5C]/50' },
  { status: 'مشغول دلوقتي', label: 'مشغول', active: 'bg-purple-600 text-white border-purple-500', idleLight: 'bg-purple-50 text-purple-800 border-purple-200', idleDark: 'bg-purple-950/50 text-purple-200 border-purple-800/60' },
  { status: 'غير متاح', label: 'غير متاح', active: 'bg-sky-600 text-white border-sky-500', idleLight: 'bg-sky-50 text-sky-800 border-sky-200', idleDark: 'bg-sky-950/50 text-sky-200 border-sky-800/60' },
  { status: 'مش بيرد', label: 'مش بيرد', active: 'bg-orange-600 text-white border-orange-500', idleLight: 'bg-orange-50 text-orange-800 border-orange-200', idleDark: 'bg-orange-950/50 text-orange-200 border-orange-800/60' },
  { status: 'مغلق', label: 'مغلق', active: 'bg-rose-600 text-white border-rose-500', idleLight: 'bg-rose-50 text-rose-800 border-rose-200', idleDark: 'bg-rose-950/50 text-rose-200 border-rose-800/60' },
  { status: 'قفل الخط في وشي', label: 'قفل الخط', active: 'bg-red-700 text-white border-red-600', idleLight: 'bg-red-50 text-red-800 border-red-200', idleDark: 'bg-red-950/50 text-red-200 border-red-800/60' },
  { status: 'الرقم مقفول', label: 'الرقم مقفول', active: 'bg-zinc-600 text-white border-zinc-500', idleLight: 'bg-zinc-100 text-zinc-800 border-zinc-300', idleDark: 'bg-zinc-800/70 text-zinc-200 border-zinc-600' },
  { status: 'الرقم غلط', label: 'الرقم غلط', active: 'bg-red-800 text-white border-red-700', idleLight: 'bg-red-50 text-red-900 border-red-300', idleDark: 'bg-red-950/60 text-red-300 border-red-800' },
  { status: 'مش مهتم', label: 'مش مهتم', active: 'bg-slate-600 text-white border-slate-500', idleLight: 'bg-slate-100 text-slate-700 border-slate-300', idleDark: 'bg-slate-800/70 text-slate-200 border-slate-600' },
];

interface MobileClientCardProps {
  client: ClientLead;
  isLight: boolean;
  canDelete: boolean;
  onStatusChange: (clientId: string, status: CallStatus) => void;
  onSelectForFollowUp: (client: ClientLead) => void;
  onOpenHistory: (client: ClientLead) => void;
  onDeleteClient?: (clientId: string) => void;
  statusConfig: Record<string, { bg: string; text: string; icon: any }>;
  selected?: boolean;
  onToggleSelect?: (clientId: string) => void;
}

export const MobileClientCard: React.FC<MobileClientCardProps> = memo(({
  client,
  isLight,
  canDelete,
  onStatusChange,
  onSelectForFollowUp,
  onOpenHistory,
  onDeleteClient,
  statusConfig,
  selected = false,
  onToggleSelect,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);

  const cleanPhone = client.phone.replace(/[^0-9]/g, '');
  const whatsAppNumber = cleanPhone.startsWith('0') ? `2${cleanPhone}` : cleanPhone;
  const whatsAppText = encodeURIComponent(`مرحباً أستاذ ${client.name}، بخصوص اهتمامك بمشروعات جوهر جروب للتطوير العقاري.`);

  const handleCopyPhone = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(client.phone);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  const priorityColor =
    client.priority === 'عالي'
      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
      : client.priority === 'متوسط'
      ? 'bg-[#2A6B5C]/20 text-[#7AB0A0] border-[#2A6B5C]/40'
      : 'bg-slate-500/20 text-slate-300 border-slate-500/40';

  const currentStatusStyle = statusConfig[client.status] || {
    bg: 'bg-slate-800',
    text: 'text-slate-200',
    icon: Sparkles,
  };

  const StatusIcon = currentStatusStyle.icon || Sparkles;

  return (
    <div
      onClick={onToggleSelect ? (e => {
        if ((e.target as HTMLElement).closest('button, a, input, select, textarea, label')) return;
        onToggleSelect(client.id);
      }) : undefined}
      className={`mobile-card-item rounded-2xl border p-3.5 sm:p-4 transition-all shadow-sm ${selected ? 'ring-2 ring-[#2A6B5C] border-[#2A6B5C] ' : ''}${onToggleSelect ? 'cursor-pointer ' : ''}
        isLight
          ? client.status === 'مهتم'
            ? 'bg-[#FBF7EE] border-[#C49A45]/60 shadow-slate-100/50'
            : 'bg-white border-slate-200 shadow-slate-200/40'
          : client.status === 'مهتم'
          ? 'bg-[#1d3a2f] border-[#C49A45]/60 shadow-black/40'
          : 'bg-[#16302A] border-[#2A6B5C]/40'
      }`}
    >
      {/* 1. Header: Name, Priority, Project, and Expand Toggle */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            {selected && <span className="px-1.5 py-0.5 rounded-md bg-[#2A6B5C] text-white text-[10px] font-bold">✓ محدد</span>}
            <h4 className={`text-sm sm:text-base font-black truncate ${
              isLight ? 'text-slate-900' : 'text-slate-100'
            }`}>
              {client.name}
            </h4>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${priorityColor}`}>
              {client.priority}
            </span>
          </div>

          <a
            href={`tel:${client.phone}`}
            dir="ltr"
            className={`inline-flex items-center gap-1 mt-1 font-mono text-[13px] font-bold ${
              isLight ? 'text-[#123F36]' : 'text-[#A8CCC0]'
            }`}
          >
            <Phone className="w-3 h-3" />
            <span>{client.phone}</span>
          </a>

          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-400">
            <Building className="w-3 h-3 text-[#2A6B5C] shrink-0" />
            <span className={`truncate font-medium ${isLight ? 'text-slate-600' : 'text-slate-200/80'}`}>
              {client.projectName || 'مشروع جوهر جروب'}
            </span>
          </div>
        </div>

        {/* Current Status Badge (Tap to toggle or change) */}
        <div className="shrink-0 flex flex-col items-end gap-1">
          <div className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border flex items-center gap-1 ${currentStatusStyle.bg} ${currentStatusStyle.text}`}>
            <StatusIcon className="w-3 h-3" />
            <span>{client.status}</span>
            {formatAddedAt(client) && <span className="text-[9px] opacity-80 font-normal">· {formatAddedAt(client)}</span>}
          </div>
          {client.followUpDate && (
            <span className="text-[10px] font-mono text-[#4F9282] flex items-center gap-1 font-bold">
              <Clock className="w-2.5 h-2.5" />
              <span>{client.followUpDate}</span>
            </span>
          )}
        </div>
      </div>

      {/* 2. Primary 1-Thumb Action Buttons (Min height 44px for touch ergonomics) */}
      <div className="grid grid-cols-4 gap-1.5 mt-3 pt-3 border-t border-slate-700/20">
        {/* Direct Phone Call Button */}
        <a
          href={`tel:${client.phone}`}
          className="min-h-[44px] px-2 py-1.5 rounded-xl bg-[#2A6B5C] hover:bg-[#1F5447] active:scale-95 text-white flex flex-col items-center justify-center gap-0.5 text-center transition font-bold shadow-sm"
          title="اتصال هاتفي مباشر"
        >
          <Phone className="w-4 h-4" />
          <span className="text-[10px] font-bold">اتصال</span>
        </a>

        {/* Direct WhatsApp Chat Button */}
        <a
          href={`https://wa.me/${whatsAppNumber}?text=${whatsAppText}`}
          target="_blank"
          rel="noopener noreferrer"
          className="min-h-[44px] px-2 py-1.5 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] active:scale-95 text-slate-950 flex flex-col items-center justify-center gap-0.5 text-center transition font-bold shadow-sm"
          title="محادثة واتساب"
        >
          <MessageSquare className="w-4 h-4 text-slate-950" />
          <span className="text-[10px] font-black">واتساب</span>
        </a>

        {/* Scheduled Follow-up Modal Button */}
        <button
          type="button"
          onClick={() => onSelectForFollowUp(client)}
          className={`min-h-[44px] px-2 py-1.5 rounded-xl active:scale-95 flex flex-col items-center justify-center gap-0.5 text-center transition font-bold border ${
            isLight
              ? 'bg-[#D1E4DE] hover:bg-[#A8CCC0] text-[#041310] border-[#7AB0A0]'
              : 'bg-[#1c1c1e] hover:bg-slate-900/60 text-[#7AB0A0] border-[#2A6B5C]/40'
          }`}
          title="جدولة موعد متابعة"
        >
          <Clock className="w-4 h-4 text-[#2A6B5C]" />
          <span className="text-[10px]">متابعة</span>
        </button>

        {/* Notes & Call History Button */}
        <button
          type="button"
          onClick={() => onOpenHistory(client)}
          className={`min-h-[44px] px-2 py-1.5 rounded-xl active:scale-95 flex flex-col items-center justify-center gap-0.5 text-center transition font-bold border ${
            isLight
              ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
              : 'bg-[#000000] hover:bg-slate-950 text-slate-200 border-slate-800/80'
          }`}
          title="سجل الملاحظات والمكالمات"
        >
          <History className="w-4 h-4" />
          <span className="text-[10px]">السجل ({client.notesHistory?.length || 0})</span>
        </button>
      </div>

      {/* 3. Quick Status Change Pills (Mobile Friendly) */}
      <div className="mt-2.5 pt-2 border-t border-slate-700/20">
        <div className="flex items-center justify-between mb-1.5">
          <span className={`text-[10px] font-bold ${isLight ? 'text-slate-600' : 'text-[#A8CCC0]/80'}`}>
            تحديث حالة المكالمة بضغطة واحدة:
          </span>
          <button
            type="button"
            onClick={() => setIsExpanded(prev => !prev)}
            className={`text-[10px] font-bold flex items-center gap-1 cursor-pointer ${
              isLight ? 'text-slate-800' : 'text-[#7AB0A0]'
            }`}
          >
            <span>{isExpanded ? 'إخفاء التفاصيل' : 'عرض التفاصيل'}</span>
            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>

        {/* All status buttons visible at once - wraps to fit any screen width */}
        <div className="grid grid-cols-2 min-[360px]:grid-cols-3 sm:grid-cols-5 gap-1.5">
          {STATUS_BUTTONS.map(({ status, label, active, idleLight, idleDark }) => {
            const isSelected = client.status === status;
            return (
              <button
                key={status}
                type="button"
                onClick={() => {
                  onStatusChange(client.id, status);
                  // Same as desktop: "interested" immediately opens follow-up scheduling
                  if (status === 'مهتم') onSelectForFollowUp(client);
                }}
                className={`min-h-[40px] px-1 rounded-xl text-[12px] leading-tight font-bold transition-all border active:scale-95 ${
                  isSelected ? `${active} shadow-sm` : isLight ? idleLight : idleDark
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Expandable Details Drawer/Accordion */}
      {isExpanded && (
        <div className={`mt-3 pt-3 border-t space-y-2 text-xs animate-fadeIn ${
          isLight ? 'border-slate-200 text-slate-700' : 'border-slate-900/60 text-slate-200'
        }`}>
          {/* Phone Number & Copy button */}
          <div className="flex items-center justify-between p-2 rounded-xl bg-black/10 border border-white/5">
            <div className="flex items-center gap-2 font-mono text-xs">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              <span dir="ltr">{client.phone}</span>
            </div>
            <button
              type="button"
              onClick={handleCopyPhone}
              className="p-1 rounded-lg text-slate-400 hover:text-white transition flex items-center gap-1 text-[10px]"
              title="نسخ الرقم"
            >
              {copiedPhone ? (
                <>
                  <Check className="w-3 h-3 text-slate-400" />
                  <span className="text-slate-400 font-bold">تم النسخ</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>نسخ</span>
                </>
              )}
            </button>
          </div>

          {/* Region & Email */}
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            {client.address && (
              <div className="flex items-center gap-1.5 p-2 rounded-lg bg-black/5">
                <MapPin className="w-3 h-3 text-[#2A6B5C] shrink-0" />
                <span className="truncate">{client.address}</span>
              </div>
            )}
            {client.email && (
              <div className="flex items-center gap-1.5 p-2 rounded-lg bg-black/5">
                <Mail className="w-3 h-3 text-[#4F9282] shrink-0" />
                <span className="truncate">{client.email}</span>
              </div>
            )}
          </div>

          {/* Assigned Sales Rep & Source */}
          <div className="flex items-center justify-between text-[11px] p-2 rounded-lg bg-black/5">
            <div className="flex items-center gap-1.5">
              <User className="w-3 h-3 text-[#4F9282]" />
              <span>المسؤول: <strong>{client.assignedUserName || 'غير محدد'}</strong></span>
            </div>
            <span className="text-slate-400 text-[10px]">المصدر: {client.source}</span>
          </div>

          {/* Notes Preview */}
          {client.notes && (
            <div className="p-2.5 rounded-xl bg-black/15 border border-white/5 space-y-1">
              <span className="text-[10px] font-bold text-[#7AB0A0] block">آخر ملاحظة مسجلة:</span>
              <p className="text-[11px] leading-relaxed text-slate-300 line-clamp-3">
                {client.notes}
              </p>
            </div>
          )}

          {/* Delete Action (if permitted) */}
          {canDelete && onDeleteClient && (
            <div className="pt-1 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  if (confirm(`هل أنت متأكد من رغبتك في حذف العميل "${client.name}" نهائياً من الشيت؟`)) {
                    onDeleteClient(client.id);
                  }
                }}
                className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-red-400 hover:text-red-300 hover:bg-red-950/40 border border-red-800/50 flex items-center gap-1 transition"
              >
                <Trash2 className="w-3 h-3" />
                <span>حذف العميل من الشيت</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

MobileClientCard.displayName = 'MobileClientCard';
