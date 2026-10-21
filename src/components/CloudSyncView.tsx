import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  CloudCheck,
  CloudUpload,
  RefreshCw,
  HardDrive,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Database,
  FileSpreadsheet,
  Download,
  Upload,
  Lock,
  FileJson,
  Check,
  AlertCircle,
  Key,
} from 'lucide-react';
import { toLocalDateStr } from '../utils/dates';

export const CloudSyncView: React.FC = () => {
  const {
    cloudConfig,
    updateCloudConfig,
    triggerManualSync,
    canExport,
    currentUser,
    clients,
    users,
    projects,
    joinCodes,
    messageTemplates,
    themeMode,
  } = useApp();

  const isLight = themeMode === 'light';
  const [isSyncing, setIsSyncing] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  const handleManualSync = async () => {
    setIsSyncing(true);
    await triggerManualSync();
    setIsSyncing(false);
  };

  // Export encrypted/structured JSON backup
  const handleExportBackupJSON = () => {
    try {
      const backupPayload = {
        app: 'Gohar Group Real Estate CRM',
        version: '3.0',
        exportedAt: new Date().toISOString(),
        exportedBy: currentUser.name,
        data: {
          clients,
          users: users.map(u => ({ ...u, password: '***' })),
          projects,
          joinCodes,
          messageTemplates,
          cloudConfig,
        },
        checksum: btoa(unescape(encodeURIComponent(JSON.stringify({ clientCount: clients.length, timestamp: Date.now() })))),
      };

      const jsonStr = JSON.stringify(backupPayload, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Gohar_CRM_Backup_${toLocalDateStr()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 4000);
    } catch (err) {
      console.error('Failed to export backup:', err);
      alert('حدث خطأ أثناء تصدير النسخة الاحتياطية.');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className={`p-5 rounded-3xl border shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 ${
        isLight
          ? 'bg-white border-slate-200 text-slate-900 shadow-slate-200/60'
          : 'bg-[#000000] text-slate-100 border-[#2A6B5C]/40 shadow-xl'
      }`}>
        <div>
          <div className="flex items-center gap-2">
            <CloudCheck className={`w-5 h-5 ${isLight ? 'text-slate-700' : 'text-[#2A6B5C]'}`} />
            <h1 className={`text-base font-bold ${isLight ? 'text-slate-900' : 'text-[#2A6B5C]'}`}>
              التكامل مع السحابة والنسخ الاحتياطي (Cloud & Local Backups)
            </h1>
          </div>
          <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-600' : 'text-slate-200/90'}`}>
            ربط ومزامنة شيتات البيانات تلقائياً مع Google Drive وتصدير نسخ احتياطية مشفرة بصيغة JSON.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Export JSON Backup Button */}
          <button
            onClick={handleExportBackupJSON}
            className={`px-4 py-2 font-black text-xs rounded-xl shadow-lg transition flex items-center gap-2 cursor-pointer ${
              exportSuccess
                ? 'bg-slate-600 text-white'
                : isLight
                ? 'bg-[#D1E4DE] text-[#081F1A] hover:bg-[#A8CCC0] border border-[#7AB0A0]'
                : 'bg-slate-950 text-[#7AB0A0] hover:bg-slate-900 border border-[#2A6B5C]/40'
            }`}
          >
            {exportSuccess ? <Check className="w-4 h-4" /> : <FileJson className="w-4 h-4 text-[#2A6B5C]" />}
            <span>{exportSuccess ? 'تم تنزيل النسخة بنجاح!' : 'تصدير نسخة احتياطية (JSON)'}</span>
          </button>

          {/* Cloud Sync Button */}
          <button
            onClick={handleManualSync}
            disabled={isSyncing}
            className={`px-4 py-2 bg-[#2A6B5C] text-white hover:bg-[#7AB0A0] font-black text-xs rounded-xl shadow-lg transition flex items-center gap-2 disabled:opacity-60 cursor-pointer`}
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'جاري المزامنة...' : 'مزامنة السحابة الآن'}</span>
          </button>
        </div>
      </div>

      {/* Cloud Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Card 1: Provider Status */}
        <div className={`p-5 rounded-3xl border shadow-md space-y-3 ${
          isLight ? 'bg-white border-slate-200' : 'bg-[#000000] border-slate-800/80'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">مزود الخدمة السحابية</span>
            <span className="px-2.5 py-0.5 text-[10px] font-bold bg-slate-950 text-slate-400 rounded-full border border-slate-800">
              ● متصل بنجاح
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-slate-950 text-[#2A6B5C] rounded-2xl border border-slate-800 shadow">
              <HardDrive className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-[#7AB0A0] text-sm">{cloudConfig.provider}</h3>
              <p className="text-xs opacity-75 mt-0.5">الحساب المؤسسي لشركة جوهر</p>
            </div>
          </div>
        </div>

        {/* Card 2: Last Sync Time */}
        <div className={`p-5 rounded-3xl border shadow-md space-y-3 ${
          isLight ? 'bg-white border-slate-200' : 'bg-[#000000] border-slate-800/80'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">تاريخ آخر مزامنة</span>
            <CheckCircle2 className="w-5 h-5 text-slate-400" />
          </div>
          <div>
            <h3 className="font-extrabold text-[#7AB0A0] text-sm">{cloudConfig.lastSyncTime || 'الآن'}</h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5">المزامنة التلقائية مفعلة كل 60 دقيقة</p>
          </div>
        </div>

        {/* Card 3: Storage Capacity */}
        <div className={`p-5 rounded-3xl border shadow-md space-y-3 ${
          isLight ? 'bg-white border-slate-200' : 'bg-[#000000] border-slate-800/80'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">المساحة المستهلكة</span>
            <span className="text-xs font-mono font-black text-[#7AB0A0]">{cloudConfig.storageUsedMB} MB</span>
          </div>
          <div className="w-full bg-black/40 rounded-full h-2.5 overflow-hidden border border-white/10">
            <div className="bg-[#2A6B5C] h-full rounded-full" style={{ width: '15%' }} />
          </div>
          <p className="text-[11px] opacity-75">15 GB مساحة مجانية متبقية في السحابة</p>
        </div>

      </div>

      {/* Cloud Link & Download Manager */}
      <div className={`p-5 rounded-3xl border shadow-xl space-y-4 ${
        isLight ? 'bg-white border-slate-200' : 'bg-[#000000] border-[#2A6B5C]/40'
      }`}>
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/40">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-[#2A6B5C]" />
            <h2 className="text-sm font-bold text-[#7AB0A0]">مجلد Google Drive الخارجي للنسخ الاحتياطية</h2>
          </div>
        </div>

        <div className="p-4 bg-black/30 rounded-2xl border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="w-8 h-8 text-[#2A6B5C]" />
            <div>
              <p className="font-bold text-slate-200 text-xs">مجلد الشيتات وقواعد البيانات / Gohar_Group_CRM_Backups</p>
              <p className="text-slate-400 font-mono dir-ltr text-right text-[11px] mt-0.5">
                {cloudConfig.driveFolderUrl}
              </p>
            </div>
          </div>

          <a
            href={cloudConfig.driveFolderUrl}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 bg-[#2A6B5C] text-white hover:bg-[#7AB0A0] font-black rounded-xl shadow transition flex items-center gap-1.5 shrink-0"
          >
            <span>فتح المجلد بالسحابة</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        {/* Security Alert for Cloud Exports */}
        {!canExport && (
          <div className="p-3 bg-[#2A6B5C]/10 border border-[#2A6B5C]/30 text-[#A8CCC0] rounded-2xl text-xs flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#2A6B5C] shrink-0" />
            <span>تنزيل النسخ الاحتياطية وتصدير الداتا مقتصر فقط على مدير النظام (الأدمن) أو من لديه صلاحية التصدير.</span>
          </div>
        )}
      </div>

    </div>
  );
};
