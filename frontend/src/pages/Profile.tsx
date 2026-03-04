import { Layout } from '../components/Layout';
import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/auth';
import { api } from '../api';
import type { Post } from '../types';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Calendar, FileText, MessageSquare, Edit, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function Profile() {
  const { user, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchUserPosts();
  }, [isAuthenticated, navigate]);

  const fetchUserPosts = async () => {
    try {
      const response = await api.get('/posts/my-posts');
      setPosts(response.data.posts || []);
    } catch (error) {
      console.error('Failed to fetch user posts:', error);
    } finally {
      setIsLoading(false);
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
      <div className="max-w-5xl mx-auto pb-20">
        {/* Cinematic Header/Cover */}
        <div className="relative h-48 sm:h-64 rounded-[2.5rem] overflow-hidden mb-[-4rem] z-0">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500"></div>
          <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 to-transparent"></div>
        </div>

        {/* Profile Content Container */}
        <div className="relative z-10 px-4 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Left Column: Profile Card */}
            <div className="lg:col-span-1">
              <div className="bg-white/80 backdrop-blur-2xl border border-white/60 rounded-[2.5rem] shadow-2xl p-8 sticky top-28">
                <div className="flex flex-col items-center text-center">
                  <div className="relative mb-6">
                    <div className="w-32 h-32 rounded-3xl bg-white p-2 shadow-xl overflow-hidden rotate-3 hover:rotate-0 transition-transform duration-500">
                      {user.profileImage ? (
                        <img
                          src={user.profileImage}
                          alt={user.nickname}
                          className="w-full h-full rounded-2xl object-cover"
                        />
                      ) : (
                        <div className="w-full h-full rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-500 uppercase font-black text-4xl">
                          {user.nickname[0]}
                        </div>
                      )}
                    </div>
                    <div className="absolute -bottom-2 -right-2 bg-emerald-500 w-6 h-6 rounded-full border-4 border-white"></div>
                  </div>

                  <h1 className="text-2xl font-black text-slate-800 tracking-tight mb-2">{user.nickname}</h1>
                  <div className="inline-flex items-center px-3 py-1 rounded-full bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest mb-6">
                    {user.role === 'admin' ? t('profile.admin') : user.role === 'moderator' ? t('profile.moderator') : t('profile.member')}
                  </div>

                  <div className="w-full space-y-4 text-left border-t border-slate-100 pt-6">
                    <div className="flex items-center gap-3 text-slate-600">
                      <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                        <Mail size={16} />
                      </div>
                      <span className="text-sm font-bold truncate">{user.email}</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-600">
                      <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                        <Calendar size={16} />
                      </div>
                      <span className="text-sm font-bold">Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {user.bio && (
                    <div className="w-full mt-6 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100/50 text-left">
                      <p className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-2">Bio</p>
                      <p className="text-sm text-slate-600 font-medium leading-relaxed">{user.bio}</p>
                    </div>
                  )}

                  <Link
                    to="/profile/edit"
                    className="w-full mt-8 flex items-center justify-center gap-2 bg-slate-900 text-white py-4 rounded-2xl font-bold shadow-xl shadow-slate-900/20 hover:bg-slate-800 transition-all active:scale-95"
                  >
                    <Edit size={18} />
                    {t('profile.editProfile')}
                  </Link>
                </div>
              </div>
            </div>

            {/* Right Column: Activity / Posts */}
            <div className="lg:col-span-2 space-y-8">
              {/* Stats Overview */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white/70 backdrop-blur-xl border border-white/60 p-6 rounded-3xl shadow-sm text-center group hover:shadow-md transition-shadow">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Posts</p>
                  <p className="text-3xl font-black text-slate-800 group-hover:text-indigo-600 transition-colors">{posts.length}</p>
                </div>
                <div className="bg-white/70 backdrop-blur-xl border border-white/60 p-6 rounded-3xl shadow-sm text-center group hover:shadow-md transition-shadow">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Level</p>
                  <p className="text-3xl font-black text-slate-800 group-hover:text-purple-600 transition-colors capitalize">{user.role}</p>
                </div>
                <div className="bg-white/70 backdrop-blur-xl border border-white/60 p-6 rounded-3xl shadow-sm text-center group hover:shadow-md transition-shadow">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Status</p>
                  <p className="text-3xl font-black text-slate-800 group-hover:text-emerald-600 transition-colors">Active</p>
                </div>
              </div>

              {/* My Posts Card */}
              <div className="bg-white/70 backdrop-blur-xl border border-white/60 rounded-[2.5rem] shadow-xl overflow-hidden">
                <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white/50">
                  <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                    <FileText className="text-indigo-600" />
                    {t('profile.myPosts')}
                  </h2>
                </div>

                <div className="p-8">
                  {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                      <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                      <p className="text-slate-400 font-bold">{t('common.loading')}</p>
                    </div>
                  ) : posts.length === 0 ? (
                    <div className="text-center py-20 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                      <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-slate-200 mx-auto mb-6 shadow-sm">
                        <FileText size={40} />
                      </div>
                      <p className="text-slate-400 font-bold mb-4">{t('profile.noPosts')}</p>
                      <Link
                        to="/posts/new"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-xl text-slate-700 font-black text-xs uppercase tracking-widest hover:bg-white hover:shadow-md transition-all active:scale-95"
                      >
                        {t('post.createFirst')}
                      </Link>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {posts.map((post) => (
                        <Link
                          key={post.id}
                          to={`/posts/${post.id}`}
                          className="group bg-white p-6 rounded-3xl border border-slate-100 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-500/5 transition-all flex flex-col sm:flex-row sm:items-center gap-6"
                        >
                          <div className="flex-1">
                            <h3 className="text-lg font-black text-slate-800 group-hover:text-indigo-600 transition-colors mb-2 leading-snug">
                              {post.title}
                            </h3>
                            <p className="text-slate-500 font-medium text-sm line-clamp-2 mb-4">
                              {post.content.replace(/<[^>]*>/g, '').substring(0, 150)}...
                            </p>
                            <div className="flex flex-wrap items-center gap-4 text-[10px] font-black uppercase tracking-widest text-slate-300">
                              <span className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-lg">
                                <Calendar size={12} />
                                {new Date(post.createdAt).toLocaleDateString()}
                              </span>
                              <span className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-lg text-indigo-400">
                                <MessageSquare size={12} />
                                {post.commentCount} Comments
                              </span>
                            </div>
                          </div>
                          <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-indigo-600 group-hover:text-white transition-all transform group-hover:translate-x-1">
                            <ArrowRight size={20} />
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
