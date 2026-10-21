import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { User } from '../types';
import {
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  X,
  ShieldCheck,
} from 'lucide-react';

interface ChangePasswordModalProps {
  isOpen: boolean;
  targetUser?: User | null; // If null, changing current user's password
  onClose: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  targetUser,
  onClose,
}) => {
  const { currentUser, changeUserPassword, themeMode } = useApp();
  const isLight = themeMode === 'light';

  const userToUpdate = targetUser || currentUser;
  const isSelf = userToUpdate.id === currentUser.id;

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const modalRef = useFocusTrap<HTMLDivElement>({
    isActive: isOpen,
    onClose,
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (newPassword.length < 6) {
      setErrorMsg('كلمة المرور يجب ألا تقل عن 6 أحرف أو أرقام');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('كلمة المرور الجديدة غير متطابقة مع تأكيد كلمة المرور');
      return;
    }

    const res = await changeUserPassword(userToUpdate.id, newPassword, isSelf ? oldPassword : undefined);
    if (!res.success) {
      setErrorMsg(res.message || 'تعذر تغيير كلمة السر');
      return;
    }
    setSuccessMsg('');

    if (newPassword.length < 6) {
      setErrorMsg('كلمة المرور يجب ألا تقل عن 6 أحرف أو أرقام');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('كلمة المرور الجديدة غير متطابقة مع تأكيد كلمة المرور');
      return;
    }

    // Check old password only if regular user is updating self
    if (isSelf && userToUpdate.password && oldPassword !== userToUpdate.password && currentUser.role === 'SALES_REP') {
      setErrorMsg('كلمة المرور الحالية غير صحيحة');
      return;
    }

    changeUserPassword(userToUpdate.id, newPassword);
    setSuccessMsg(`تم تغيير كلمة المرور لحساب (${userToUpdate.name}) بنجاح!`);
    setTimeout(() => {
      onClose();
    }, 1800);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4"
      dir="rtl"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
      data-modal-backdrop="true"
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        data-modal-container="true"
        className={`relative w-full max-w-md rounded-3xl border-2 shadow-2xl overflow-hidden transition-all ${
          isLight
            ? 'bg-white border-[#4F9282]/60 text-slate-900 shadow-slate-400/50'
            : 'bg-[#000000] border-[#2A6B5C]/60 text-slate-100 shadow-2xl'
        }`}
      >
        
        {/* Header */}
        <div className={`p-5 border-b flex items-center justify-between ${
          isLight
            ? 'bg-gradient-to-r from-[#EAF3F0] to-slate-50 border-slate-200'
            : 'bg-gradient-to-r from-[#1c1c1e] to-[#000000] border-[#2A6B5C]/30'
        }`}>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-[#2A6B5C] to-[#2A6B5C] text-gray-950 rounded-2xl shadow-lg">
              <KeyRound className="w-6 h-6" />
            </div>
            <div>
              <h3 className={`text-base font-black ${isLight ? 'text-[#1c1c1e]' : 'text-[#7AB0A0]'}`}>
                {isSelf ? 'تغيير كلمة المرور الخاصة بك' : `إعادة تعيين كلمة مرور: ${userToUpdate.name}`}
              </h3>
              <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-200/80'}`}>
                اسم المستخدم: <strong className="font-mono text-[#4F9282]">{userToUpdate.username || userToUpdate.email}</strong>
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

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-950/80 border border-red-500 text-red-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-500 text-slate-200 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-slate-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {isSelf && (
            <div>
              <label className={`block font-bold mb-1 ${isLight ? 'text-slate-700' : 'text-slate-100'}`}>كلمة المرور الحالية:</label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="أدخل كلمة المرور الحالية..."
                value={oldPassword}
                onChange={e => setOldPassword(e.target.value)}
                className={`w-full p-2.5 rounded-xl border text-xs font-mono ${
                  isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-[#000000] border-[#2A6B5C]/30 text-white'
                }`}
              />
            </div>
          )}

          <div>
            <label className={`block font-bold mb-1 ${isLight ? 'text-slate-700' : 'text-slate-100'}`}>كلمة المرور الجديدة:</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="أدخل كلمة المرور الجديدة..."
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className={`w-full p-2.5 pl-9 rounded-xl border text-xs font-mono ${
                  isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-[#000000] border-[#2A6B5C]/30 text-white'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#4F9282]"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className={`block font-bold mb-1 ${isLight ? 'text-slate-700' : 'text-slate-100'}`}>تأكيد كلمة المرور الجديدة:</label>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              placeholder="أعد كتابة كلمة المرور للتأكيد..."
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className={`w-full p-2.5 rounded-xl border text-xs font-mono ${
                isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-[#000000] border-[#2A6B5C]/30 text-white'
              }`}
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800/30">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-slate-200"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#2A6B5C] hover:bg-[#4F9282] text-white font-black rounded-xl shadow-lg transition"
            >
              حفظ كلمة المرور
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
