import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { Layout } from '../components/Layout';
import { Eye, EyeOff, AlertCircle, Mail, Lock as LockIcon, ArrowRight, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading, error, clearError } = useAuthStore();
  const navigate = useNavigate();
  const { t } = useTranslation();


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    const result = await login({ email, password });
    if (result) {
      navigate('/');
    }
  };

  return (
    <Layout>
      <div className="max-w-md mx-auto mt-12 sm:mt-24 px-4 pb-20">
        <div className="relative group">
          {/* Decorative glow */}
          <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-[2.5rem] blur opacity-20 group-hover:opacity-30 transition duration-1000"></div>

          <div className="relative bg-white/70 backdrop-blur-2xl border border-white/60 p-10 rounded-[2.5rem] shadow-2xl">
            <div className="flex flex-col items-center text-center mb-10">
              <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white mb-6 shadow-xl shadow-indigo-600/20">
                <Sparkles size={32} />
              </div>
              <h1 className="text-3xl font-black text-slate-800 tracking-tight mb-2">{t('auth.login')}</h1>
              <p className="text-slate-400 font-semibold text-sm uppercase tracking-widest italic">Experience the Premium</p>
            </div>

            {error && (
              <div className="bg-rose-50 border border-rose-100 text-rose-600 px-5 py-3.5 rounded-2xl mb-8 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                <AlertCircle size={18} />
                <span className="text-sm font-bold">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 px-1 uppercase tracking-widest flex items-center gap-2">
                  <Mail size={12} />
                  {t('auth.email')}
                </label>
                <div className="relative group">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-5 py-4 bg-slate-50/50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white transition-all text-slate-700 font-bold placeholder-slate-300"
                    placeholder="example@mail.com"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <LockIcon size={12} />
                    {t('auth.password')}
                  </label>
                </div>
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

              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full bg-slate-900 text-white py-4 rounded-2xl font-bold shadow-xl shadow-slate-900/20 hover:bg-slate-800 transition-all active:scale-[0.98] disabled:opacity-50 overflow-hidden"
              >
                <div className="relative z-10 flex items-center justify-center gap-2">
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      {t('auth.login')}
                      <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </div>
              </button>
            </form>

            <div className="mt-10 pt-8 border-t border-slate-100 flex flex-col items-center gap-4">
              <p className="text-sm font-semibold text-slate-400">
                {t('auth.noAccount')}
              </p>
              <button
                onClick={() => navigate('/register')}
                className="px-8 py-3 bg-white border border-slate-200 rounded-xl text-slate-700 font-black text-xs uppercase tracking-widest hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm active:scale-95"
              >
                {t('auth.register')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
