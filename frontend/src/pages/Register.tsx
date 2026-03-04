import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { Layout } from '../components/Layout';
import { Eye, EyeOff, User, Mail, Lock, Smartphone, Users, Sparkles, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other' | ''>('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { register, isLoading, error, clearError } = useAuthStore();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const formatPhoneNumber = (value: string): string => {
    const numbers = value.replace(/[^\d]/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhone(formatted);
  };

  const [successMessage, setSuccessMessage] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setSuccessMessage('');

    if (!email.trim() || !password || !confirmPassword || !nickname.trim() || !name.trim() || !phone.trim() || !gender) {
      return;
    }
    if (password !== confirmPassword) {
      return;
    }

    const result = await register({ email, password, nickname, name, phone, gender });
    if (result) {
      setIsRegistered(true);
    }
  };


  return (
    <Layout>
      <div className="max-w-2xl mx-auto mt-12 sm:mt-20 px-4 pb-20">
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-[2.5rem] blur opacity-20 group-hover:opacity-30 transition duration-1000"></div>

          <div className="relative bg-white/70 backdrop-blur-2xl border border-white/60 p-8 sm:p-12 rounded-[2.5rem] shadow-2xl">
            <div className="flex flex-col items-center text-center mb-12">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white mb-6 shadow-xl shadow-indigo-600/20">
                <Sparkles size={32} />
              </div>
              <h1 className="text-3xl font-black text-slate-800 tracking-tight mb-2">
                {isRegistered ? 'Welcome!' : t('auth.register')}
              </h1>
              <p className="text-slate-400 font-semibold text-sm uppercase tracking-widest">
                {isRegistered ? 'Registration Complete' : 'Join our Premium Community'}
              </p>
            </div>

            {isRegistered ? (
              <div className="py-10 flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-700">
                <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-3xl flex items-center justify-center mb-8 shadow-inner border border-emerald-100">
                  <Sparkles size={40} className="animate-pulse" />
                </div>

                <h2 className="text-2xl font-black text-slate-800 mb-4">회원가입이 완료되었습니다!</h2>
                <div className="space-y-4 mb-10">
                  <p className="text-slate-600 font-bold leading-relaxed">
                    회원가입이 성공했습니다.<br />
                    보다 안전한 커뮤니티 운영을 위해
                  </p>
                  <p className="inline-block px-4 py-2 bg-emerald-100 text-emerald-700 rounded-xl font-black text-sm uppercase tracking-tighter">
                    관리자의 승인을 기다려주세요.
                  </p>
                </div>

                <div className="w-full bg-slate-50/50 rounded-2xl p-6 border border-slate-100 text-xs text-slate-400 font-semibold italic mb-4">
                  "승인 완료 후 모든 서비스를 이용하실 수 있습니다.<br />
                  완료 시 이메일로 안내 드리겠습니다."
                </div>
              </div>
            ) : (
              <>

                {successMessage && (
                  <div className="bg-emerald-50 border border-emerald-100 text-emerald-600 px-6 py-4 rounded-2xl mb-8 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-sm font-bold">{successMessage}</span>
                  </div>
                )}

                {error && (
                  <div className="bg-rose-50 border border-rose-100 text-rose-600 px-6 py-4 rounded-2xl mb-8 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                    <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></div>
                    <span className="text-sm font-bold">{error}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="grid grid-cols-1 gap-8">
                    {/* Email Field */}
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 px-1 uppercase tracking-widest flex items-center gap-2">
                        <Mail size={12} />
                        {t('auth.email')} *
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-5 py-4 bg-slate-50/50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white transition-all text-slate-700 font-bold placeholder-slate-300"
                        placeholder="example@mail.com"
                        required
                      />
                    </div>

                    {/* Password Field */}
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 px-1 uppercase tracking-widest flex items-center gap-2">
                        <Lock size={12} />
                        {t('auth.password')} *
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full px-5 py-4 bg-slate-50/50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white transition-all text-slate-700 font-bold placeholder-••••••••"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-indigo-600 transition-colors"
                        >
                          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                    </div>

                    {/* Confirm Password Field */}
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 px-1 uppercase tracking-widest flex items-center gap-2">
                        <Lock size={12} />
                        {t('auth.confirmPassword')} *
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className={`w-full px-5 py-4 bg-slate-50/50 border rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all text-slate-700 font-bold placeholder-•••••••• ${password !== confirmPassword && confirmPassword ? 'border-rose-300 bg-rose-50/30' : 'border-slate-200 focus:border-indigo-500 focus:bg-white'
                            }`}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-indigo-600 transition-colors"
                        >
                          {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                      {password !== confirmPassword && confirmPassword && (
                        <p className="text-rose-500 text-[10px] font-black uppercase tracking-tighter px-1">{t('auth.passwordMismatch')}</p>
                      )}
                    </div>

                    {/* Nickname Field */}
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 px-1 uppercase tracking-widest flex items-center gap-2">
                        <User size={12} />
                        {t('auth.nickname')} *
                      </label>
                      <input
                        type="text"
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        className="w-full px-5 py-4 bg-slate-50/50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white transition-all text-slate-700 font-bold placeholder="
                        required
                      />
                    </div>

                    {/* Name Field */}
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 px-1 uppercase tracking-widest flex items-center gap-2">
                        <User size={12} />
                        {t('auth.name')} *
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-5 py-4 bg-slate-50/50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white transition-all text-slate-700 font-bold placeholder="
                        required
                      />
                    </div>

                    {/* Phone Field */}
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 px-1 uppercase tracking-widest flex items-center gap-2">
                        <Smartphone size={12} />
                        {t('auth.phone')} *
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={handlePhoneChange}
                        className="w-full px-5 py-4 bg-slate-50/50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white transition-all text-slate-700 font-bold placeholder-010-1234-5678"
                        required
                        maxLength={13}
                      />
                    </div>

                    {/* Gender Field */}
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 px-1 uppercase tracking-widest flex items-center gap-2">
                        <Users size={12} />
                        {t('auth.gender')} *
                      </label>
                      <select
                        value={gender}
                        onChange={(e) => setGender(e.target.value as 'male' | 'female' | 'other' | '')}
                        className="w-full px-5 py-4 bg-slate-50/50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white transition-all text-slate-700 font-bold appearance-none cursor-pointer"
                        required
                      >
                        <option value="">{t('auth.genderSelect')}</option>
                        <option value="male">{t('auth.male')}</option>
                        <option value="female">{t('auth.female')}</option>
                        <option value="other">{t('auth.other')}</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || (password !== confirmPassword && confirmPassword !== '')}
                    className="group relative w-full bg-slate-900 text-white py-5 rounded-2xl font-bold shadow-xl shadow-slate-900/20 hover:bg-slate-800 transition-all active:scale-[0.98] disabled:opacity-50 overflow-hidden mt-6"
                  >
                    <div className="relative z-10 flex items-center justify-center gap-2 text-lg">
                      {isLoading ? (
                        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      ) : (
                        <>
                          {t('auth.register')}
                          <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </div>
                  </button>
                </form>
              </>
            )}

            <div className="mt-12 pt-10 border-t border-slate-100 flex flex-col items-center gap-4">
              <p className="text-sm font-semibold text-slate-400">
                {t('auth.alreadyHaveAccount')}
              </p>
              <button
                onClick={() => navigate('/login')}
                className="px-10 py-3 bg-white border border-slate-200 rounded-xl text-slate-700 font-black text-xs uppercase tracking-widest hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm active:scale-95"
              >
                {t('auth.login')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
