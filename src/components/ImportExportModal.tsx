import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { useFocusTrap } from '../hooks/useFocusTrap';
import {
  Download,
  Upload,
  FileSpreadsheet,
  Lock,
  CheckCircle2,
  AlertTriangle,
  X,
  FileCode,
  Users,
  Building,
  Link,
  Layers,
  Sparkles,
  ArrowRight,
  Zap,
  Printer,
  FileText,
  Filter,
  Check,
  Wifi,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { autoDetectColumnMapping, formatPhoneNumber } from '../utils/smartExcelMapper';
import { WirelessPrinterModal } from './WirelessPrinterModal';
import { toLocalDateStr } from '../utils/dates';

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ImportExportModal: React.FC<ImportExportModalProps> = ({ isOpen, onClose }) => {
  const {
    canExport,
    canImport,
    visibleClients,
    importClientsFromCSV,
    users,
    projects,
    currentUser,
    companyTitle,
    companySubtitle,
    themeMode,
  } = useApp();

  const isLight = themeMode === 'light';
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mode Selection: 'file' | 'google-sheet' | 'text' | 'export'
  const [activeTab, setActiveTab] = useState<'file' | 'google-sheet' | 'text' | 'export'>('file');

  // Import Targets
  const salesUsers = users.filter(u => u.role === 'SALES_REP');
  const [selectedSalesRepId, setSelectedSalesRepId] = useState<string>('ROUND_ROBIN');
  const [selectedProject, setSelectedProject] = useState<string>(projects[0]?.name || 'جميع المشاريع');

  // PDF Export Customization State
  const [exportPdfTitle, setExportPdfTitle] = useState<string>('تقرير عملاء وبيانات مبيعات جوهر جروب');
  const [exportFilterProject, setExportFilterProject] = useState<string>('ALL');
  const [exportFilterStatus, setExportFilterStatus] = useState<string>('ALL');
  const [exportFilterUser, setExportFilterUser] = useState<string>('ALL');
  const [exportIncludeNotes, setExportIncludeNotes] = useState<boolean>(true);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [showWirelessPrinter, setShowWirelessPrinter] = useState<boolean>(false);

  // File Upload State
  const [fileName, setFileName] = useState<string>('');
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [googleSheetUrl, setGoogleSheetUrl] = useState<string>('');
  const [rawTextData, setRawTextData] = useState<string>('');

  // Processing & Simulation State
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [processedCount, setProcessedCount] = useState(0);
  const [statusMessage, setStatusMessage] = useState<{ success?: boolean; text?: string }>({});

  const modalRef = useFocusTrap<HTMLDivElement>({
    isActive: isOpen,
    onClose,
  });

  if (!isOpen) return null;

  // Filtered clients for export
  const getFilteredExportClients = () => {
    return visibleClients.filter(client => {
      if (exportFilterProject !== 'ALL' && client.projectName !== exportFilterProject) return false;
      if (exportFilterStatus !== 'ALL' && client.status !== exportFilterStatus) return false;
      if (exportFilterUser !== 'ALL' && client.assignedUserId !== exportFilterUser) return false;
      return true;
    });
  };

  // 1. File Parser (Excel .xlsx / .xls or CSV)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setStatusMessage({});
    const fileExt = file.name.split('.').pop()?.toLowerCase();

    if (fileExt === 'xlsx' || fileExt === 'xls') {
      const reader = new FileReader();
      reader.onload = evt => {
        try {
          const bstr = evt.target?.result;
          const wb = XLSX.read(bstr, { type: 'binary' });
          const wsname = wb.SheetNames[0];
          const ws = wb.Sheets[wsname];
          const data = XLSX.utils.sheet_to_json(ws);
          setParsedRows(data);
          setStatusMessage({ success: true, text: `تم قراءة ملف إكسل بنجاح (${data.length.toLocaleString('ar-EG')} صف جاهز للاستيراد)` });
        } catch (err) {
          setStatusMessage({ success: false, text: 'حدث خطأ أثناء قراءة ملف الإكسل' });
        }
      };
      reader.readAsBinaryString(file);
    } else {
      // CSV or TXT
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: results => {
          setParsedRows(results.data);
          setStatusMessage({ success: true, text: `تم قراءة الملف بنجاح (${results.data.length.toLocaleString('ar-EG')} صف جاهز للاستيراد)` });
        },
        error: () => {
          setStatusMessage({ success: false, text: 'حدث خطأ أثناء قراءة ملف CSV' });
        },
      });
    }
  };

  // 2. Fetch or Parse Google Sheets CSV URL
  const handleGoogleSheetsParse = () => {
    if (!googleSheetUrl) return;
    setStatusMessage({ success: true, text: 'جاري جلب وقراءة بيانات جوجل شيت...' });

    // Extract CSV link or parse raw string
    let url = googleSheetUrl.trim();
    if (url.includes('docs.google.com/spreadsheets')) {
      // Convert view link to export csv link if needed
      if (!url.includes('/export?format=csv') && !url.includes('/pub?output=csv')) {
        url = url.replace(/\/edit.*$/, '/export?format=csv');
      }
    }

    Papa.parse(url, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: results => {
        if (results.data && results.data.length > 0) {
          setParsedRows(results.data);
          setStatusMessage({ success: true, text: `تم ربط وجلب شيت جوجل بنجاح (${results.data.length.toLocaleString('ar-EG')} عميل)` });
        } else {
          setStatusMessage({ success: false, text: 'لم يتم العثور على أسطر بيانات في الرابط المرفق' });
        }
      },
      error: () => {
        setStatusMessage({
          success: false,
          text: 'تعذر الاتصال برابط الشيت المباشر. يرجى التأكد أن الشيت متاح للجميع (Public/Anyone with link) أو لصق البيانات يدوياً.',
        });
      },
    });
  };

  // 3. Process Large Scale Import (Batch Execution)
  const handleExecuteImport = async () => {
    let rowsToImport: any[] = [];

    if (activeTab === 'text') {
      const lines = rawTextData.trim().split('\n');
      rowsToImport = lines.map((line, idx) => {
        const parts = line.split(/[,;\t]/).map(s => s.trim().replace(/^"|"$/g, ''));
        return {
          'اسم العميل': parts[0] || `عميل ${idx + 1}`,
          'رقم الهاتف': parts[1] || '01000000000',
          'البريد الإلكتروني': parts[2] || '',
          'العنوان': parts[3] || 'القاهرة',
          'المشروع': parts[4] || selectedProject,
          'ملاحظات': parts[5] || 'استيراد سريع',
        };
      });
    } else {
      rowsToImport = parsedRows;
    }

    if (!rowsToImport || rowsToImport.length === 0) {
      setStatusMessage({ success: false, text: 'الرجاء اختيار ملف أو إدخال بيانات أولاً' });
      return;
    }

    setIsProcessing(true);
    setProgressPercent(0);
    setProcessedCount(0);

    const total = rowsToImport.length;

    // Detect column headers from first row
    const headers = Object.keys(rowsToImport[0] || {});
    const mapping = autoDetectColumnMapping(headers, rowsToImport);

    // Simulate high-speed multi-threaded batching for huge files
    const step = Math.max(1, Math.floor(total / 20));
    let current = 0;

    const interval = setInterval(() => {
      current += step;
      if (current >= total) {
        current = total;
        clearInterval(interval);

        // Normalize rows for AppContext using smart auto-mapping
        const formattedData = rowsToImport.map((row, idx) => {
          // Determine assigned user
          let assignedUser = salesUsers[0] || currentUser;
          if (selectedSalesRepId === 'ROUND_ROBIN' && salesUsers.length > 0) {
            assignedUser = salesUsers[idx % salesUsers.length];
          } else if (selectedSalesRepId !== 'ROUND_ROBIN') {
            const found = salesUsers.find(u => u.id === selectedSalesRepId);
            if (found) assignedUser = found;
          }

          // Smart auto-mapped columns
          const rawName = mapping.nameCol ? row[mapping.nameCol] : Object.values(row)[0];
          const rawPhone = mapping.phoneCol ? row[mapping.phoneCol] : Object.values(row)[1];
          const rawEmail = mapping.emailCol ? row[mapping.emailCol] : '';
          const rawAddress = mapping.addressCol ? row[mapping.addressCol] : 'القاهرة';
          const rawStatus = mapping.statusCol ? row[mapping.statusCol] : 'جديد';
          const rawProject = mapping.projectNameCol ? row[mapping.projectNameCol] : selectedProject;
          const rawSource = mapping.sourceCol ? row[mapping.sourceCol] : 'داتا خاصة';
          const rawPriority = mapping.priorityCol ? row[mapping.priorityCol] : 'متوسط';
          const rawNotes = mapping.notesCol ? row[mapping.notesCol] : '';
          const rawFollowUp = mapping.followUpDateCol ? row[mapping.followUpDateCol] : undefined;

          const clientName = String(rawName || `عميل مستورد ${idx + 1}`).trim();
          const clientPhone = formatPhoneNumber(rawPhone) || '01000000000';

          return {
            name: clientName,
            phone: clientPhone,
            email: rawEmail ? String(rawEmail).trim() : '',
            address: rawAddress ? String(rawAddress).trim() : 'القاهرة',
            status: rawStatus ? String(rawStatus).trim() : 'جديد',
            projectName: rawProject ? String(rawProject).trim() : selectedProject,
            source: rawSource ? String(rawSource).trim() : 'داتا خاصة',
            priority: rawPriority ? String(rawPriority).trim() : 'متوسط',
            followUpDate: rawFollowUp ? String(rawFollowUp).trim() : undefined,
            assignedUserId: assignedUser.id,
            assignedUserName: assignedUser.name,
            notes: rawNotes ? String(rawNotes).trim() : `داتا مستوردة وتعيينها للموظف ${assignedUser.name}`,
          };
        });

        // Add to global state
        const result = importClientsFromCSV(formattedData);

        setIsProcessing(false);
        setProgressPercent(100);
        setProcessedCount(total);
        setStatusMessage({
          success: true,
          text: `🎉 تم استيراد وتخصيص ${total.toLocaleString('ar-EG')} عميل بنجاح مع الفرز الذكي التلقائي للأعمدة ونقلهم لشيت الموظف المستهدف!`,
        });

        // Reset state
        setParsedRows([]);
        setRawTextData('');
      } else {
        setProcessedCount(current);
        setProgressPercent(Math.round((current / total) * 100));
      }
    }, 80);
  };

  // 4. Export CSV / Excel
  const handleExportCSV = () => {
    if (!canExport) return;

    const clientsToExport = getFilteredExportClients();

    const headers = [
      'اسم العميل',
      'رقم الهاتف',
      'البريد الإلكتروني',
      'العنوان',
      'الحالة',
      'المشروع',
      'مصدر الداتا',
      'الأولوية',
      'الموظف المسؤول',
      'ميعاد الفولو اب',
      'الملاحظات',
    ];

    const rows = clientsToExport.map(c => [
      `"${c.name}"`,
      `"${c.phone}"`,
      `"${c.email}"`,
      `"${c.address}"`,
      `"${c.status}"`,
      `"${c.projectName}"`,
      `"${c.source}"`,
      `"${c.priority}"`,
      `"${c.assignedUserName}"`,
      `"${c.followUpDate || ''} ${c.followUpTime || ''}"`,
      `"${(c.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Gohar_Group_Leads_${toLocalDateStr()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 5. Professional PDF Export (Gohar Group Identity)
  const handleExportPDF = () => {
    if (!canExport) return;

    setIsExportingPdf(true);
    const clientsToExport = getFilteredExportClients();

    const totalCount = clientsToExport.length;
    const interestedCount = clientsToExport.filter(c => c.status === 'مهتم').length;
    const callbackCount = clientsToExport.filter(c => c.status === 'هرجع اكلمه تاني' || c.status === 'مشغول دلوقتي').length;
    const followUpsCount = clientsToExport.filter(c => c.followUpDate).length;

    const printWindow = document.createElement('iframe');
    printWindow.style.position = 'absolute';
    printWindow.style.top = '-9999px';
    printWindow.style.left = '-9999px';
    printWindow.style.width = '0';
    printWindow.style.height = '0';
    printWindow.style.border = '0';
    document.body.appendChild(printWindow);

    const doc = printWindow.contentWindow?.document;
    if (!doc) {
      setIsExportingPdf(false);
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
        <head>
          <meta charset="utf-8" />
          <title>${exportPdfTitle}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap');
            
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }

            body {
              font-family: 'Cairo', sans-serif;
              color: #111827;
              background: #ffffff;
              padding: 20px;
              font-size: 11px;
              line-height: 1.4;
            }

            @page {
              size: A4 portrait;
              margin: 10mm;
            }

            .header-banner {
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-bottom: 3px solid #1c1c1e;
              padding-bottom: 12px;
              margin-bottom: 14px;
            }

            .company-name {
              font-size: 20px;
              font-weight: 900;
              color: #1c1c1e;
            }

            .company-sub {
              font-size: 11px;
              color: #B45309;
              font-weight: 700;
            }

            .report-title-box {
              text-align: left;
            }

            .report-title {
              font-size: 15px;
              font-weight: 800;
              color: #1c1c1e;
            }

            .report-meta {
              font-size: 10px;
              color: #4B5563;
              margin-top: 3px;
            }

            .metrics-grid {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 8px;
              margin-bottom: 14px;
            }

            .metric-card {
              background: #F9FAFB;
              border: 1px solid #E5E7EB;
              border-radius: 8px;
              padding: 8px;
              text-align: center;
            }

            .metric-value {
              font-size: 16px;
              font-weight: 800;
              color: #1c1c1e;
            }

            .metric-label {
              font-size: 10px;
              color: #6B7280;
              font-weight: 600;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 18px;
            }

            th, td {
              border: 1px solid #D1D5DB;
              padding: 6px 8px;
              text-align: right;
              font-size: 10px;
            }

            th {
              background-color: #1c1c1e;
              color: #FDF6B2;
              font-weight: 800;
              font-size: 10px;
            }

            tr:nth-child(even) {
              background-color: #F9FAFB;
            }

            .badge {
              display: inline-block;
              padding: 2px 6px;
              border-radius: 4px;
              font-size: 9px;
              font-weight: 700;
            }

            .badge-interested {
              background-color: #DEF7EC;
              color: #03543F;
              border: 1px solid #31C48D;
            }

            .badge-callback {
              background-color: #E1EFFE;
              color: #1E429F;
              border: 1px solid #76A9FA;
            }

            .badge-default {
              background-color: #F3F4F6;
              color: #374151;
              border: 1px solid #D1D5DB;
            }

            .notes-text {
              font-size: 9px;
              color: #374151;
              line-height: 1.3;
            }

            .footer-section {
              margin-top: 20px;
              padding-top: 10px;
              border-top: 1px dashed #9CA3AF;
              display: flex;
              justify-content: space-between;
              align-items: center;
              font-size: 10px;
              color: #6B7280;
            }

            .signature-block {
              text-align: center;
              width: 160px;
            }

            .signature-line {
              border-bottom: 1px solid #374151;
              margin-top: 22px;
            }

            @media print {
              body {
                padding: 0;
              }
              .no-print {
                display: none !important;
              }
            }
          </style>
        </head>
        <body>
          <div class="header-banner">
            <div>
              <div class="company-name">جوهر جروب للاستثمار العقاري</div>
              <div class="company-sub">Gohar Group Real Estate Investment</div>
              <div style="font-size: 10px; color: #4B5563; margin-top: 2px;">
                المدير العام: م. أسامة جوهر | إدارة المبيعات والتسويق
              </div>
            </div>
            <div class="report-title-box">
              <div class="report-title">${exportPdfTitle}</div>
              <div class="report-meta">
                تاريخ الاستخراج: ${new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                <br />
                استخرج بواسطة: ${currentUser.name} (${currentUser.role === 'ADMIN' ? 'المدير العام' : 'مسؤول مبيعات'})
              </div>
            </div>
          </div>

          <div class="metrics-grid">
            <div class="metric-card">
              <div class="metric-value">${totalCount}</div>
              <div class="metric-label">إجمالي العملاء في التقرير</div>
            </div>
            <div class="metric-card" style="border-color: #31C48D;">
              <div class="metric-value" style="color: #03543F;">${interestedCount}</div>
              <div class="metric-label">عملاء مهتمين ⭐</div>
            </div>
            <div class="metric-card" style="border-color: #76A9FA;">
              <div class="metric-value" style="color: #1E429F;">${callbackCount}</div>
              <div class="metric-label">مكالمات لاحقة وتذكير</div>
            </div>
            <div class="metric-card" style="border-color: #F59E0B;">
              <div class="metric-value" style="color: #B45309;">${followUpsCount}</div>
              <div class="metric-label">مواعيد فولو اب محددة</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 30px; text-align: center;">#</th>
                <th style="width: 130px;">اسم العميل</th>
                <th style="width: 100px;">رقم الهاتف</th>
                <th style="width: 95px;">المشروع</th>
                <th style="width: 75px; text-align: center;">الحالة</th>
                <th style="width: 80px;">الموظف المسؤول</th>
                <th style="width: 95px;">موعد الفولو اب</th>
                ${exportIncludeNotes ? '<th>الملاحظات والتفاصيل</th>' : ''}
              </tr>
            </thead>
            <tbody>
              ${clientsToExport.map((client, index) => `
                <tr>
                  <td style="text-align: center; font-weight: bold; color: #4B5563;">${index + 1}</td>
                  <td style="font-weight: 800; color: #111827;">${client.name}</td>
                  <td style="font-family: monospace; font-weight: bold; direction: ltr; text-align: right;">${client.phone}</td>
                  <td style="font-weight: 600; color: #065F46;">${client.projectName || '-'}</td>
                  <td style="text-align: center;">
                    <span class="badge ${
                      client.status === 'مهتم'
                        ? 'badge-interested'
                        : client.status === 'هرجع اكلمه تاني'
                        ? 'badge-callback'
                        : 'badge-default'
                    }">
                      ${client.status}
                    </span>
                  </td>
                  <td style="font-size: 9px;">${client.assignedUserName || '-'}</td>
                  <td style="font-weight: 700; color: #92400E;">
                    ${client.followUpDate || '-'} ${client.followUpTime ? `<br><small style="color: #4B5563;">⏰ ${client.followUpTime}</small>` : ''}
                  </td>
                  ${exportIncludeNotes ? `<td class="notes-text">${client.notes || '-'}</td>` : ''}
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="footer-section">
            <div>
              <span>منظومة جوهر جروب العقارية الذكية © ${new Date().getFullYear()}</span>
              <span style="margin-right: 15px;">عدد السجلات المستخرجة: ${clientsToExport.length}</span>
            </div>

            <div class="signature-block">
              <div>اعتماد الإدارة العامة</div>
              <div class="signature-line"></div>
              <div style="font-size: 9px; margin-top: 3px; color: #374151;">م. أسامة جوهر</div>
            </div>
          </div>
        </body>
      </html>
    `;

    doc.open();
    doc.write(htmlContent);
    doc.close();

    setTimeout(() => {
      printWindow.contentWindow?.focus();
      printWindow.contentWindow?.print();
      setIsExportingPdf(false);
      setTimeout(() => {
        document.body.removeChild(printWindow);
      }, 1000);
    }, 400);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
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
        className="bg-[#2c2c2e] text-slate-100 rounded-lg max-w-2xl w-full p-6 border border-slate-800 shadow-2xl text-right space-y-5 max-h-[90vh] overflow-y-auto"
      >
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#1c1c1e] text-[#4F9282] rounded border border-slate-800">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-[#4F9282] text-base">
                مركز استيراد الداتا الضخمة (Million Leads Import Center)
              </h3>
              <p className="text-xs text-slate-400">
                رفع واستيراد شيتات الإكسل والجوجل شيت وتوجيهها مباشرة إلى المبيعات
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {!canImport ? (
          <div className="p-6 text-center text-red-400 bg-red-950/30 rounded border border-red-900/40 space-y-2">
            <Lock className="w-10 h-10 mx-auto text-red-400" />
            <h4 className="font-bold text-sm">خاصية التصدير والاستيراد مقتصرة فقط على أدمن النظام</h4>
            <p className="text-xs text-slate-400">
              حسب سياسة أمان شركة جوهر جروب، لا يملك الموظفون الفرعيون صلاحية تصدير الداتا لتجنب التسريب.
            </p>
          </div>
        ) : (
          <div className="space-y-4 text-xs">
            
            {/* Main Tabs Navigation */}
            <div className="flex items-center gap-1 bg-[#1c1c1e] p-1 rounded border border-slate-800 text-xs">
              <button
                onClick={() => setActiveTab('file')}
                className={`flex-1 py-2 px-3 rounded font-bold transition flex items-center justify-center gap-1.5 ${
                  activeTab === 'file' ? 'bg-[#4F9282] text-[#1c1c1e]' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>رفع ملف Excel / CSV</span>
              </button>

              <button
                onClick={() => setActiveTab('google-sheet')}
                className={`flex-1 py-2 px-3 rounded font-bold transition flex items-center justify-center gap-1.5 ${
                  activeTab === 'google-sheet' ? 'bg-[#4F9282] text-[#1c1c1e]' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Link className="w-3.5 h-3.5" />
                <span>رابط Google Sheet</span>
              </button>

              <button
                onClick={() => setActiveTab('text')}
                className={`flex-1 py-2 px-3 rounded font-bold transition flex items-center justify-center gap-1.5 ${
                  activeTab === 'text' ? 'bg-[#4F9282] text-[#1c1c1e]' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>لصق أرقام مجمعة</span>
              </button>

              <button
                onClick={() => setActiveTab('export')}
                className={`flex-1 py-2 px-3 rounded font-bold transition flex items-center justify-center gap-1.5 ${
                  activeTab === 'export' ? 'bg-[#4F9282] text-[#1c1c1e]' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Download className="w-3.5 h-3.5" />
                <span>تصدير الشيت</span>
              </button>
            </div>

            {/* Target Assignment Controls (Shown for all import tabs) */}
            {activeTab !== 'export' && (
              <div className="p-3 bg-[#1c1c1e] rounded border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-[#4F9282] font-bold text-xs">
                  <Users className="w-4 h-4" />
                  <span>تحديد الموظف وتخصيص الداتا المستوردة تلقائياً:</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1 text-[11px]">يوزر المبيعات المستلم للداتا:</label>
                    <select
                      value={selectedSalesRepId}
                      onChange={e => setSelectedSalesRepId(e.target.value)}
                      className="w-full p-2 bg-[#2c2c2e] border border-slate-800 rounded text-slate-200 focus:outline-none focus:border-[#4F9282]"
                    >
                      <option value="ROUND_ROBIN">🔄 توزيع آلي بالتساوي على كافة فريق المبيعات</option>
                      {salesUsers.map(u => (
                        <option key={u.id} value={u.id}>
                          💼 {u.name} ({u.assignedProject || 'جميع المشاريع'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 text-[11px]">تخصيص للمشروع العقاري:</label>
                    <select
                      value={selectedProject}
                      onChange={e => setSelectedProject(e.target.value)}
                      className="w-full p-2 bg-[#2c2c2e] border border-slate-800 rounded text-slate-200 focus:outline-none focus:border-[#4F9282]"
                    >
                      {projects.map(p => (
                        <option key={p.id} value={p.name}>
                          🏢 {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 1: FILE UPLOAD */}
            {activeTab === 'file' && (
              <div className="space-y-3">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-700 hover:border-[#4F9282] bg-[#1c1c1e] p-8 rounded text-center cursor-pointer transition space-y-2"
                >
                  <FileSpreadsheet className="w-10 h-10 text-[#4F9282] mx-auto" />
                  <p className="font-bold text-slate-200 text-xs">
                    اضغط هنا لاختيار ملف Excel (.xlsx, .xls) أو CSV من جهازك
                  </p>
                  <p className="text-[11px] text-slate-500">
                    يدعم الشيتات الضخمة التي تحتوي على آلاف وملايين أرقام العملاء.
                  </p>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx, .xls, .csv, .txt"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </div>

                {fileName && (
                  <div className="p-2.5 bg-[#1c1c1e] border border-slate-800 rounded flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-mono">📁 {fileName}</span>
                    <span className="text-[#4F9282] font-bold">
                      {parsedRows.length > 0 ? `${parsedRows.length.toLocaleString('ar-EG')} صف` : 'جاهز'}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: GOOGLE SHEETS LINK */}
            {activeTab === 'google-sheet' && (
              <div className="space-y-3">
                <p className="text-slate-400 text-xs">
                  ضع رابط شيت جوجل المباشر (Google Sheets URL) ليتم جلب وتفريغ البيانات فورياً:
                </p>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://docs.google.com/spreadsheets/d/12345/edit#gid=0"
                    value={googleSheetUrl}
                    onChange={e => setGoogleSheetUrl(e.target.value)}
                    className="flex-1 p-2.5 bg-[#1c1c1e] border border-slate-800 rounded text-slate-100 font-mono text-xs focus:outline-none focus:border-[#4F9282]"
                  />
                  <button
                    type="button"
                    onClick={handleGoogleSheetsParse}
                    className="px-4 py-2.5 bg-slate-800 text-slate-200 font-bold rounded hover:bg-slate-700 shrink-0"
                  >
                    قراءة الشيت
                  </button>
                </div>
              </div>
            )}

            {/* TAB 3: PASTE RAW TEXT */}
            {activeTab === 'text' && (
              <div className="space-y-2">
                <label className="block text-slate-400 text-xs">
                  لصق أرقام وأسماء العملاء (كل سطر يحتوي على: الاسم, الهاتف, البريد, العنوان, المشروع):
                </label>
                <textarea
                  rows={5}
                  placeholder={`أحمد عبد العزيز, 01012345678, ahmed@gmail.com, المعادي, Wada Bay رأس الحكمة\nمحمود كمال, 01198765432, mahmoud@yahoo.com, المنصورة, مول الهابي لاند الطبي Health Capital`}
                  value={rawTextData}
                  onChange={e => setRawTextData(e.target.value)}
                  className="w-full p-3 bg-[#1c1c1e] border border-slate-800 rounded text-slate-200 font-mono text-xs focus:outline-none focus:border-[#4F9282]"
                />
              </div>
            )}

            {/* TAB 4: EXPORT SECTION */}
            {activeTab === 'export' && (
              <div className="space-y-4">
                {/* Export Options & Filter Bar */}
                <div className="p-4 bg-[#1c1c1e] rounded-xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#4F9282]">
                      <Filter className="w-4 h-4" />
                      <span>خيارات تصفية وتخصيص البيانات للتصدير</span>
                    </div>
                    <span className="text-[11px] text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-full font-mono font-bold">
                      {getFilteredExportClients().length} عميل مستهدف
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">تصفية حسب المشروع</label>
                      <select
                        value={exportFilterProject}
                        onChange={e => setExportFilterProject(e.target.value)}
                        className="w-full p-2 bg-[#2c2c2e] border border-slate-700 rounded text-slate-200 text-xs focus:outline-none focus:border-[#4F9282]"
                      >
                        <option value="ALL">جميع المشاريع</option>
                        {projects.map(p => (
                          <option key={p.id} value={p.name}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">تصفية حسب الحالة</label>
                      <select
                        value={exportFilterStatus}
                        onChange={e => setExportFilterStatus(e.target.value)}
                        className="w-full p-2 bg-[#2c2c2e] border border-slate-700 rounded text-slate-200 text-xs focus:outline-none focus:border-[#4F9282]"
                      >
                        <option value="ALL">جميع الحالات</option>
                        <option value="مهتم">مهتم</option>
                        <option value="جديد">جديد</option>
                        <option value="هرجع اكلمه تاني">هرجع اكلمه تاني</option>
                        <option value="مشغول دلوقتي">مشغول دلوقتي</option>
                        <option value="لم يرد">لم يرد</option>
                        <option value="غير مهتم">غير مهتم</option>
                        <option value="محجوز">محجوز</option>
                        <option value="تم التعاقد">تم التعاقد</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">الموظف المسؤول</label>
                      <select
                        value={exportFilterUser}
                        onChange={e => setExportFilterUser(e.target.value)}
                        className="w-full p-2 bg-[#2c2c2e] border border-slate-700 rounded text-slate-200 text-xs focus:outline-none focus:border-[#4F9282]"
                      >
                        <option value="ALL">جميع الموظفين</option>
                        {salesUsers.map(u => (
                          <option key={u.id} value={u.id}>
                            {u.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Title & Notes Settings */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-xs">
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] text-slate-400 mb-1">عنوان التقرير في ملف الـ PDF</label>
                      <input
                        type="text"
                        value={exportPdfTitle}
                        onChange={e => setExportPdfTitle(e.target.value)}
                        className="w-full p-2 bg-[#2c2c2e] border border-slate-700 rounded text-slate-200 text-xs focus:outline-none focus:border-[#4F9282]"
                        placeholder="تقرير عملاء وبيانات مبيعات جوهر جروب"
                      />
                    </div>
                    <div className="flex items-end pb-1">
                      <label className="flex items-center gap-2 cursor-pointer text-slate-300 text-[11px]">
                        <input
                          type="checkbox"
                          checked={exportIncludeNotes}
                          onChange={e => setExportIncludeNotes(e.target.checked)}
                          className="w-4 h-4 accent-[#4F9282] rounded cursor-pointer"
                        />
                        <span>تضمين عمود الملاحظات والتفاصيل</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Two Export Action Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* PDF Export Card */}
                  <div className="p-4 bg-gradient-to-br from-[#1c1c1e]/30 to-[#1c1c1e] rounded-xl border border-slate-800/50 flex flex-col justify-between text-right space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 bg-slate-950/80 text-slate-400 rounded-lg border border-slate-800/80 shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-100 text-xs flex items-center gap-1.5">
                          <span>تصدير ملف PDF بهوية جوهر جروب</span>
                          <span className="text-[9px] bg-slate-900/60 text-slate-300 px-1.5 py-0.5 rounded font-bold border border-slate-700/50">فاخر</span>
                        </h4>
                        <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                          مستند طباعة عالي الدقة A4 مزود بترويسة وشعار جوهر جروب وكروت المؤشرات والاعتماد الرسمي.
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={handleExportPDF}
                      disabled={isExportingPdf || getFilteredExportClients().length === 0}
                      className="w-full py-2.5 bg-gradient-to-r from-[#1c1c1e] to-[#155e3e] hover:from-[#0e4830] hover:to-[#1b734c] text-slate-100 font-bold rounded-lg transition shadow-md flex items-center justify-center gap-2 text-xs border border-slate-600/40 disabled:opacity-50 cursor-pointer active:scale-95"
                    >
                      <Printer className="w-4 h-4" />
                      <span>{isExportingPdf ? 'جاري تجهيز المستند...' : `طباعة وتصدير PDF (${getFilteredExportClients().length} عميل)`}</span>
                    </button>
                  </div>

                  {/* Excel / CSV Export Card */}
                  <div className="p-4 bg-[#1c1c1e] rounded-xl border border-slate-800 flex flex-col justify-between text-right space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 bg-[#041310]/40 text-[#4F9282] rounded-lg border border-[#0C2E27]/40 shrink-0">
                        <FileSpreadsheet className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-100 text-xs">تصدير شيت Excel / CSV</h4>
                        <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                          تنزيل ملف بيانات جدولية متوافق مع Microsoft Excel وجداول بيانات Google.
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={handleExportCSV}
                      disabled={getFilteredExportClients().length === 0}
                      className="w-full py-2.5 bg-[#4F9282] hover:bg-[#64B5F6] text-[#1c1c1e] font-bold rounded-lg transition shadow flex items-center justify-center gap-2 text-xs disabled:opacity-50 cursor-pointer active:scale-95"
                    >
                      <Download className="w-4 h-4" />
                      <span>تنزيل شيت Excel ({getFilteredExportClients().length} عميل)</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Progress Bar during Batch processing */}
            {isProcessing && (
              <div className="p-4 bg-[#1c1c1e] border border-[#4F9282]/40 rounded space-y-2">
                <div className="flex justify-between text-xs font-bold text-[#4F9282]">
                  <span>جاري المعالجة والتوزيع للعملاء...</span>
                  <span className="font-mono">{progressPercent}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-[#4F9282] h-2 transition-all duration-150"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-400 text-center font-mono">
                  تم معالجة {processedCount.toLocaleString('ar-EG')} سطر...
                </p>
              </div>
            )}

            {/* Status Messages */}
            {statusMessage.text && (
              <div
                className={`p-3 rounded border text-xs font-bold ${
                  statusMessage.success
                    ? 'bg-slate-950/60 text-slate-400 border-slate-800'
                    : 'bg-red-950/60 text-red-400 border-red-800'
                }`}
              >
                {statusMessage.text}
              </div>
            )}

            {/* Execute Button */}
            {activeTab !== 'export' && (
              <button
                onClick={handleExecuteImport}
                disabled={
                  isProcessing ||
                  (activeTab === 'file' && parsedRows.length === 0) ||
                  (activeTab === 'google-sheet' && parsedRows.length === 0) ||
                  (activeTab === 'text' && !rawTextData.trim())
                }
                className="w-full py-3 bg-[#4F9282] text-[#1c1c1e] font-bold rounded hover:bg-[#64B5F6] transition shadow disabled:opacity-50 text-xs flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>
                  تأكيد استيراد وتخصيص الداتا ليوزر المبيعات (
                  {selectedSalesRepId === 'ROUND_ROBIN'
                    ? 'توزيع متساوي'
                    : salesUsers.find(u => u.id === selectedSalesRepId)?.name || 'الموظف المحدد'}
                  )
                </span>
              </button>
            )}

          </div>
        )}

      </div>
    </div>
  );
};
