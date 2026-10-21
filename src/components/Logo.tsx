import React from 'react';
import { useApp } from '../context/AppContext';

interface LogoProps {
  className?: string;
  showText?: boolean;
  variant?: 'light' | 'dark' | 'full-color';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  customImage?: string | null;
  customTitle?: string;
  customSubtitle?: string;
}

export const Logo: React.FC<LogoProps> = ({
  className = '',
  showText = true,
  variant = 'full-color',
  size = 'md',
  customImage,
  customTitle,
  customSubtitle,
}) => {
  let appState: any = null;
  try {
    appState = useApp();
  } catch (e) {
    // Graceful fallback if Logo rendered outside AppProvider
  }

  const activeCustomImage = customImage !== undefined ? customImage : appState?.customLogoUrl;
  const activeTitle = customTitle || appState?.companyTitle || 'جوهر جروب للتطوير العقاري';
  const activeSubtitle = customSubtitle || appState?.companySubtitle || 'Gohar Group for Real Estate Development';

  const sizeMap = {
    sm: { icon: 'h-8 w-8', title: 'text-xs', sub: 'text-[8px]', gap: 'gap-2' },
    md: { icon: 'h-12 w-12', title: 'text-sm sm:text-base font-bold', sub: 'text-[9px] sm:text-[10px]', gap: 'gap-3' },
    lg: { icon: 'h-16 w-16', title: 'text-lg sm:text-xl font-extrabold', sub: 'text-xs', gap: 'gap-4' },
    xl: { icon: 'h-24 w-24', title: 'text-2xl sm:text-3xl font-black', sub: 'text-sm', gap: 'gap-5' },
  };

  const { icon, title, sub, gap } = sizeMap[size];

  return (
    <div className={`flex items-center ${gap} select-none ${className}`}>
      {/* Emblem Icon / Custom Logo Image */}
      <div className={`relative flex items-center justify-center shrink-0 ${icon}`}>
        {activeCustomImage ? (
          <div className="w-full h-full rounded-lg overflow-hidden border-2 border-[#4F9282] shadow-lg bg-[#1c1c1e] p-0.5">
            <img
              src={activeCustomImage}
              alt={activeTitle}
              width={64}
              height={64}
              decoding="async"
              fetchPriority="high"
              className="w-full h-full object-contain"
            />
          </div>
        ) : (
          <svg viewBox="0 0 240 240" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-xl">
            <defs>
              {/* Outer Hexagon Bevel Gradient */}
              <linearGradient id="goharOuterGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFF2B2" />
                <stop offset="25%" stopColor="#E0B746" />
                <stop offset="50%" stopColor="#B38728" />
                <stop offset="75%" stopColor="#FBF5B7" />
                <stop offset="100%" stopColor="#996E19" />
              </linearGradient>

              {/* Inner G Ring Gradient */}
              <linearGradient id="goharInnerGrad" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FBF5B7" />
                <stop offset="35%" stopColor="#AA771C" />
                <stop offset="70%" stopColor="#FFDF73" />
                <stop offset="100%" stopColor="#664600" />
              </linearGradient>

              {/* 3D Shadow Highlight */}
              <filter id="goldGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000000" floodOpacity="0.5" />
              </filter>
            </defs>

            <g filter="url(#goldGlow)">
              {/* Outer Thick Hexagon Frame */}
              <polygon
                points="120,12 215,67 215,173 120,228 25,173 25,67"
                fill="none"
                stroke="url(#goharOuterGrad)"
                strokeWidth="14"
                strokeLinejoin="round"
              />
              {/* Inner Hexagon Outline for 3D Bevel depth */}
              <polygon
                points="120,26 201,73 201,167 120,214 39,167 39,73"
                fill="none"
                stroke="#5C4300"
                strokeWidth="3"
                strokeLinejoin="round"
                opacity="0.8"
              />

              {/* Inner Hexagonal 'G' Ribbon Structure */}
              <polygon
                points="120,44 180,78 180,105 120,71 60,105 60,78"
                fill="url(#goharInnerGrad)"
              />
              <polygon
                points="60,78 60,162 82,150 82,90 120,68 120,44"
                fill="url(#goharOuterGrad)"
              />
              <polygon
                points="60,162 120,196 180,162 180,135 120,169 82,148 82,122 120,144 180,110 180,135"
                fill="url(#goharInnerGrad)"
              />
              <polygon
                points="120,110 180,110 180,130 135,130 135,140 115,130 120,110"
                fill="url(#goharOuterGrad)"
              />
              <polygon
                points="135,120 180,120 180,135 135,135"
                fill="url(#goharInnerGrad)"
              />
            </g>
          </svg>
        )}
      </div>

      {showText && (
        <div className="flex flex-col text-right justify-center leading-tight min-w-0">
          {/* Main Gold Arabic Title */}
          <span
            className={`font-bold font-arabic tracking-tight ${title} ${size === 'sm' ? 'truncate max-w-[9.5rem] sm:max-w-none' : ''}`}
            style={{
              background: 'linear-gradient(180deg, #FFF099 0%, #2A6B5C 50%, #997314 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontFamily: "'Cairo', 'Segoe UI', Tahoma, sans-serif",
              filter: 'drop-shadow(0px 1px 2px rgba(0,0,0,0.4))',
            }}
          >
            {activeTitle}
          </span>

          {/* Golden Horizontal Separator with Diamond */}
          <div className={`my-1 items-center gap-1.5 w-full opacity-90 ${size === 'sm' ? 'hidden sm:flex' : 'flex'}`}>
            <div className="h-[1px] flex-1 bg-gradient-to-l from-[#2A6B5C] via-[#FFE599] to-transparent" />
            <div className="w-1.5 h-1.5 rotate-45 bg-[#2A6B5C] border border-[#FFF2B2] shrink-0" />
            <div className="h-[1px] flex-1 bg-gradient-to-r from-[#2A6B5C] via-[#FFE599] to-transparent" />
          </div>

          {/* Gold English Subtitle */}
          <span
            className={`font-semibold tracking-wider ${sub} uppercase font-sans ${size === 'sm' ? 'hidden sm:block' : ''}`}
            style={{
              background: 'linear-gradient(180deg, #FFE599 0%, #4F9282 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '0.08em',
            }}
          >
            {activeSubtitle}
          </span>
        </div>
      )}
    </div>
  );
};

