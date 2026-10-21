import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ClientLead } from '../types';
import {
  MapPin,
  Navigation,
  Car,
  Clock,
  ExternalLink,
  X,
  Compass,
  Building2,
  Share2,
  CheckCircle,
} from 'lucide-react';

interface LocationMapModalProps {
  isOpen: boolean;
  client: ClientLead | null;
  onClose: () => void;
}

// Company Headquarters: Gohar Group Main HQ, Mansoura & New Cairo Branch
const COMPANY_HQ = {
  name: 'المقر الرئيسي لشركة جوهر جروب',
  address: 'المنصورة - برج جوهر الإداري / فرع التجمع الخامس بالقاهرة',
  lat: 31.0409,
  lng: 31.3785,
};

// Known Project coordinates database
const PROJECT_COORDS: Record<string, { lat: number; lng: number; label: string; kmFromHQ: number; driveMins: number }> = {
  'Wada Bay رأس الحكمة': {
    lat: 31.0667,
    lng: 27.8500,
    label: 'رأس الحكمة - الساحل الشمالي (الكيلو 200 طريق الإسكندرية مطروح)',
    kmFromHQ: 345,
    driveMins: 210,
  },
  'كمبوند نايل هابي لاند طلخا': {
    lat: 31.0538,
    lng: 31.3742,
    label: 'طلخا - كورنيش النيل مباشرة أمام نادي التجديف',
    kmFromHQ: 4,
    driveMins: 10,
  },
  'مول الهابي لاند الطبي Health Capital': {
    lat: 31.0425,
    lng: 31.3850,
    label: 'المنصورة - مجمع الهابي لاند الطبي والتجاري الفاخر',
    kmFromHQ: 2,
    driveMins: 6,
  },
  'جوهر ريزيدنس التجمع الخامس': {
    lat: 30.0131,
    lng: 31.4913,
    label: 'القاهرة الجديدة - التجمع الخامس - بالقرب من المستثمرين الجنوبية',
    kmFromHQ: 135,
    driveMins: 105,
  },
};

