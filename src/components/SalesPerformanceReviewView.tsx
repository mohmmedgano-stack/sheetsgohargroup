import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { SalesPerformanceReview } from '../types';
import {
  Star,
  Award,
  TrendingUp,
  UserCheck,
  PhoneCall,
  FileText,
  Plus,
  Calendar,
  MessageSquare,
  CheckCircle,
  BarChart3,
  ThumbsUp,
  Shield,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from 'recharts';
import { toLocalDateStr } from '../utils/dates';

export const SalesPerformanceReviewView: React.FC = () => {
  const { users, clients, reviews, addReview, deleteReview, currentUser, themeMode } = useApp();
  const isLight = themeMode === 'light';

  const [selectedRepId, setSelectedRepId] = useState<string>('ALL');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [repId, setRepId] = useState('');
  const [clientId, setClientId] = useState('');
  const [rating, setRating] = useState<number>(5);
  const [category, setCategory] = useState<SalesPerformanceReview['category']>('CALL_QUALITY');
  const [comment, setComment] = useState('');

  const salesReps = users.filter(u => u.role === 'SALES_REP');

  const filteredReviews = reviews.filter(r => {
    return selectedRepId === 'ALL' || r.repId === selectedRepId;
  });

  // Calculate Average Rating per Rep
  const repStats = salesReps.map(rep => {
    const repReviews = reviews.filter(r => r.repId === rep.id);
    const avgRating = repReviews.length > 0
      ? (repReviews.reduce((sum, r) => sum + r.rating, 0) / repReviews.length).toFixed(1)
      : '5.0';

    const repClients = clients.filter(c => c.assignedUserId === rep.id);
    const contracted = repClients.filter(c => c.status === 'متعاقد').length;
    const interested = repClients.filter(c => c.status === 'مهتم').length;

    return {
      id: rep.id,
      name: rep.name,
      avgRating: parseFloat(avgRating),
      reviewsCount: repReviews.length,
      contracted,
      interested,
      totalLeads: repClients.length,
    };
  });

  // Chart data
  const chartData = repStats.map(s => ({
    name: s.name.split(' ')[0],
    التقييم: s.avgRating,
    التعاقدات: s.contracted,
    المكالمات_المهتمة: s.interested,
  }));

  const categoryLabels: Record<SalesPerformanceReview['category'], { label: string; icon: any }> = {
    CALL_QUALITY: { label: 'جودة المكالمة والإقناع', icon: PhoneCall },
    NOTES_ACCURACY: { label: 'دقة الملاحظات والتسجيل', icon: FileText },
    CLOSING_SKILLS: { label: 'مهارات إغلاق الصفقات (Closing)', icon: Award },
    CUSTOMER_HANDLING: { label: 'أسلوب التعامل مع العميل', icon: UserCheck },
    GENERAL: { label: 'تقييم أداء عام', icon: TrendingUp },
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!repId || !comment.trim()) {
      alert('يرجى اختيار الموظف وكتابة الملاحظة التقييمية');
      return;
    }

    const selectedRep = users.find(u => u.id === repId);
    const selectedClient = clients.find(c => c.id === clientId);

    addReview({
      repId,
      repName: selectedRep?.name || 'موظف مبيعات',
      rating,
      category,
      comment: comment.trim(),
      clientId: clientId || undefined,
      clientName: selectedClient?.name || undefined,
      callDate: toLocalDateStr(),
      weekNumber: Math.ceil(new Date().getDate() / 7),
    });

    setShowAddModal(false);
    setComment('');
    setRating(5);
    setClientId('');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className={`p-6 rounded-3xl border shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 ${
        isLight
          ? 'bg-white border-slate-200 text-slate-900 shadow-slate-200/60'
          : 'bg-[#000000] text-slate-100 border-[#2A6B5C]/40 shadow-xl'
      }`}>
        <div>
          <div className="flex items-center gap-2">
            <Award className="w-6 h-6 text-[#2A6B5C]" />
            <h1 className={`text-xl font-black ${isLight ? 'text-slate-900' : 'text-[#A8CCC0]'}`}>
              تقييم أداء وجودة مكالمات المبيعات (Sales Quality & Reviews)
            </h1>
          </div>
          <p className={`text-xs mt-1 ${isLight ? 'text-slate-600' : 'text-slate-200/80'}`}>
            أداة إشرافية لمدير المبيعات والمدير العام لتقييم جودة الاتصالات، دقة الملاحظات، ومهارات الإغلاق لكل سيلز أسبوعياً.
          </p>
        </div>

        {(currentUser.role === 'ADMIN' || currentUser.role === 'SALES_MANAGER') && (
          <button
            onClick={() => {
              if (salesReps.length > 0) setRepId(salesReps[0].id);
              setShowAddModal(true);
            }}
            className="px-4 py-2.5 bg-[#2A6B5C] hover:bg-[#7AB0A0] text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة تقييم جديد للموظف</span>
          </button>
        )}
      </div>

      {/* Leaderboard & Rep Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {repStats.map(stat => (
          <div
            key={stat.id}
            className={`p-5 rounded-2xl border transition-all shadow-md ${
              isLight ? 'bg-white border-slate-200' : 'bg-[#1c1c1e]/70 border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-[#7AB0A0]">{stat.name}</h3>
                <span className="text-[11px] text-slate-400">
                  {stat.totalLeads} عميل مستلم | {stat.reviewsCount} تقييم مسجل
                </span>
              </div>
              <div className="flex items-center gap-1 px-3 py-1 bg-[#2A6B5C]/20 border border-[#2A6B5C]/40 rounded-xl text-[#7AB0A0] font-bold text-sm">
                <Star className="w-4 h-4 fill-[#4F9282] text-[#4F9282]" />
                <span>{stat.avgRating}</span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 text-center text-xs">
              <div className="p-2 bg-slate-950/40 border border-slate-800 rounded-xl">
                <span className="block text-[10px] text-slate-400">التعاقدات 🏆</span>
                <span className="font-bold text-slate-300 text-sm">{stat.contracted}</span>
              </div>
              <div className="p-2 bg-[#041310]/40 border border-[#0C2E27] rounded-xl">
                <span className="block text-[10px] text-[#4F9282]">عملاء مهتمين ⭐</span>
                <span className="font-bold text-[#7AB0A0] text-sm">{stat.interested}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Performance Charts */}
      <div className={`p-5 rounded-3xl border shadow-xl ${
        isLight ? 'bg-white border-slate-200' : 'bg-[#000000] border-slate-800'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#4F9282]" />
            <h3 className="text-sm font-bold text-[#7AB0A0]">مقارنة مؤشرات أداء فريق المبيعات والجودة</h3>
          </div>
          <span className="text-xs text-slate-400">التقييم من 5 نجوم</span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
              <XAxis dataKey="name" stroke="#A7F3D0" />
              <YAxis stroke="#A7F3D0" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#000000',
                  borderColor: '#2A6B5C',
                  borderRadius: '12px',
                  color: '#fff',
                }}
              />
              <Bar dataKey="التقييم" fill="#2A6B5C" radius={[6, 6, 0, 0]} />
              <Bar dataKey="التعاقدات" fill="#10B981" radius={[6, 6, 0, 0]} />
              <Bar dataKey="المكالمات_المهتمة" fill="#2A6B5C" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Reviews Stream / Table */}
      <div className={`rounded-3xl border shadow-xl overflow-hidden ${
        isLight ? 'bg-white border-slate-200' : 'bg-[#000000] border-slate-800'
      }`}>
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-sm text-[#7AB0A0]">سجل مراجعات وتقييمات المكالمات</h3>
          <select
            value={selectedRepId}
            onChange={e => setSelectedRepId(e.target.value)}
            aria-label="تصفية حسب موظف المبيعات"
            className={`px-3 py-1.5 text-xs rounded-xl border font-bold ${
              isLight ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-[#000000] border-slate-700 text-[#7AB0A0]'
            }`}
          >
            <option value="ALL">جميع موظفي المبيعات</option>
            {salesReps.map(r => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>

        <div className="divide-y divide-slate-800/30">
          {filteredReviews.length === 0 ? (
            <div className="p-8 text-center text-slate-400">لا توجد تقييمات مسجلة بعد لهذا الموظف.</div>
          ) : (
            filteredReviews.map(rev => {
              const catMeta = categoryLabels[rev.category] || { label: rev.category, icon: FileText };
              const Icon = catMeta.icon;

              return (
                <div key={rev.id} className="p-4 hover:bg-[#1c1c1e]/30 transition flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[#A8CCC0]">{rev.repName}</span>
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-950/60 border border-slate-700 text-slate-300 inline-flex items-center gap-1">
                        <Icon className="w-3 h-3" />
                        <span>{catMeta.label}</span>
                      </span>
                      {rev.clientName && (
                        <span className="text-xs text-slate-400">
                          بخصوص العميل: <b className="text-[#7AB0A0]">{rev.clientName}</b>
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-200 leading-relaxed bg-black/20 p-3 rounded-xl border border-slate-900/50">
                      "{rev.comment}"
                    </p>

                    <div className="flex items-center gap-4 text-[11px] text-slate-400">
                      <span>بواسطة: <b className="text-slate-400">{rev.reviewerName}</b></span>
                      <span>التاريخ: {rev.createdAt}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 bg-[#2A6B5C]/20 px-3 py-1.5 rounded-xl border border-[#2A6B5C]/30">
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${
                          star <= rev.rating ? 'fill-[#4F9282] text-[#4F9282]' : 'text-slate-600'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Add Review Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className={`w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden p-6 ${
            isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#000000] border-[#2A6B5C]/40 text-slate-100'
          }`}>
            <h2 className="text-base font-black text-[#7AB0A0] mb-4 flex items-center gap-2">
              <Award className="w-5 h-5" />
              <span>إضافة تقييم جودة مكالمة لموظف مبيعات</span>
            </h2>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1">اختر الموظف المراد تقييمه</label>
                <select
                  value={repId}
                  onChange={e => setRepId(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border bg-[#000000] border-slate-700 text-[#A8CCC0]"
                  required
                >
                  {salesReps.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">نوع ومعيار التقييم</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border bg-[#000000] border-slate-700 text-[#A8CCC0]"
                >
                  {Object.entries(categoryLabels).map(([catKey, val]) => (
                    <option key={catKey} value={catKey}>
                      {val.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">التقييم بالنجوم (1 إلى 5)</label>
                <div className="flex items-center gap-2 p-2 bg-[#000000] border border-slate-800 rounded-xl">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1 cursor-pointer hover:scale-110 transition"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= rating ? 'fill-[#4F9282] text-[#4F9282]' : 'text-slate-600'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-[#7AB0A0] mr-2">{rating} من 5 نجوم</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">ربط بعميل محدد (اختياري)</label>
                <select
                  value={clientId}
                  onChange={e => setClientId(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border bg-[#000000] border-slate-700 text-slate-200"
                >
                  <option value="">-- بدون تحديد عميل محدد --</option>
                  {clients
                    .filter(c => !repId || c.assignedUserId === repId)
                    .map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.phone}) - {c.status}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">الملاحظات التقييمية والتوجيهات</label>
                <textarea
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder="اكتب توجيهاتك وتقييمك لجودة المكالمة أو نقاط القوة والتطوير..."
                  rows={3}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border bg-[#000000] border-slate-700 text-slate-100"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-600 text-slate-300 hover:bg-slate-800 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-[#2A6B5C] hover:bg-[#7AB0A0] text-white shadow-md cursor-pointer"
                >
                  حفظ التقييم
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
