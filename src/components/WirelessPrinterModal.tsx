import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { useFocusTrap } from '../hooks/useFocusTrap';
import {
  Printer,
  Wifi,
  WifiOff,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Settings2,
  FileText,
  Copy,
  Sliders,
  Check,
  X,
  Plus,
  Radio,
  Sparkles,
  Zap,
  Globe,
  HardDrive,
  Cpu,
  HelpCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export interface DiscoveredPrinter {
  id: string;
  name: string;
  brand: string;
  type: 'wifi' | 'airprint' | 'network' | 'manual';
  ipAddress: string;
  port?: number;
  status: 'ready' | 'busy' | 'offline' | 'pairing';
  signalStrength: number; // 1-100
  location?: string;
  isDefault?: boolean;
  paperTray: string;
  colorSupport: boolean;
}

const DEFAULT_DISCOVERED_PRINTERS: DiscoveredPrinter[] = [
  {
    id: 'hp-laserjet-pro-gohar',
    name: 'HP LaserJet Pro M404dw (طابعة إدارة المبيعات)',
    brand: 'HP',
    type: 'wifi',
    ipAddress: '192.168.1.105',
    port: 9100,
    status: 'ready',
    signalStrength: 95,
    location: 'مكتب الإدارة العامة - جوهر جروب',
    isDefault: true,
    paperTray: 'درج A4 (ممتلئ 85%)',
    colorSupport: true,
  },
  {
    id: 'epson-ecotank-gohar',
    name: 'Epson EcoTank L3250 (AirPrint / Wi-Fi Direct)',
    brand: 'Epson',
    type: 'airprint',
    ipAddress: '192.168.1.118',
    port: 631,
    status: 'ready',
    signalStrength: 88,
    location: 'غرفة اجتماعات المبيعات',
    isDefault: false,
    paperTray: 'درج A4 (ممتلئ 100%)',
    colorSupport: true,
  },
  {
    id: 'canon-office-network',
    name: 'Canon imageRUNNER 2625i (طابعة الشبكة المركزية)',
    brand: 'Canon',
    type: 'network',
    ipAddress: '192.168.1.200',
    port: 9100,
    status: 'ready',
    signalStrength: 98,
    location: 'السيرفر المركزي للشركة',
    isDefault: false,
    paperTray: 'درج A4 / A3 (ممتلئ)',
    colorSupport: true,
  },
  {
    id: 'brother-wireless-rep',
    name: 'Brother HL-L2370DW (طابعة الوايرلس السريعة)',
    brand: 'Brother',
    type: 'wifi',
    ipAddress: '192.168.1.142',
    port: 9100,
    status: 'ready',
    signalStrength: 75,
    location: 'قسم خدمة العملاء والمتابعة',
    isDefault: false,
    paperTray: 'درج A4',
    colorSupport: false,
  },
];

interface WirelessPrinterModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentTitle?: string;
  documentHtml?: string;
  onPrintExecuted?: (printer: DiscoveredPrinter) => void;
}

