import React, { useState } from 'react';
import { useApp, PUBLIC_INFO } from '../context/AppContext';
import { Logo } from './Logo';
import { PWAInstallButton } from './PWAInstallButton';
import {
  Lock,
  Mail,
  ShieldCheck,
  KeyRound,
  Eye,
  EyeOff,
  AlertCircle,
  UserPlus,
  Ticket,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const {
    loginWithCredentials,
    registerSalesWithJoinCode,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'LOGIN' | 'REGISTER'>('LOGIN');

  // Login Form States
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Register Form States
  const [regName, setRegName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regProject, setRegProject] = useState(PUBLIC_INFO.projects?.[0] || 'Wada Bay رأس الحكمة');
  const [regJoinCode, setRegJoinCode] = useState('');
  const [regSuccessMsg, setRegSuccessMsg] = useState('');
  const [regErrorMsg, setRegErrorMsg] = useState('');

  const [busy, setBusy] = useState(false);

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setBusy(true);
    const res = await loginWithCredentials(usernameInput, passwordInput);
    if (!res.success) {
      setBusy(false);
      setErrorMsg(res.message || 'خطأ في تسجيل الدخول، يرجى التأكد من بيانات الاعتماد');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegErrorMsg('');
    setRegSuccessMsg('');

    if (!regJoinCode.trim()) {
      setRegErrorMsg('يرجى إدخال كود انضمام الفريق المسلم لك من المدير');
      return;
    }

    setBusy(true);
    const res = await registerSalesWithJoinCode(
      {
        name: regName.trim(),
        username: regUsername.trim(),
        password: regPassword,
        email: regEmail.trim(),
        phone: regPhone.trim(),
        assignedProject: regProject,
      },
      regJoinCode.trim()
    );

    setBusy(false);
    if (res.success) {
      setRegSuccessMsg(res.message);
      // Clear fields
      setRegName('');
      setRegUsername('');
      setRegEmail('');
      setRegPhone('');
      setRegPassword('');
      setRegJoinCode('');
    } else {
      setRegErrorMsg(res.message);
    }
  };

  // Get active join code sample for display hint
  const activeCodeSample = 'GOHAR-2026-XXXX';

  return (
    <div className="ios-page ios-font min-h-screen flex flex-col justify-between relative overflow-hidden selection:bg-[var(--ios-blue)] selection:text-white">

      {/* Soft background glows (very subtle, iOS-style) */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-[var(--ios-blue)]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-[var(--ios-green)]/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Top Header Bar */}
      <header className="p-4 sm:p-5 flex items-center justify-between z-10 gap-2 bg-[var(--ios-card)]/70 backdrop-blur-xl border-b border-[var(--ios-separator)]">
        <Logo size="md" />
        <div className="flex items-center gap-2">
          <PWAInstallButton variant="header" />
          <div className="hidden sm:flex items-center gap-2 bg-[var(--ios-blue)]/10 px-3.5 py-1.5 rounded-full">
            <ShieldCheck className="w-4 h-4 text-[var(--ios-blue)]" />
            <span className="text-xs text-[var(--ios-blue)] font-semibold">بوابة الدخول والانضمام المعتمدة</span>
          </div>
        </div>
      </header>

      {/* Main Login/Register Card */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 z-10 my-4">
        <div className="ios-card max-w-lg w-full p-6 sm:p-8 flex flex-col items-center space-y-5">

          {/* Logo & Company Title Header */}
          <div className="flex flex-col items-center text-center space-y-2">
            <Logo size="lg" />
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-[var(--ios-text)]">
                {activeTab === 'LOGIN' ? 'تسجيل الدخول للنظام' : 'طلب انضمام سيلز جديد للفريق'}
              </h2>
              <p className="text-xs text-[var(--ios-label-secondary)] mt-0.5">
                {activeTab === 'LOGIN'
                  ? 'يرجى إدخال اسم المستخدم وكلمة السر المعتمدة'
                  : 'التسجيل حصري بكود عشوائي معتمد من المدير العام'}
              </p>
            </div>
          </div>

          {/* Tab Switcher (iOS segmented control) */}
          <div className="w-full grid grid-cols-2 p-1 bg-[var(--ios-label-secondary)]/10 rounded-2xl">
            <button
              type="button"
              onClick={() => { setActiveTab('LOGIN'); setErrorMsg(''); }}
              className={`py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
                activeTab === 'LOGIN'
                  ? 'bg-[var(--ios-card)] text-[var(--ios-text)] shadow-sm'
                  : 'text-[var(--ios-label-secondary)]'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>تسجيل الدخول</span>
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('REGISTER'); setRegErrorMsg(''); setRegSuccessMsg(''); }}
              className={`py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
                activeTab === 'REGISTER'
                  ? 'bg-[var(--ios-card)] text-[var(--ios-text)] shadow-sm'
                  : 'text-[var(--ios-label-secondary)]'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>انضمام بكود الفريق</span>
            </button>
          </div>

          {/* TAB 1: LOGIN FORM */}
          {activeTab === 'LOGIN' && (
            <div className="w-full space-y-4">
              {errorMsg && (
                <div className="w-full bg-[var(--ios-red)]/10 border border-[var(--ios-red)]/20 p-3 rounded-xl text-xs text-[var(--ios-red)] flex items-center gap-2 animate-fadeIn">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleCredentialsSubmit} className="w-full space-y-3.5 text-xs">
                <div>
                  <label className="block text-[var(--ios-text)]/70 font-bold mb-1.5">اسم المستخدم أو البريد:</label>
                  <div className="relative">
                    <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--ios-label-secondary)]" />
                    <input
                      type="text"
                      required
                      placeholder="اسم المستخدم أو البريد..."
                      value={usernameInput}
                      onChange={e => setUsernameInput(e.target.value)}
                      className="ios-input pr-9 pl-3 font-mono placeholder:text-[var(--ios-label-secondary)]/60"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[var(--ios-text)]/70 font-bold mb-1.5">كلمة السر:</label>
                  <div className="relative">
                    <KeyRound className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--ios-label-secondary)]" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="كلمة السر..."
                      value={passwordInput}
                      onChange={e => setPasswordInput(e.target.value)}
                      className="ios-input pr-9 pl-10 font-mono placeholder:text-[var(--ios-label-secondary)]/60"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ios-label-secondary)] active:text-[var(--ios-blue)]"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={busy}
                  className="ios-button text-xs disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
                >
                  <Lock className="w-4 h-4" />
                  <span>{busy ? 'جاري الدخول...' : 'تسجيل الدخول إلى الشيت'}</span>
                </button>
              </form>

            </div>
          )}

          {/* TAB 2: SALES REGISTRATION WITH JOIN CODE */}
          {activeTab === 'REGISTER' && (
            <div className="w-full space-y-4">

              {/* Informational Box */}
              <div className="p-3 bg-[var(--ios-blue)]/10 rounded-2xl text-[11px] text-[var(--ios-blue)] space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <Ticket className="w-4 h-4" />
                  <span>شرط الانضمام بكود الفريق:</span>
                </div>
                <p className="leading-relaxed opacity-90 text-[var(--ios-text)]/70">
                  لا يمكن إنشاء حساب سيلز إلا بكود عشوائي معتمد من المدير العام. بعد التسجيل يظل الحساب معلقاً حتى يعتمد المدير الصلاحيات المخصصة لك.
                </p>
                <div className="pt-1 text-[10px] text-[var(--ios-text)]/60">
                  كود نشط للتجربة: <strong className="font-mono bg-[var(--ios-label-secondary)]/15 px-1.5 py-0.5 rounded text-[var(--ios-blue)]">{activeCodeSample}</strong>
                </div>
              </div>

              {regErrorMsg && (
                <div className="w-full bg-[var(--ios-red)]/10 border border-[var(--ios-red)]/20 p-3 rounded-xl text-xs text-[var(--ios-red)] flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{regErrorMsg}</span>
                </div>
              )}

              {regSuccessMsg && (
                <div className="w-full bg-[var(--ios-green)]/10 border border-[var(--ios-green)]/20 p-4 rounded-2xl text-xs text-[var(--ios-text)]/80 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-[var(--ios-green)] text-sm">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>تم تقديم طلب الانضمام بنجاح!</span>
                  </div>
                  <p className="leading-relaxed">{regSuccessMsg}</p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('LOGIN')}
                    className="ios-button mt-2 text-xs flex items-center justify-center gap-1.5"
                  >
                    <span>العودة لصفحة تسجيل الدخول</span>
                    <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                  </button>
                </div>
              )}

              {!regSuccessMsg && (
                <form onSubmit={handleRegisterSubmit} className="w-full space-y-3 text-xs">

                  {/* Join Code Field (Prominent) */}
                  <div className="p-3 bg-[var(--ios-blue)]/[0.06] rounded-2xl space-y-1.5">
                    <label className="block text-[var(--ios-blue)] font-extrabold flex items-center gap-1.5">
                      <Ticket className="w-4 h-4" />
                      <span>كود انضمام الفريق (Team Join Code)*:</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: GOHAR-2026-SALES"
                      value={regJoinCode}
                      onChange={e => setRegJoinCode(e.target.value.toUpperCase())}
                      className="ios-input font-mono font-bold tracking-wider text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[var(--ios-text)]/70 font-bold mb-1">الاسم بالكامل:</label>
                      <input
                        type="text"
                        required
                        placeholder="مثال: سارة أحمد"
                        value={regName}
                        onChange={e => setRegName(e.target.value)}
                        className="ios-input"
                      />
                    </div>

                    <div>
                      <label className="block text-[var(--ios-text)]/70 font-bold mb-1">اسم المستخدم للدخول:</label>
                      <input
                        type="text"
                        required
                        placeholder="مثال: Sarah01"
                        value={regUsername}
                        onChange={e => setRegUsername(e.target.value)}
                        className="ios-input font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[var(--ios-text)]/70 font-bold mb-1">البريد الإلكتروني:</label>
                      <input
                        type="email"
                        required
                        placeholder="sarah@gohar.eg"
                        value={regEmail}
                        onChange={e => setRegEmail(e.target.value)}
                        className="ios-input font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[var(--ios-text)]/70 font-bold mb-1">رقم الهاتف:</label>
                      <input
                        type="tel"
                        required
                        placeholder="010XXXXXXXX"
                        value={regPhone}
                        onChange={e => setRegPhone(e.target.value)}
                        className="ios-input font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[var(--ios-text)]/70 font-bold mb-1">كلمة المرور:</label>
                      <input
                        type="password"
                        required
                        placeholder="كلمة مرور قوية..."
                        value={regPassword}
                        onChange={e => setRegPassword(e.target.value)}
                        className="ios-input"
                      />
                    </div>

                    <div>
                      <label className="block text-[var(--ios-text)]/70 font-bold mb-1">المشروع المفضل:</label>
                      <select
                        value={regProject}
                        onChange={e => setRegProject(e.target.value)}
                        className="ios-input"
                      >
                        {(PUBLIC_INFO.projects || []).map(name => (
                          <option key={name} value={name}>
                            {name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="ios-button text-xs flex items-center justify-center gap-2 mt-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>إرسال طلب الانضمام لاعتماده من المدير العام</span>
                  </button>
                </form>
              )}

            </div>
          )}

        </div>
      </main>

      {/* Footer */}
      <footer className="p-4 text-center text-xs text-[var(--ios-label-secondary)] z-10">
        جوهر جروب للتطوير العقاري &copy; {new Date().getFullYear()} - جميع الحقوق محفوظة
      </footer>

    </div>
  );
};
