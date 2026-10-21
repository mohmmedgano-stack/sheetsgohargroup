import React from 'react';
import {
  X,
  Filter,
  RotateCcw,
  Building,
  Tag,
  MapPin,
  User,
  Clock,
  Sparkles,
  Check,
} from 'lucide-react';
import { Project, User as UserType } from '../types';

interface MobileFilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  isLight: boolean;
  projects: Project[];
  users: UserType[];
  availableRegions: string[];
  selectedProject: string;
  setSelectedProject: (p: string) => void;
  selectedStatus: string;
  setSelectedStatus: (s: string) => void;
  selectedPriority: string;
  setSelectedPriority: (p: string) => void;
  selectedSource: string;
  setSelectedSource: (s: string) => void;
  selectedUser: string;
  setSelectedUser: (u: string) => void;
  selectedRegion: string;
  setSelectedRegion: (r: string) => void;
  selectedFollowUpRange: string;
  setSelectedFollowUpRange: (r: any) => void;
  sortBy: string;
  setSortBy: (s: any) => void;
  onResetFilters: () => void;
  activeFiltersCount: number;
}

export const MobileFilterDrawer: React.FC<MobileFilterDrawerProps> = ({
  isOpen,
  onClose,
  isLight,
  projects,
  users,
  availableRegions,
  selectedProject,
  setSelectedProject,
  selectedStatus,
  setSelectedStatus,
  selectedPriority,
  setSelectedPriority,
  selectedSource,
  setSelectedSource,
  selectedUser,
  setSelectedUser,
  selectedRegion,
  setSelectedRegion,
  selectedFollowUpRange,
  setSelectedFollowUpRange,
  sortBy,
  setSortBy,
  onResetFilters,
  activeFiltersCount,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex flex-col justify-end lg:hidden animate-fadeIn"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
      data-modal-backdrop="true"
    >
      <div
        data-modal-container="true"
        className={`w-full max-h-[88dvh] overflow-y-auto rounded-t-3xl border-t p-5 pb-safe space-y-4 shadow-2xl transition-all transform animate-slideUp ${
          isLight
            ? 'bg-white border-slate-200 text-slate-900'
            : 'bg-[#000000] border-[#2A6B5C]/30 text-slate-100'
        }`}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b pb-3 border-slate-900/30">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-[#2A6B5C]/20 text-[#4F9282]">
              <Filter className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-[#A8CCC0]">
                فلاتر وتصنيفات الشيت الذكية
              </h3>
              <p className="text-[11px] text-slate-400">
                {activeFiltersCount > 0 ? `${activeFiltersCount} فلتر نشط حالياً` : 'تخصيص عرض العملاء'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {activeFiltersCount > 0 && (
              <button
                type="button"
                onClick={onResetFilters}
                className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-[#7AB0A0] hover:bg-white/10 flex items-center gap-1 transition"
                title="إلغاء كل الفلاتر"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>إعادة ضبط</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white"
              aria-label="إغلاق الفلتر"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Controls Grid */}
        <div className="space-y-3.5 text-xs">
          {/* Project Filter */}
          <div>
            <label className="block font-bold mb-1.5 text-[#7AB0A0] flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5" />
              <span>المشروع العقاري:</span>
            </label>
            <select
              value={selectedProject}
              onChange={e => setSelectedProject(e.target.value)}
              className={`w-full min-h-[44px] p-2.5 rounded-xl font-bold border ${
                isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-[#1c1c1e] border-slate-700 text-[#D1E4DE]'
              }`}
            >
              <option value="ALL">جميع المشاريع</option>
              {projects.map(p => (
                <option key={p.id} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <label className="block font-bold mb-1.5 text-[#7AB0A0] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>درجة الأولوية:</span>
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {['ALL', 'عالي', 'متوسط', 'منخفض'].map(pri => (
                <button
                  key={pri}
                  type="button"
                  onClick={() => setSelectedPriority(pri)}
                  className={`min-h-[42px] py-2 rounded-xl font-bold border text-xs transition cursor-pointer active:scale-95 ${
                    selectedPriority === pri
                      ? 'bg-[#2A6B5C] text-white border-[#2A6B5C] shadow-sm font-black'
                      : isLight
                      ? 'bg-slate-100 border-slate-300 text-slate-700'
                      : 'bg-[#1c1c1e] border-slate-800 text-slate-200'
                  }`}
                >
                  {pri === 'ALL' ? 'الكل' : pri}
                </button>
              ))}
            </div>
          </div>

          {/* FollowUp Date Range Filter */}
          <div>
            <label className="block font-bold mb-1.5 text-[#7AB0A0] flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>موعد المتابعة والفولو اب:</span>
            </label>
            <select
              value={selectedFollowUpRange}
              onChange={e => setSelectedFollowUpRange(e.target.value)}
              className={`w-full min-h-[44px] p-2.5 rounded-xl font-bold border ${
                isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-[#1c1c1e] border-slate-700 text-[#D1E4DE]'
              }`}
            >
              <option value="ALL">جميع المواعيد</option>
              <option value="TODAY">مواعيد اليوم فقط</option>
              <option value="TOMORROW">مواعيد الغد</option>
              <option value="WEEK">مواعيد الأسبوع الحالي</option>
              <option value="OVERDUE">مواعيد متأخرة تجاوزت وقتها</option>
              <option value="NO_FOLLOWUP">عملاء بدون موعد متابعة</option>
            </select>
          </div>

          {/* Lead Source Filter */}
          <div>
            <label className="block font-bold mb-1.5 text-[#7AB0A0] flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5" />
              <span>مصدر الداتا:</span>
            </label>
            <select
              value={selectedSource}
              onChange={e => setSelectedSource(e.target.value)}
              className={`w-full min-h-[44px] p-2.5 rounded-xl font-bold border ${
                isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-[#1c1c1e] border-slate-700 text-[#D1E4DE]'
              }`}
            >
              <option value="ALL">جميع المصادر</option>
              <option value="اعلانات فيسبوك">اعلانات فيسبوك</option>
              <option value="داتا خاصة">داتا خاصة</option>
              <option value="اوت دور">اوت دور</option>
            </select>
          </div>

          {/* Region / Location Filter */}
          <div>
            <label className="block font-bold mb-1.5 text-[#7AB0A0] flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              <span>المنطقة / العنوان:</span>
            </label>
            <select
              value={selectedRegion}
              onChange={e => setSelectedRegion(e.target.value)}
              className={`w-full min-h-[44px] p-2.5 rounded-xl font-bold border ${
                isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-[#1c1c1e] border-slate-700 text-[#D1E4DE]'
              }`}
            >
              <option value="ALL">جميع المناطق ({availableRegions.length})</option>
              {availableRegions.map(reg => (
                <option key={reg} value={reg}>
                  {reg}
                </option>
              ))}
            </select>
          </div>

          {/* Assigned Rep Filter */}
          <div>
            <label className="block font-bold mb-1.5 text-[#7AB0A0] flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              <span>الموظف المسؤول:</span>
            </label>
            <select
              value={selectedUser}
              onChange={e => setSelectedUser(e.target.value)}
              className={`w-full min-h-[44px] p-2.5 rounded-xl font-bold border ${
                isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-[#1c1c1e] border-slate-700 text-[#D1E4DE]'
              }`}
            >
              <option value="ALL">جميع الموظفين</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sorting Order */}
          <div>
            <label className="block font-bold mb-1.5 text-[#7AB0A0] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>ترتيب النتائج حسب:</span>
            </label>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className={`w-full min-h-[44px] p-2.5 rounded-xl font-bold border ${
                isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-[#1c1c1e] border-slate-700 text-[#D1E4DE]'
              }`}
            >
              <option value="DEFAULT">الترتيب الافتراضي (الأحدث)</option>
              <option value="PRIORITY">الأولوية (العالي أولاً)</option>
              <option value="FOLLOWUP">موعد المتابعة (الأقرب أولاً)</option>
              <option value="NAME">أبجدياً باسم العميل</option>
              <option value="PROJECT">حسب اسم المشروع</option>
            </select>
          </div>
        </div>

        {/* Apply CTA Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full min-h-[48px] py-3 bg-[#2A6B5C] hover:bg-[#1F5447] text-white font-black text-xs rounded-2xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            <Check className="w-4 h-4" />
            <span>عرض نتائج التصفية</span>
          </button>
        </div>
      </div>
    </div>
  );
};
