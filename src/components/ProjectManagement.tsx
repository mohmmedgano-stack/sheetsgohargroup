import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { Project } from '../types';
import { compressImageFile } from '../utils/imageCompression';
import {
  Building2,
  Plus,
  MapPin,
  Users,
  Edit2,
  Trash2,
  CheckCircle2,
  TrendingUp,
  Search,
  Image,
  Upload,
  Sparkles,
} from 'lucide-react';

const PRESET_PROJECT_IMAGES = [
  { name: 'كمبوند سكني فاخر', url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600' },
  { name: 'أبراج فندقية ومودرن', url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600' },
  { name: 'مول تجاري وإداري', url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600' },
  { name: 'منتجع وسياحة ساحلي', url: 'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=600' },
  { name: 'فلل مستقلة مودرن', url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600' },
  { name: 'برج إداري شاهق', url: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?w=600' },
];

export const ProjectManagement: React.FC = () => {
  const { projects, addProject, updateProject, deleteProject, clients, currentUser, themeMode } = useApp();

  const isLight = themeMode === 'light';

  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const projectModalRef = useFocusTrap<HTMLDivElement>({
    isActive: Boolean(showAddModal || editingProject),
    onClose: () => {
      setShowAddModal(false);
      setEditingProject(null);
    },
  });

  // Form State
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'متاح للبيع' | 'مباع بالكامل' | 'قيد الإنشاء'>('متاح للبيع');
  const [imageUrl, setImageUrl] = useState('');

  const filteredProjects = projects.filter(
    p =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenAdd = () => {
    setName('');
    setLocation('');
    setDescription('');
    setStatus('متاح للبيع');
    setImageUrl(PRESET_PROJECT_IMAGES[0].url);
    setShowAddModal(true);
  };

  const handleStartEdit = (proj: Project) => {
    setEditingProject(proj);
    setName(proj.name);
    setLocation(proj.location);
    setDescription(proj.description);
    setStatus(proj.status);
    setImageUrl(proj.imageUrl || PRESET_PROJECT_IMAGES[0].url);
  };

  const handleSaveProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !location) return;

    if (editingProject) {
      updateProject(editingProject.id, {
        name,
        location,
        description,
        status,
        imageUrl: imageUrl || PRESET_PROJECT_IMAGES[0].url,
      });
      setEditingProject(null);
    } else {
      addProject({
        name,
        location,
        description,
        status,
        imageUrl: imageUrl || PRESET_PROJECT_IMAGES[0].url,
      });
      setShowAddModal(false);
    }
  };

  // Handle local image file select
  const handleLocalImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      compressImageFile(file, 768, 0.8).then(compressed => {
        setImageUrl(compressed);
      });
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className={`p-5 rounded-2xl border shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 ${
        isLight
          ? 'bg-white border-slate-200 text-slate-900 shadow-slate-200/70'
          : 'bg-[#000000] text-slate-100 border-[#2A6B5C]/40 shadow-xl'
      }`}>
        <div>
          <div className="flex items-center gap-2">
            <Building2 className={`w-5 h-5 ${isLight ? 'text-slate-700' : 'text-[#2A6B5C]'}`} />
            <h1 className={`text-base font-bold ${isLight ? 'text-slate-900' : 'text-[#2A6B5C]'}`}>
              إدارة مشاريع جوهر جروب للتطوير العقاري (Real Estate Projects Engine)
            </h1>
          </div>
          <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-600' : 'text-slate-200/90'}`}>
            تعديل أسماء المشاريع، إنشاء مشروع جديد، إضافة وتغيير صور المشروع المعمارية، ومتابعة عملاء كل مشروع.
          </p>
        </div>

        {currentUser.role === 'ADMIN' && (
          <button
            onClick={handleOpenAdd}
            className={`px-4 py-2 font-bold text-xs rounded-xl shadow-lg transition flex items-center gap-1.5 shrink-0 self-start md:self-auto cursor-pointer ${
              isLight
                ? 'bg-slate-800 text-white hover:bg-slate-900'
                : 'bg-[#2A6B5C] text-white hover:bg-[#7AB0A0]'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>+ إنشاء مشروع جديد</span>
          </button>
        )}
      </div>

      {/* Stats Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className={`p-3.5 rounded-xl border flex items-center justify-between shadow-sm ${
          isLight ? 'bg-white border-slate-200' : 'bg-[#2c2c2e] border-slate-800'
        }`}>
          <div>
            <span className={`text-[11px] block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>إجمالي المشاريع</span>
            <span className={`text-lg font-bold font-mono ${isLight ? 'text-[#123F36]' : 'text-[#4F9282]'}`}>{projects.length}</span>
          </div>
          <Building2 className="w-5 h-5 text-[#4F9282] opacity-80" />
        </div>

        <div className={`p-3.5 rounded-xl border flex items-center justify-between shadow-sm ${
          isLight ? 'bg-white border-slate-200' : 'bg-[#2c2c2e] border-slate-800'
        }`}>
          <div>
            <span className={`text-[11px] block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>المشاريع المتاحة للبيع</span>
            <span className={`text-lg font-bold font-mono ${isLight ? 'text-slate-700' : 'text-slate-400'}`}>
              {projects.filter(p => p.status === 'متاح للبيع').length}
            </span>
          </div>
          <CheckCircle2 className="w-5 h-5 text-slate-500 opacity-80" />
        </div>

        <div className={`p-3.5 rounded-xl border flex items-center justify-between shadow-sm ${
          isLight ? 'bg-white border-slate-200' : 'bg-[#2c2c2e] border-slate-800'
        }`}>
          <div>
            <span className={`text-[11px] block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>إجمالي العملاء المسجلين</span>
            <span className={`text-lg font-bold font-mono ${isLight ? 'text-slate-900' : 'text-[#7AB0A0]'}`}>{clients.length}</span>
          </div>
          <Users className="w-5 h-5 text-[#2A6B5C] opacity-80" />
        </div>

        <div className={`p-3.5 rounded-xl border flex items-center justify-between shadow-sm ${
          isLight ? 'bg-white border-slate-200' : 'bg-[#2c2c2e] border-slate-800'
        }`}>
          <div>
            <span className={`text-[11px] block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>العملاء المهتمين</span>
            <span className={`text-lg font-bold font-mono ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
              {clients.filter(c => c.status === 'مهتم').length}
            </span>
          </div>
          <TrendingUp className="w-5 h-5 text-slate-500 opacity-80" />
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="تصفية المشاريع باسم المشروع أو الموقع..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className={`w-full pl-3 pr-9 py-2 text-xs rounded-xl border focus:outline-none focus:border-[#4F9282] ${
            isLight
              ? 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 shadow-sm'
              : 'bg-[#2c2c2e] border-slate-800 text-slate-200 placeholder-slate-500'
          }`}
        />
      </div>

      {/* Projects Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredProjects.map(proj => {
          const projectLeads = clients.filter(c => c.projectName === proj.name);
          const interestedLeads = projectLeads.filter(c => c.status === 'مهتم');

          return (
            <div
              key={proj.id}
              className={`rounded-2xl border overflow-hidden shadow-md space-y-3 transition flex flex-col justify-between group ${
                isLight
                  ? 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-lg'
                  : 'bg-[#2c2c2e] border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                {/* Project Image Banner */}
                <div className="relative h-44 w-full overflow-hidden bg-slate-900">
                  <img
                    src={proj.imageUrl || PRESET_PROJECT_IMAGES[0].url}
                    alt={proj.name}
                    width={400}
                    height={176}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className={`absolute inset-0 bg-gradient-to-t ${isLight ? 'from-black/70 via-black/20 to-transparent' : 'from-[#2c2c2e] via-transparent to-black/40'}`} />

                  <span
                    className={`absolute top-3 left-3 px-2.5 py-1 text-[10px] font-bold rounded-lg border shadow-lg backdrop-blur-md ${
                      proj.status === 'متاح للبيع'
                        ? 'bg-slate-950/90 text-slate-400 border-slate-700'
                        : proj.status === 'قيد الإنشاء'
                        ? 'bg-[#041310]/90 text-[#4F9282] border-[#123F36]'
                        : 'bg-slate-900/90 text-slate-300 border-slate-700'
                    }`}
                  >
                    {proj.status}
                  </span>

                  <div className="absolute bottom-3 right-3 text-right">
                    <span className="text-[10px] text-[#7AB0A0] bg-black/60 px-2 py-0.5 rounded font-mono border border-[#2A6B5C]/30">
                      مشروع جوهر جروب المعماري
                    </span>
                  </div>
                </div>

                {/* Project Header Info */}
                <div className="p-4 space-y-3">
                  <div>
                    <h3 className={`font-bold text-sm sm:text-base flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                      <Building2 className="w-4 h-4 text-[#4F9282] shrink-0" />
                      <span>{proj.name}</span>
                    </h3>
                    <p className={`text-xs flex items-center gap-1 mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      <MapPin className="w-3.5 h-3.5 text-[#2A6B5C] shrink-0" />
                      <span>{proj.location}</span>
                    </p>
                  </div>

                  <p className={`text-xs leading-relaxed p-3 rounded-xl border ${
                    isLight
                      ? 'bg-slate-50 text-slate-700 border-slate-200'
                      : 'bg-[#1c1c1e] text-slate-300 border-slate-800/80'
                  }`}>
                    {proj.description || 'لا يوجد وصف تفصيلي مسجل للمشروع.'}
                  </p>

                  {/* Live Project Metrics */}
                  <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                    <div className={`p-2.5 rounded-xl border flex items-center justify-between ${
                      isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#1c1c1e] border-slate-800'
                    }`}>
                      <span className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>عملاء المشروع:</span>
                      <span className="font-bold text-[#4F9282] font-mono">{projectLeads.length} عميل</span>
                    </div>
                    <div className={`p-2.5 rounded-xl border flex items-center justify-between ${
                      isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#1c1c1e] border-slate-800'
                    }`}>
                      <span className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>مهتمين مؤكدين:</span>
                      <span className={`font-bold font-mono ${isLight ? 'text-slate-700' : 'text-slate-400'}`}>{interestedLeads.length} عميل</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Admin Controls */}
              {currentUser.role === 'ADMIN' && (
                <div className={`px-4 pb-4 pt-2 border-t flex items-center justify-end gap-2 ${
                  isLight ? 'border-slate-100' : 'border-slate-800/80'
                }`}>
                  <button
                    onClick={() => handleStartEdit(proj)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition flex items-center gap-1.5 ${
                      isLight
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200'
                        : 'text-slate-200 bg-slate-800 hover:bg-slate-700'
                    }`}
                  >
                    <Edit2 className="w-3.5 h-3.5 text-[#4F9282]" />
                    <span>تعديل الاسم والصورة</span>
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`هل أنت متأكد من حذف مشروع (${proj.name})؟`)) {
                        deleteProject(proj.id);
                      }
                    }}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition flex items-center gap-1.5 ${
                      isLight
                        ? 'text-red-700 bg-red-50 hover:bg-red-100 border border-red-200'
                        : 'text-red-400 bg-red-950/40 hover:bg-red-900/60 border border-red-900/40'
                    }`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>حذف</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add / Edit Project Modal */}
      {(showAddModal || editingProject) && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
          dir="rtl"
          onClick={e => {
            if (e.target === e.currentTarget) {
              setShowAddModal(false);
              setEditingProject(null);
            }
          }}
          data-modal-backdrop="true"
        >
          <div
            ref={projectModalRef}
            role="dialog"
            aria-modal="true"
            data-modal-container="true"
            className={`rounded-2xl max-w-lg w-full p-5 border shadow-2xl text-right space-y-4 max-h-[90vh] overflow-y-auto ${
              isLight
                ? 'bg-white text-slate-900 border-slate-200'
                : 'bg-[#2c2c2e] text-slate-100 border-slate-800'
            }`}
          >
            <div className={`flex items-center justify-between border-b pb-3 ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
              <h3 className="font-bold text-[#4F9282] text-sm flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#4F9282]" />
                <span>{editingProject ? `تعديل مشروع: ${editingProject.name}` : 'إنشاء مشروع عقاري جديد'}</span>
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingProject(null);
                }}
                className={`p-1 rounded ${isLight ? 'hover:bg-slate-100 text-slate-400' : 'hover:bg-slate-800 text-slate-400'}`}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProject} className="space-y-3.5 text-xs">
              <div>
                <label className={`block font-bold mb-1 ${isLight ? 'text-slate-800' : 'text-slate-300'}`}>اسم المشروع العقاري:</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: جوهر زايد تاورز - الشيخ زايد"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border focus:outline-none focus:border-[#4F9282] ${
                    isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#1c1c1e] border-slate-800 text-slate-100'
                  }`}
                />
              </div>

              <div>
                <label className={`block font-bold mb-1 ${isLight ? 'text-slate-800' : 'text-slate-300'}`}>الموقع والتفاصيل الجغرافية:</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: التجمع الخامس - النرجس الجديدة"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border focus:outline-none focus:border-[#4F9282] ${
                    isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#1c1c1e] border-slate-800 text-slate-100'
                  }`}
                />
              </div>

              <div>
                <label className={`block font-bold mb-1 ${isLight ? 'text-slate-800' : 'text-slate-300'}`}>حالة البيع والمشروع:</label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value as any)}
                  className={`w-full p-2.5 rounded-xl border focus:outline-none focus:border-[#4F9282] ${
                    isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#1c1c1e] border-slate-800 text-slate-100'
                  }`}
                >
                  <option value="متاح للبيع">متاح للبيع</option>
                  <option value="قيد الإنشاء">قيد الإنشاء</option>
                  <option value="مباع بالكامل">مباع بالكامل</option>
                </select>
              </div>

              {/* Project Image Selection Section */}
              <div className={`p-3 rounded-xl border space-y-2.5 ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#1c1c1e] border-slate-800'
              }`}>
                <div className="flex items-center justify-between">
                  <label className={`font-bold flex items-center gap-1.5 ${isLight ? 'text-slate-800' : 'text-slate-300'}`}>
                    <Image className="w-4 h-4 text-[#4F9282]" />
                    <span>صورة المشروع المعمارية:</span>
                  </label>
                  <span className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>اختر صورة جاهزة أو ارفع صورة خاصة</span>
                </div>

                {/* Image Preview */}
                {imageUrl && (
                  <div className={`relative h-28 w-full rounded-xl overflow-hidden border ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
                    <img
                      src={imageUrl}
                      alt="معاينة الصورة"
                      width={400}
                      height={112}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2 bg-black/70 text-[#7AB0A0] px-2 py-0.5 rounded text-[10px] font-mono">
                      معاينة الصورة
                    </div>
                  </div>
                )}

                {/* Preset Options */}
                <div>
                  <span className={`block text-[11px] mb-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>نماذج صور هندسية جاهزة للمشروع:</span>
                  <div className="grid grid-cols-3 gap-2">
                    {PRESET_PROJECT_IMAGES.map((preset, idx) => (
                      <div
                        key={idx}
                        onClick={() => setImageUrl(preset.url)}
                        className={`cursor-pointer rounded-lg border overflow-hidden relative h-14 group transition ${
                          imageUrl === preset.url ? 'border-[#4F9282] ring-2 ring-[#4F9282]' : (isLight ? 'border-slate-200 opacity-80 hover:opacity-100' : 'border-slate-800 opacity-70 hover:opacity-100')
                        }`}
                      >
                        <img
                          src={preset.url}
                          alt={preset.name}
                          width={120}
                          height={56}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute inset-x-0 bottom-0 bg-black/80 text-slate-200 text-[9px] text-center py-0.5 truncate px-1">
                          {preset.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Custom URL or File Upload */}
                <div className={`space-y-2 pt-1 border-t ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
                  <input
                    type="url"
                    placeholder="أو ضع رابط صورة مخصص (URL)..."
                    value={imageUrl}
                    onChange={e => setImageUrl(e.target.value)}
                    className={`w-full p-2 rounded-lg border text-xs font-mono focus:outline-none focus:border-[#4F9282] ${
                      isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#2c2c2e] border-slate-800 text-slate-100'
                    }`}
                  />

                  <label className={`flex items-center justify-center gap-2 p-2 rounded-lg cursor-pointer transition text-xs font-bold border ${
                    isLight
                      ? 'bg-slate-200 hover:bg-slate-300 text-slate-800 border-slate-300'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                  }`}>
                    <Upload className="w-3.5 h-3.5 text-[#4F9282]" />
                    <span>رفع صورة مشروع جديدة من الجهاز</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleLocalImageUpload} />
                  </label>
                </div>
              </div>

              <div>
                <label className={`block font-bold mb-1 ${isLight ? 'text-slate-800' : 'text-slate-300'}`}>وصف المشروع والمزايا الرئيسية:</label>
                <textarea
                  rows={3}
                  placeholder="مساحات الوحدات، أنظمة السداد، موعد التسليم..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border focus:outline-none focus:border-[#4F9282] ${
                    isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#1c1c1e] border-slate-800 text-slate-100'
                  }`}
                />
              </div>

              <div className={`pt-3 border-t flex items-center justify-end gap-2 ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingProject(null);
                  }}
                  className={`px-4 py-2 rounded-lg transition ${
                    isLight ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 font-bold rounded-lg shadow transition ${
                    isLight
                      ? 'bg-slate-800 text-white hover:bg-slate-900'
                      : 'bg-[#4F9282] text-[#1c1c1e] hover:bg-[#64B5F6]'
                  }`}
                >
                  حفظ بيانات المشروع
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
