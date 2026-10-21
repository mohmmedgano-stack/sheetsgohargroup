import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { AuditLog } from '../types';
import {
  ShieldAlert,
  Search,
  Filter,
  Trash2,
  Edit3,
  UserCheck,
  FileSpreadsheet,
  Download,
  Lock,
  Calendar,
  User,
  Activity,
  AlertCircle,
  FileJson,
  CheckCircle2,
  RefreshCw,
  Eye,
} from 'lucide-react';
import { toLocalDateStr } from '../utils/dates';

export const AuditLogView: React.FC = () => {
  const { auditLogs, clearAuditLogs, themeMode, currentUser } = useApp();
  const isLight = themeMode === 'light';

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAction, setSelectedAction] = useState<string>('ALL');
  const [selectedUser, setSelectedUser] = useState<string>('ALL');

  const actionLabels: Record<string, { label: string; color: string; icon: any }> = {
    DELETE_CLIENT: { label: 'حذف عميل', color: 'bg-red-500/20 text-red-400 border-red-500/40', icon: Trash2 },
    BULK_DELETE: { label: 'حذف جماعي', color: 'bg-red-600/30 text-red-300 border-red-500', icon: Trash2 },
    EDIT_CLIENT: { label: 'تعديل بيانات عميل', color: 'bg-[#2A6B5C]/20 text-[#4F9282] border-[#2A6B5C]/40', icon: Edit3 },
    FINANCIAL_UPDATE: { label: 'تعديل مالي / عقد', color: 'bg-[#2A6B5C]/20 text-[#7AB0A0] border-[#2A6B5C]/40', icon: Activity },
    PERMISSIONS_UPDATE: { label: 'تعديل صلاحيات', color: 'bg-purple-500/20 text-purple-300 border-purple-500/40', icon: Lock },
    STATUS_CHANGE: { label: 'تغيير حالة اتصال', color: 'bg-slate-500/20 text-slate-300 border-slate-500/40', icon: CheckCircle2 },
    IMPORT_DATA: { label: 'استيراد إكسيل ذكي', color: 'bg-teal-500/20 text-teal-300 border-teal-500/40', icon: FileSpreadsheet },
    EXPORT_DATA: { label: 'تصدير بيانات', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40', icon: Download },
    USER_APPROVED: { label: 'اعتماد موظف جديد', color: 'bg-slate-500/20 text-slate-400 border-slate-500/40', icon: UserCheck },
    PASSWORD_RESET: { label: 'تغيير كلمة مرور', color: 'bg-orange-500/20 text-orange-400 border-orange-500/40', icon: Lock },
    REVIEW_ADDED: { label: 'تقييم أداء مكالمة', color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40', icon: Activity },
  };

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch =
      log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.targetName && log.targetName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesAction = selectedAction === 'ALL' || log.action === selectedAction;
    const matchesUser = selectedUser === 'ALL' || log.userId === selectedUser;

    return matchesSearch && matchesAction && matchesUser;
  });

  interface UniqueUserItem {
    id: string;
    name: string;
  }

  const userMap = new Map<string, UniqueUserItem>();
  auditLogs.forEach(l => {
    if (!userMap.has(l.userId)) {
      userMap.set(l.userId, { id: l.userId, name: l.userName });
    }
  });
  const uniqueUsers: UniqueUserItem[] = Array.from(userMap.values());

  // Export audit log as CSV
  const exportLogsAsCSV = () => {
    const headers = ['التاريخ والوقت', 'اسم المستخدم', 'الصفة', 'نوع العملية', 'التفاصيل', 'الهدف'];
    const rows = filteredLogs.map(l => [
      `"${l.timestamp}"`,
      `"${l.userName}"`,
      `"${l.userRole}"`,
      `"${actionLabels[l.action]?.label || l.action}"`,
      `"${l.details.replace(/"/g, '""')}"`,
      `"${l.targetName || '-'}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Gohar_Group_Audit_Log_${toLocalDateStr()}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className={`p-6 rounded-3xl border shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 ${
        isLight
          ? 'bg-white border-slate-200 text-slate-900 shadow-slate-200/60'
          : 'bg-[#000000] text-slate-100 border-[#2A6B5C]/40 shadow-xl'
      }`}>
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-[#2A6B5C]" />
            <h1 className={`text-xl font-black ${isLight ? 'text-slate-900' : 'text-[#A8CCC0]'}`}>
              سجل النشاط والأمان والرقابة (Audit Log & Security)
            </h1>
          </div>
          <p className={`text-xs mt-1 ${isLight ? 'text-slate-600' : 'text-slate-200/80'}`}>
            متابعة فورية ومفصلة لجميع العمليات الحساسة: حذف العملاء، تعديل البيانات المالية، استيراد الشيتات، واعتماد الموظفين.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={exportLogsAsCSV}
            className="px-4 py-2 bg-[#2A6B5C] hover:bg-[#7AB0A0] text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>تصدير السجل (CSV)</span>
          </button>

          {currentUser.role === 'ADMIN' && (
            <button
              onClick={() => {
                if (confirm('هل أنت متأكد من تفريغ سجل العمليات؟')) {
                  clearAuditLogs();
                }
              }}
              className="px-3.5 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold rounded-xl transition flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>تفريغ السجل</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className={`p-4 rounded-2xl border shadow-md flex flex-wrap items-center justify-between gap-3 ${
        isLight ? 'bg-white border-slate-200' : 'bg-[#1c1c1e]/60 border-slate-800'
      }`}>
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-[#4F9282]" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="بحث في تفاصيل العملية أو اسم الموظف أو العميل..."
            className={`w-full text-xs bg-transparent border-0 focus:outline-none ${
              isLight ? 'text-slate-800 placeholder-slate-400' : 'text-slate-100 placeholder-slate-400'
            }`}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Action Filter */}
          <select
            value={selectedAction}
            onChange={e => setSelectedAction(e.target.value)}
            aria-label="تصفية حسب نوع العملية"
            className={`px-3 py-1.5 text-xs rounded-xl border font-bold cursor-pointer ${
              isLight ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-[#000000] border-slate-700 text-[#7AB0A0]'
            }`}
          >
            <option value="ALL">جميع العمليات</option>
            {Object.entries(actionLabels).map(([actKey, val]) => (
              <option key={actKey} value={actKey}>
                {val.label}
              </option>
            ))}
          </select>

          {/* User Filter */}
          <select
            value={selectedUser}
            onChange={e => setSelectedUser(e.target.value)}
            aria-label="تصفية حسب الموظف"
            className={`px-3 py-1.5 text-xs rounded-xl border font-bold cursor-pointer ${
              isLight ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-[#000000] border-slate-700 text-[#7AB0A0]'
            }`}
          >
            <option value="ALL">جميع الموظفين</option>
            {uniqueUsers.map(u => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>

          <span className="text-xs text-[#4F9282] font-mono font-bold px-2 py-1 bg-black/30 rounded-lg">
            {filteredLogs.length} عملية مسجلة
          </span>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className={`rounded-3xl border shadow-xl overflow-hidden ${
        isLight ? 'bg-white border-slate-200' : 'bg-[#000000] border-slate-800'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className={`border-b font-black ${
              isLight ? 'bg-slate-100 border-slate-200 text-slate-800' : 'bg-[#000000] border-slate-800 text-[#7AB0A0]'
            }`}>
              <tr>
                <th className="p-3.5">التاريخ والوقت</th>
                <th className="p-3.5">الموظف / المنفذ</th>
                <th className="p-3.5">نوع العملية</th>
                <th className="p-3.5">الهدف / العميل</th>
                <th className="p-3.5">التفاصيل الكاملة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/20">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    <AlertCircle className="w-8 h-8 mx-auto text-[#4F9282]/60 mb-2" />
                    <p>لا توجد سجلات تطابق معايير البحث الحالية.</p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => {
                  const actMeta = actionLabels[log.action] || {
                    label: log.action,
                    color: 'bg-slate-500/20 text-slate-300 border-slate-500',
                    icon: Activity,
                  };
                  const Icon = actMeta.icon;

                  return (
                    <tr
                      key={log.id}
                      className={`transition-colors ${
                        isLight ? 'hover:bg-slate-50' : 'hover:bg-[#1c1c1e]/40'
                      }`}
                    >
                      <td className="p-3.5 whitespace-nowrap font-mono text-[11px] text-slate-400">
                        {log.timestamp}
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <div className="font-bold flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-[#4F9282]" />
                          <span>{log.userName}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 opacity-80">
                          {log.userRole === 'ADMIN' ? 'المدير العام' : log.userRole === 'SALES_MANAGER' ? 'مدير مبيعات' : 'سيلز'}
                        </span>
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border inline-flex items-center gap-1 ${actMeta.color}`}>
                          <Icon className="w-3 h-3" />
                          <span>{actMeta.label}</span>
                        </span>
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        {log.targetName ? (
                          <span className="font-bold text-[#7AB0A0]">{log.targetName}</span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="p-3.5 text-slate-200 leading-relaxed max-w-md">
                        <p>{log.details}</p>
                        {log.oldValue && log.newValue && (
                          <div className="mt-1 text-[10px] flex items-center gap-2 font-mono">
                            <span className="text-red-400 bg-red-950/50 px-1.5 py-0.5 rounded border border-red-800">
                              السابق: {log.oldValue}
                            </span>
                            <span>←</span>
                            <span className="text-slate-400 bg-slate-950/50 px-1.5 py-0.5 rounded border border-slate-800">
                              الجديد: {log.newValue}
                            </span>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
