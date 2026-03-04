import { Layout } from '../components/Layout';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuthStore } from '../store/auth';
import { User, Lock, Camera, Loader2, Eye, EyeOff, Save, ChevronLeft, Image as ImageIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function EditProfile() {
  const navigate = useNavigate();
  const { user, setUser } = useAuthStore();
  const { t } = useTranslation();

  // Profile form states
  const [nickname, setNickname] = useState('');
  const [bio, setBio] = useState('');
  const [profileImage, setProfileImage] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Password form states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Active tab
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');

  useEffect(() => {
    if (user) {
      setNickname(user.nickname);
      setBio(user.bio || '');
      setProfileImage(user.profileImage || '');
    }
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) return;

    setIsUpdating(true);
    try {
      const response = await api.put('/users/me', {
        nickname,
        bio,
      });
      setUser(response.data.user);
      alert(t('profile.updateSuccess'));
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      alert(error.response?.data?.error || t('profile.updateError'));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      alert(t('auth.passwordMismatch'));
      return;
    }

    if (newPassword.length < 6) {
      alert(t('profile.passwordMinLength'));
      return;
    }

    setIsChangingPassword(true);
    try {
      await api.put('/users/me/password', {
        currentPassword,
        newPassword,
      });
      alert(t('profile.passwordChangeSuccess'));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error('Failed to change password:', error);
      alert(error.response?.data?.error || t('profile.passwordChangeError'));
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleImageUpdate = async () => {
    if (!profileImage.trim()) return;

    try {
      const response = await api.put('/users/me/image', {
        profileImage,
      });
      setUser(response.data.user);
      alert(t('profile.imageUpdateSuccess'));
    } catch (error) {
      console.error('Failed to update image:', error);
      alert(t('profile.imageUpdateError'));
    }
  };

  if (!user) {
    return (
      <Layout>
        <div className="text-center py-8">{t('common.loading')}</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto pb-20 mt-8 px-4">
        {/* Header with Navigation */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">{t('profile.editProfile')}</h1>
            <p className="text-slate-400 font-semibold text-sm uppercase tracking-widest mt-1 italic">Personalize your profile</p>
          </div>
          <button
            onClick={() => navigate('/profile')}
            className="group flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all active:scale-95 shadow-sm"
          >
            <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            {t('common.back')}
          </button>
        </div>

        {/* glassmorphism Container */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-[2.5rem] blur opacity-10 group-hover:opacity-20 transition duration-1000"></div>

          <div className="relative bg-white/70 backdrop-blur-2xl border border-white/60 rounded-[2.5rem] shadow-2xl overflow-hidden">
            {/* Tabs Navigation */}
            <div className="flex border-b border-slate-100 bg-white/30">
              <button
                onClick={() => setActiveTab('profile')}
                className={`flex-1 flex items-center justify-center gap-2 py-5 px-4 font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'profile'
                  ? 'text-indigo-600 border-b-2 border-indigo-600 bg-white/50'
                  : 'text-slate-400 hover:text-slate-600 hover:bg-white/20'
                  }`}
              >
                <User size={16} />
                Profile Info
              </button>
              <button
                onClick={() => setActiveTab('password')}
                className={`flex-1 flex items-center justify-center gap-2 py-5 px-4 font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'password'
                  ? 'text-indigo-600 border-b-2 border-indigo-600 bg-white/50'
                  : 'text-slate-400 hover:text-slate-600 hover:bg-white/20'
                  }`}
              >
                <Lock size={16} />
                Security
              </button>
            </div>

            <div className="p-8 sm:p-12">
              {activeTab === 'profile' ? (
                <form onSubmit={handleUpdateProfile} className="space-y-10">
                  {/* Profile Image Section */}
                  <div className="relative">
                    <div className="flex flex-col sm:flex-row items-center gap-8">
                      <div className="relative group/avatar">
                        <div className="w-32 h-32 rounded-3xl bg-white p-2 shadow-xl ring-1 ring-slate-100 overflow-hidden relative">
                          {profileImage ? (
                            <img
                              src={profileImage}
                              alt="Preview"
                              className="w-full h-full rounded-2xl object-cover"
                              onError={(e) => { (e.target as HTMLImageElement).src = ''; }}
                            />
                          ) : (
                            <div className="w-full h-full rounded-2xl bg-slate-50 flex items-center justify-center text-slate-200">
                              <User size={48} />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center text-white cursor-pointer">
                            <Camera size={24} />
                          </div>
                        </div>
                      </div>

                      <div className="flex-1 space-y-4 w-full">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
                          <ImageIcon size={12} />
                          {t('profile.profileImage')} URL
                        </label>
                        <div className="flex flex-col sm:flex-row gap-3">
                          <input
                            type="url"
                            value={profileImage}
                            onChange={(e) => setProfileImage(e.target.value)}
                            className="flex-1 px-5 py-4 bg-slate-50/50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-slate-700 placeholder-slate-300 shadow-inner"
                            placeholder="https://images.unsplash.com/..."
                          />
                          <button
                            type="button"
                            onClick={handleImageUpdate}
                            className="px-6 py-4 bg-white border border-slate-200 text-slate-700 rounded-2xl font-black text-xs uppercase tracking-widest hover:border-indigo-300 hover:text-indigo-600 transition-all shadow-sm active:scale-95"
                          >
                            Update Image
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Nickname & Bio */}
                  <div className="grid gap-8">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 px-1 uppercase tracking-widest">
                        {t('profile.nickname')} *
                      </label>
                      <input
                        type="text"
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        className="w-full px-5 py-4 bg-slate-50/50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-slate-700 shadow-inner"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 px-1 uppercase tracking-widest">
                        {t('profile.bio')}
                      </label>
                      <textarea
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        className="w-full px-5 py-4 bg-slate-50/50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-slate-700 shadow-inner min-h-[140px] resize-none"
                        placeholder={t('profile.bioPlaceholder')}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <button
                      type="submit"
                      disabled={isUpdating}
                      className="group flex items-center justify-center gap-3 px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-slate-900/20 hover:bg-slate-800 transition-all active:scale-[0.98] disabled:opacity-50"
                    >
                      {isUpdating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save size={20} />}
                      {t('common.save')}
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleChangePassword} className="space-y-8 max-w-lg mx-auto py-4">
                  <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 mx-auto mb-4 shadow-inner border border-rose-100/50">
                      <Lock size={28} />
                    </div>
                    <h3 className="text-xl font-black text-slate-800 tracking-tight">Security Settings</h3>
                    <p className="text-slate-400 font-medium text-sm mt-1">Keep your account safe and secure</p>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 px-1 uppercase tracking-widest">
                        {t('profile.currentPassword')}
                      </label>
                      <div className="relative">
                        <input
                          type={showCurrentPassword ? 'text' : 'password'}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="w-full px-5 py-4 bg-slate-50/50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-slate-700 shadow-inner"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors"
                        >
                          {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 px-1 uppercase tracking-widest">
                        {t('profile.newPassword')}
                      </label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full px-5 py-4 bg-slate-50/50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-slate-700 shadow-inner"
                          required
                          minLength={6}
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors"
                        >
                          {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 px-1 uppercase tracking-widest">
                        {t('profile.confirmNewPassword')}
                      </label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={`w-full px-5 py-4 bg-slate-50/50 border rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold text-slate-700 shadow-inner ${newPassword && confirmPassword && newPassword !== confirmPassword ? 'border-rose-300 ring-rose-500/10' : 'border-slate-200 focus:border-indigo-500'
                          }`}
                        required
                      />
                      {newPassword && confirmPassword && newPassword !== confirmPassword && (
                        <p className="text-rose-500 text-[10px] font-black uppercase tracking-tighter px-1">{t('auth.passwordMismatch')}</p>
                      )}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isChangingPassword || newPassword !== confirmPassword}
                    className="w-full mt-6 group flex items-center justify-center gap-3 px-10 py-4 bg-rose-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-rose-500/20 hover:bg-rose-600 transition-all active:scale-[0.98] disabled:opacity-50"
                  >
                    {isChangingPassword ? <Loader2 className="w-5 h-5 animate-spin" /> : <Lock size={20} />}
                    {t('profile.changePassword')}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
