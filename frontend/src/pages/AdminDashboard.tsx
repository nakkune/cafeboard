import { Layout } from '../components/Layout';
import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/auth';
import { api } from '../api';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Users, FileText, MessageSquare, AlertCircle,
  BarChart3, Shield, UserCheck, Search, Check, X, Loader2, Settings
} from 'lucide-react';

interface Stats {
  overview: {
    totalUsers: number;
    newUsersToday: number;
    totalPosts: number;
    newPostsToday: number;
    totalComments: number;
    newCommentsToday: number;
    pendingReports: number;
    totalReports: number;
  };
  usersByRole: { role: string; count: number }[];
  dailyStats: { date: string; users: number; posts: number }[];
}

interface Member {
  id: number;
  email: string;
  nickname: string;
  name: string | null;
  phone: string | null;
  gender: string | null;
  memberStatus: 'pending' | 'approved' | 'rejected';
  memberLevel: 'regular' | 'general' | 'nonmember';
  role: string;
  isActive: boolean;
  createdAt: string;
  approvedAt: string | null;
}

interface Report {
  id: number;
  reporterId: number | null;
  targetType: 'post' | 'comment' | 'video';
  targetId: number;
  reason: string;
  status: 'pending' | 'resolved' | 'rejected';
  createdAt: string;
  resolvedAt: string | null;
  reporter?: {
    nickname: string;
    email: string;
  };
  target?: {
    title?: string;
    content?: string;
    author?: {
      id: number;
      nickname: string;
    }
  };
}

interface AdminPost {
  id: number;
  title: string;
  content: string;
  status: 'published' | 'draft' | 'hidden';
  createdAt: string;
  author: { id: number; nickname: string; email: string } | null;
  category: { id: number; name: string };
}

interface AdminComment {
  id: number;
  content: string;
  isDeleted: boolean;
  createdAt: string;
  author: { id: number; nickname: string } | null;
  post: { id: number; title: string };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { t } = useTranslation();
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'reports' | 'content' | 'settings'>('overview');

  const [members, setMembers] = useState<Member[]>([]);
  const [memberPagination, setMemberPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [memberSearch, setMemberSearch] = useState('');
  const [memberStatus, setMemberStatus] = useState<string>('');
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [approvingId, setApprovingId] = useState<number | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectingId, setRejectingId] = useState<number>(0);
  const [rejectReason, setRejectReason] = useState('');