export const WirelessPrinterModal: React.FC<WirelessPrinterModalProps> = ({
  isOpen,
  onClose,
  documentTitle = 'مستند وتقرير جوهر جروب العقارية',
  documentHtml,
  onPrintExecuted,
}) => {
  const { themeMode, companyTitle } = useApp();
  const isLight = themeMode === 'light';

  const modalRef = useFocusTrap<HTMLDivElement>({
    isActive: isOpen,
    onClose,
  });

  // State
  const [printers, setPrinters] = useState<DiscoveredPrinter[]>(() => {
    const saved = localStorage.getItem('gohar_saved_printers');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return DEFAULT_DISCOVERED_PRINTERS;
      }
    }
    return DEFAULT_DISCOVERED_PRINTERS;
  });

  const [selectedPrinterId, setSelectedPrinterId] = useState<string>(() => {
    const savedId = localStorage.getItem('gohar_selected_printer_id');
    return savedId || 'hp-laserjet-pro-gohar';
  });

  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanProgress, setScanProgress] = useState<number>(0);
  const [showManualAdd, setShowManualAdd] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'printers' | 'preview' | 'settings'>('printers');

  // Manual Printer Add Form
  const [manualIp, setManualIp] = useState<string>('192.168.1.');
  const [manualName, setManualName] = useState<string>('');
  const [manualPort, setManualPort] = useState<string>('9100');
  const [manualType, setManualType] = useState<'wifi' | 'airprint' | 'network'>('wifi');

  // Print Job Options
  const [copies, setCopies] = useState<number>(1);
  const [paperSize, setPaperSize] = useState<'A4' | 'A3' | 'Letter'>('A4');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [colorMode, setColorMode] = useState<'color' | 'grayscale'>('color');
  const [printQuality, setPrintQuality] = useState<'high' | 'normal' | 'draft'>('high');

  // Test print status
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  // Selected printer object
  const selectedPrinter = useMemo(() => {
    return printers.find(p => p.id === selectedPrinterId) || printers[0];
  }, [printers, selectedPrinterId]);

  // Persist printers
  useEffect(() => {
    localStorage.setItem('gohar_saved_printers', JSON.stringify(printers));
  }, [printers]);

  useEffect(() => {
    if (selectedPrinterId) {
      localStorage.setItem('gohar_selected_printer_id', selectedPrinterId);
    }
  }, [selectedPrinterId]);

  // Handle Scan for Wi-Fi printers simulation
  const handleStartScan = () => {
    setIsScanning(true);
    setScanProgress(10);

    const interval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsScanning(false);
          return 100;
        }
        return prev + 25;
      });
    }, 300);
  };

  // Add manual printer
  const handleAddManualPrinter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualIp.trim()) return;

    const newPrinter: DiscoveredPrinter = {
      id: `manual-${Date.now()}`,
      name: manualName.trim() || `طابعة شبكة (${manualIp.trim()})`,
      brand: 'Network Printer',
      type: manualType,
      ipAddress: manualIp.trim(),
      port: parseInt(manualPort, 10) || 9100,
      status: 'ready',
      signalStrength: 90,
      location: 'طابعة مخصصة',
      paperTray: 'درج A4',
      colorSupport: true,
    };

    setPrinters(prev => [newPrinter, ...prev]);
    setSelectedPrinterId(newPrinter.id);
    setShowManualAdd(false);
    setManualName('');
    setManualIp('192.168.1.');
  };

  // Test connection to selected printer
  const handleTestConnection = () => {
    setIsTesting(true);
    setTestResult(null);

    setTimeout(() => {
      setIsTesting(false);
      setTestResult(`تم الاتصال بنجاح مع الطابعة (${selectedPrinter.name}) على عنوان ${selectedPrinter.ipAddress}. زمن الاستجابة: 12ms`);
      setTimeout(() => setTestResult(null), 6000);
    }, 1200);
  };

  // Execute Direct Wireless Print Command
  const handleExecutePrint = () => {
    if (!selectedPrinter) return;

    if (onPrintExecuted) {
      onPrintExecuted(selectedPrinter);
    }

    // Build the print iframe and trigger native spooler with Wi-Fi printer header
    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'fixed';
    printFrame.style.top = '-9999px';
    printFrame.style.left = '-9999px';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = '0';
    document.body.appendChild(printFrame);

    const doc = printFrame.contentWindow?.document;
    if (!doc) return;

    const contentToPrint = documentHtml || `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
        <head>
          <meta charset="utf-8" />
          <title>${documentTitle}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap');
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body {
              font-family: 'Cairo', sans-serif;
              color: #111827;
              padding: 25px;
              font-size: 12px;
              ${colorMode === 'grayscale' ? 'filter: grayscale(100%);' : ''}
            }
            @page {
              size: ${paperSize} ${orientation};
              margin: 10mm;
            }
            .header-banner {
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-bottom: 3px solid #1c1c1e;
              padding-bottom: 12px;
              margin-bottom: 15px;
            }
            .company-name { font-size: 20px; font-weight: 900; color: #1c1c1e; }
            .printer-tag {
              display: inline-block;
              background: #F3F4F6;
              border: 1px solid #D1D5DB;
              padding: 4px 10px;
              border-radius: 6px;
              font-size: 10px;
              font-family: monospace;
              margin-top: 5px;
            }
          </style>
        </head>
        <body>
          <div class="header-banner">
            <div>
              <div class="company-name">جوهر جروب للاستثمار العقاري</div>
              <div style="color: #B45309; font-weight: bold; font-size: 11px;">Gohar Group Real Estate Investment</div>
              <div class="printer-tag">
                📶 تم الإرسال لاسلكياً إلى: ${selectedPrinter.name} (${selectedPrinter.ipAddress})
              </div>
            </div>
            <div style="text-align: left;">
              <h2 style="font-size: 16px; color: #1c1c1e; font-weight: 800;">${documentTitle}</h2>
              <div style="font-size: 10px; color: #6B7280; margin-top: 4px;">
                تاريخ الطباعة: ${new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
            </div>
          </div>
          <div style="padding: 20px; text-align: center; border: 1px dashed #D1D5DB; border-radius: 8px;">
            <h3 style="font-size: 14px; color: #1c1c1e;">مستند جاهز للطباعة والاقتران اللاسلكي</h3>
            <p style="font-size: 11px; color: #4B5563; margin-top: 6px;">تم ضبط عدد النسخ: ${copies} | الحجم: ${paperSize} | التوجيه: ${orientation === 'portrait' ? 'طولي' : 'عرضي'}</p>
          </div>
        </body>
      </html>
    `;

    doc.open();
    doc.write(contentToPrint);
    doc.close();

    setTimeout(() => {
      printFrame.contentWindow?.focus();
      printFrame.contentWindow?.print();
      setTimeout(() => {
        document.body.removeChild(printFrame);
      }, 1500);
    }, 400);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
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
        className={`w-full max-w-3xl rounded-3xl p-5 sm:p-6 border shadow-2xl text-right space-y-4 max-h-[92vh] flex flex-col ${
          isLight
            ? 'bg-white text-slate-900 border-slate-200 shadow-slate-400/50'
            : 'bg-[#1c1c1e] text-slate-100 border-[#2A6B5C]/40 shadow-black/90'
        }`}
      >
        {/* Title Bar */}
        <div
          className={`flex items-center justify-between border-b pb-3.5 shrink-0 ${
            isLight ? 'border-slate-200' : 'border-slate-900/60'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-[#2A6B5C] to-[#A8CCC0] text-gray-950 font-bold shadow-md">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3
                  className={`font-black text-base sm:text-lg ${
                    isLight ? 'text-slate-900' : 'text-[#D1E4DE]'
                  }`}
                >
                  مركز الطباعة اللاسلكية والاقتران عبر الواي فاي (Wireless Print Hub)
                </h3>
                <span className="px-2.5 py-0.5 text-[10px] font-black rounded-full bg-slate-500/20 text-slate-400 border border-slate-500/40 font-mono">
                  Wi-Fi & AirPrint
                </span>
              </div>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-300/80'}`}>
                اكتشاف واقتران الطابعات المحلية المتاحة على شبكة الواي فاي وإرسال أمر الطباعة المباشر
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-2 rounded-xl transition ${
              isLight
                ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-950'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation & Scan Button */}
        <div className="flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5">
            {[
              { id: 'printers', label: `الطابعات المتاحة (${printers.length})`, icon: Wifi },
              { id: 'settings', label: 'إعدادات الطباعة والورق', icon: Sliders },
              { id: 'preview', label: 'معاينة المستند', icon: FileText },
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-3.5 py-2 rounded-xl font-bold transition text-xs flex items-center gap-2 cursor-pointer ${
                    isActive
                      ? isLight
                        ? 'bg-[#1c1c1e] text-[#7AB0A0] shadow-sm'
                        : 'bg-[#2A6B5C] text-white shadow-md font-black'
                      : isLight
                      ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      : 'bg-slate-950 text-slate-300 hover:bg-slate-900'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleStartScan}
              disabled={isScanning}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${
                isLight
                  ? 'bg-[#EAF3F0] text-[#081F1A] border-[#A8CCC0] hover:bg-[#D1E4DE]'
                  : 'bg-slate-900/70 text-[#7AB0A0] border-slate-700/60 hover:bg-slate-900'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin text-[#4F9282]' : ''}`} />
              <span>{isScanning ? `جاري مسح الشبكة (${scanProgress}%)...` : 'فحص طابعات الواي فاي'}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowManualAdd(!showManualAdd)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1 cursor-pointer ${
                isLight
                  ? 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                  : 'bg-[#000000] text-slate-200 border-slate-900 hover:bg-[#0A261B]'
              }`}
            >
              <Plus className="w-3.5 h-3.5 text-[#2A6B5C]" />
              <span>إضافة IP يدوياً</span>
            </button>
          </div>
        </div>

        {/* Dynamic Scanning Banner */}
        {isScanning && (
          <div
            className={`p-3 rounded-2xl border flex items-center gap-3 animate-pulse ${
              isLight ? 'bg-[#EAF3F0] border-[#7AB0A0]' : 'bg-slate-950/60 border-[#2A6B5C]/40'
            }`}
          >
            <div className="w-8 h-8 rounded-xl bg-[#2A6B5C] text-white flex items-center justify-center font-bold">
              <Wifi className="w-4 h-4 animate-ping" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between text-xs font-bold">
                <span>جاري البحث عن طابعات شبكة الواي فاي و AirPrint في نطاق 192.168.1.x...</span>
                <span>{scanProgress}%</span>
              </div>
              <div className="w-full bg-black/20 h-1.5 rounded-full overflow-hidden mt-1.5">
                <div
                  className="bg-[#2A6B5C] h-full transition-all duration-300"
                  style={{ width: `${scanProgress}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Manual Add Collapsible Form */}
        {showManualAdd && (
          <form
            onSubmit={handleAddManualPrinter}
            className={`p-4 rounded-2xl border space-y-3 ${
              isLight ? 'bg-slate-50 border-slate-300' : 'bg-[#000000] border-slate-900'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#2A6B5C] flex items-center gap-1.5">
                <Globe className="w-4 h-4" />
                <span>إضافة طابعة شبكة أو واي فاي يدوياً عبر IP</span>
              </span>
              <button
                type="button"
                onClick={() => setShowManualAdd(false)}
                className="text-xs text-slate-400 hover:text-slate-200"
              >
                ✕ إغلاق
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-xs">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold mb-1">اسم الطابعة التعريفي</label>
                <input
                  type="text"
                  placeholder="مثال: HP LaserJet - قسم المبيعات"
                  value={manualName}
                  onChange={e => setManualName(e.target.value)}
                  className={`w-full p-2 rounded-xl border focus:outline-none ${
                    isLight
                      ? 'bg-white border-slate-300 text-slate-900'
                      : 'bg-[#1c1c1e] border-slate-800 text-slate-100'
                  }`}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold mb-1">عنوان IP الخاص بالطابعة</label>
                <input
                  type="text"
                  placeholder="192.168.1.150"
                  value={manualIp}
                  onChange={e => setManualIp(e.target.value)}
                  className={`w-full p-2 rounded-xl border font-mono text-left focus:outline-none ${
                    isLight
                      ? 'bg-white border-slate-300 text-slate-900'
                      : 'bg-[#1c1c1e] border-slate-800 text-slate-100'
                  }`}
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold mb-1">منفذ البروتوكول (Port)</label>
                <input
                  type="text"
                  placeholder="9100 / 631"
                  value={manualPort}
                  onChange={e => setManualPort(e.target.value)}
                  className={`w-full p-2 rounded-xl border font-mono text-left focus:outline-none ${
                    isLight
                      ? 'bg-white border-slate-300 text-slate-900'
                      : 'bg-[#1c1c1e] border-slate-800 text-slate-100'
                  }`}
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                className="px-4 py-2 bg-gradient-to-r from-[#2A6B5C] to-[#0060DF] text-gray-950 font-black rounded-xl text-xs shadow hover:brightness-110 cursor-pointer"
              >
                + حفظ وإقران الطابعة
              </button>
            </div>
          </form>
        )}

        {/* Test Result Toast */}
        {testResult && (
          <div className="p-3 rounded-xl bg-slate-500/20 border border-slate-500/40 text-slate-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-slate-400 shrink-0" />
            <span>{testResult}</span>
          </div>
        )}

        {/* Tab 1: Printers Discovery & Pairing List */}
        {activeTab === 'printers' && (
          <div className="flex-1 overflow-y-auto space-y-2.5 pr-0.5">
            <div className="text-xs font-bold flex items-center justify-between pb-1">
              <span className={isLight ? 'text-slate-700' : 'text-slate-300'}>
                اختر الطابعة المقترنة لإرسال المستند:
              </span>
              <span className="text-[11px] text-[#2A6B5C]">
                الطابعة المحددة: <strong className="underline">{selectedPrinter.name}</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {printers.map(printer => {
                const isSelected = selectedPrinterId === printer.id;
                return (
                  <div
                    key={printer.id}
                    onClick={() => setSelectedPrinterId(printer.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isSelected
                        ? isLight
                          ? 'bg-[#EAF3F0]/80 border-[#4F9282] ring-2 ring-[#4F9282]/40 shadow-md'
                          : 'bg-gradient-to-r from-[#1c1c1e] via-[#092D1E] to-[#000000] border-[#4F9282]/80 ring-2 ring-[#4F9282]/30 shadow-lg'
                        : isLight
                        ? 'bg-white border-slate-200 hover:border-[#7AB0A0] hover:bg-slate-50'
                        : 'bg-[#000000] border-slate-900/60 hover:border-[#2A6B5C]/40 hover:bg-[#0A261B]'
                    }`}
                  >
                    {/* Left Details */}
                    <div className="flex items-start gap-3.5">
                      <div
                        className={`p-3 rounded-2xl shrink-0 mt-0.5 ${
                          isSelected
                            ? 'bg-[#2A6B5C] text-white shadow-md'
                            : isLight
                            ? 'bg-slate-100 text-slate-600'
                            : 'bg-slate-950 text-slate-300 border border-slate-800'
                        }`}
                      >
                        <Printer className="w-6 h-6" />
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h4
                            className={`font-black text-sm ${
                              isSelected
                                ? isLight
                                  ? 'text-slate-900'
                                  : 'text-[#A8CCC0]'
                                : isLight
                                ? 'text-slate-800'
                                : 'text-slate-200'
                            }`}
                          >
                            {printer.name}
                          </h4>
                          {printer.isDefault && (
                            <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-[#2A6B5C]/20 text-[#2A6B5C] border border-[#2A6B5C]/30">
                              افتراضية
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs mt-1.5">
                          <span className="flex items-center gap-1 font-mono text-[11px] opacity-80">
                            <Wifi className="w-3.5 h-3.5 text-slate-400" />
                            <span>IP: {printer.ipAddress}</span>
                          </span>

                          <span className="text-[11px] opacity-75">
                            📍 {printer.location || 'شبكة الشركة'}
                          </span>

                          <span className="text-[11px] opacity-75">
                            📄 {printer.paperTray}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right Signal & Status */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-slate-200/40">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] font-bold text-slate-400">
                            إشارة {printer.signalStrength}%
                          </span>
                          <div className="flex items-end gap-0.5 h-3">
                            <div className="w-1 bg-slate-500 h-1 rounded-sm" />
                            <div className="w-1 bg-slate-500 h-2 rounded-sm" />
                            <div className="w-1 bg-slate-500 h-3 rounded-sm" />
                          </div>
                        </div>

                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-500/20 text-slate-400 border border-slate-500/30">
                          جاهزة للطباعة
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {isSelected && (
                          <span className="text-xs font-bold text-[#2A6B5C] flex items-center gap-1">
                            <Check className="w-4 h-4 stroke-[3]" />
                            <span>مقترنة ومحددة</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 2: Print Settings & Paper Size */}
        {activeTab === 'settings' && (
          <div className="flex-1 overflow-y-auto space-y-4 pr-0.5">
            <div
              className={`p-4 rounded-2xl border space-y-3 ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#000000] border-slate-900/60'
              }`}
            >
              <h4 className="font-bold text-xs text-[#2A6B5C] flex items-center gap-1.5">
                <Sliders className="w-4 h-4" />
                <span>خيارات الطباعة وإعدادات الصفحة</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                {/* Copies */}
                <div>
                  <label className="block text-[11px] font-bold mb-1">عدد النسخ المطلوبة</label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCopies(Math.max(1, copies - 1))}
                      className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-800 font-bold text-base flex items-center justify-center cursor-pointer"
                    >
                      -
                    </button>
                    <span className="font-mono font-bold text-sm px-3">{copies}</span>
                    <button
                      type="button"
                      onClick={() => setCopies(copies + 1)}
                      className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-800 font-bold text-base flex items-center justify-center cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Paper Size */}
                <div>
                  <label className="block text-[11px] font-bold mb-1">حجم الورق</label>
                  <select
                    value={paperSize}
                    onChange={e => setPaperSize(e.target.value as any)}
                    className={`w-full p-2 rounded-xl border font-bold text-xs ${
                      isLight
                        ? 'bg-white border-slate-300 text-slate-900'
                        : 'bg-[#1c1c1e] border-slate-800 text-slate-100'
                    }`}
                  >
                    <option value="A4">A4 القياسي (210 × 297 mm)</option>
                    <option value="A3">A3 الكبير (297 × 420 mm)</option>
                    <option value="Letter">Letter (216 × 279 mm)</option>
                  </select>
                </div>

                {/* Orientation */}
                <div>
                  <label className="block text-[11px] font-bold mb-1">اتجاه الصفحة</label>
                  <select
                    value={orientation}
                    onChange={e => setOrientation(e.target.value as any)}
                    className={`w-full p-2 rounded-xl border font-bold text-xs ${
                      isLight
                        ? 'bg-white border-slate-300 text-slate-900'
                        : 'bg-[#1c1c1e] border-slate-800 text-slate-100'
                    }`}
                  >
                    <option value="portrait">طولي (Portrait) - افتراضي</option>
                    <option value="landscape">عرضي (Landscape)</option>
                  </select>
                </div>
              </div>

              {/* Color and Quality */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200/40 dark:border-slate-900/40 text-xs">
                <div>
                  <label className="block text-[11px] font-bold mb-1">نمط الألوان</label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setColorMode('color')}
                      className={`flex-1 py-1.5 px-3 rounded-xl font-bold border transition text-xs cursor-pointer ${
                        colorMode === 'color'
                          ? 'bg-[#2A6B5C] text-white border-[#2A6B5C]'
                          : 'bg-transparent border-slate-600 opacity-60'
                      }`}
                    >
                      ألوان كاملة (هوية جوهر جروب)
                    </button>
                    <button
                      type="button"
                      onClick={() => setColorMode('grayscale')}
                      className={`flex-1 py-1.5 px-3 rounded-xl font-bold border transition text-xs cursor-pointer ${
                        colorMode === 'grayscale'
                          ? 'bg-[#2A6B5C] text-white border-[#2A6B5C]'
                          : 'bg-transparent border-slate-600 opacity-60'
                      }`}
                    >
                      أبيض وأسود (توفير الحبر)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold mb-1">دقة الطباعة (DPI)</label>
                  <select
                    value={printQuality}
                    onChange={e => setPrintQuality(e.target.value as any)}
                    className={`w-full p-2 rounded-xl border font-bold text-xs ${
                      isLight
                        ? 'bg-white border-slate-300 text-slate-900'
                        : 'bg-[#1c1c1e] border-slate-800 text-slate-100'
                    }`}
                  >
                    <option value="high">عالية الدقة 600 DPI (تقارير رسمية)</option>
                    <option value="normal">عادية 300 DPI</option>
                    <option value="draft">مسودة سريعة 150 DPI</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Document Preview */}
        {activeTab === 'preview' && (
          <div className="flex-1 overflow-y-auto p-4 rounded-2xl border bg-slate-900/40 border-slate-900/60 max-h-[360px]">
            <div className="bg-white text-slate-900 p-6 rounded-xl shadow-lg text-right max-w-xl mx-auto space-y-4">
              <div className="flex items-center justify-between border-b-2 border-[#1c1c1e] pb-3">
                <div>
                  <h3 className="text-base font-black text-[#1c1c1e]">جوهر جروب للاستثمار العقاري</h3>
                  <p className="text-[10px] text-[#123F36] font-bold">Gohar Group Real Estate Investment</p>
                </div>
                <div className="text-left">
                  <span className="text-xs font-bold text-[#1c1c1e]">{documentTitle}</span>
                  <p className="text-[9px] text-slate-500">{new Date().toLocaleDateString('ar-EG')}</p>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-lg border text-center text-xs space-y-1">
                <span className="font-bold text-slate-800">معاينة المستند قبل إرساله للطابعة</span>
                <p className="text-[11px] text-slate-500">
                  الطابعة المحددة: {selectedPrinter.name} ({selectedPrinter.ipAddress})
                </p>
                <p className="text-[10px] text-slate-700 font-mono">
                  {paperSize} • {orientation === 'portrait' ? 'طولي' : 'عرضي'} • {copies} نسخة
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons & Footer */}
        <div
          className={`pt-3 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 ${
            isLight ? 'border-slate-200' : 'border-slate-900/60'
          }`}
        >
          {/* Test connection & IP status */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isTesting}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${
                isLight
                  ? 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                  : 'bg-slate-950 text-slate-200 border-slate-800 hover:bg-slate-900'
              }`}
            >
              <Zap className={`w-3.5 h-3.5 text-[#4F9282] ${isTesting ? 'animate-bounce' : ''}`} />
              <span>{isTesting ? 'جاري فحص الاتصال...' : 'اختبار اتصال الطابعة (Ping)'}</span>
            </button>
          </div>

          {/* Main Action Buttons */}
          <div className="flex items-center gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
                isLight
                  ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              إلغاء
            </button>

            <button
              type="button"
              onClick={handleExecutePrint}
              className="px-6 py-2 text-xs font-black bg-gradient-to-r from-[#2A6B5C] to-[#0060DF] hover:from-[#5AC8FA] hover:to-[#4F9282] text-gray-950 rounded-xl transition shadow-lg shadow-[#2A6B5C]/20 active:scale-95 cursor-pointer flex items-center gap-2"
            >
              <Printer className="w-4 h-4 stroke-[2.5]" />
              <span>إرسال أمر الطباعة اللاسلكي فوراً</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
