import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface CollapsibleSectionProps {
  title: string;
  icon?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

// Wraps a dashboard section behind a clickable header. Keeps everything that
// was there before - nothing removed, just collapsed by default so the page
// isn't overwhelming on first load. One click reveals the full section.
export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  icon,
  defaultOpen = false,
  children,
}) => {
  const { themeMode } = useApp();
  const isLight = themeMode === 'light';
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={`rounded-2xl border overflow-hidden transition-all ${
      isLight ? 'bg-white border-slate-200' : 'bg-[#2c2c2e] border-slate-800'
    }`}>
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className={`w-full p-4 flex items-center justify-between gap-3 text-right transition ${
          isLight ? 'hover:bg-slate-50' : 'hover:bg-black/20'
        }`}
      >
        <span className={`flex items-center gap-2 text-sm font-bold ${
          isLight ? 'text-slate-900' : 'text-[#D1E4DE]'
        }`}>
          {icon}
          <span>{title}</span>
        </span>
        <ChevronDown
          className={`w-4 h-4 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''} ${
            isLight ? 'text-slate-500' : 'text-slate-400'
          }`}
        />
      </button>

      {isOpen && (
        <div className="px-4 pb-4 sm:px-5 sm:pb-5 animate-fadeIn">
          {children}
        </div>
      )}
    </div>
  );
};
