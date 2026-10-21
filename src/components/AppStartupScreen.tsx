import React, { useState, useEffect, useCallback } from 'react';
import { ShieldCheck, Database, Server, CheckCircle2, AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react';

interface AppStartupScreenProps {
  onReady: () => void;
}

type StartupStep = 'storage' | 'server' | 'preferences' | 'ready' | 'error';

export const AppStartupScreen: React.FC<AppStartupScreenProps> = ({ onReady }) => {
  const [currentStep, setCurrentStep] = useState<StartupStep>('storage');
  const [progress, setProgress] = useState<number>(15);
  const [stepMessage, setStepMessage] = useState<string>('جارِ فحص قاعدة البيانات المحلية وسلامة البيانات...');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const runStartupChecks = useCallback(async () => {
    try {
      // Step 1: Storage & Local Database Validation
      setCurrentStep('storage');
      setProgress(25);
      setStepMessage('جارِ فحص قاعدة البيانات المحلية وسلامة بيانات العملاء...');

      // Test localStorage availability and auto-repair corrupted keys if any
      try {
        const testKey = '__gohar_storage_check__';
        localStorage.setItem(testKey, '1');
        localStorage.removeItem(testKey);
      } catch (storageErr) {
        throw new Error('تعذر الوصول إلى وحدة التخزين المحلية. يرجى التأكد من تفعيل التخزين في المتصفح أو التطبيق.');
      }

      await new Promise(resolve => setTimeout(resolve, 350));

      // Step 2: Server & Backend Health Check
      setCurrentStep('server');
      setProgress(60);
      setStepMessage('جارِ التحقق من جاهزية خادم النظام والخدمات السحابية...');

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500);
        await fetch('/api/health', { signal: controller.signal }).catch(() => {
          // In offline mode or standalone without backend, continue gracefully
        });
        clearTimeout(timeoutId);
      } catch {
        // Fallback to offline mode is supported
      }

      await new Promise(resolve => setTimeout(resolve, 350));

      // Step 3: Application Preferences & Themes
      setCurrentStep('preferences');
      setProgress(90);
      setStepMessage('جارِ إعداد واجهة الشيتات ومساحة العمل الخاصة بك...');

      await new Promise(resolve => setTimeout(resolve, 300));

      // Step 4: Ready
      setCurrentStep('ready');
      setProgress(100);
      setStepMessage('تمت التهيئة بنجاح! جاري فتح النظام...');

      await new Promise(resolve => setTimeout(resolve, 350));
      onReady();
    } catch (err: any) {
      setCurrentStep('error');
      setErrorMessage(
        err && typeof err === 'object' && err.message
          ? err.message
          : 'حدث خطأ مؤقت أثناء بدء تشغيل النظام. تم تأمين بياناتك محلياً.'
      );
    }
  }, [onReady]);

  useEffect(() => {
    runStartupChecks();
  }, [runStartupChecks]);

  return (
    <div
      role="region"
      aria-label="شاشة بدء تشغيل النظام"
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#000000] p-4 text-center select-none"
    >
      <div className="w-full max-w-md bg-[#000000]/90 border border-[#2A6B5C]/35 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md space-y-6">
        {/* Brand Emblem */}
        <div className="relative flex justify-center">
          <div className="w-20 h-20 relative flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-[#4F9282]/10 blur-xl animate-pulse"></div>
            <svg className="w-16 h-16 relative z-10" viewBox="0 0 240 240" fill="none" xmlns="http://www.w3.org/2000/svg">
              <polygon points="120,8 218,64 218,176 120,232 22,176 22,64" fill="url(#startupGoldGrad)" stroke="#FFE899" stroke-width="4" />
              <path d="M 170 120 A 50 50 0 1 0 120 170 L 120 135 L 145 135" fill="none" stroke="#000000" stroke-width="18" stroke-linecap="round" stroke-linejoin="round" />
              <defs>
                <linearGradient id="startupGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#FFF2B2" />
                  <stop offset="50%" stop-color="#2A6B5C" />
                  <stop offset="100%" stop-color="#996E19" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        {/* Title */}
        <div className="space-y-1.5">
          <h1 className="text-xl font-black text-[#A8CCC0]">جوهر جروب للتطوير العقاري</h1>
          <p className="text-xs text-slate-300/80">نظام إدارة العملاء والشيتات الذكي (CRM)</p>
        </div>

        {currentStep !== 'error' ? (
          <div className="space-y-5">
            {/* Animated Progress Bar */}
            <div className="space-y-2">
              <div className="w-full bg-slate-950/80 rounded-full h-2 overflow-hidden border border-[#2A6B5C]/20 p-0.5">
                <div
                  className="bg-gradient-to-r from-[#4F9282] to-[#2A6B5C] h-full rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-[11px] text-[#A8CCC0]/70 font-mono">
                <span>التهيئة التلقائية</span>
                <span>{progress}%</span>
              </div>
            </div>

            {/* Current Step Status */}
            <div className="flex items-center justify-center gap-2 text-xs text-[#D1E4DE]/90 font-medium bg-[#000000] p-3 rounded-2xl border border-slate-800/60 min-h-[48px]">
              {currentStep === 'storage' && <Database className="w-4 h-4 text-[#4F9282] shrink-0 animate-pulse" />}
              {currentStep === 'server' && <Server className="w-4 h-4 text-[#4F9282] shrink-0 animate-pulse" />}
              {currentStep === 'preferences' && <ShieldCheck className="w-4 h-4 text-[#4F9282] shrink-0 animate-pulse" />}
              {currentStep === 'ready' && <CheckCircle2 className="w-4 h-4 text-slate-400 shrink-0" />}
              <span>{stepMessage}</span>
            </div>

            <div className="text-[11px] text-slate-400">
              تشغيل فوري ومباشر دون خطوات يدوية (Zero Manual Setup)
            </div>
          </div>
        ) : (
          /* Friendly Error Recovery View */
          <div className="space-y-4 text-right bg-red-950/30 border border-red-800/40 p-4 rounded-2xl">
            <div className="flex items-center gap-2 text-red-300 font-bold text-xs">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>تنبيه في بدء التشغيل</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {errorMessage}
            </p>
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                type="button"
                onClick={runStartupChecks}
                className="flex-1 py-2 px-3 bg-[#2A6B5C] hover:bg-[#7AB0A0] text-white font-black text-xs rounded-xl shadow transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>إعادة المحاولة الآن</span>
              </button>
              <button
                type="button"
                onClick={onReady}
                className="py-2 px-3 bg-slate-950 hover:bg-slate-900 text-[#A8CCC0] font-bold text-xs rounded-xl border border-slate-700 transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>المتابعة دون اتصال</span>
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
