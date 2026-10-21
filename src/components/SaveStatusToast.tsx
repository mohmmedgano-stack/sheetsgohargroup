import React, { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';

export const SaveStatusToast: React.FC = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let hideTimer: ReturnType<typeof setTimeout> | null = null;

    const handleError = () => {
      setVisible(true);
      if (hideTimer) clearTimeout(hideTimer);
      hideTimer = setTimeout(() => setVisible(false), 6000);
    };
    const handleOk = () => {
      setVisible(false);
      if (hideTimer) clearTimeout(hideTimer);
    };

    window.addEventListener('gohar:save-error', handleError);
    window.addEventListener('gohar:save-ok', handleOk);
    return () => {
      window.removeEventListener('gohar:save-error', handleError);
      window.removeEventListener('gohar:save-ok', handleOk);
      if (hideTimer) clearTimeout(hideTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-[9999] px-4 py-2.5 rounded-full bg-[var(--ios-red,#FF3B30)] text-white text-xs font-bold shadow-lg flex items-center gap-2 animate-fadeIn">
      <WifiOff className="w-4 h-4 shrink-0" />
      <span>تعذر حفظ آخر تعديل - تحقق من الاتصال بالإنترنت</span>
    </div>
  );
};
