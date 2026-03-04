import { Layout } from '../components/Layout';
import React, { useState, useEffect } from 'react';
import { api } from '../api';
import type { Post } from '../types';
import { Link } from 'react-router-dom';
import { MessageSquare, ThumbsUp, Eye, ChevronLeft, ChevronRight, Search, Plus, Filter, Clock, Hash } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { useTranslation } from 'react-i18next';

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function PostList() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const { t } = useTranslation();

  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [searchType, setSearchType] = useState<'title' | 'content'>(searchParams.get('searchType') as 'title' | 'content' || 'title');
  const [isFocused, setIsFocused] = useState(false);

  const { isAuthenticated } = useAuthStore();
  const categoryId = searchParams.get('categoryId');
  const page = parseInt(searchParams.get('page') || '1');

  useEffect(() => {
    fetchPosts();
  }, [categoryId, page, searchParams.get('search'), searchParams.get('searchType')]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (searchQuery.trim()) {
      params.set('search', searchQuery.trim());
      params.set('searchType', searchType);
    } else {
      params.delete('search');
      params.delete('searchType');
    }
    params.delete('page');
    setSearchParams(params);
  };

  const fetchPosts = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      if (categoryId) params.append('categoryId', categoryId);
      if (searchParams.get('search')) {
        params.append('search', searchParams.get('search')!);
        params.append('searchType', searchParams.get('searchType') || 'title');
      }

      const response = await api.get(`/posts?${params.toString()}`);
      setPosts(response.data.posts || []);
      setPagination(response.data.pagination || null);
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    if (newPage > 1) {
      params.set('page', newPage.toString());
    } else {
      params.delete('page');
    }
    setSearchParams(params);
  };

  const title = categoryId ? `${t(`category.${categoryId}`) || 'Board'}` : t('post.board');

  return (
    <Layout>
      <div className="max-w-5xl mx-auto flex flex-col min-h-[calc(100vh-10rem)]">
        {/* 프리미엄 헤더 영역 */}
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-600/30 flex items-center justify-center text-white">
                <Hash className="h-6 w-6" />
              </div>
              <h1 className="text-4xl font-black text-slate-800 tracking-tight">{title}</h1>
            </div>
            {pagination && (
              <p className="text-sm font-semibold text-slate-400 pl-1">
                {t('post.totalCount', { count: pagination.total })}개의 포스트가 있습니다.
              </p>
            )}
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            {isAuthenticated && (
              <Link
                to={categoryId ? `/posts/new?categoryId=${categoryId}` : '/posts/new'}
                className="group flex-1 md:flex-none flex items-center justify-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20 active:scale-95"
              >
                <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
                {t('post.write')}
              </Link>
            )}
          </div>
        </div>

        {/* 고급 검색 바 (Glassmorphism) */}
        <div className="bg-white/80 backdrop-blur-xl border border-white/60 shadow-lg shadow-slate-200/40 rounded-2xl p-2 mb-8 sticky top-3 z-30 transition-all duration-300 ease-in-out">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-2 h-auto md:h-12 items-center">
            <div className="relative h-full w-full md:w-40 flex-shrink-0">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Filter className="h-4 w-4" />
              </div>
              <select
                value={searchType}
                onChange={(e) => setSearchType(e.target.value as 'title' | 'content')}
                className="h-12 md:h-full w-full pl-9 pr-8 bg-slate-50/50 hover:bg-slate-100/50 border-0 rounded-xl text-sm font-semibold text-slate-700 cursor-pointer focus:ring-2 focus:ring-indigo-500/20 appearance-none transition-colors"
              >
                <option value="title">{t('post.title')}</option>
                <option value="content">{t('post.content')}</option>
              </select>
            </div>
            <div className="w-px h-6 bg-slate-200 hidden md:block"></div>
            <div className={`relative flex-1 w-full h-12 md:h-full transition-all duration-300 ${isFocused ? 'ring-2 ring-indigo-500/20 rounded-xl' : ''}`}>
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className={`h-5 w-5 transition-colors ${isFocused ? 'text-indigo-500' : ''}`} />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder={t('common.search') + "..."}
                className="w-full h-full pl-10 pr-4 bg-transparent border-0 text-slate-700 placeholder-slate-400 font-medium focus:ring-0"
              />
            </div>
            <button
              type="submit"
              className="w-full md:w-auto px-6 h-12 md:h-full bg-indigo-50 text-indigo-600 rounded-xl font-bold hover:bg-indigo-100 transition-colors"
            >
              검색
            </button>
          </form>
        </div>

        {/* 게시물 목록 */}
        <div className="flex-1 flex flex-col">
          {isLoading ? (
            <div className="flex-1 flex justify-center items-center">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center shadow-inner">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            </div>
          ) : posts.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center bg-white/50 backdrop-blur-xl border border-white/60 rounded-[2rem] p-12 text-center shadow-sm">
              <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center text-slate-300 mb-6">
                <MessageSquare className="h-10 w-10" />
              </div>
              <h3 className="text-xl font-bold text-slate-700 mb-2">게시물이 없습니다</h3>
              <p className="text-slate-400 font-medium">검색 결과가 없거나 아직 작성된 글이 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {posts.map((post) => (
                <Link
                  key={post.id}
                  to={`/posts/${post.id}`}
                  className="group flex flex-col md:flex-row md:items-center justify-between p-5 bg-white/60 backdrop-blur-xl border border-white/60 shadow-[0_4px_20px_rgb(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] rounded-2xl transition-all duration-300 hover:-translate-y-0.5"
                >
                  <div className="flex-1 min-w-0 pr-4">
                    <h2 className="text-lg font-bold text-slate-800 mb-2 group-hover:text-indigo-600 transition-colors truncate">
                      {post.title}
                    </h2>
                    <div className="flex flex-wrap items-center gap-4 text-[13px] font-semibold text-slate-400">
                      <span className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-100 rounded-md text-slate-600">
                        {post.author?.nickname || 'Unknown'}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        {new Date(post.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-slate-100 text-slate-400">
                    <div className="flex items-center gap-1.5 group-hover:text-indigo-500 transition-colors w-14 text-sm font-bold">
                      <Eye className="h-4 w-4" />
                      {post.viewCount}
                    </div>
                    <div className="flex items-center gap-1.5 group-hover:text-rose-500 transition-colors w-14 text-sm font-bold">
                      <ThumbsUp className="h-4 w-4" />
                      {post.likeCount}
                    </div>
                    <div className="flex items-center gap-1.5 group-hover:text-amber-500 transition-colors w-14 text-sm font-bold justify-end">
                      <MessageSquare className="h-4 w-4" />
                      {post.commentCount}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* 고급 페이지네이션 */}
        {!isLoading && pagination && pagination.totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-10 mb-6">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page <= 1}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-indigo-600 disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-slate-500 transition-all shadow-sm"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-1 bg-white border border-slate-200 p-1 rounded-xl shadow-sm">
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`w-10 h-10 rounded-lg text-sm font-bold transition-all ${pageNum === page
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'text-slate-600 hover:bg-slate-50'
                    }`}
                >
                  {pageNum}
                </button>
              ))}
            </div>

            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= pagination.totalPages}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-indigo-600 disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-slate-500 transition-all shadow-sm"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
}
