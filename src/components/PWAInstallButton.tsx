import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Monitor, Smartphone, X, CheckCircle, Share2, PlusSquare } from 'lucide-react';

interface PWAInstallButtonProps {
  variant?: 'button' | 'compact' | 'header';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'button' }) => {
  const { isInstallable, isInstalled, isIOS, isStandalone, install } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  // If already running as installed desktop or mobile app, hide install CTA
  if (isInstalled || isStandalone) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      const accepted = await install();
      if (accepted) {
        setInstallSuccess(true);
        setTimeout(() => setInstallSuccess(false), 4000);
      }
    } else if (isIOS) {
      setShowIOSModal(true);
    } else {
      // Direct instruction fallback for unsupported or already prompted desktop browsers
      alert('لتثبيت تطبيق سطح المكتب المستقل:\nاضغط على أيقونة التثبيت (➕ أو 💻) الموجودة في شريط عنوان المتصفح، أو من قائمة المتصفح اختر "تثبيت جوهر CRM كبرنامج".');
    }
  };

  return (
    <>
      {variant === 'header' ? (
        <button
          type="button"
          onClick={handleInstallClick}
          className="px-2.5 py-1.5 bg-gradient-to-r from-[#2A6B5C]/20 to-yellow-500/10 hover:from-[#2A6B5C]/30 hover:to-yellow-500/20 text-[#A8CCC0] border border-[#2A6B5C]/40 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
          title="تثبيت التطبيق على الكمبيوتر أو الموبايل بدون شريط المتصفح"
        >
          <Monitor className="w-3.5 h-3.5 text-[#4F9282]" />
          <span className="hidden md:inline">تثبيت التطبيق (Desktop App)</span>
          <span className="md:hidden">تثبيت</span>
        </button>
      ) : variant === 'compact' ? (
        <button
          type="button"
          onClick={handleInstallClick}
          className="p-2 rounded-xl bg-[#2A6B5C]/10 text-[#7AB0A0] border border-[#2A6B5C]/30 hover:bg-[#2A6B5C]/20 transition flex items-center justify-center cursor-pointer"
          title="تثبيت البرنامج كـ Desktop / Mobile App"
        >
          <Download className="w-4 h-4" />
        </button>
      ) : (
        <button
          type="button"
          onClick={handleInstallClick}
          className="w-full py-2.5 px-4 bg-[#2A6B5C] hover:bg-[#7AB0A0] text-white font-black text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
        >
          <Monitor className="w-4 h-4" />
          <span>تثبيت البرنامج على سطح المكتب (Desktop App)</span>
        </button>
      )}

      {/* iOS Safari Guide Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#000000] border border-[#2A6B5C]/40 rounded-2xl p-6 max-w-sm w-full text-slate-100 shadow-2xl space-y-4 text-right">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2 text-[#7AB0A0] font-bold text-sm">
                <Smartphone className="w-5 h-5 text-[#4F9282]" />
                <span>تثبيت التطبيق على iPhone / iPad</span>
              </div>
              <button
                type="button"
                onClick={() => setShowIOSModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              لتشغيل البرنامج كتطبيق مستقل على هاتفك وبدون شريط عنوان المتصفح:
            </p>

            <div className="space-y-2.5 text-xs text-[#D1E4DE]/90 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/50">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#2A6B5C] text-white font-black flex items-center justify-center text-[10px]">1</span>
                <span>اضغط على زر المشاركة <Share2 className="w-3.5 h-3.5 inline text-[#4F9282]" /> في أسفل متصفح Safari.</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#2A6B5C] text-white font-black flex items-center justify-center text-[10px]">2</span>
                <span>مرر للأسفل واختر <strong>إضافة إلى الصفحة الرئيسية (Add to Home Screen)</strong> <PlusSquare className="w-3.5 h-3.5 inline text-[#4F9282]" />.</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#2A6B5C] text-white font-black flex items-center justify-center text-[10px]">3</span>
                <span>اضغط على <strong>إضافة (Add)</strong> في الزاوية العلوية.</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIOSModal(false)}
              className="w-full py-2 rounded-xl bg-[#2A6B5C] hover:bg-[#7AB0A0] text-white font-black text-xs transition cursor-pointer"
            >
              تم الفهم
            </button>
          </div>
        </div>
      )}
    </>
  );
};
