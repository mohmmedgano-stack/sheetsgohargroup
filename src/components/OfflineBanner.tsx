import React from 'react';
import { WifiOff, RefreshCw, CheckCircle2 } from 'lucide-react';

interface OfflineBannerProps {
  isOnline: boolean;
  isReconnecting: boolean;
  onRetry: () => void;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({
  isOnline,
  isReconnecting,
  onRetry,
}) => {
  if (isOnline) return null;

  return (
    <aside
      aria-label="حالة الاتصال بالإنترنت"
      className="fixed bottom-16 sm:bottom-4 left-3 right-3 sm:left-auto sm:right-4 z-50 max-w-md bg-[#041310]/95 border border-[#2A6B5C]/50 text-[#D1E4DE] p-3 rounded-2xl shadow-2xl backdrop-blur-md transition-all duration-300 animate-in slide-in-from-bottom-4"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-2 rounded-xl bg-[#2A6B5C]/20 text-[#7AB0A0] shrink-0">
            <WifiOff className="w-4 h-4 animate-pulse" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-black text-[#A8CCC0] flex items-center gap-1.5">
              <span>أنت في وضع عدم الاتصال (Offline)</span>
              <span className="inline-block w-2 h-2 rounded-full bg-[#4F9282] animate-ping"></span>
            </div>
            <p className="text-[11px] text-[#A8CCC0]/80 truncate">
              البيانات والتعديلات محفوظة محلياً بأمان تام وسيتم المزامنة تلقائياً.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onRetry}
          disabled={isReconnecting}
          className="shrink-0 px-3 py-1.5 bg-[#2A6B5C] hover:bg-[#7AB0A0] text-white text-xs font-black rounded-xl transition flex items-center gap-1 shadow cursor-pointer active:scale-95 disabled:opacity-50"
          title="إعادة فحص الاتصال بالخادم الآن"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isReconnecting ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">إعادة المحاولة</span>
        </button>
      </div>
    </aside>
  );
};
