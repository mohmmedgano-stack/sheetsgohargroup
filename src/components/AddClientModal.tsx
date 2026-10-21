import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { LeadSource, PriorityLevel, CallStatus } from '../types';
import { UserPlus, X, Building, Phone, Mail, MapPin, Tag, AlertTriangle, UserCheck, ClipboardPaste, Sparkles } from 'lucide-react';
import { toLocalDateStr } from '../utils/dates';
import { parseContacts } from '../utils/contactParser';

interface AddClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialName?: string;
  initialPhone?: string;
}

export const AddClientModal: React.FC<AddClientModalProps> = ({ isOpen, onClose, initialName, initialPhone }) => {
  const { addClient, addClientsBulk, projects, users, currentUser, checkDuplicateClient, themeMode } = useApp();
  const isLight = themeMode === 'light';

  const [name, setName] = useState(initialName || '');
  const [phone, setPhone] = useState(initialPhone || '');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('القاهرة');
  const [priority, setPriority] = useState<PriorityLevel>('متوسط');
  const [source, setSource] = useState<LeadSource>('اعلانات فيسبوك');
  const [projectName, setProjectName] = useState(projects[0]?.name || 'Wada Bay رأس الحكمة');
  const [assignedUserId, setAssignedUserId] = useState(currentUser.id);
  const [status, setStatus] = useState<CallStatus>('جديد');
  const [notes, setNotes] = useState('');
  const [pasteText, setPasteText] = useState('');
  const [bulkContacts, setBulkContacts] = useState<{ name: string; phone: string; include: boolean }[] | null>(null);
  const [bulkResult, setBulkResult] = useState<{ added: number; skipped: number } | null>(null);

  const [pasteInfo, setPasteInfo] = useState<string | null>(null);

  const handleExtractFromPaste = () => {
    const r = parseContacts(pasteText);
    const found = r.contacts;
    const notes: string[] = [];
    if (r.duplicatesInPaste > 0) notes.push(`${r.duplicatesInPaste} رقم مكرر في اللي لصقته اتشال`);
    if (r.skipped > 0) notes.push(`${r.skipped} سطر من غير رقم اتجاهل`);
    if (found.length === 0) {
      setPasteInfo('مفيش أي رقم تليفون واضح في اللي لصقته. جرّب تنسخ جهات الاتصال تاني.');
      return;
    }
    setPasteInfo(notes.length ? notes.join(' - ') : null);
    if (found.length > 1) {
      setBulkContacts(found.map(c => ({ ...c, include: true })));
      setBulkResult(null);
    } else {
      if (found[0].name) setName(found[0].name);
      if (found[0].phone) setPhone(found[0].phone);
      setBulkContacts(null);
    }
    setPasteText('');
  };

  const handleBulkAddAll = () => {
    if (!bulkContacts) return;
    const assignedUserObj = users.find(u => u.id === assignedUserId) || currentUser;
    const chosen = bulkContacts.filter(c => c.include && c.phone);
    const res = addClientsBulk(
      chosen.map(c => ({ name: (c.name || c.phone).trim(), phone: c.phone.trim() })),
      {
        address,
        priority,
        source,
        projectName,
        assignedUserId: assignedUserObj.id,
        assignedUserName: assignedUserObj.name,
        status,
      }
    );
    setBulkResult({ added: res.added, skipped: bulkContacts.length - res.added });
    setBulkContacts(null);
  };

  // If a contact is shared in while the modal is already open, apply it
  useEffect(() => {
    if (initialName) setName(initialName);
    if (initialPhone) setPhone(initialPhone);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialName, initialPhone]);

  // Live duplicate detection
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  useEffect(() => {
    if (phone.trim().length >= 8 || (email.trim().length > 4 && email.includes('@'))) {
      const res = checkDuplicateClient(phone, email);
      if (res.isDuplicate && res.reason) {
        setDuplicateWarning(res.reason);
      } else {
        setDuplicateWarning(null);
      }
    } else {
      setDuplicateWarning(null);
    }
  }, [phone, email, checkDuplicateClient]);

  // Is this number already in the CRM (any sales rep)? Asked from the server, which is the single source of truth.
  const [takenBy, setTakenBy] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const askServer = async (value: string): Promise<string | null> => {
    try {
      const r = await fetch(`/api/clients/phone-check?phone=${encodeURIComponent(value)}`, { cache: 'no-store' });
      if (!r.ok) return null;
      const d: { exists?: boolean; ownerName?: string } = await r.json();
      return d.exists ? (d.ownerName || 'عميل آخر') : null;
    } catch {
      return null;
    }
  };
  useEffect(() => {
    if ((phone.match(/[0-9٠-٩]/g) || []).length < 7) {
      setTakenBy(null);
      return;
    }
    const t = setTimeout(async () => setTakenBy(await askServer(phone)), 350);
    return () => clearTimeout(t);
  }, [phone]);

  const modalRef = useFocusTrap<HTMLDivElement>({
    isActive: isOpen,
    onClose,
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;

    setChecking(true);
    const owner = await askServer(phone);
    setChecking(false);
    if (owner) {
      setTakenBy(owner);
      return; // the first person who added this number keeps it
    }

    if (duplicateWarning) {
      const confirmAdd = confirm(`⚠️ تنبيه تكرار عميل:\n${duplicateWarning}\n\nهل ترغب في المتابعة وإضافة العميل بالرغم من ذلك؟`);
      if (!confirmAdd) return;
    }

    const assignedUserObj = users.find(u => u.id === assignedUserId) || currentUser;

    addClient({
      name,
      phone,
      email,
      address,
      priority,
      source,
      projectName,
      assignedUserId: assignedUserObj.id,
      assignedUserName: assignedUserObj.name,
      status,
      lastInteractionDate: toLocalDateStr(),
      notes,
    });

    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
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
        className={`rounded-3xl max-w-lg w-full p-6 border shadow-2xl text-right space-y-4 max-h-[90vh] overflow-y-auto ${
          isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#000000] border-[#2A6B5C]/40 text-slate-100'
        }`}
      >
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800/40 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[#2A6B5C] text-white rounded-xl shadow-md">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-[#A8CCC0] text-base">إضافة عميل جديد لشيت جوهر جروب</h3>
              <p className="text-xs text-slate-400">فحص تلقائي لتكرار الأرقام والبريد الإلكتروني</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Shared Contact Confirmation Banner */}
        {(initialName || initialPhone) && (
          <div className="p-3 rounded-2xl bg-[#34C759]/10 border border-[#34C759]/30 text-[#1f7a3d] text-xs flex items-center gap-2">
            <UserCheck className="w-4 h-4 shrink-0 text-[#34C759]" />
            <span>تم استيراد بيانات جهة الاتصال المشارَكة تلقائيًا (الاسم والرقم) - راجعها وكمّل باقي البيانات.</span>
          </div>
        )}

        {takenBy && (
          <div role="alert" className="p-3.5 rounded-2xl bg-red-50 border border-red-300 text-red-800 text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">الرقم ده موجود في الـCRM قبل كده</span>
              <p className="mt-0.5 leading-relaxed">مسجل عند: {takenBy}. مينفعش يتضاف تاني.</p>
            </div>
          </div>
        )}

        {/* Duplicate Warning Box */}
        {duplicateWarning && (
          <div className="p-3.5 rounded-2xl bg-[#2A6B5C]/20 border border-[#2A6B5C]/50 text-[#7AB0A0] text-xs flex items-start gap-2.5 animate-pulse">
            <AlertTriangle className="w-5 h-5 text-[#4F9282] shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">تنبيه تكرار عميل مسجل مسبقاً:</span>
              <p className="mt-0.5 text-[#A8CCC0] leading-relaxed">{duplicateWarning}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">

          {/* Paste-to-Import: fill name/phone from WhatsApp or saved contacts (one or many) */}
          <div className="p-3 rounded-2xl bg-[#2A6B5C]/[0.06] border border-[#2A6B5C]/20 space-y-2">
            <label className="flex items-center gap-1.5 font-bold text-[#2A6B5C]">
              <ClipboardPaste className="w-4 h-4" />
              <span>لصق جهة اتصال (أو عدة جهات دفعة واحدة) من الواتساب أو الهاتف</span>
            </label>
            <textarea
              rows={3}
              value={pasteText}
              onChange={e => setPasteText(e.target.value)}
              placeholder="انسخ جهة اتصال واحدة أو عدة جهات (كل واحدة في سطر) من الواتساب أو جهات الاتصال، والصقهم هنا..."
              className="w-full p-2.5 bg-[#000000] border border-slate-700 rounded-xl text-slate-100 focus:ring-2 focus:ring-[#4F9282] resize-none"
            />
            <button
              type="button"
              onClick={handleExtractFromPaste}
              disabled={!pasteText.trim()}
              className="w-full py-2 rounded-xl bg-[#2A6B5C] text-white font-bold flex items-center justify-center gap-1.5 disabled:opacity-40 active:opacity-80 transition"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>استخراج جهات الاتصال تلقائيًا</span>
            </button>

            {pasteInfo && <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800">{pasteInfo}</div>}

            {bulkResult && (
              <div className="p-2.5 rounded-xl bg-[#34C759]/10 border border-[#34C759]/30 text-[11px] text-center">
                تمت إضافة <strong>{bulkResult.added}</strong> عميل جديد بنجاح
                {bulkResult.skipped > 0 && <> (تم تجاهل {bulkResult.skipped} - بيانات ناقصة أو غير محددة)</>}
              </div>
            )}
          </div>

          {/* Bulk Contacts Preview & Confirm */}
          {bulkContacts && (
            <div className="p-3 rounded-2xl bg-[#2A6B5C]/[0.06] border border-[#2A6B5C]/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#2A6B5C]">
                  تم العثور على {bulkContacts.length} جهة اتصال - راجعهم قبل الإضافة:
                </span>
                <button
                  type="button"
                  onClick={() => setBulkContacts(null)}
                  className="text-slate-400 hover:text-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                {bulkContacts.slice(0, 100).map((c, idx) => (
                  <label
                    key={idx}
                    className="flex items-center gap-2 p-2 bg-black/40 rounded-lg border border-slate-800 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={c.include}
                      onChange={e => {
                        const updated = [...bulkContacts];
                        updated[idx] = { ...updated[idx], include: e.target.checked };
                        setBulkContacts(updated);
                      }}
                      className="shrink-0"
                    />
                    <input
                      type="text"
                      value={c.name}
                      onChange={e => {
                        const updated = [...bulkContacts];
                        updated[idx] = { ...updated[idx], name: e.target.value };
                        setBulkContacts(updated);
                      }}
                      placeholder="الاسم"
                      className="flex-1 min-w-0 bg-transparent text-slate-100 focus:outline-none"
                    />
                    <input
                      type="text"
                      value={c.phone}
                      onChange={e => {
                        const updated = [...bulkContacts];
                        updated[idx] = { ...updated[idx], phone: e.target.value };
                        setBulkContacts(updated);
                      }}
                      placeholder="الرقم"
                      className="w-32 shrink-0 bg-transparent text-slate-100 font-mono focus:outline-none"
                    />
                  </label>
                ))}
              </div>

              {bulkContacts.length > 100 && (
                <p className="text-[10px] text-slate-500">معروض أول 100 للمراجعة، والباقي ({bulkContacts.length - 100}) هيتضاف معاهم بنفس الطريقة.</p>
              )}
              <p className="text-[10px] text-slate-400">
                هيتم إضافتهم كلهم بنفس المشروع والمصدر والأولوية والموظف المسؤول المحددين تحت - تقدر تعدل كل عميل لاحقًا من الشيت.
              </p>

              <button
                type="button"
                onClick={handleBulkAddAll}
                className="w-full py-2.5 rounded-xl bg-[#34C759] text-white font-bold flex items-center justify-center gap-1.5 active:opacity-80 transition"
              >
                <UserPlus className="w-4 h-4" />
                <span>إضافة {bulkContacts.filter(c => c.include).length} عميل محدد للشيت</span>
              </button>
            </div>
          )}

          <div>
            <label className="block font-bold mb-1">اسم العميل الثلاثي: *</label>
            <input
              type="text"
              required
              placeholder="مثال: المهندس أحمد سلامة"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full p-2.5 bg-[#000000] border border-slate-700 rounded-xl text-slate-100 focus:ring-2 focus:ring-[#4F9282]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold mb-1">رقم الهاتف: *</label>
              <input
                type="text"
                required
                placeholder="010XXXXXXXX"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full p-2.5 bg-[#000000] border border-slate-700 rounded-xl text-slate-100 focus:ring-2 focus:ring-[#4F9282] font-mono"
              />
            </div>

            <div>
              <label className="block font-bold mb-1">البريد الإلكتروني:</label>
              <input
                type="email"
                placeholder="client@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full p-2.5 bg-[#000000] border border-slate-700 rounded-xl text-slate-100 focus:ring-2 focus:ring-[#4F9282] font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold mb-1">مصدر الداتا: *</label>
              <select
                value={source}
                onChange={e => setSource(e.target.value as LeadSource)}
                className="w-full p-2.5 bg-[#000000] border border-slate-700 rounded-xl text-slate-100 focus:ring-2 focus:ring-[#4F9282]"
              >
                <option value="اعلانات فيسبوك">اعلانات فيسبوك</option>
                <option value="داتا خاصة">داتا خاصة</option>
                <option value="اوت دور">اوت دور</option>
              </select>
            </div>

            <div>
              <label className="block font-bold mb-1">مستوى الأولوية:</label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as PriorityLevel)}
                className="w-full p-2.5 bg-[#000000] border border-slate-700 rounded-xl text-slate-100 focus:ring-2 focus:ring-[#4F9282]"
              >
                <option value="عالي">عالي 🔥</option>
                <option value="متوسط">متوسط</option>
                <option value="منخفض">منخفض</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold mb-1">اسم المشروع المستهدف: *</label>
            <select
              value={projectName}
              onChange={e => setProjectName(e.target.value)}
              className="w-full p-2.5 bg-[#000000] border border-slate-700 rounded-xl text-slate-100 focus:ring-2 focus:ring-[#4F9282]"
            >
              {projects.map(p => (
                <option key={p.id} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {(currentUser.role === 'ADMIN' || currentUser.role === 'SALES_MANAGER') && (
            <div>
              <label className="block font-bold mb-1">تخصيص العميل لموظف مبيعات:</label>
              <select
                value={assignedUserId}
                onChange={e => setAssignedUserId(e.target.value)}
                className="w-full p-2.5 bg-[#000000] border border-slate-700 rounded-xl text-slate-100 focus:ring-2 focus:ring-[#4F9282]"
              >
                {users
                  .filter(u => u.role === 'SALES_REP' || (currentUser.role === 'ADMIN' && u.id === currentUser.id))
                  .map(u => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role === 'SALES_REP' ? 'مسؤول مبيعات' : 'المدير'})
                    </option>
                  ))}
              </select>
            </div>
          )}

          <div>
            <label className="block font-bold mb-1">العنوان والمحافظة:</label>
            <input
              type="text"
              placeholder="مثال: التجمع الخامس - القاهرة"
              value={address}
              onChange={e => setAddress(e.target.value)}
              className="w-full p-2.5 bg-[#000000] border border-slate-700 rounded-xl text-slate-100 focus:ring-2 focus:ring-[#4F9282]"
            />
          </div>

          <div>
            <label className="block font-bold mb-1">ملاحظات أولية:</label>
            <textarea
              rows={2}
              placeholder="أي تفاصيل خاصة باهتمامات العميل..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full p-2.5 bg-[#000000] border border-slate-700 rounded-xl text-slate-100 focus:ring-2 focus:ring-[#4F9282]"
            />
          </div>

          <div className="pt-3 border-t border-slate-800/40 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={checking || !!takenBy}
              className="px-5 py-2 bg-[#2A6B5C] hover:bg-[#7AB0A0] text-white font-bold rounded-xl shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {checking ? 'جاري الفحص...' : 'حفظ وإضافة للشيت'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