export const LocationMapModal: React.FC<LocationMapModalProps> = ({
  isOpen,
  client,
  onClose,
}) => {
  const { themeMode } = useApp();
  const isLight = themeMode === 'light';

  const [copied, setCopied] = useState(false);

  if (!isOpen || !client) return null;

  const projectData = PROJECT_COORDS[client.projectName] || {
    lat: 31.0409,
    lng: 31.3785,
    label: client.address || client.projectName,
    kmFromHQ: 25,
    driveMins: 30,
  };

  const mapEmbedUrl = `https://maps.google.com/maps?q=${projectData.lat},${projectData.lng}&hl=ar&z=14&output=embed`;
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&origin=${COMPANY_HQ.lat},${COMPANY_HQ.lng}&destination=${projectData.lat},${projectData.lng}`;

  const handleShareLocation = () => {
    const text = `موقع مشروع ${client.projectName} لشركة جوهر جروب:\n${projectData.label}\nرابط خرائط جوجل: ${directionsUrl}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4" dir="rtl">
      <div className={`relative w-full max-w-2xl rounded-3xl border-2 shadow-2xl overflow-hidden transition-all max-h-[92vh] flex flex-col ${
        isLight
          ? 'bg-white border-[#4F9282]/60 text-slate-900 shadow-slate-400/50'
          : 'bg-[#000000] border-[#2A6B5C]/60 text-slate-100 shadow-2xl'
      }`}>
        
        {/* Header */}
        <div className={`p-5 border-b flex items-center justify-between shrink-0 ${
          isLight
            ? 'bg-gradient-to-r from-[#EAF3F0] to-slate-50 border-slate-200'
            : 'bg-gradient-to-r from-[#1c1c1e] to-[#000000] border-[#2A6B5C]/30'
        }`}>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-[#2A6B5C] to-[#2A6B5C] text-gray-950 rounded-2xl shadow-lg">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <h3 className={`text-base sm:text-lg font-black ${isLight ? 'text-[#1c1c1e]' : 'text-[#7AB0A0]'}`}>
                موقع المشروع والعميل وحساب المسافة للمعاينة
              </h3>
              <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-200/80'}`}>
                مشروع: <strong className="text-[#4F9282] font-bold">{client.projectName}</strong> | العميل: {client.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-xl transition ${isLight ? 'hover:bg-slate-200 text-slate-500' : 'hover:bg-slate-900 text-slate-300'}`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
          
          {/* Distance & Travel Estimation Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            
            {/* Distance from HQ */}
            <div className={`p-3.5 rounded-2xl border flex items-center gap-3 ${
              isLight
                ? 'bg-slate-50/80 border-slate-200 text-slate-950'
                : 'bg-[#1c1c1e]/80 border-slate-500/30 text-slate-100'
            }`}>
              <div className="p-2.5 rounded-xl bg-slate-500/20 text-slate-400">
                <Navigation className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] opacity-80 block">المسافة من مقر العمل:</span>
                <span className="text-base font-black font-mono">{projectData.kmFromHQ} كم</span>
              </div>
            </div>

            {/* Driving Time */}
            <div className={`p-3.5 rounded-2xl border flex items-center gap-3 ${
              isLight
                ? 'bg-[#EAF3F0]/80 border-[#A8CCC0] text-[#041310]'
                : 'bg-[#1c1c1e]/80 border-[#2A6B5C]/30 text-[#A8CCC0]'
            }`}>
              <div className="p-2.5 rounded-xl bg-[#2A6B5C]/20 text-[#4F9282]">
                <Car className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] opacity-80 block">الوقت التقديري بالسيارة:</span>
                <span className="text-base font-black">
                  {Math.floor(projectData.driveMins / 60) > 0 ? `${Math.floor(projectData.driveMins / 60)} ساعة و ` : ''}
                  {projectData.driveMins % 60} دقيقة
                </span>
              </div>
            </div>

            {/* Meeting & Site Visit Readiness */}
            <div className={`p-3.5 rounded-2xl border flex items-center gap-3 ${
              isLight
                ? 'bg-[#EAF3F0]/80 border-[#A8CCC0] text-[#041310]'
                : 'bg-[#1c1c1e]/80 border-[#2A6B5C]/30 text-[#A8CCC0]'
            }`}>
              <div className="p-2.5 rounded-xl bg-[#2A6B5C]/20 text-[#4F9282]">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] opacity-80 block">جاهزية المعاينة:</span>
                <span className="text-sm font-black text-slate-400">متاح للزيارات الميدانية ✅</span>
              </div>
            </div>

          </div>

          {/* Location Address Details */}
          <div className={`p-3.5 rounded-2xl border text-xs space-y-1.5 ${
            isLight
              ? 'bg-slate-50 border-slate-200 text-slate-800'
              : 'bg-[#000000] border-[#2A6B5C]/20 text-slate-100'
          }`}>
            <div className="flex items-center gap-2 text-[#4F9282] font-bold">
              <Compass className="w-4 h-4" />
              <span>عنوان الموقع والوصف التفصيلي:</span>
            </div>
            <p className="font-medium text-xs leading-relaxed opacity-95">{projectData.label}</p>
            <p className="text-[11px] opacity-70">عنوان العميل المسجل: {client.address || 'القاهرة / الدقهلية'}</p>
          </div>

          {/* Interactive Google Map Embed */}
          <div className="w-full h-64 sm:h-72 rounded-2xl overflow-hidden border-2 border-[#2A6B5C]/40 shadow-inner relative">
            <iframe
              title={`خريطة موقع ${client.projectName}`}
              src={mapEmbedUrl}
              className="w-full h-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          </div>

          {/* Action Row */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
            <button
              type="button"
              onClick={handleShareLocation}
              className={`px-4 py-2 rounded-xl font-bold transition flex items-center gap-1.5 ${
                copied
                  ? 'bg-slate-600 text-white'
                  : isLight
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300'
                  : 'bg-slate-950 hover:bg-slate-900 text-[#7AB0A0] border border-[#2A6B5C]/30'
              }`}
            >
              {copied ? <CheckCircle className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
              <span>{copied ? 'تم نسخ الموقع للمشاركة!' : 'نسخ تفاصيل الموقع للعميل'}</span>
            </button>

            <div className="flex items-center gap-2">
              <a
                href={directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 bg-[#2A6B5C] hover:bg-[#4F9282] text-white font-black rounded-xl shadow-lg transition flex items-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                <span>فتح خط السير المباشر في Google Maps</span>
              </a>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