  const [reports, setReports] = useState<Report[]>([]);
  const [reportPagination, setReportPagination] = useState<Pagination>({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [reportStatus, setReportStatus] = useState<string>('pending');
  const [isLoadingReports, setIsLoadingReports] = useState(false);
  const [resolvingId, setResolvingId] = useState<number | null>(null);

  const [adminPosts, setAdminPosts] = useState<AdminPost[]>([]);
  const [postPagination, setPostPagination] = useState<Pagination>({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [postSearch, setPostSearch] = useState('');
  const [postStatusFilter, setPostStatusFilter] = useState('');
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);

  const [adminComments, setAdminComments] = useState<AdminComment[]>([]);
  const [commentPagination, setCommentPagination] = useState<Pagination>({ page: 1, limit: 15, total: 0, totalPages: 0 });
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [contentSubTab, setContentSubTab] = useState<'posts' | 'comments'>('posts');

  const [systemSettings, setSystemSettings] = useState<Record<string, string>>({
    site_name: 'CafeBoard',
    maintenance_mode: 'false',
    terms_of_service: '',
    privacy_policy: ''
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  useEffect(() => {
    if (!user || (user.role !== 'admin' && user.role !== 'moderator')) {
      navigate('/');
      return;
    }
    fetchStats();
  }, [user, navigate]);

  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMembers = async () => {
    setIsLoadingMembers(true);
    try {
      const params: any = { page: memberPagination.page, limit: memberPagination.limit };
      if (memberSearch) params.search = memberSearch;
      if (memberStatus) params.status = memberStatus;
      const response = await api.get('/admin/users', { params });
      setMembers(response.data.users);
      setMemberPagination(response.data.pagination);
    } catch (error) {
      console.error('Failed to fetch members:', error);
    } finally {
      setIsLoadingMembers(false);
    }
  };

  const handleApprove = async (memberId: number, status: 'approved' | 'rejected') => {
    setApprovingId(memberId);
    try {
      await api.post(`/admin/members/${memberId}/approve`, {
        status,
        rejectionReason: status === 'rejected' ? rejectReason : null
      });
      fetchMembers();
      setShowRejectModal(false);
      setRejectingId(0);
      setRejectReason('');
    } catch (error) {
      console.error('Failed to approve member:', error);
    } finally {
      setApprovingId(null);
    }
  };

  const handleLevelChange = async (memberId: number, level: 'regular' | 'general' | 'nonmember') => {
    try {
      await api.put(`/admin/members/${memberId}/level`, { memberLevel: level });
      fetchMembers();
    } catch (error) {
      console.error('Failed to update member level:', error);
    }
  };

  const openRejectModal = (memberId: number) => {
    setRejectingId(memberId);
    setShowRejectModal(true);
  };

  const fetchReports = async () => {
    setIsLoadingReports(true);
    try {
      const params: any = { page: reportPagination.page, limit: reportPagination.limit };
      if (reportStatus) params.status = reportStatus;
      const response = await api.get('/admin/reports', { params });
      setReports(response.data.reports);
      setReportPagination(response.data.pagination);
    } catch (error) {
      console.error('Failed to fetch reports:', error);
    } finally {
      setIsLoadingReports(false);
    }
  };

  const handleResolveReport = async (reportId: number, status: 'resolved' | 'rejected', action?: 'hide') => {
    setResolvingId(reportId);
    try {
      await api.post(`/admin/reports/${reportId}/resolve`, { status, action });
      fetchReports();
      fetchStats(); // Update dashboard stats (pending count)
    } catch (error) {
      console.error('Failed to resolve report:', error);
    } finally {
      setResolvingId(null);
    }
  };

  const fetchAdminPosts = async () => {
    setIsLoadingPosts(true);
    try {
      const params: any = {
        page: postPagination.page,
        limit: postPagination.limit,
        search: postSearch,
        status: postStatusFilter
      };
      const response = await api.get('/admin/content/posts', { params });
      setAdminPosts(response.data.posts);
      setPostPagination(response.data.pagination);
    } catch (error) {
      console.error('Failed to fetch admin posts:', error);
    } finally {
      setIsLoadingPosts(false);
    }
  };

  const handleUpdatePostStatus = async (postId: number, status: string) => {
    try {
      await api.put(`/admin/content/posts/${postId}/status`, { status });
      fetchAdminPosts();
    } catch (error) {
      console.error('Failed to update post status:', error);
    }
  };

  const fetchAdminComments = async () => {
    setIsLoadingComments(true);
    try {
      const params: any = { page: commentPagination.page, limit: commentPagination.limit };
      const response = await api.get('/admin/content/comments', { params });
      setAdminComments(response.data.comments);
      setCommentPagination(response.data.pagination);
    } catch (error) {
      console.error('Failed to fetch admin comments:', error);
    } finally {
      setIsLoadingComments(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!window.confirm('Are you sure you want to mark this comment as deleted?')) return;
    try {
      await api.delete(`/admin/content/comments/${commentId}`);
      fetchAdminComments();
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await api.get('/admin/settings');
      setSystemSettings(prev => ({ ...prev, ...response.data }));
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    }
  };

  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    try {
      await api.put('/admin/settings', { settings: systemSettings });
      alert('Settings saved successfully');
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Failed to save settings');
    } finally {
      setIsSavingSettings(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'users') {
      fetchMembers();
    } else if (activeTab === 'reports') {
      fetchReports();
    } else if (activeTab === 'content') {
      if (contentSubTab === 'posts') fetchAdminPosts();
      else fetchAdminComments();
    } else if (activeTab === 'settings') {
      fetchSettings();
    }
  }, [activeTab, memberPagination.page, memberStatus, reportPagination.page, reportStatus, postPagination.page, postStatusFilter, commentPagination.page, contentSubTab]);

  if (!user || (user.role !== 'admin' && user.role !== 'moderator')) {
    return null;
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto pb-20 px-4">
        {/* Admin Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 mt-4">
          <div>
            <h1 className="text-4xl font-black text-slate-800 tracking-tight flex items-center gap-3">
              <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-600/20">
                <Shield size={28} />
              </div>
              {t('admin.title') || 'Control Center'}
            </h1>
            <p className="text-slate-400 font-semibold text-sm uppercase tracking-widest mt-2 px-1 italic">Advanced System Management</p>
          </div>
          <div className="flex items-center gap-3 bg-white/50 backdrop-blur-md border border-white/60 px-4 py-2 rounded-2xl shadow-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-black text-slate-600 uppercase tracking-widest">
              {user.role === 'admin' ? t('admin.admin') : t('admin.moderator')} Mode
            </span>
          </div>
        </div>

        {/* Dynamic Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <StatCard
            icon={<Users size={24} />}
            title={t('admin.totalUsers')}
            value={stats?.overview.totalUsers || 0}
            subtitle={`+${stats?.overview.newUsersToday || 0} Registered today`}
            color="indigo"
          />
          <StatCard
            icon={<FileText size={24} />}
            title={t('admin.totalPosts')}
            value={stats?.overview.totalPosts || 0}
            subtitle={`+${stats?.overview.newPostsToday || 0} Published today`}
            color="purple"
          />
          <StatCard
            icon={<MessageSquare size={24} />}
            title={t('admin.totalComments')}
            value={stats?.overview.totalComments || 0}
            subtitle={`+${stats?.overview.newCommentsToday || 0} Engagement today`}
            color="emerald"
          />
          <StatCard
            icon={<AlertCircle size={24} />}
            title={t('admin.pendingReports')}
            value={stats?.overview?.pendingReports ?? 0}
            subtitle={`${stats?.overview?.totalReports ?? 0} Total logged reports`}
            color="rose"
            alert={(stats?.overview?.pendingReports ?? 0) > 0}
          />
        </div>

        {/* Main Content Area with glassmorphism */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-[2.5rem] blur opacity-10 group-hover:opacity-20 transition duration-1000"></div>

          <div className="relative bg-white/70 backdrop-blur-2xl border border-white/60 rounded-[2.5rem] shadow-2xl overflow-hidden">
            {/* Tab Navigation */}
            <div className="flex border-b border-slate-100 bg-white/30">
              <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} icon={<BarChart3 size={16} />} label={t('admin.overview') || 'System Overview'} />
              <TabButton active={activeTab === 'users'} onClick={() => setActiveTab('users')} icon={<Users size={16} />} label={t('admin.users') || 'Member Management'} />
              <TabButton active={activeTab === 'reports'} onClick={() => setActiveTab('reports')} icon={<AlertCircle size={16} />} label={t('admin.reports') || 'Security Reports'} />
              <TabButton active={activeTab === 'content'} onClick={() => setActiveTab('content')} icon={<FileText size={16} />} label={'Content'} />
              <TabButton active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={<Settings size={16} />} label={'Settings'} />
            </div>

            <div className="p-8 sm:p-10">
              {activeTab === 'overview' && (
                <div>
                  {/* System Growth Trend Section */}
                  <div className="mb-12">
                    <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
                      <BarChart3 className="text-indigo-600" size={20} />
                      System Growth Track (Last 7 Days)
                    </h3>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Detailed Stats & Chart Area */}
                      <div className="lg:col-span-2 bg-slate-900 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                          <BarChart3 size={120} className="text-white" />
                        </div>

                        <div className="relative z-10">
                          <div className="flex justify-between items-end mb-8">
                            <div>
                              <p className="text-indigo-300 font-black text-[10px] uppercase tracking-[0.2em] mb-1">Growth Engine</p>
                              <h4 className="text-white text-3xl font-black tracking-tighter">Content & Users Trend</h4>
                            </div>
                            <div className="flex gap-4">
                              <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"></span>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Users</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]"></span>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Posts</span>
                              </div>
                            </div>
                          </div>

                          {/* SVG Line Chart (Senior Handcrafted) */}
                          <div className="h-[200px] w-full mt-4">
                            {stats?.dailyStats && stats.dailyStats.length > 0 ? (
                              <svg viewBox="0 0 700 200" className="w-full h-full preserve-3d">
                                <defs>
                                  <linearGradient id="userGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
                                    <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                                  </linearGradient>
                                  <linearGradient id="postGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#34d399" stopOpacity="0.2" />
                                    <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
                                  </linearGradient>
                                </defs>

                                {/* Base Lines */}
                                {[0, 50, 100, 150].map(y => (
                                  <line key={y} x1="0" y1={y} x2="700" y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                                ))}

                                {(() => {
                                  const points = stats.dailyStats;
                                  const maxVal = Math.max(...points.map(p => Math.max(p.users, p.posts, 5))) * 1.2;

                                  const getX = (idx: number) => (idx * (700 / (points.length - 1)));
                                  const getY = (val: number) => 180 - (val / maxVal * 150);

                                  const userPath = points.map((p, i) => `${getX(i)},${getY(p.users)}`).join(' ');
                                  const postPath = points.map((p, i) => `${getX(i)},${getY(p.posts)}`).join(' ');

                                  const userArea = `0,200 ${userPath} 700,200`;
                                  const postArea = `0,200 ${postPath} 700,200`;

                                  return (
                                    <>
                                      {/* Areas */}
                                      <polyline points={userArea} fill="url(#userGradient)" />
                                      <polyline points={postArea} fill="url(#postGradient)" />

                                      {/* Lines */}
                                      <polyline
                                        points={userPath}
                                        fill="none"
                                        stroke="#6366f1"
                                        strokeWidth="4"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        className="drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]"
                                      />
                                      <polyline
                                        points={postPath}
                                        fill="none"
                                        stroke="#34d399"
                                        strokeWidth="4"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        className="drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]"
                                      />

                                      {/* Bottom Labels */}
                                      {points.map((p, i) => (
                                        <text
                                          key={i}
                                          x={getX(i)}
                                          y="198"
                                          textAnchor="middle"
                                          fill="rgba(255,255,255,0.3)"
                                          className="text-[10px] font-black uppercase tracking-tighter"
                                        >
                                          {p.date}
                                        </text>
                                      ))}
                                    </>
                                  );
                                })()}
                              </svg>
                            ) : (
                              <div className="flex items-center justify-center h-full text-slate-600 font-black italic">Initializing Analytics Core...</div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right Side Cards (Breakdown) */}
                      <div className="flex flex-col gap-6">
                        <div className="bg-indigo-600/10 border border-indigo-600/20 p-6 rounded-[2rem] shadow-sm flex-1 group hover:bg-indigo-600 hover:text-white transition-all duration-500">
                          <h5 className="text-[10px] font-black uppercase tracking-widest mb-4 opacity-60 group-hover:opacity-100 transition-opacity">Role Distribution</h5>
                          <div className="space-y-4">
                            {stats?.usersByRole.map((roleData) => (
                              <div key={roleData.role} className="flex items-center justify-between">
                                <span className="text-xs font-black capitalize tracking-tight">{roleData.role}s</span>
                                <div className="flex items-center gap-3">
                                  <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-indigo-500 transition-all duration-1000"
                                      style={{ width: `${(roleData.count / (stats?.overview.totalUsers || 1)) * 100}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-sm font-black">{roleData.count}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-[2rem] shadow-sm group hover:bg-emerald-500 hover:text-white transition-all duration-500">
                          <h5 className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-60 group-hover:opacity-100 transition-opacity">Engagement Rate</h5>
                          <div className="text-3xl font-black tracking-tighter">
                            {Math.round(((stats?.overview.totalComments || 0) / (stats?.overview.totalPosts || 1)) * 10) / 10}
                          </div>
                          <p className="text-[9px] font-bold uppercase opacity-60 mt-2">Avg Comments per Post</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-12">
                    <h3 className="text-lg font-black tracking-tight mb-6 flex items-center gap-2 text-slate-800">
                      <Shield className="text-indigo-600" size={20} />
                      {t('admin.quickActions') || 'Quick Actions'}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <ActionCard
                        icon={<UserCheck size={24} />}
                        title={t('admin.manageUsers') || 'Manage Users'}
                        description={t('admin.manageUsersDesc') || 'View and manage user accounts, roles and status'}
                        onClick={() => setActiveTab('users')}
                      />
                      <ActionCard
                        icon={<AlertCircle size={24} />}
                        title={t('admin.handleReports') || 'Handle Reports'}
                        description={`${stats?.overview?.pendingReports ?? 0} ${t('admin.pendingReports') || 'pending security reports waiting for review'}`}
                        onClick={() => setActiveTab('reports')}
                        alert={(stats?.overview?.pendingReports ?? 0) > 0}
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'users' && (
                <div>
                  <div className="flex flex-wrap gap-4 mb-8">
                    <div className="flex-1 min-w-[280px] relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                      <input
                        type="text"
                        placeholder={t('admin.searchMembers')}
                        value={memberSearch}
                        onChange={(e) => setMemberSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && fetchMembers()}
                        className="w-full pl-12 pr-5 py-4 bg-white/50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-slate-700 shadow-inner"
                      />
                    </div>
                    <select
                      value={memberStatus}
                      onChange={(e) => setMemberStatus(e.target.value)}
                      className="px-6 py-4 bg-white/50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-slate-700 shadow-inner min-w-[160px]"
                    >
                      <option value="">Status: All</option>
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                    <button
                      onClick={fetchMembers}
                      className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg active:scale-95"
                    >
                      {t('common.search')}
                    </button>
                  </div>

                  {isLoadingMembers ? (
                    <div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-indigo-600" /></div>
                  ) : members.length === 0 ? (
                    <div className="text-center py-20 bg-slate-50/50 rounded-[2rem] border border-dashed border-slate-200">
                      <Users className="h-16 w-16 mx-auto mb-4 text-slate-200" />
                      <p className="font-bold text-slate-400">{t('admin.noMembers')}</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto -mx-1">
                      <table className="w-full border-separate border-spacing-y-3">
                        <thead>
                          <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">
                            <th className="px-6 py-4 text-left">Member</th>
                            <th className="px-4 py-4 text-left">Info</th>
                            <th className="px-4 py-4 text-left">Status</th>
                            <th className="px-4 py-4 text-left">Level</th>
                            <th className="px-4 py-4 text-left">Role</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {members.map((member) => (
                            <tr key={member.id} className="group bg-white/50 hover:bg-white transition-all shadow-sm hover:shadow-md">
                              <td className="px-6 py-4 rounded-l-3xl">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500 font-black">
                                    {member.nickname[0]}
                                  </div>
                                  <div>
                                    <div className="font-black text-slate-800 tracking-tight">{member.nickname}</div>
                                    <div className="text-[10px] font-bold text-slate-400">{member.email}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-4">
                                <div className="text-xs font-bold text-slate-600">{member.name || '-'}</div>
                                <div className="text-[10px] text-slate-400 italic">{member.phone || '-'}</div>
                              </td>
                              <td className="px-4 py-4">
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${member.memberStatus === 'pending' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                                  member.memberStatus === 'approved' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                    'bg-rose-50 text-rose-600 border border-rose-100'
                                  }`}>
                                  {member.memberStatus}
                                </span>
                              </td>
                              <td className="px-4 py-4">
                                <select
                                  value={member.memberLevel}
                                  onChange={(e) => handleLevelChange(member.id, e.target.value as any)}
                                  className="text-[10px] font-black uppercase tracking-widest bg-slate-50 border-none rounded-lg px-2 py-1 outline-none focus:ring-1 ring-indigo-500 transition-all"
                                >
                                  <option value="regular">Regular</option>
                                  <option value="general">General</option>
                                  <option value="nonmember">Non-Member</option>
                                </select>
                              </td>
                              <td className="px-4 py-4">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{member.role}</span>
                              </td>
                              <td className="px-6 py-4 text-right rounded-r-3xl">
                                {member.memberStatus === 'pending' ? (
                                  <div className="flex items-center justify-end gap-2">
                                    <button
                                      onClick={() => handleApprove(member.id, 'approved')}
                                      disabled={approvingId === member.id}
                                      className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-500 hover:text-white transition-all shadow-sm"
                                    >
                                      {approvingId === member.id ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                                    </button>
                                    <button
                                      onClick={() => openRejectModal(member.id)}
                                      className="p-2 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                                    >
                                      <X size={16} />
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-[10px] font-black text-slate-300">COMPLETED</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  {memberPagination.totalPages > 1 && (
                    <div className="flex justify-center items-center gap-4 mt-10">
                      <button
                        onClick={() => setMemberPagination({ ...memberPagination, page: memberPagination.page - 1 })}
                        disabled={memberPagination.page === 1}
                        className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 font-bold text-xs uppercase tracking-widest hover:bg-slate-50 disabled:opacity-30 transition-all shadow-sm"
                      >
                        Prev
                      </button>
                      <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
                        Page {memberPagination.page} / {memberPagination.totalPages}
                      </span>
                      <button
                        onClick={() => setMemberPagination({ ...memberPagination, page: memberPagination.page + 1 })}
                        disabled={memberPagination.page === memberPagination.totalPages}
                        className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 font-bold text-xs uppercase tracking-widest hover:bg-slate-50 disabled:opacity-30 transition-all shadow-sm"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'reports' && (
                <div>
                  <div className="flex flex-wrap gap-4 mb-8">
                    <select
                      value={reportStatus}
                      onChange={(e) => setReportStatus(e.target.value)}
                      className="px-6 py-4 bg-white/50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-slate-700 shadow-inner min-w-[220px]"
                    >
                      <option value="pending">Review Pending</option>
                      <option value="resolved">Resolved / Action Taken</option>
                      <option value="rejected">Rejected / Ignored</option>
                      <option value="">All Security Reports</option>
                    </select>
                    <button
                      onClick={fetchReports}
                      className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg active:scale-95 ml-auto"
                    >
                      {t('common.refresh') || 'Refresh List'}
                    </button>
                  </div>

                  {isLoadingReports ? (
                    <div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-indigo-600" /></div>
                  ) : reports.length === 0 ? (
                    <div className="text-center py-20 bg-slate-50/50 rounded-[2rem] border border-dashed border-slate-200">
                      <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-slate-200 mx-auto mb-6 shadow-sm">
                        <Shield size={40} />
                      </div>
                      <p className="font-bold text-slate-400 tracking-tight uppercase text-xs tracking-widest">No reports found matching criteria</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto -mx-1">
                      <table className="w-full border-separate border-spacing-y-3">
                        <thead>
                          <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">
                            <th className="px-6 py-4 text-left">Target Content</th>
                            <th className="px-4 py-4 text-left">Reason / Reporter</th>
                            <th className="px-4 py-4 text-left">Date</th>
                            <th className="px-4 py-4 text-left">Status</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reports.map((report) => (
                            <tr key={report.id} className="group bg-white/50 hover:bg-white transition-all shadow-sm hover:shadow-md">
                              <td className="px-6 py-4 rounded-l-3xl">
                                <div className="flex flex-col">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 uppercase tracking-tighter shadow-sm border border-slate-200/50">
                                      {report.targetType}
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-bold">id:{report.targetId}</span>
                                  </div>
                                  <div className="font-black text-slate-800 line-clamp-1 max-w-[250px] tracking-tight">
                                    {report.target?.title || report.target?.content || 'Content Unavailable'}
                                  </div>
                                  {report.target?.author && (
                                    <div className="text-[10px] text-indigo-500 font-black mt-1 uppercase tracking-tighter">
                                      BY: {report.target.author.nickname}
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-4">
                                <div className="text-xs font-bold text-slate-700 bg-rose-50/60 p-2.5 rounded-xl mb-1 border border-rose-100 shadow-inner">
                                  {report.reason}
                                </div>
                                <div className="text-[9px] text-slate-400 font-black uppercase tracking-widest px-1">
                                  Reporter: {report.reporter?.nickname || 'Anonymous'}
                                </div>
                              </td>
                              <td className="px-4 py-4">
                                <div className="text-[11px] font-black text-slate-600">
                                  {new Date(report.createdAt).toLocaleDateString()}
                                </div>
                                <div className="text-[10px] font-bold text-slate-400 tracking-tighter">
                                  {new Date(report.createdAt).toLocaleTimeString()}
                                </div>
                              </td>
                              <td className="px-4 py-4">
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${report.status === 'pending' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                                  report.status === 'resolved' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                    'bg-slate-50 text-slate-500 border border-slate-100'
                                  }`}>
                                  {report.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right rounded-r-3xl">
                                {report.status === 'pending' ? (
                                  <div className="flex items-center justify-end gap-2">
                                    <button
                                      onClick={() => handleResolveReport(report.id, 'resolved', 'hide')}
                                      disabled={resolvingId === report.id}
                                      className="flex items-center gap-2 px-3 py-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-500 hover:text-white transition-all text-[10px] font-black group/action shadow-sm border border-emerald-100 hover:border-emerald-500"
                                      title="Hide content and mark as resolved"
                                    >
                                      {resolvingId === report.id ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                                      RESOLVE & HIDE
                                    </button>
                                    <button
                                      onClick={() => handleResolveReport(report.id, 'rejected')}
                                      disabled={resolvingId === report.id}
                                      className="p-2 bg-rose-50 text-rose-400 rounded-xl hover:bg-rose-500 hover:text-white transition-all shadow-sm border border-rose-100 hover:border-rose-500"
                                      title="Ignore report"
                                    >
                                      <X size={14} />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                                    PROCESSED {report.resolvedAt && new Date(report.resolvedAt).toLocaleDateString()}
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  {reportPagination.totalPages > 1 && (
                    <div className="flex justify-center items-center gap-4 mt-10">
                      <button
                        onClick={() => setReportPagination({ ...reportPagination, page: reportPagination.page - 1 })}
                        disabled={reportPagination.page === 1}
                        className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 font-bold text-xs uppercase tracking-widest hover:bg-slate-50 disabled:opacity-30 transition-all shadow-sm"
                      >
                        Prev
                      </button>
                      <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
                        Page {reportPagination.page} / {reportPagination.totalPages}
                      </span>
                      <button
                        onClick={() => setReportPagination({ ...reportPagination, page: reportPagination.page + 1 })}
                        disabled={reportPagination.page === reportPagination.totalPages}
                        className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 font-bold text-xs uppercase tracking-widest hover:bg-slate-50 disabled:opacity-30 transition-all shadow-sm"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'content' && (
                <div>
                  <div className="flex gap-4 mb-8">
                    <button
                      onClick={() => setContentSubTab('posts')}
                      className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${contentSubTab === 'posts' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                    >
                      Posts
                    </button>
                    <button
                      onClick={() => setContentSubTab('comments')}
                      className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${contentSubTab === 'comments' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                    >
                      Comments
                    </button>
                  </div>

                  {contentSubTab === 'posts' ? (
                    <div>
                      <div className="flex flex-wrap gap-4 mb-8">
                        <div className="flex-1 min-w-[280px] relative">
                          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Search posts..."
                            value={postSearch}
                            onChange={(e) => setPostSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && fetchAdminPosts()}
                            className="w-full pl-12 pr-5 py-4 bg-white/50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-slate-700 shadow-inner"
                          />
                        </div>
                        <select
                          value={postStatusFilter}
                          onChange={(e) => setPostStatusFilter(e.target.value)}
                          className="px-6 py-4 bg-white/50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-slate-700 shadow-inner min-w-[160px]"
                        >
                          <option value="">All Status</option>
                          <option value="published">Published</option>
                          <option value="draft">Draft</option>
                          <option value="hidden">Hidden</option>
                        </select>
                        <button
                          onClick={fetchAdminPosts}
                          className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg"
                        >
                          Search
                        </button>
                      </div>

                      {isLoadingPosts ? (
                        <div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-indigo-600" /></div>
                      ) : adminPosts.length === 0 ? (
                        <div className="text-center py-20 bg-slate-50/50 rounded-[2rem] border border-dashed border-slate-200">
                          <p className="font-bold text-slate-400">No posts found.</p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full border-separate border-spacing-y-3">
                            <thead>
                              <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                <th className="px-6 py-4 text-left">Post</th>
                                <th className="px-4 py-4 text-left">Author / Category</th>
                                <th className="px-4 py-4 text-left">Date</th>
                                <th className="px-4 py-4 text-left">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {adminPosts.map((post) => (
                                <tr key={post.id} className="group bg-white/50 hover:bg-white transition-all shadow-sm">
                                  <td className="px-6 py-4 rounded-l-3xl">
                                    <div className="font-black text-slate-800 line-clamp-1 max-w-[300px]">{post.title}</div>
                                    <div className="text-[10px] text-slate-400 font-bold">ID: {post.id}</div>
                                  </td>
                                  <td className="px-4 py-4">
                                    <div className="text-xs font-black text-indigo-600">{post.author?.nickname || 'Unknown'}</div>
                                    <div className="text-[10px] text-slate-400 font-bold uppercase">{post.category.name}</div>
                                  </td>
                                  <td className="px-4 py-4">
                                    <div className="text-[11px] font-black text-slate-600">{new Date(post.createdAt).toLocaleDateString()}</div>
                                  </td>
                                  <td className="px-4 py-4">
                                    <select
                                      value={post.status}
                                      onChange={(e) => handleUpdatePostStatus(post.id, e.target.value)}
                                      className={`text-[9px] font-black uppercase tracking-widest rounded-lg px-2 py-1 border-none outline-none ${post.status === 'published' ? 'bg-emerald-50 text-emerald-600' :
                                        post.status === 'hidden' ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-500'
                                        }`}
                                    >
                                      <option value="published">Published</option>
                                      <option value="draft">Draft</option>
                                      <option value="hidden">Hidden</option>
                                    </select>
                                  </td>
                                  <td className="px-6 py-4 text-right rounded-r-3xl">
                                    <button
                                      onClick={() => navigate(`/post/${post.id}`)}
                                      className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
                                      title="View Post"
                                    >
                                      <Search size={16} />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {postPagination.totalPages > 1 && (
                        <div className="flex justify-center items-center gap-4 mt-8">
                          <button
                            disabled={postPagination.page === 1}
                            onClick={() => setPostPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                            className="px-4 py-2 bg-white border rounded-xl text-xs font-black disabled:opacity-30"
                          >Prev</button>
                          <span className="text-[10px] font-black text-slate-400 uppercase">Page {postPagination.page} / {postPagination.totalPages}</span>
                          <button
                            disabled={postPagination.page === postPagination.totalPages}
                            onClick={() => setPostPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                            className="px-4 py-2 bg-white border rounded-xl text-xs font-black disabled:opacity-30"
                          >Next</button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      {isLoadingComments ? (
                        <div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-indigo-600" /></div>
                      ) : adminComments.length === 0 ? (
                        <div className="text-center py-20 bg-slate-50/50 rounded-[2rem] border border-dashed border-slate-200">
                          <p className="font-bold text-slate-400">No comments found.</p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full border-separate border-spacing-y-3">
                            <thead>
                              <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                <th className="px-6 py-4 text-left">Comment / Target Post</th>
                                <th className="px-4 py-4 text-left">Author</th>
                                <th className="px-4 py-4 text-left">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {adminComments.map((comment) => (
                                <tr key={comment.id} className="group bg-white/50 hover:bg-white transition-all shadow-sm">
                                  <td className="px-6 py-4 rounded-l-3xl">
                                    <div className="text-sm font-bold text-slate-700 line-clamp-2 mb-1">{comment.content}</div>
                                    <div className="text-[10px] text-indigo-400 font-black uppercase tracking-tighter">ON: {comment.post.title}</div>
                                  </td>
                                  <td className="px-4 py-4">
                                    <div className="text-xs font-black text-slate-600">{comment.author?.nickname || 'Unknown'}</div>
                                    <div className="text-[10px] text-slate-400">{new Date(comment.createdAt).toLocaleDateString()}</div>
                                  </td>
                                  <td className="px-4 py-4">
                                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full ${comment.isDeleted ? 'bg-rose-100 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                      {comment.isDeleted ? 'Deleted' : 'Active'}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 text-right rounded-r-3xl">
                                    {!comment.isDeleted && (
                                      <button
                                        onClick={() => handleDeleteComment(comment.id)}
                                        className="p-2 text-rose-400 hover:text-rose-600 transition-colors"
                                        title="Mark as deleted"
                                      >
                                        <X size={16} />
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {commentPagination.totalPages > 1 && (
                        <div className="flex justify-center items-center gap-4 mt-8">
                          <button
                            disabled={commentPagination.page === 1}
                            onClick={() => setCommentPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                            className="px-4 py-2 bg-white border rounded-xl text-xs font-black disabled:opacity-30"
                          >Prev</button>
                          <span className="text-[10px] font-black text-slate-400 uppercase">Page {commentPagination.page} / {commentPagination.totalPages}</span>
                          <button
                            disabled={commentPagination.page === commentPagination.totalPages}
                            onClick={() => setCommentPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                            className="px-4 py-2 bg-white border rounded-xl text-xs font-black disabled:opacity-30"
                          >Next</button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'settings' && (
                <div className="max-w-4xl">
                  <div className="mb-10">
                    <h3 className="text-xl font-black text-slate-800 mb-2">Global System Configuration</h3>
                    <p className="text-slate-500 font-medium text-sm">Manage site-wide settings and policies.</p>
                  </div>

                  <div className="space-y-10">
                    {/* Basic Info Section */}
                    <div className="bg-slate-50/50 p-8 rounded-[2rem] border border-slate-100">
                      <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6">Basic Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Site Name</label>
                          <input
                            type="text"
                            className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 outline-none transition-all font-bold text-slate-700"
                            value={systemSettings.site_name}
                            onChange={(e) => setSystemSettings({ ...systemSettings, site_name: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Maintenance Mode</label>
                          <div className="flex items-center gap-4 mt-2">
                            <button
                              onClick={() => setSystemSettings({ ...systemSettings, maintenance_mode: systemSettings.maintenance_mode === 'true' ? 'false' : 'true' })}
                              className={`relative w-14 h-8 rounded-full transition-colors ${systemSettings.maintenance_mode === 'true' ? 'bg-rose-500' : 'bg-slate-200'}`}
                            >
                              <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-lg transition-transform ${systemSettings.maintenance_mode === 'true' ? 'translate-x-6' : ''}`}></div>
                            </button>
                            <span className={`text-xs font-black uppercase tracking-widest ${systemSettings.maintenance_mode === 'true' ? 'text-rose-600' : 'text-slate-400'}`}>
                              {systemSettings.maintenance_mode === 'true' ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Policies Section */}
                    <div className="bg-slate-50/50 p-8 rounded-[2rem] border border-slate-100">
                      <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6">Legal & Policies</h4>
                      <div className="space-y-8">
                        <div>
                          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Terms of Service</label>
                          <textarea
                            className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 outline-none transition-all font-medium text-slate-600 min-h-[150px] resize-y"
                            value={systemSettings.terms_of_service}
                            onChange={(e) => setSystemSettings({ ...systemSettings, terms_of_service: e.target.value })}
                            placeholder="Describe site terms and conditions..."
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Privacy Policy</label>
                          <textarea
                            className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 outline-none transition-all font-medium text-slate-600 min-h-[150px] resize-y"
                            value={systemSettings.privacy_policy}
                            onChange={(e) => setSystemSettings({ ...systemSettings, privacy_policy: e.target.value })}
                            placeholder="Describe how user data is handled..."
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end pt-4">
                      <button
                        onClick={handleSaveSettings}
                        disabled={isSavingSettings}
                        className="px-12 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 active:scale-95 disabled:opacity-50 flex items-center gap-2"
                      >
                        {isSavingSettings ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                        Apply Changes
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showRejectModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-[2.5rem] p-10 w-full max-w-md shadow-2xl scale-in-center">
            <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 mb-6 shadow-inner border border-rose-100">
              <AlertCircle size={32} />
            </div>
            <h3 className="text-2xl font-black text-slate-800 tracking-tight mb-2">Reject Registration</h3>
            <p className="text-slate-500 font-medium text-sm mb-6 leading-relaxed">Please provide a constructive reason for this rejection. The user will be notified.</p>

            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 transition-all font-bold text-slate-700 shadow-inner mb-6 min-h-[120px] resize-none"
              placeholder="Reason for rejection (Optional)"
            />

            <div className="flex gap-3">
              <button
                onClick={() => { setShowRejectModal(false); setRejectingId(0); }}
                className="flex-1 px-6 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95"
              >
                Cancel
              </button>
              <button
                onClick={() => rejectingId && handleApprove(rejectingId, 'rejected')}
                disabled={approvingId !== null}
                className="flex-2 px-10 py-4 bg-rose-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-rose-600 transition-all shadow-lg shadow-rose-500/20 active:scale-95 disabled:opacity-50"
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

function StatCard({ icon, title, value, subtitle, color = 'indigo', alert = false }: { icon: React.ReactNode; title: string; value: number; subtitle: string; color?: string; alert?: boolean }) {
  const colorClasses: Record<string, string> = {
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100 shadow-indigo-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100 shadow-purple-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-emerald-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100 shadow-rose-100',
  };

  const activeColor = alert ? colorClasses.rose : colorClasses[color];

  return (
    <div className={`relative bg-white/70 backdrop-blur-xl border border-white/60 rounded-3xl p-6 shadow-sm group hover:shadow-xl transition-all duration-500 hover:-translate-y-1 ${alert ? 'ring-2 ring-rose-500/20' : ''}`}>
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-inner ${activeColor}`}>
          {icon}
        </div>
        {alert && (
          <div className="flex items-center gap-1 px-2 py-1 bg-rose-100 text-rose-600 rounded-lg text-[10px] font-black uppercase tracking-tighter animate-pulse">
            Attention Required
          </div>
        )}
      </div>
      <div>
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{title}</h3>
        <p className="text-3xl font-black text-slate-800 tracking-tight">{value.toLocaleString()}</p>
        <p className="text-[10px] font-bold text-slate-400 mt-2 flex items-center gap-1">
          <span className={alert ? 'text-rose-500' : 'text-emerald-500'}>●</span>
          {subtitle}
        </p>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-8 py-5 font-black text-xs uppercase tracking-widest transition-all ${active
        ? 'text-indigo-600 border-b-2 border-indigo-600 bg-white/50'
        : 'text-slate-400 hover:text-slate-600 hover:bg-white/20'
        }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function ActionCard({ icon, title, description, onClick, alert = false }: { icon: React.ReactNode; title: string; description: string; onClick: () => void; alert?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`group flex items-start gap-4 p-6 rounded-3xl border transition-all hover:shadow-lg ${alert
        ? 'border-rose-100 bg-rose-50/30 hover:bg-rose-50'
        : 'border-slate-100 bg-white hover:border-indigo-200'
        }`}
    >
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110 ${alert ? 'bg-rose-100 text-rose-600 shadow-rose-100' : 'bg-indigo-50 text-indigo-600 shadow-indigo-100'
        } shadow-inner`}>
        {icon}
      </div>
      <div>
        <h4 className="font-black text-slate-800 tracking-tight group-hover:text-indigo-600 transition-colors uppercase text-xs tracking-widest mb-1">{title}</h4>
        <p className="text-slate-500 text-sm font-medium leading-normal">{description}</p>
      </div>
    </button>
  );
}
