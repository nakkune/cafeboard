import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { Home, User, LogOut, Menu, Shield, Globe } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '../store/settings';

export function Header() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { t, i18n } = useTranslation();
  const { settings } = useSettingsStore();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'en' ? 'ko' : 'en');
  };

  return (
    <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/50 sticky top-0 z-50 transition-all duration-300">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 group-hover:scale-105 transition-transform duration-300">
                <Home className="h-5 w-5" />
              </div>
              <span className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 tracking-tight">
                {settings.site_name || t('app.title')}
              </span>
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-2">
            <button
              onClick={toggleLanguage}
              className="flex items-center space-x-2 text-slate-500 hover:text-indigo-600 px-3 py-2 rounded-xl hover:bg-indigo-50/50 transition-colors font-semibold text-sm"
            >
              <Globe className="h-4 w-4" />
              <span>{i18n.language === 'en' ? 'KO' : 'EN'}</span>
            </button>

            {isAuthenticated ? (
              <>
                <div className="h-5 w-px bg-slate-200 mx-2"></div>
                <div className="flex flex-col items-end mr-2 pr-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('app.welcome')}</span>
                  <span className="text-sm font-bold text-slate-800">{user?.nickname}</span>
                </div>
                {(user?.role === 'admin' || user?.role === 'moderator') && (
                  <Link
                    to="/admin"
                    className="flex items-center space-x-1.5 text-rose-500 hover:text-rose-600 px-3 py-2 rounded-xl hover:bg-rose-50 transition-colors font-bold text-sm"
                  >
                    <Shield className="h-4 w-4" />
                    <span>{t('nav.admin')}</span>
                  </Link>
                )}
                <Link
                  to="/profile"
                  className="flex items-center space-x-1.5 text-slate-500 hover:text-indigo-600 px-3 py-2 rounded-xl hover:bg-indigo-50/50 transition-colors font-bold text-sm"
                >
                  <User className="h-4 w-4" />
                  <span>{t('nav.profile')}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1.5 text-slate-500 hover:text-rose-500 px-3 py-2 rounded-xl hover:bg-rose-50 transition-colors font-bold text-sm ml-1"
                >
                  <LogOut className="h-4 w-4" />
                  <span>{t('nav.logout')}</span>
                </button>
              </>
            ) : (
              <div className="flex items-center gap-3 ml-2">
                <Link
                  to="/login"
                  className="text-sm font-bold text-slate-600 hover:text-indigo-600 px-4 py-2.5 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  {t('nav.login')}
                </Link>
                <Link
                  to="/register"
                  className="text-sm font-bold bg-slate-900 text-white px-5 py-2.5 rounded-xl hover:bg-slate-800 transition-all shadow-md shadow-slate-900/10 hover:-translate-y-0.5"
                >
                  {t('nav.register')}
                </Link>
              </div>
            )}
          </div>

          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-700 hover:text-gray-900"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden pb-4">
            <button
              onClick={toggleLanguage}
              className="flex items-center space-x-1 text-gray-700 hover:text-blue-600 px-3 py-2"
            >
              <Globe className="h-5 w-5" />
              <span>{i18n.language === 'en' ? '한국어' : 'English'}</span>
            </button>

            {isAuthenticated ? (
              <div className="flex flex-col space-y-2">
                <span className="text-gray-700 px-3">{t('app.welcome')}, {user?.nickname}</span>
                {(user?.role === 'admin' || user?.role === 'moderator') && (
                  <Link
                    to="/admin"
                    className="text-red-600 hover:text-red-700 px-3 py-2"
                  >
                    {t('nav.admin')}
                  </Link>
                )}
                <Link
                  to="/profile"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2"
                >
                  {t('nav.profile')}
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-left text-gray-700 hover:text-red-600 px-3 py-2"
                >
                  {t('nav.logout')}
                </button>
              </div>
            ) : (
              <div className="flex flex-col space-y-2">
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2"
                >
                  {t('nav.login')}
                </Link>
                <Link
                  to="/register"
                  className="bg-blue-600 text-white px-3 py-2 rounded-md"
                >
                  {t('nav.register')}
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
