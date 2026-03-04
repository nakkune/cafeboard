import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { videoApi } from '../api/videos';
import { api } from '../api';
import type { Video, Category } from '../types';
import { Link } from 'react-router-dom';
import { Play, Eye, Calendar, Search, Plus, Filter, Video as VideoIcon, Youtube, HardDrive } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/auth';

export function VideoList() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | ''>('');
  const [videoTypeFilter, setVideoTypeFilter] = useState<'all' | 'local' | 'external'>('all');
  const [isFocused, setIsFocused] = useState(false);

  const { isAuthenticated } = useAuthStore();
  const { t } = useTranslation();

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchVideos();
  }, [selectedCategory, videoTypeFilter]);

  const fetchCategories = async () => {
    try {
      const response = await api.get<{ categories: Category[] }>('/categories');
      setCategories(response.data.categories);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchVideos = async () => {
    setIsLoading(true);
    try {
      const params: any = {};
      if (selectedCategory) params.categoryId = selectedCategory;
      if (videoTypeFilter !== 'all') params.videoType = videoTypeFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const response = await videoApi.getVideos(params);
      setVideos(response.data.videos);
    } catch (error) {
      console.error('Failed to fetch videos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchVideos();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto flex flex-col min-h-[calc(100vh-10rem)]">
        {/* 프리미엄 헤더 영역 */}
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-2xl bg-rose-600 shadow-lg shadow-rose-600/30 flex items-center justify-center text-white">
                <VideoIcon className="h-6 w-6" />
              </div>
              <h1 className="text-4xl font-black text-slate-800 tracking-tight">{t('video.title') || '동영상 허브'}</h1>
            </div>
            <p className="text-sm font-semibold text-slate-400 pl-1">
              영감을 주는 다양한 멀티미디어 콘텐츠를 탐색하세요.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            {isAuthenticated && (
              <Link
                to="/videos/new"
                className="group flex-1 md:flex-none flex items-center justify-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20 active:scale-95"
              >
                <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
                {t('video.upload') || '미디어 업로드'}
              </Link>
            )}
          </div>
        </div>

        {/* 고급 검색 및 필터 바 (Glassmorphism) */}
        <div className="bg-white/80 backdrop-blur-xl border border-white/60 shadow-lg shadow-slate-200/40 rounded-2xl p-2 mb-10 sticky top-3 z-30 transition-all duration-300 ease-in-out">
          <div className="flex flex-col xl:flex-row gap-4 items-center justify-between">
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2 h-auto sm:h-12 items-center w-full xl:w-auto flex-1">
              <div className="relative h-full w-full sm:w-48 flex-shrink-0">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Filter className="h-4 w-4" />
                </div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value ? Number(e.target.value) : '')}
                  className="h-12 sm:h-full w-full pl-9 pr-8 bg-slate-50/50 hover:bg-slate-100/50 border-0 rounded-xl text-sm font-semibold text-slate-700 cursor-pointer focus:ring-2 focus:ring-rose-500/20 appearance-none transition-colors"
                >
                  <option value="">{t('video.allCategories') || '모든 카테고리'}</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div className="w-px h-6 bg-slate-200 hidden sm:block"></div>
              <div className={`relative flex-1 w-full h-12 sm:h-full transition-all duration-300 ${isFocused ? 'ring-2 ring-rose-500/20 rounded-xl' : ''}`}>
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Search className={`h-5 w-5 transition-colors ${isFocused ? 'text-rose-500' : ''}`} />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  placeholder={t('video.searchPlaceholder') || "검색어를 입력하세요..."}
                  className="w-full h-full pl-10 pr-4 bg-transparent border-0 text-slate-700 placeholder-slate-400 font-medium focus:ring-0"
                />
              </div>
              <button
                type="submit"
                className="w-full sm:w-auto px-6 h-12 sm:h-full bg-rose-50 text-rose-600 rounded-xl font-bold hover:bg-rose-100 transition-colors shrink-0"
              >
                {t('common.search') || '검색'}
              </button>
            </form>

            <div className="flex bg-slate-100/50 p-1 rounded-xl w-full xl:w-auto">
              <button
                onClick={() => setVideoTypeFilter('all')}
                className={`flex-1 xl:w-24 flex justify-center items-center py-2.5 text-sm font-bold rounded-lg transition-all ${videoTypeFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50'
                  : 'text-slate-500 hover:text-slate-700'
                  }`}
              >
                {t('video.all') || '전체 미디어'}
              </button>
              <button
                onClick={() => setVideoTypeFilter('local')}
                className={`flex-1 xl:w-24 flex items-center justify-center gap-1.5 py-2.5 text-sm font-bold rounded-lg transition-all ${videoTypeFilter === 'local'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/50 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
                  }`}
              >
                <HardDrive className="h-4 w-4" />
                {t('video.local') || '서버 저장'}
              </button>
              <button
                onClick={() => setVideoTypeFilter('external')}
                className={`flex-1 xl:w-24 flex items-center justify-center gap-1.5 py-2.5 text-sm font-bold rounded-lg transition-all ${videoTypeFilter === 'external'
                  ? 'bg-rose-50 text-rose-700 border border-rose-200/50 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
                  }`}
              >
                <Youtube className="h-4 w-4" />
                {t('video.external') || '외부 소스'}
              </button>
            </div>
          </div>
        </div>

        {/* 비디오 그리드 */}
        <div className="flex-1 flex flex-col">
          {isLoading ? (
            <div className="flex-1 flex justify-center items-center">
              <div className="w-16 h-16 rounded-2xl bg-rose-50 flex items-center justify-center shadow-inner">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
              </div>
            </div>
          ) : videos.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center bg-white/50 backdrop-blur-xl border border-white/60 rounded-[2rem] p-12 text-center shadow-sm">
              <div className="w-20 h-20 rounded-[2rem] bg-slate-100 flex items-center justify-center text-slate-300 mb-6">
                <VideoIcon className="h-10 w-10" />
              </div>
              <h3 className="text-xl font-bold text-slate-700 mb-2">동영상이 없습니다</h3>
              <p className="text-slate-400 font-medium">검색 결과가 없거나 아직 업로드된 미디어가 없습니다.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-12">
              {videos.map((video) => (
                <Link
                  key={video.id}
                  to={`/videos/${video.id}`}
                  className="group flex flex-col bg-white/60 backdrop-blur-xl border border-white/60 shadow-[0_4px_20px_rgb(0,0,0,0.02)] hover:shadow-[0_12px_40px_rgb(0,0,0,0.08)] rounded-[1.5rem] overflow-hidden transition-all duration-300 hover:-translate-y-1 block h-full flex"
                >
                  <div className="relative aspect-video bg-slate-900 overflow-hidden flex-shrink-0 border-b border-slate-100">
                    <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-105">
                      {video.thumbnailUrl ? (
                        <img
                          src={video.thumbnailUrl}
                          alt={video.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-800">
                          <Play className="h-16 w-16 text-slate-600" />
                        </div>
                      )}
                    </div>

                    {/* 타입 뱃지 */}
                    <div className="absolute top-3 left-3 z-20">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-lg shadow-sm backdrop-blur-md ${video.videoType === 'local'
                        ? 'bg-emerald-500/90 text-white border border-emerald-400/50'
                        : 'bg-rose-500/90 text-white border border-rose-400/50'
                        }`}>
                        {video.videoType === 'local' ? <HardDrive className="h-3 w-3" /> : <Youtube className="h-3 w-3" />}
                        {video.videoType === 'local' ? t('video.local') : t('video.external')}
                      </span>
                    </div>

                    {/* 오버레이 재생 버튼 애니메이션 */}
                    <div className="absolute inset-0 bg-slate-900/0 hover:bg-slate-900/40 z-10 flex items-center justify-center transition-all duration-300">
                      <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                        <Play className="h-8 w-8 text-white ml-1.5" />
                      </div>
                    </div>
                  </div>

                  <div className="p-5 flex flex-col flex-1 justify-between bg-white rounded-t-3xl -mt-4 relative z-20">
                    <div className="mb-4">
                      {video.category && (
                        <div className="mb-3">
                          <span className="inline-block px-2.5 py-1 bg-indigo-50/80 text-indigo-600 text-[11px] font-black tracking-wider uppercase rounded-md border border-indigo-100/50">
                            {video.category.name}
                          </span>
                        </div>
                      )}
                      <h3 className="text-lg font-black text-slate-800 line-clamp-2 leading-snug group-hover:text-rose-600 transition-colors">
                        {video.title}
                      </h3>
                    </div>

                    <div className="flex items-center justify-between text-xs font-semibold text-slate-400 pt-4 border-t border-slate-100">
                      <span className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 rounded-lg text-slate-600 max-w-[100px] truncate">
                        {video.author?.nickname}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1 flex-shrink-0" title="조회수">
                          <Eye className="h-3.5 w-3.5" />
                          {video.viewCount}
                        </span>
                        <span className="flex items-center gap-1 shrink-0" title="업로드 날짜">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatDate(video.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
