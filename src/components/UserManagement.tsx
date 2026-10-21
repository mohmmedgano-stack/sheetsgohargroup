import { Avatar } from './activity/ActivityParts';
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { User, UserRole, UserPermissions } from '../types';
import { ChangePasswordModal } from './ChangePasswordModal';
import { compressImageFile } from '../utils/imageCompression';
import {
  Users,
  UserPlus,
  ShieldCheck,
  Building,
  Mail,
  Phone,
  Trash2,
  Edit,
  ShieldAlert,
  CheckCircle2,
  Upload,
  Image,
  KeyRound,
  Ticket,
  Copy,
  Check,
  Clock,
  UserCheck,
  UserX,
  Sliders,
  Sparkles,
  RefreshCw,
  Eye,
  Lock,
} from 'lucide-react';

const PRESET_USER_AVATARS = [
  'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
];

export const UserManagement: React.FC = () => {
  const {
    users,
    projects,
    addUser,
    updateUser,
    deleteUser,
    currentUser,
    canManageTeam,
    joinCodes,
    generateJoinCode,
    toggleJoinCode,
    deleteJoinCode,
    approveUser,
    rejectUser,
    themeMode,
  } = useApp();

  const isLight = themeMode === 'light';

  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'PENDING' | 'CODES'>('ACTIVE');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [permissionTargetUser, setPermissionTargetUser] = useState<User | null>(null);
  const [passwordTargetUser, setPasswordTargetUser] = useState<User | null>(null);

  const permissionModalRef = useFocusTrap<HTMLDivElement>({
    isActive: Boolean(permissionTargetUser),
    onClose: () => setPermissionTargetUser(null),
  });

  const userFormModalRef = useFocusTrap<HTMLDivElement>({
    isActive: Boolean(showAddModal || editingUser),
    onClose: () => {
      setShowAddModal(false);
      setEditingUser(null);
    },
  });

  // Form states for Add/Edit User
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('SALES_REP');
  const [assignedProject, setAssignedProject] = useState('');
  const [avatar, setAvatar] = useState(PRESET_USER_AVATARS[0]);

  // Permissions state for Approval / Configuration Modal
  const [customPermissions, setCustomPermissions] = useState<UserPermissions>({
    canExport: false,
    canImport: false,
    canDeleteClients: false,
    canEditClientDetails: true,
    canViewAllProjects: false,
    canBulkAssign: false,
    canSendWhatsApp: true,
    canRecordVoiceNotes: true,
    canViewDistanceMap: true,
    canManageTeam: false,
  });
  const [approvalProject, setApprovalProject] = useState('');

  // Join Code Creation
  const [codeDescription, setCodeDescription] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Pending users count
  const pendingUsers = users.filter(u => u.activeStatus === 'pending_approval');
  const activeUsers = users.filter(u => u.activeStatus !== 'pending_approval');

  const handleOpenAdd = () => {
    setName('');
    setUsername('');
    setPassword('');
    setEmail('');
    setPhone('');
    setRole('SALES_REP');
    setAssignedProject(projects[0]?.name || 'جميع المشاريع');
    setAvatar(PRESET_USER_AVATARS[0]);
    setShowAddModal(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    if (editingUser) {
      updateUser(editingUser.id, {
        name,
        username: username || editingUser.username,
        email,
        phone,
        role,
        assignedProject,
        avatar: avatar || PRESET_USER_AVATARS[0],
      });
      setEditingUser(null);
    } else {
      if (password.length < 6) {
        alert('كلمة السر لازم تكون 6 أحرف أو أرقام على الأقل');
        return;
      }
      addUser({
        name,
        username: username || `user_${Date.now().toString().slice(-4)}`,
        password,
        email,
        phone,
        role,
        assignedProject: assignedProject || 'جميع المشاريع',
        activeStatus: 'active',
        avatar: avatar || PRESET_USER_AVATARS[0],
        permissions: {
          canExport: role === 'ADMIN',
          canImport: role === 'ADMIN',
          canDeleteClients: role === 'ADMIN',
          canEditClientDetails: true,
          canViewAllProjects: role === 'ADMIN' || role === 'SALES_MANAGER',
          canBulkAssign: role === 'ADMIN' || role === 'SALES_MANAGER',
          canSendWhatsApp: true,
          canRecordVoiceNotes: true,
          canViewDistanceMap: true,
          canManageTeam: role === 'ADMIN' || role === 'SALES_MANAGER',
        },
      });
      setShowAddModal(false);
    }
  };

  const handleStartEdit = (u: User) => {
    setEditingUser(u);
    setName(u.name);
    setUsername(u.username || '');
    setEmail(u.email);
    setPhone(u.phone || '');
    setRole(u.role);
    setAssignedProject(u.assignedProject || '');
    setAvatar(u.avatar || PRESET_USER_AVATARS[0]);
  };

  const handleOpenPermissionsModal = (u: User) => {
    setPermissionTargetUser(u);
    setCustomPermissions(u.permissions || {
      canExport: false,
      canImport: false,
      canDeleteClients: false,
      canEditClientDetails: true,
      canViewAllProjects: false,
      canBulkAssign: false,
      canSendWhatsApp: true,
      canRecordVoiceNotes: true,
      canViewDistanceMap: true,
      canManageTeam: false,
    });
    setApprovalProject(u.assignedProject || projects[0]?.name || 'Wada Bay رأس الحكمة');
  };

  const handleSavePermissions = (e: React.FormEvent) => {
    e.preventDefault();
    if (!permissionTargetUser) return;

    if (permissionTargetUser.activeStatus === 'pending_approval') {
      approveUser(permissionTargetUser.id, customPermissions, approvalProject);
    } else {
      updateUser(permissionTargetUser.id, {
        permissions: customPermissions,
        assignedProject: approvalProject,
      });
    }

    setPermissionTargetUser(null);
  };

  const handleCreateCode = (e: React.FormEvent) => {
    e.preventDefault();
    generateJoinCode(codeDescription);
    setCodeDescription('');
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleLocalAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      compressImageFile(file, 256, 0.8).then(compressed => {
        setAvatar(compressed);
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
            <ShieldCheck className={`w-5 h-5 ${isLight ? 'text-slate-700' : 'text-[#2A6B5C]'}`} />
            <h1 className={`text-base font-bold ${isLight ? 'text-slate-900' : 'text-[#2A6B5C]'}`}>
              نظام إدارة فريق المبيعات والأكواد والصلاحيات
            </h1>
          </div>
          <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-600' : 'text-slate-200/90'}`}>
            إنشاء أكواد عشوائية قابلة للتغيير لانضمام السيلز، اعتماد الحسابات المعلقة، وتحديد الصلاحيات وتغيير كلمات المرور.
          </p>
        </div>

        {canManageTeam && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenAdd}
              className={`px-4 py-2 font-bold text-xs rounded-xl shadow-lg transition flex items-center gap-1.5 cursor-pointer ${
                isLight
                  ? 'bg-slate-800 text-white hover:bg-slate-900'
                  : 'bg-[#2A6B5C] text-white hover:bg-[#7AB0A0]'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>+ إضافة حساب يدوي</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Tabs Navigation */}
      <div className={`flex flex-wrap items-center gap-2 p-1.5 rounded-2xl border ${
        isLight ? 'bg-slate-100 border-slate-300' : 'bg-[#000000] border-[#2A6B5C]/20'
      }`}>
        
        {/* Tab 1: Active Team */}
        <button
          onClick={() => setActiveTab('ACTIVE')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'ACTIVE'
              ? isLight
                ? 'bg-[#1c1c1e] text-[#7AB0A0] shadow-md'
                : 'bg-[#2A6B5C] text-white shadow-lg'
              : isLight
              ? 'text-slate-700 hover:bg-slate-200'
              : 'text-slate-300 hover:bg-slate-900/50'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>الموظفين والحسابات النشطة ({activeUsers.length})</span>
        </button>

        {/* Tab 2: Pending Approvals */}
        <button
          onClick={() => setActiveTab('PENDING')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 relative ${
            activeTab === 'PENDING'
              ? isLight
                ? 'bg-[#1c1c1e] text-[#7AB0A0] shadow-md'
                : 'bg-[#2A6B5C] text-white shadow-lg'
              : isLight
              ? 'text-slate-700 hover:bg-slate-200'
              : 'text-slate-300 hover:bg-slate-900/50'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>طلبات الانضمام المعلقة</span>
          {pendingUsers.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-500 text-white animate-pulse">
              {pendingUsers.length} طلب جديد
            </span>
          )}
        </button>

        {/* Tab 3: Team Join Codes */}
        {canManageTeam && (
          <button
            onClick={() => setActiveTab('CODES')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'CODES'
                ? isLight
                  ? 'bg-[#1c1c1e] text-[#7AB0A0] shadow-md'
                  : 'bg-[#2A6B5C] text-white shadow-lg'
              : isLight
              ? 'text-slate-700 hover:bg-slate-200'
              : 'text-slate-300 hover:bg-slate-900/50'
            }`}
          >
            <Ticket className="w-4 h-4" />
            <span>أكواد انضمام الفريق ({joinCodes.length})</span>
          </button>
        )}
      </div>

      {/* TAB 1: ACTIVE USERS GRID */}
      {activeTab === 'ACTIVE' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {activeUsers.map(user => {
            const isSelf = user.id === currentUser.id;

            return (
              <div
                key={user.id}
                className={`p-5 rounded-2xl border transition shadow-lg flex flex-col justify-between space-y-4 relative ${
                  isLight
                    ? 'bg-white border-slate-200 hover:border-[#4F9282] text-slate-800'
                    : 'bg-[#000000] border-slate-800/80 hover:border-[#2A6B5C]/60 text-slate-100'
                }`}
              >
                {/* User Header */}
                <div className="flex items-start gap-3.5">
                  <div className="relative shrink-0">
                    <Avatar user={user} size={52} />
                    <span className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-slate-500 rounded-full border-2 ${isLight ? 'border-white' : 'border-[#000000]'}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h3 className={`font-extrabold text-sm truncate ${isLight ? 'text-[#2A6B5C]' : 'text-[#7AB0A0]'}`}>{user.name}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                        user.role === 'ADMIN'
                          ? 'bg-[#4F9282] text-gray-950'
                          : user.role === 'SALES_MANAGER'
                          ? 'bg-purple-600 text-white'
                          : isLight ? 'bg-slate-200 text-slate-700' : 'bg-slate-800 text-slate-100'
                      }`}>
                        {user.role === 'ADMIN' ? '👑 المدير العام' : user.role === 'SALES_MANAGER' ? '👔 مدير مبيعات' : '💼 مبيعات'}
                      </span>
                    </div>

                    <div className={`text-[11px] font-mono truncate mt-0.5 ${isLight ? 'text-slate-600' : 'text-slate-200 opacity-80'}`}>
                      اسم المستخدم: <strong className={isLight ? 'text-slate-900' : 'text-white'}>{user.username || 'بدون'}</strong>
                    </div>

                    <div className="text-[11px] opacity-75 truncate">{user.email}</div>
                  </div>
                </div>

                {/* Info Badges */}
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center gap-2 text-[11px] opacity-85">
                    <Building className="w-3.5 h-3.5 text-[#4F9282] shrink-0" />
                    <span className="truncate">المشروع: <strong>{user.assignedProject || 'جميع المشاريع'}</strong></span>
                  </div>

                  {user.phone && (
                    <div className="flex items-center gap-2 text-[11px] opacity-85">
                      <Phone className="w-3.5 h-3.5 text-[#4F9282] shrink-0" />
                      <span className="font-mono">{user.phone}</span>
                    </div>
                  )}

                </div>

                {/* Actions Row */}
                <div className={`pt-2 border-t ${isLight ? 'border-slate-200' : 'border-slate-800/40'} flex flex-wrap items-center justify-between gap-1.5`}>
                  <div className="flex items-center gap-1">
                    {/* Change Password Button (Self or Admin) */}
                    {(canManageTeam || isSelf) && (
                      <button
                        type="button"
                        onClick={() => setPasswordTargetUser(user)}
                        className={`p-2 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                          isLight
                            ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                            : 'bg-slate-950 hover:bg-slate-900 text-[#7AB0A0] border border-[#2A6B5C]/30'
                        }`}
                        title="تغيير كلمة المرور"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                        <span className="text-[10px]">الباسورد</span>
                      </button>
                    )}

                    {/* Permissions Config Button (Admin Only) */}
                    {canManageTeam && user.role !== 'ADMIN' && (
                      <button
                        type="button"
                        onClick={() => handleOpenPermissionsModal(user)}
                        className={`p-2 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                          isLight
                            ? 'bg-[#D1E4DE] hover:bg-[#A8CCC0] text-[#081F1A]'
                            : 'bg-slate-950 hover:bg-slate-900 text-slate-200 border border-slate-700'
                        }`}
                        title="تعديل الصلاحيات المخصصة"
                      >
                        <Sliders className="w-3.5 h-3.5 text-[#2A6B5C]" />
                        <span className="text-[10px]">الصلاحيات</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    {canManageTeam && (
                      <button
                        type="button"
                        onClick={() => handleStartEdit(user)}
                        className="p-2 text-slate-400 hover:text-[#7AB0A0] rounded-lg"
                        title="تعديل البيانات"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    )}

                    {canManageTeam && !isSelf && (
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`هل أنت متأكد من حذف حساب (${user.name})؟`)) {
                            deleteUser(user.id);
                          }
                        }}
                        className="p-2 text-red-400 hover:text-red-300 rounded-lg"
                        title="حذف الحساب"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: PENDING SALES APPROVALS */}
      {activeTab === 'PENDING' && (
        <div className="space-y-4">
          {pendingUsers.length === 0 ? (
            <div className={`p-8 rounded-3xl border text-center space-y-3 ${
              isLight ? 'bg-white border-slate-200' : 'bg-[#000000] border-slate-800'
            }`}>
              <CheckCircle2 className="w-12 h-12 text-slate-400 mx-auto" />
              <h3 className="font-black text-sm text-[#7AB0A0]">لا توجد طلبات انضمام معلقة حالياً</h3>
              <p className="text-xs text-slate-400">
                عند قيام موظف سيلز جديد بالتسجيل عبر كود الفريق، سيظهر طلبه هنا للمدير العام لاعتماده وتحديد صلاحياته.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingUsers.map(u => (
                <div
                  key={u.id}
                  className={`p-5 rounded-3xl border-2 shadow-xl space-y-4 ${
                    isLight
                      ? 'bg-[#EAF3F0]/70 border-[#7AB0A0] text-slate-900'
                      : 'bg-[#1c1c1e] border-[#4F9282]/60 text-slate-100'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={u.avatar}
                        alt={u.name}
                        width={48}
                        height={48}
                        loading="lazy"
                        decoding="async"
                        className="w-12 h-12 rounded-2xl object-cover ring-2 ring-[#4F9282]"
                      />
                      <div>
                        <h4 className="font-extrabold text-sm text-[#7AB0A0]">{u.name}</h4>
                        <div className="text-xs font-mono opacity-80">@{u.username || 'user'}</div>
                        <div className="text-[11px] opacity-70">{u.email} | {u.phone}</div>
                      </div>
                    </div>

                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-[#2A6B5C]/30 text-[#7AB0A0] border border-[#4F9282]/40">
                      طلب معلق ⏳
                    </span>
                  </div>

                  <div className="p-3 bg-black/20 rounded-2xl text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="opacity-80">كود الانضمام المستخدم:</span>
                      <span className="font-mono font-bold text-[#7AB0A0]">{u.joinCodeUsed || 'كود معتمد'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="opacity-80">المشروع المطلوب:</span>
                      <span className="font-bold">{u.assignedProject || 'Wada Bay رأس الحكمة'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="opacity-80">تاريخ الطلب:</span>
                      <span>{u.createdAt}</span>
                    </div>
                  </div>

                  {canManageTeam ? (
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#2A6B5C]/30">
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`هل أنت متأكد من رفض طلب (${u.name})؟`)) {
                            rejectUser(u.id);
                          }
                        }}
                        className="px-4 py-2 rounded-xl text-xs font-bold text-red-300 hover:bg-red-950/60 transition"
                      >
                        <UserX className="w-3.5 h-3.5 inline ml-1" />
                        <span>رفض الطلب</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenPermissionsModal(u)}
                        className="px-5 py-2 bg-[#2A6B5C] hover:bg-[#7AB0A0] text-white font-black text-xs rounded-xl shadow-lg transition flex items-center gap-1.5"
                      >
                        <UserCheck className="w-4 h-4" />
                        <span>موافقة وتحديد الصلاحيات</span>
                      </button>
                    </div>
                  ) : (
                    <p className="text-center text-[11px] text-[#7AB0A0] font-medium">
                      في انتظار موافقة المدير العام أو مدير المبيعات
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: TEAM JOIN CODES MANAGEMENT */}
      {activeTab === 'CODES' && canManageTeam && (
        <div className="space-y-5">
          
          {/* Create Code Form */}
          <form onSubmit={handleCreateCode} className={`p-5 rounded-3xl border shadow-xl flex flex-col sm:flex-row items-end gap-3 ${
            isLight ? 'bg-white border-slate-200' : 'bg-[#000000] border-[#2A6B5C]/40'
          }`}>
            <div className="flex-1 w-full space-y-1">
              <label className="block text-xs font-bold text-[#7AB0A0] flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-[#2A6B5C]" />
                <span>إنشاء كود عشوائي جديد للفريق (Team Code Generator):</span>
              </label>
              <input
                type="text"
                placeholder="وصف اختياري للكود (مثال: كود دفعة مبيعات الصيف - فرع القاهرة)..."
                value={codeDescription}
                onChange={e => setCodeDescription(e.target.value)}
                className={`w-full p-2.5 rounded-xl border text-xs ${
                  isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-[#000000] border-[#2A6B5C]/30 text-white'
                }`}
              />
            </div>

            <button
              type="submit"
              className="px-6 py-2.5 bg-[#2A6B5C] hover:bg-[#7AB0A0] text-white font-black text-xs rounded-xl shadow-lg transition flex items-center gap-2 shrink-0 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>توليد كود جديد الآن</span>
            </button>
          </form>

          {/* Join Codes List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {joinCodes.map(codeItem => {
              const isCopied = copiedCode === codeItem.code;

              return (
                <div
                  key={codeItem.code}
                  className={`p-4 rounded-3xl border transition shadow-md space-y-3 ${
                    codeItem.isActive
                      ? isLight
                        ? 'bg-white border-slate-300'
                        : 'bg-[#000000] border-[#2A6B5C]/40'
                      : isLight
                      ? 'bg-slate-100 border-slate-300 opacity-60'
                      : 'bg-black/30 border-slate-800 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                      codeItem.isActive ? 'bg-slate-500/20 text-slate-400 border border-slate-500/40' : 'bg-slate-500/20 text-slate-400'
                    }`}>
                      {codeItem.isActive ? 'نشط وصالح للتسجيل ✅' : 'معطل مؤقتاً ⛔'}
                    </span>

                    <span className="text-[10px] opacity-70">{codeItem.createdAt}</span>
                  </div>

                  <div className="p-3 bg-black/40 rounded-2xl border border-white/10 flex items-center justify-between">
                    <span className="font-mono font-black text-base text-[#7AB0A0] tracking-wider">
                      {codeItem.code}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyCode(codeItem.code)}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs transition flex items-center gap-1 ${
                        isCopied ? 'bg-slate-600 text-white' : 'bg-[#2A6B5C] text-white hover:bg-[#7AB0A0]'
                      }`}
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{isCopied ? 'تم النسخ!' : 'نسخ'}</span>
                    </button>
                  </div>

                  <p className="text-xs opacity-85 font-medium">{codeItem.description}</p>
                  <div className="text-[10px] opacity-60">صادر بواسطة: {codeItem.createdBy}</div>

                  <div className="pt-2 border-t border-slate-800/30 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => toggleJoinCode(codeItem.code)}
                      className={`text-xs font-bold px-3 py-1 rounded-lg transition ${
                        codeItem.isActive
                          ? 'text-[#4F9282] hover:bg-[#041310]/40'
                          : 'text-slate-400 hover:bg-slate-950/40'
                      }`}
                    >
                      {codeItem.isActive ? 'تعطيل الكود' : 'تفعيل الكود'}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`هل أنت متأكد من حذف الكود ${codeItem.code}؟`)) {
                          deleteJoinCode(codeItem.code);
                        }
                      }}
                      className="text-red-400 hover:text-red-300 p-1"
                      title="حذف الكود"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* MODAL: APPROVE / CONFIGURE GRANULAR PERMISSIONS */}
      {permissionTargetUser && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4"
          dir="rtl"
          onClick={e => {
            if (e.target === e.currentTarget) setPermissionTargetUser(null);
          }}
          data-modal-backdrop="true"
        >
          <div
            ref={permissionModalRef}
            role="dialog"
            aria-modal="true"
            data-modal-container="true"
            className={`relative w-full max-w-lg rounded-3xl border-2 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col ${
              isLight ? 'bg-white border-[#4F9282] text-slate-900' : 'bg-[#000000] border-[#2A6B5C] text-slate-100'
            }`}
          >
            
            {/* Header */}
            <div className={`p-5 border-b flex items-center justify-between shrink-0 ${
              isLight ? 'bg-gradient-to-r from-[#EAF3F0] to-slate-50' : 'bg-[#1c1c1e]'
            }`}>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-[#2A6B5C] to-[#2A6B5C] text-gray-950 rounded-2xl shadow">
                  <Sliders className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-base text-[#7AB0A0]">
                    {permissionTargetUser.activeStatus === 'pending_approval'
                      ? `اعتماد وتحديد صلاحيات: ${permissionTargetUser.name}`
                      : `تعديل صلاحيات الحساب: ${permissionTargetUser.name}`}
                  </h3>
                  <p className="text-xs text-slate-200/80">
                    حدد بدقة ما يمكن للموظف رؤيته والتحكم فيه في الشيت
                  </p>
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSavePermissions} className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
              
              {/* Project */}
              <div className="grid grid-cols-1 gap-3 p-3 bg-black/20 rounded-2xl">
                <div>
                  <label className="block text-[11px] font-bold mb-1 text-[#7AB0A0]">المشروع المخصص:</label>
                  <select
                    value={approvalProject}
                    onChange={e => setApprovalProject(e.target.value)}
                    className={`w-full p-2 rounded-xl border text-xs ${
                      isLight ? 'bg-white border-slate-300' : 'bg-[#000000] border-[#2A6B5C]/30 text-white'
                    }`}
                  >
                    {projects.map(p => (
                      <option key={p.id} value={p.name}>
                        {p.name}
                      </option>
                    ))}
                    <option value="جميع المشاريع">جميع المشاريع</option>
                  </select>
                </div>

              </div>

              {/* Permission Checkboxes */}
              <div className="space-y-2">
                <label className="block font-extrabold text-xs text-[#7AB0A0]">
                  الصلاحيات التفصيلية (Granular Permissions):
                </label>

                {[
                  { key: 'canEditClientDetails', label: 'تعديل تفاصيل وبيانات العملاء', desc: 'تحديث أرقام وملاحظات وحالات العملاء' },
                  { key: 'canExport', label: 'تصدير الداتا إلى Excel / CSV', desc: 'تحميل وسحب شيتات العملاء إلى ملفات إكسيل' },
                  { key: 'canImport', label: 'استيراد داتا عملاء جديدة', desc: 'رفع ملفات CSV وإضافة أرقام جماعية' },
                  { key: 'canDeleteClients', label: 'حذف العملاء من الشيت', desc: 'إمكانية مسح سجل العميل نهائياً' },
                  { key: 'canBulkAssign', label: 'إعادة توزيع العملاء', desc: 'نقل العملاء بين موظفي المبيعات' },
                  { key: 'canSendWhatsApp', label: 'إرسال رسائل الواتساب المباشرة', desc: 'استخدام قوالب الواتساب السريعة' },
                  { key: 'canRecordVoiceNotes', label: 'تسجيل الملاحظات الصوتية', desc: 'استخدام الميكروفون لتحويل الصوت لنص' },
                  { key: 'canViewDistanceMap', label: 'خريطة المعاينة وحساب المسافة', desc: 'حساب زمن الوصول للمشروع ومشاركة الخريطة' },
                  { key: 'canManageTeam', label: 'صلاحية مدير مبيعات / إدارة الفريق', desc: 'توليد أكواد الفريق ومتابعة أداء السيلز' },
                ].map(perm => (
                  <label
                    key={perm.key}
                    className={`p-3 rounded-2xl border flex items-start gap-3 cursor-pointer transition ${
                      (customPermissions as any)[perm.key]
                        ? isLight
                          ? 'bg-slate-50 border-slate-400'
                          : 'bg-[#1c1c1e] border-slate-500'
                        : isLight
                        ? 'bg-slate-50 border-slate-200'
                        : 'bg-black/20 border-white/10'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={Boolean((customPermissions as any)[perm.key])}
                      onChange={e =>
                        setCustomPermissions(prev => ({
                          ...prev,
                          [perm.key]: e.target.checked,
                        }))
                      }
                      className="mt-1 w-4 h-4 rounded text-[#2A6B5C] focus:ring-[#4F9282]"
                    />
                    <div>
                      <div className="font-bold text-xs">{perm.label}</div>
                      <div className="text-[10px] opacity-75">{perm.desc}</div>
                    </div>
                  </label>
                ))}
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-800/40 flex justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setPermissionTargetUser(null)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-slate-200"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#2A6B5C] hover:bg-[#7AB0A0] text-white font-black rounded-xl shadow-lg transition"
                >
                  {permissionTargetUser.activeStatus === 'pending_approval'
                    ? 'اعتماد الحساب وتفعيل الصلاحيات ✅'
                    : 'حفظ وتحديث الصلاحيات'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* MODAL: RESET / CHANGE PASSWORD */}
      {passwordTargetUser && (
        <ChangePasswordModal
          isOpen={true}
          targetUser={passwordTargetUser}
          onClose={() => setPasswordTargetUser(null)}
        />
      )}

      {/* MODAL: ADD / EDIT USER */}
      {(showAddModal || editingUser) && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4"
          dir="rtl"
          onClick={e => {
            if (e.target === e.currentTarget) {
              setShowAddModal(false);
              setEditingUser(null);
            }
          }}
          data-modal-backdrop="true"
        >
          <div
            ref={userFormModalRef}
            role="dialog"
            aria-modal="true"
            data-modal-container="true"
            className={`relative w-full max-w-lg rounded-3xl border-2 shadow-2xl overflow-hidden ${
              isLight ? 'bg-white border-[#4F9282] text-slate-900' : 'bg-[#000000] border-[#2A6B5C] text-slate-100'
            }`}
          >
            
            <div className={`p-5 border-b flex items-center justify-between ${
              isLight ? 'bg-gradient-to-r from-[#EAF3F0] to-slate-50' : 'bg-[#1c1c1e]'
            }`}>
              <h3 className="font-black text-base text-[#7AB0A0]">
                {editingUser ? `تعديل بيانات: ${editingUser.name}` : 'إنشاء حساب موظف جديد'}
              </h3>
            </div>

            <form onSubmit={handleSaveUser} className="p-5 space-y-4 text-xs">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">الاسم الكامل:</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className={`w-full p-2.5 rounded-xl border text-xs ${
                      isLight ? 'bg-slate-50 border-slate-300' : 'bg-[#000000] border-[#2A6B5C]/30 text-white'
                    }`}
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1">اسم المستخدم للدخول:</label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    className={`w-full p-2.5 rounded-xl border text-xs font-mono ${
                      isLight ? 'bg-slate-50 border-slate-300' : 'bg-[#000000] border-[#2A6B5C]/30 text-white'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">البريد الإلكتروني:</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className={`w-full p-2.5 rounded-xl border text-xs font-mono ${
                      isLight ? 'bg-slate-50 border-slate-300' : 'bg-[#000000] border-[#2A6B5C]/30 text-white'
                    }`}
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1">رقم الهاتف:</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className={`w-full p-2.5 rounded-xl border text-xs font-mono ${
                      isLight ? 'bg-slate-50 border-slate-300' : 'bg-[#000000] border-[#2A6B5C]/30 text-white'
                    }`}
                  />
                </div>
              </div>

              {!editingUser && (
                <div>
                  <label className="block font-bold mb-1">كلمة السر الأولية:</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className={`w-full p-2.5 rounded-xl border text-xs font-mono ${
                      isLight ? 'bg-slate-50 border-slate-300' : 'bg-[#000000] border-[#2A6B5C]/30 text-white'
                    }`}
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">الصفة والدور:</label>
                  <select
                    value={role}
                    onChange={e => setRole(e.target.value as UserRole)}
                    className={`w-full p-2.5 rounded-xl border text-xs ${
                      isLight ? 'bg-slate-50 border-slate-300' : 'bg-[#000000] border-[#2A6B5C]/30 text-white'
                    }`}
                  >
                    <option value="SALES_REP">💼 موظف مبيعات (Sales Rep)</option>
                    <option value="SALES_MANAGER">👔 مدير مبيعات (Sales Manager)</option>
                    <option value="ADMIN">👑 المدير العام (Admin)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold mb-1">المشروع المخصص:</label>
                  <select
                    value={assignedProject}
                    onChange={e => setAssignedProject(e.target.value)}
                    className={`w-full p-2.5 rounded-xl border text-xs ${
                      isLight ? 'bg-slate-50 border-slate-300' : 'bg-[#000000] border-[#2A6B5C]/30 text-white'
                    }`}
                  >
                    {projects.map(p => (
                      <option key={p.id} value={p.name}>
                        {p.name}
                      </option>
                    ))}
                    <option value="جميع المشاريع">جميع المشاريع</option>
                  </select>
                </div>
              </div>

              {/* Avatar Selection */}
              <div className="space-y-2">
                <label className="block font-bold">صورة الحساب / الأفاتار:</label>
                <div className="flex items-center gap-2">
                  {PRESET_USER_AVATARS.map((av, idx) => (
                    <img
                      key={idx}
                      src={av}
                      alt={`Avatar option ${idx + 1}`}
                      width={40}
                      height={40}
                      loading="lazy"
                      decoding="async"
                      onClick={() => setAvatar(av)}
                      className={`w-10 h-10 rounded-xl object-cover cursor-pointer transition ${
                        avatar === av ? 'ring-2 ring-[#4F9282] scale-105' : 'opacity-60 hover:opacity-100'
                      }`}
                    />
                  ))}
                  <label className="p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-[#7AB0A0] cursor-pointer hover:bg-slate-900">
                    <Upload className="w-4 h-4" />
                    <input type="file" accept="image/*" onChange={handleLocalAvatarUpload} className="hidden" />
                  </label>
                </div>
              </div>

              <div className="pt-3 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingUser(null);
                  }}
                  className="px-4 py-2 text-slate-400 hover:text-slate-200"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#2A6B5C] hover:bg-[#7AB0A0] text-white font-black rounded-xl shadow-lg transition"
                >
                  حفظ بيانات الحساب
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
