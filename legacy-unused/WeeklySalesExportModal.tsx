import React, { useState, useMemo, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { ClientLead, User, Project, CallStatus } from '../types';
import {
  FileSpreadsheet,
  FileText,
  Printer,
  Download,
  Calendar,
  UserCheck,
  Building,
  Filter,
  CheckCircle2,
  TrendingUp,
  Award,
  Clock,
  Flame,
  PhoneCall,
  X,
  Sparkles,
  BarChart3,
  CalendarDays,
  ShieldCheck,
  Percent,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { toLocalDateStr } from '../utils/dates';

interface WeeklySalesExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: ClientLead[];
  users: User[];
  projects: Project[];
}

type PeriodOption = 'CURRENT_WEEK' | 'PREVIOUS_WEEK' | 'LAST_7_DAYS' | 'CURRENT_MONTH' | 'CUSTOM';

export const WeeklySalesExportModal: React.FC<WeeklySalesExportModalProps> = ({
  isOpen,
  onClose,
  clients,
  users,
  projects,
}) => {
  const { currentUser, companyTitle, companySubtitle, customLogoUrl } = useApp();
  const printAreaRef = useRef<HTMLDivElement>(null);

  // Period state
  const [periodOption, setPeriodOption] = useState<PeriodOption>('CURRENT_WEEK');
  
  // Custom Date Range State
  const todayStr = useMemo(() => toLocalDateStr(), []);
  const [customStartDate, setCustomStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return toLocalDateStr(d);
  });
  const [customEndDate, setCustomEndDate] = useState<string>(todayStr);

  // Filter state
  const [selectedRepId, setSelectedRepId] = useState<string>('ALL');
  const [selectedProjectName, setSelectedProjectName] = useState<string>('ALL');

  // Calculate Date Range based on Period Selection
  const { startDateStr, endDateStr, periodTitle } = useMemo(() => {
    const now = new Date();
    
    if (periodOption === 'CURRENT_WEEK') {
      // Current Week: Saturday to Friday or Monday to Sunday (Arabic workweek: Sat-Thu/Fri)
      const day = now.getDay(); // 0 is Sunday, 6 is Saturday
      // Let's set Saturday as start of week:
      const diffToSaturday = (day + 1) % 7;
      const start = new Date(now);
      start.setDate(now.getDate() - diffToSaturday);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);

      const sStr = toLocalDateStr(start);
      const eStr = toLocalDateStr(end);
      return {
        startDateStr: sStr,
        endDateStr: eStr,
        periodTitle: `الأسبوع الحالي (من ${sStr} إلى ${eStr})`,
      };
    } else if (periodOption === 'PREVIOUS_WEEK') {
      const day = now.getDay();
      const diffToSaturday = (day + 1) % 7;
      const start = new Date(now);
      start.setDate(now.getDate() - diffToSaturday - 7);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);

      const sStr = toLocalDateStr(start);
      const eStr = toLocalDateStr(end);
      return {
        startDateStr: sStr,
        endDateStr: eStr,
        periodTitle: `الأسبوع الماضي (من ${sStr} إلى ${eStr})`,
      };
    } else if (periodOption === 'LAST_7_DAYS') {
      const start = new Date(now);
      start.setDate(now.getDate() - 6);
      const sStr = toLocalDateStr(start);
      const eStr = toLocalDateStr(now);
      return {
        startDateStr: sStr,
        endDateStr: eStr,
        periodTitle: `آخر 7 أيام (من ${sStr} إلى ${eStr})`,
      };
    } else if (periodOption === 'CURRENT_MONTH') {
      const year = now.getFullYear();
      const month = now.getMonth();
      const start = new Date(year, month, 1);
      const end = new Date(year, month + 1, 0);
      const sStr = toLocalDateStr(start);
      const eStr = toLocalDateStr(end);
      return {
        startDateStr: sStr,
        endDateStr: eStr,
        periodTitle: `الشهر الحالي (${now.toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' })})`,
      };
    } else {
      return {
        startDateStr: customStartDate,
        endDateStr: customEndDate,
        periodTitle: `فترة مخصصة (من ${customStartDate} إلى ${customEndDate})`,
      };
    }
  }, [periodOption, customStartDate, customEndDate]);

  // Filtered Leads within Date Range & Filters
  const filteredLeads = useMemo(() => {
    return clients.filter(c => {
      // Date matching: lastInteractionDate or createdAt or notesHistory dates
      const refDate = c.lastInteractionDate || c.updatedAt || c.createdAt;
      const hasHistoryInPeriod = c.notesHistory?.some(n => {
        // notesHistory dates might be formatted as date strings
        try {
          const noteDateStr = n.date;
          return noteDateStr >= startDateStr && noteDateStr <= endDateStr;
        } catch {
          return false;
        }
      });

      const inDateRange =
        (refDate && refDate >= startDateStr && refDate <= endDateStr) || hasHistoryInPeriod;

      const matchesRep = selectedRepId === 'ALL' || c.assignedUserId === selectedRepId;
      const matchesProject = selectedProjectName === 'ALL' || c.projectName === selectedProjectName;

      return inDateRange && matchesRep && matchesProject;
    });
  }, [clients, startDateStr, endDateStr, selectedRepId, selectedProjectName]);

  // Aggregate Metrics for Selected Period
  const totalCallsInPeriod = filteredLeads.length;
  const interestedInPeriod = filteredLeads.filter(c => c.status === 'مهتم').length;
  const callBackInPeriod = filteredLeads.filter(c => c.status === 'هرجع اكلمه تاني').length;
  const busyInPeriod = filteredLeads.filter(c => c.status === 'مشغول دلوقتي').length;
  const unreachableInPeriod = filteredLeads.filter(c => c.status === 'غير متاح').length;
  const closedInPeriod = filteredLeads.filter(c => c.status === 'مغلق').length;
  const hungUpInPeriod = filteredLeads.filter(c => c.status === 'قفل الخط في وشي').length;
  const notInterestedInPeriod = filteredLeads.filter(c => c.status === 'مش مهتم').length;
  const followUpsBookedInPeriod = filteredLeads.filter(c => c.followUpDate).length;

  const conversionRate = totalCallsInPeriod > 0
    ? ((interestedInPeriod / totalCallsInPeriod) * 100).toFixed(1)
    : '0.0';

  // Sales Reps Breakdown
  const salesUsers = users.filter(u => u.role === 'SALES_REP');
  const repsPerformance = useMemo(() => {
    return salesUsers.map(user => {
      const userLeads = filteredLeads.filter(c => c.assignedUserId === user.id);
      const calls = userLeads.length;
      const interested = userLeads.filter(c => c.status === 'مهتم').length;
      const callback = userLeads.filter(c => c.status === 'هرجع اكلمه تاني').length;
      const unreachable = userLeads.filter(c => c.status === 'غير متاح' || c.status === 'مغلق').length;
      const notInterested = userLeads.filter(c => c.status === 'مش مهتم' || c.status === 'قفل الخط في وشي').length;
      const followUps = userLeads.filter(c => c.followUpDate).length;

      const rate = calls > 0 ? ((interested / calls) * 100).toFixed(1) : '0.0';
      // Expected weekly quota (e.g. 500 calls/week assuming 100/day * 5-6 work days)
      const weeklyQuota = (user.dailyQuota || 100) * 5;
      const quotaAchievedPercent = Math.min(100, Math.round((calls / weeklyQuota) * 100));

      let ratingBadge = 'جيد';
      let ratingColor = 'text-[#4F9282] bg-[#041310] border-[#0C2E27]';
      if (Number(rate) >= 15 || calls >= weeklyQuota) {
        ratingBadge = 'ممتاز 🌟';
        ratingColor = 'text-[#7AB0A0] bg-[#041310] border-[#2A6B5C]/60';
      } else if (Number(rate) >= 8 || quotaAchievedPercent >= 70) {
        ratingBadge = 'جيد جداً ⭐';
        ratingColor = 'text-slate-300 bg-slate-950 border-slate-700';
      } else if (calls < weeklyQuota * 0.4) {
        ratingBadge = 'يحتاج متابعة ⚠️';
        ratingColor = 'text-rose-300 bg-rose-950 border-rose-800';
      }

      return {
        user,
        calls,
        interested,
        callback,
        unreachable,
        notInterested,
        followUps,
        rate,
        weeklyQuota,
        quotaAchievedPercent,
        ratingBadge,
        ratingColor,
      };
    }).sort((a, b) => b.interested - a.interested || b.calls - a.calls);
  }, [salesUsers, filteredLeads]);

  // Projects Breakdown
  const projectsPerformance = useMemo(() => {
    return projects.map(proj => {
      const projLeads = filteredLeads.filter(c => c.projectName === proj.name);
      const calls = projLeads.length;
      const interested = projLeads.filter(c => c.status === 'مهتم').length;
      const rate = calls > 0 ? ((interested / calls) * 100).toFixed(1) : '0.0';

      return {
        project: proj,
        calls,
        interested,
        rate,
      };
    }).filter(p => p.calls > 0).sort((a, b) => b.calls - a.calls);
  }, [projects, filteredLeads]);

  if (!isOpen) return null;

  // 1. Export Excel (.xlsx) Multi-Sheet Workbook
  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Weekly Summary & KPIs
    const summaryData = [
      ['شركة جوهر جروب للتطوير العقاري - تقرير المبيعات الأسبوعي للأداء'],
      ['الفترة المحددة:', periodTitle],
      ['تاريخ استخراج التقرير:', new Date().toLocaleString('ar-EG')],
      ['المسؤول المستخرج للتقرير:', currentUser.name],
      [],
      ['=== المؤشرات العامة للأداء الأسبوعي ==='],
      ['إجمالي المكالمات والتواصل المنفذ', totalCallsInPeriod],
      ['العملاء المهتمون (Interested / Hot Leads)', interestedInPeriod],
      ['معدل تحويل العملاء المهتمين', `${conversionRate}%`],
      ['مواعيد الفولو اب المجدولة', followUpsBookedInPeriod],
      ['مكالمات إعادة الاتصال (هرجع أكلمه)', callBackInPeriod],
      ['أرقام غير متاحة أو مغلقة', unreachableInPeriod + closedInPeriod],
      ['غير مهتمين', notInterestedInPeriod],
      [],
      ['=== جدول تقييم أداء مسؤولي المبيعات (Sales Reps Performance) ==='],
      ['اسم الموظف', 'إجمالي المكالمات', 'المهتمين', 'إعادة اتصال', 'غير متاح/مغلق', 'مش مهتم', 'مواعيد فولو اب', 'نسبة الاهتمام %', 'التقييم'],
      ...repsPerformance.map(r => [
        r.user.name,
        r.calls,
        r.interested,
        r.callback,
        r.unreachable,
        r.notInterested,
        r.followUps,
        `${r.rate}%`,
        r.ratingBadge,
      ]),
      [],
      ['=== أداء وتوزيع المشاريع العقارية ==='],
      ['اسم المشروع', 'إجمالي العملاء المتواصل معهم', 'العملاء المهتمين', 'نسبة الاهتمام %'],
      ...projectsPerformance.map(p => [
        p.project.name,
        p.calls,
        p.interested,
        `${p.rate}%`,
      ]),
    ];

    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'ملخص_الأداء_الأسبوعي');

    // Sheet 2: Leads Detailed List
    const leadsHeaders = [
      'اسم العميل',
      'رقم الهاتف',
      'المشروع',
      'حالة الاتصال',
      'الموظف المسؤول',
      'الأولوية',
      'مصدر الداتا',
      'تاريخ آخر تواصل',
      'ميعاد الفولو اب',
      'وقت الفولو اب',
      'ملاحظات المكالمة',
    ];

    const leadsRows = filteredLeads.map(c => [
      c.name,
      c.phone,
      c.projectName,
      c.status,
      c.assignedUserName,
      c.priority,
      c.source,
      c.lastInteractionDate || c.updatedAt || c.createdAt,
      c.followUpDate || '',
      c.followUpTime || '',
      c.notes || '',
    ]);

    const wsLeads = XLSX.utils.aoa_to_sheet([leadsHeaders, ...leadsRows]);
    XLSX.utils.book_append_sheet(wb, wsLeads, 'تفاصيل_عملاء_الأسبوع');

    // Write and download
    const fileName = `Gohar_Group_Weekly_Report_${startDateStr}_to_${endDateStr}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  // 2. Print / PDF Export Handler
  const handlePrintPDF = () => {
    const printContent = printAreaRef.current;
    if (!printContent && !filteredLeads) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
        <head>
          <meta charset="utf-8">
          <title>تقرير أداء المبيعات الأسبوعي - جوهر جروب</title>
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
              background-color: #ffffff;
              padding: 20px;
              direction: rtl;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            @page {
              size: A4;
              margin: 12mm 15mm;
            }
            .header-box {
              border-bottom: 3px solid #2A6B5C;
              padding-bottom: 12px;
              margin-bottom: 16px;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            .company-title {
              color: #000000;
              font-size: 20px;
              font-weight: 900;
            }
            .report-title {
              color: #2A6B5C;
              font-size: 14px;
              font-weight: 700;
              margin-top: 3px;
            }
            .meta-box {
              font-size: 11px;
              color: #4B5563;
              text-align: left;
              line-height: 1.5;
            }
            .kpi-grid {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 10px;
              margin-bottom: 16px;
            }
            .kpi-card {
              border: 1px solid #2A6B5C;
              background-color: #FDFBF7;
              border-radius: 8px;
              padding: 10px;
              text-align: center;
            }
            .kpi-val {
              font-size: 18px;
              font-weight: 900;
              color: #000000;
            }
            .kpi-label {
              font-size: 10px;
              color: #6B7280;
              font-weight: 600;
              margin-top: 2px;
            }
            .section-title {
              font-size: 13px;
              font-weight: 800;
              color: #000000;
              border-right: 4px solid #2A6B5C;
              padding-right: 8px;
              margin: 14px 0 8px 0;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 14px;
              font-size: 11px;
            }
            th {
              background-color: #000000;
              color: #2A6B5C;
              font-weight: 800;
              padding: 6px 8px;
              text-align: right;
              border: 1px solid #000000;
            }
            td {
              padding: 6px 8px;
              border: 1px solid #E5E7EB;
              color: #1F2937;
            }
            tr:nth-child(even) td {
              background-color: #F9FAFB;
            }
            .badge-star {
              background-color: #FEF3C7;
              color: #92400E;
              font-weight: 700;
              padding: 2px 6px;
              border-radius: 4px;
              border: 1px solid #F59E0B;
              font-size: 10px;
            }
            .signatures-box {
              margin-top: 24px;
              border-top: 1px dashed #D1D5DB;
              padding-top: 16px;
              display: flex;
              justify-content: space-between;
              font-size: 11px;
            }
            .sig-col {
              text-align: center;
              width: 30%;
            }
            .sig-line {
              margin-top: 35px;
              border-bottom: 1px solid #9CA3AF;
            }
          </style>
        </head>
        <body>
          <div class="header-box">
            <div>
              <h1 class="company-title">${companyTitle || 'جوهر جروب للتطوير العقاري (Gohar Group)'}</h1>
              <div class="report-title">تقرير الأداء والمبيعات الأسبوعي المعتمد للإدارة العامة</div>
              <div style="font-size: 11px; color: #4B5563; margin-top: 4px;">فترة التقرير: <strong>${periodTitle}</strong></div>
            </div>
            <div class="meta-box">
              <div><strong>تاريخ الطباعة:</strong> ${new Date().toLocaleDateString('ar-EG')}</div>
              <div><strong>المسؤول:</strong> ${currentUser.name}</div>
              <div><strong>الفرع:</strong> المقر الرئيسي - القاهرة</div>
            </div>
          </div>

          <div class="kpi-grid">
            <div class="kpi-card">
              <div class="kpi-val">${totalCallsInPeriod}</div>
              <div class="kpi-label">إجمالي المكالمات المنفذة</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-val" style="color: #059669;">${interestedInPeriod}</div>
              <div class="kpi-label">العملاء المهتمين (Hot Leads)</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-val" style="color: #D97706;">${conversionRate}%</div>
              <div class="kpi-label">معدل التحويل الأسبوعي</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-val" style="color: #2563EB;">${followUpsBookedInPeriod}</div>
              <div class="kpi-label">مواعيد فولو اب مجدولة</div>
            </div>
          </div>

          <div class="section-title">تقييم أداء مسؤولي المبيعات (Sales Reps Weekly Performance)</div>
          <table>
            <thead>
              <tr>
                <th>الموظف</th>
                <th>إجمالي المكالمات</th>
                <th>مهتم ⭐</th>
                <th>إعادة اتصال</th>
                <th>غير متاح/مغلق</th>
                <th>مش مهتم</th>
                <th>معدل التحويل</th>
                <th>التقييم الأسبوعي</th>
              </tr>
            </thead>
            <tbody>
              ${repsPerformance.map(r => `
                <tr>
                  <td><strong>${r.user.name}</strong></td>
                  <td>${r.calls}</td>
                  <td style="font-weight: bold; color: #059669;">${r.interested}</td>
                  <td>${r.callback}</td>
                  <td>${r.unreachable}</td>
                  <td>${r.notInterested}</td>
                  <td><strong>${r.rate}%</strong></td>
                  <td><span class="badge-star">${r.ratingBadge}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="section-title">توزيع واستجابة المشاريع العقارية خلال الفترة</div>
          <table>
            <thead>
              <tr>
                <th>المشروع</th>
                <th>العملاء المتواصل معهم</th>
                <th>العملاء المهتمين</th>
                <th>نسبة الاهتمام بالمشروع</th>
              </tr>
            </thead>
            <tbody>
              ${projectsPerformance.map(p => `
                <tr>
                  <td><strong>${p.project.name}</strong></td>
                  <td>${p.calls}</td>
                  <td>${p.interested}</td>
                  <td><strong>${p.rate}%</strong></td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="signatures-box">
            <div class="sig-col">
              <div>إعداد مسؤول المتابعة والجودة</div>
              <div class="sig-line"></div>
            </div>
            <div class="sig-col">
              <div>اعتماد مدير قطاع المبيعات</div>
              <div class="sig-line"></div>
            </div>
            <div class="sig-col">
              <div>اعتماد الإدارة العامة والعضو المنتدب</div>
              <div class="sig-line"></div>
            </div>
          </div>
        </body>
      </html>
    `;

    try {
      const printWindow = window.open('', '_blank');
      if (printWindow && !printWindow.closed) {
        printWindow.document.open();
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          try {
            printWindow.print();
          } catch {
            // ignore if window closed
          }
        }, 500);
        return;
      }
    } catch {
      // fallback to hidden iframe
    }

    // Fallback: create hidden iframe for 100% reliable printing in iframe environments
    const printIframe = document.createElement('iframe');
    printIframe.style.position = 'fixed';
    printIframe.style.right = '0';
    printIframe.style.bottom = '0';
    printIframe.style.width = '0';
    printIframe.style.height = '0';
    printIframe.style.border = '0';
    document.body.appendChild(printIframe);

    const doc = printIframe.contentWindow?.document || printIframe.contentDocument;
    if (doc) {
      doc.open();
      doc.write(htmlContent);
      doc.close();
      setTimeout(() => {
        try {
          printIframe.contentWindow?.focus();
          printIframe.contentWindow?.print();
        } catch {
          // handled
        } finally {
          setTimeout(() => {
            if (document.body.contains(printIframe)) {
              document.body.removeChild(printIframe);
            }
          }, 2000);
        }
      }, 500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="bg-[#000000] text-slate-100 rounded-2xl max-w-4xl w-full border-2 border-[#2A6B5C]/60 shadow-2xl text-right space-y-4 max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Modal Top Header */}
        <div className="p-4 sm:p-5 border-b border-[#2A6B5C]/30 bg-[#1c1c1e] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#000000] text-[#2A6B5C] rounded-xl border border-[#2A6B5C]/60 shadow-md">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-[#2A6B5C] flex items-center gap-2">
                <span>تصدير تقرير أداء المبيعات الأسبوعي (Weekly Sales & SLA Export)</span>
              </h2>
              <p className="text-xs text-slate-200/90 font-medium mt-0.5">
                توليد تقارير أداء ومتابعة المبيعات الأسبوعية بصيغتي Excel (.xlsx) و PDF رسمية للمديرين.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg transition hover:bg-slate-900/60"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Controls & Preview */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          
          {/* Controls Bar */}
          <div className="bg-[#000000] p-4 rounded-xl border border-[#2A6B5C]/40 space-y-3">
            <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-900/60">
              <span className="font-black text-[#2A6B5C] flex items-center gap-1.5">
                <Filter className="w-4 h-4 text-[#2A6B5C]" />
                <span>إعدادات الفترة والتصفية للتقرير:</span>
              </span>
              <span className="text-[11px] text-[#A8CCC0] font-bold bg-[#1c1c1e] px-2.5 py-0.5 rounded-full border border-slate-700">
                {periodTitle}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              {/* Period Selector */}
              <div>
                <label className="block text-[11px] font-black text-[#2A6B5C] mb-1">فترة التقرير:</label>
                <select
                  value={periodOption}
                  onChange={e => setPeriodOption(e.target.value as PeriodOption)}
                  className="w-full p-2 bg-[#1c1c1e] border border-[#2A6B5C]/50 rounded-xl text-[#D1E4DE] font-bold text-xs focus:ring-1 focus:ring-[#2A6B5C] cursor-pointer"
                >
                  <option value="CURRENT_WEEK" className="bg-[#000000] text-[#A8CCC0]">الأسبوع الحالي (Current Week)</option>
                  <option value="PREVIOUS_WEEK" className="bg-[#000000] text-[#A8CCC0]">الأسبوع الماضي (Previous Week)</option>
                  <option value="LAST_7_DAYS" className="bg-[#000000] text-[#A8CCC0]">آخر 7 أيام (Last 7 Days)</option>
                  <option value="CURRENT_MONTH" className="bg-[#000000] text-[#A8CCC0]">هذا الشهر (Current Month)</option>
                  <option value="CUSTOM" className="bg-[#000000] text-[#A8CCC0]">فترة مخصصة (Custom Range)</option>
                </select>
              </div>

              {/* Sales Rep Filter */}
              <div>
                <label className="block text-[11px] font-black text-[#2A6B5C] mb-1">الموظف المستهدف:</label>
                <select
                  value={selectedRepId}
                  onChange={e => setSelectedRepId(e.target.value)}
                  className="w-full p-2 bg-[#1c1c1e] border border-[#2A6B5C]/50 rounded-xl text-[#D1E4DE] font-bold text-xs focus:ring-1 focus:ring-[#2A6B5C] cursor-pointer"
                >
                  <option value="ALL" className="bg-[#000000] text-[#A8CCC0]">جميع مسؤولي المبيعات</option>
                  {salesUsers.map(u => (
                    <option key={u.id} value={u.id} className="bg-[#000000] text-[#D1E4DE]">
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Project Filter */}
              <div>
                <label className="block text-[11px] font-black text-[#2A6B5C] mb-1">المشروع العقاري:</label>
                <select
                  value={selectedProjectName}
                  onChange={e => setSelectedProjectName(e.target.value)}
                  className="w-full p-2 bg-[#1c1c1e] border border-[#2A6B5C]/50 rounded-xl text-[#D1E4DE] font-bold text-xs focus:ring-1 focus:ring-[#2A6B5C] cursor-pointer"
                >
                  <option value="ALL" className="bg-[#000000] text-[#A8CCC0]">جميع المشاريع</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.name} className="bg-[#000000] text-[#D1E4DE]">
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Custom Range Inputs if selected */}
            {periodOption === 'CUSTOM' && (
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-900/60 text-xs">
                <div>
                  <label className="block text-[10px] text-slate-200 mb-0.5">من تاريخ:</label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={e => setCustomStartDate(e.target.value)}
                    className="w-full p-1.5 bg-[#1c1c1e] border border-[#2A6B5C]/40 rounded-lg text-[#D1E4DE] text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-200 mb-0.5">إلى تاريخ:</label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={e => setCustomEndDate(e.target.value)}
                    className="w-full p-1.5 bg-[#1c1c1e] border border-[#2A6B5C]/40 rounded-lg text-[#D1E4DE] text-xs font-mono"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Quick Metrics Ribbon */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-[#1c1c1e] rounded-xl border border-[#2A6B5C]/40 text-center">
              <span className="text-[11px] text-slate-300 font-bold block">إجمالي المكالمات</span>
              <span className="text-xl sm:text-2xl font-black text-[#D1E4DE] font-mono mt-0.5 block">
                {totalCallsInPeriod}
              </span>
            </div>

            <div className="p-3 bg-[#1c1c1e] rounded-xl border border-slate-600/50 text-center">
              <span className="text-[11px] text-slate-300 font-bold block">العملاء المهتمين ⭐</span>
              <span className="text-xl sm:text-2xl font-black text-slate-300 font-mono mt-0.5 block">
                {interestedInPeriod}
              </span>
            </div>

            <div className="p-3 bg-[#1c1c1e] rounded-xl border border-[#2A6B5C]/50 text-center">
              <span className="text-[11px] text-[#7AB0A0] font-bold block">معدل التحويل (Conv. Rate)</span>
              <span className="text-xl sm:text-2xl font-black text-[#7AB0A0] font-mono mt-0.5 block">
                {conversionRate}%
              </span>
            </div>

            <div className="p-3 bg-[#1c1c1e] rounded-xl border border-[#2A6B5C]/50 text-center">
              <span className="text-[11px] text-[#7AB0A0] font-bold block">فولو اب مجدول ⏰</span>
              <span className="text-xl sm:text-2xl font-black text-[#7AB0A0] font-mono mt-0.5 block">
                {followUpsBookedInPeriod}
              </span>
            </div>
          </div>

          {/* Sales Reps Scorecard Table Preview */}
          <div className="bg-[#000000] rounded-xl border border-[#2A6B5C]/30 p-3.5 space-y-2.5">
            <div className="flex items-center justify-between text-xs border-b border-slate-900/60 pb-1.5">
              <span className="font-black text-[#2A6B5C] flex items-center gap-1.5">
                <Award className="w-4 h-4 text-[#2A6B5C]" />
                <span>جدول إنجاز وتصنيف مسؤولي المبيعات للفترة المحددة:</span>
              </span>
              <span className="text-[11px] text-slate-400">
                إجمالي {repsPerformance.length} موظف
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-[#000000] text-[#2A6B5C] border-b border-[#2A6B5C]/30">
                    <th className="p-2 font-black">الموظف</th>
                    <th className="p-2 font-black text-center">المكالمات</th>
                    <th className="p-2 font-black text-center text-slate-300">مهتم ⭐</th>
                    <th className="p-2 font-black text-center text-[#7AB0A0]">إعادة اتصال</th>
                    <th className="p-2 font-black text-center text-[#7AB0A0]">معدل التحويل</th>
                    <th className="p-2 font-black text-center">التقييم الأسبوعي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-950">
                  {repsPerformance.map((rep, idx) => (
                    <tr key={rep.user.id} className="hover:bg-[#1c1c1e]/60 transition">
                      <td className="p-2 font-bold text-slate-100 flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-slate-950 text-[#2A6B5C] text-[10px] font-mono flex items-center justify-center border border-slate-800">
                          {idx + 1}
                        </span>
                        <span>{rep.user.name}</span>
                      </td>
                      <td className="p-2 text-center font-mono font-bold text-slate-200">{rep.calls}</td>
                      <td className="p-2 text-center font-mono font-black text-slate-300">{rep.interested}</td>
                      <td className="p-2 text-center font-mono text-[#7AB0A0]">{rep.callback}</td>
                      <td className="p-2 text-center font-mono font-black text-[#7AB0A0]">{rep.rate}%</td>
                      <td className="p-2 text-center">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${rep.ratingColor}`}>
                          {rep.ratingBadge}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Hidden Print Container for layout reference */}
          <div ref={printAreaRef} className="hidden" />

        </div>

        {/* Modal Bottom Actions */}
        <div className="p-4 bg-[#1c1c1e] border-t border-[#2A6B5C]/30 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-xs text-slate-200/90 font-medium">
            تجهيز التقرير يشمل ملخص الإدارة، جدول المبيعات، وتفاصيل كافة سجلات العملاء.
          </span>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            {/* Export Excel Button */}
            <button
              onClick={handleExportExcel}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer border border-slate-500/50"
            >
              <FileSpreadsheet className="w-4 h-4 text-slate-200" />
              <span>تصدير ملف Excel (.xlsx)</span>
            </button>

            {/* Print / PDF Button */}
            <button
              onClick={handlePrintPDF}
              className="flex-1 sm:flex-none px-5 py-2.5 bg-[#2A6B5C] hover:bg-[#7AB0A0] text-white font-black text-xs rounded-xl shadow-xl transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-gray-950" />
              <span>تصدير وطباعة PDF رسمي (.pdf)</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
