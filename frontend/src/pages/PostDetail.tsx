import { Layout } from '../components/Layout';
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';
import type { Post, Comment } from '../types';
import { useAuthStore } from '../store/auth';
import { ThumbsUp, MessageSquare, ArrowLeft, Edit, Trash2, File, AlertTriangle, User, Calendar, Share2, Send, ChevronRight, Download, ImageIcon, FileText } from 'lucide-react';
import { ReportModal } from '../components/ReportModal';
import { useTranslation } from 'react-i18next';

// 게시물 상세 페이지 컴포넌트
export function PostDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuthStore();

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [reportData, setReportData] = useState<{ type: 'post' | 'comment', id: number } | null>(null);

  useEffect(() => {
    if (id) {
      fetchPost();
      fetchComments();
    }
  }, [id]);

  const fetchPost = async () => {
    try {
      const response = await api.get(`/posts/${id}`);
      setPost(response.data.post);
    } catch (error) {
      console.error('Failed to fetch post:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await api.get(`/comments/${id}`);
      setComments(response.data.comments || []);
    } catch (error) {
      console.error('Failed to fetch comments:', error);
      setComments([]);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('정말로 이 게시글을 삭제하시겠습니까?')) return;

    try {
      await api.delete(`/posts/${id}`);
      const categoryId = post?.category?.id;
      navigate(categoryId ? `/posts?categoryId=${categoryId}` : '/posts');
    } catch (error) {
      console.error('Failed to delete post:', error);
    }
  };

  const handleLike = async () => {
    if (!isAuthenticated) {
      alert('좋아요를 누르려면 로그인이 필요합니다.');
      return;
    }
    try {
      await api.post(`/posts/${id}/like`);
      fetchPost();
    } catch (error) {
      console.error('Failed to like post:', error);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      await api.post('/comments', {
        postId: parseInt(id!),
        content: newComment,
      });
      setNewComment('');
      fetchPost();
      fetchComments();
    } catch (error) {
      console.error('Failed to post comment:', error);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-100 border-t-indigo-600 mb-4"></div>
          <p className="text-slate-500 font-medium">{t('common.loading')}</p>
        </div>
      </Layout>
    );
  }

  if (!post) {
    return (
      <Layout>
        <div className="max-w-md mx-auto mt-20">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 text-center">
            <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">게시글을 찾을 수 없습니다</h2>
            <p className="text-slate-500 mb-6">삭제된 게시글이거나 잘못된 접근입니다.</p>
            <button
              onClick={() => navigate('/posts')}
              className="w-full py-3 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 transition-colors font-bold"
            >
              목록으로 돌아가기
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  const isAuthor = user?.id === post.authorId;
  const categoryId = post.category?.id;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Navigation & Actions Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate(categoryId ? `/posts?categoryId=${categoryId}` : '/posts')}
            className="group flex items-center px-4 py-2 bg-white/50 backdrop-blur-sm border border-slate-200 text-slate-600 rounded-2xl hover:bg-white hover:text-indigo-600 transition-all shadow-sm"
          >
            <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-bold">목록으로</span>
          </button>

          <div className="flex items-center space-x-2">
            <button className="p-2.5 bg-white/50 backdrop-blur-sm border border-slate-200 text-slate-500 rounded-2xl hover:bg-white hover:text-indigo-600 transition-all shadow-sm">
              <Share2 className="h-4 w-4" />
            </button>
            {isAuthor && (
              <>
                <button
                  onClick={() => navigate(`/posts/${id}/edit`)}
                  className="p-2.5 bg-white/50 backdrop-blur-sm border border-slate-200 text-indigo-600 rounded-2xl hover:bg-white hover:shadow-md transition-all shadow-sm"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={handleDelete}
                  className="p-2.5 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl hover:bg-rose-100 hover:shadow-md transition-all shadow-sm"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Post Article Card */}
        <article className="bg-white/70 backdrop-blur-xl border border-white/40 shadow-2xl rounded-[2.5rem] overflow-hidden card-glass mb-8">
          {/* Post Header Section with Gradient Accent */}
          <div className="relative p-8 md:p-12 text-left">
            <div className="flex items-center space-x-2 mb-4">
              {post.category && (
                <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[11px] font-bold rounded-full uppercase tracking-wider border border-indigo-100">
                  {post.category.name}
                </span>
              )}
            </div>

            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 leading-tight mb-6 font-outfit">
              {post.title}
            </h1>

            <div className="flex flex-wrap items-center gap-6 pt-6 border-t border-slate-100">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-indigo-100 mr-3">
                  <User className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-slate-900 leading-none mb-1">{post.author?.nickname || 'Unknown'}</p>
                  <p className="text-[11px] text-slate-400 font-medium">Author</p>
                </div>
              </div>

              <div className="flex items-center text-slate-400">
                <Calendar className="h-4 w-4 mr-2" />
                <span className="text-sm font-medium">{new Date(post.createdAt).toLocaleDateString()}</span>
              </div>

              <div className="flex items-center text-slate-400">
                <MessageSquare className="h-4 w-4 mr-2" />
                <span className="text-sm font-medium">{post.commentCount} Comments</span>
              </div>
            </div>
          </div>

          {/* Post Content Body */}
          <div className="px-8 md:px-12 py-8 text-left border-y border-slate-50">
            <div
              className="prose prose-slate max-w-none text-slate-700 leading-relaxed font-medium post-content"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          </div>

          {/* Media & Attachments Section */}
          {(post?.images && post.images.length > 0) || (post?.files && post.files.length > 0) ? (
            <div className="px-8 md:px-12 py-8 bg-slate-50/50 text-left">
              {/* Images Grid */}
              {post.images && post.images.length > 0 && (
                <div className="mb-8">
                  <h3 className="flex items-center text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                    <ImageIcon className="h-3.5 w-3.5 mr-2" />
                    Published Images
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {post.images.map((image, index) => {
                      const imgUrl = image.imageUrl.startsWith('http')
                        ? image.imageUrl
                        : `${import.meta.env.VITE_API_URL || 'http://localhost:3002'}${image.imageUrl}`;
                      return (
                        <a key={index} href={imgUrl} target="_blank" rel="noopener noreferrer" className="group relative block aspect-video rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-slate-200">
                          <img
                            src={imgUrl}
                            alt={`Image ${index + 1}`}
                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <span className="px-4 py-2 bg-white/20 backdrop-blur-md rounded-full text-white text-xs font-bold">원본 보기</span>
                          </div>
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Attachments List */}
              {post.files && post.files.length > 0 && (
                <div>
                  <h3 className="flex items-center text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                    <File className="h-3.5 w-3.5 mr-2" />
                    Shared Documents
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {post.files.map((file, index) => {
                      const fileUrl = file.fileUrl.startsWith('http')
                        ? file.fileUrl
                        : `${import.meta.env.VITE_API_URL || 'http://localhost:3002'}${file.fileUrl}`;
                      return (
                        <a
                          key={index}
                          href={fileUrl}
                          download={file.originalName}
                          className="group flex items-center p-4 bg-white border border-slate-100 rounded-3xl hover:border-indigo-200 hover:shadow-md transition-all"
                        >
                          <div className="w-10 h-10 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center mr-4 group-hover:bg-indigo-500 group-hover:text-white transition-all">
                            <File className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-800 truncate mb-0.5">{file.originalName}</p>
                            <p className="text-[11px] text-slate-400 font-medium">
                              {file.fileSize ? `${(file.fileSize / 1024).toFixed(1)} KB` : 'Unknown size'}
                            </p>
                          </div>
                          <Download className="h-4 w-4 text-slate-300 group-hover:text-indigo-500 ml-2" />
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : null}

          {/* Social Interaction Bar */}
          <div className="px-8 md:px-12 py-6 flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <button
                onClick={handleLike}
                className={`flex items-center space-x-2 transition-all ${isAuthenticated ? 'hover:scale-110 active:scale-95' : 'opacity-50'
                  }`}
              >
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all shadow-sm">
                  <ThumbsUp className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <p className="text-lg font-black text-slate-900">{post.likeCount}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Impressions</p>
                </div>
              </button>
            </div>

            <button
              onClick={() => setReportData({ type: 'post', id: post.id })}
              className="group flex items-center px-4 py-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-2xl transition-all"
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              <span className="text-xs font-bold uppercase tracking-wider">Report Post</span>
            </button>
          </div>
        </article>

        {/* Comments Section Card */}
        <section className="bg-white/70 backdrop-blur-xl border border-white/40 shadow-xl rounded-[2.5rem] p-8 md:p-12 card-glass text-left">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-slate-900 font-outfit">
              Discussion <span className="text-indigo-500 ml-1">({post.commentCount})</span>
            </h2>
          </div>

          {/* Comment Write Form */}
          {isAuthenticated ? (
            <form onSubmit={handleSubmitComment} className="mb-10 relative group">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="댓글을 남겨보세요..."
                className="w-full px-6 py-5 bg-slate-50 border border-slate-200 rounded-3xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400 font-medium resize-none"
                rows={3}
              />
              <button
                type="submit"
                disabled={!newComment.trim()}
                className="absolute bottom-4 right-4 p-3 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 disabled:opacity-30 disabled:hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-200"
              >
                <Send className="h-5 w-5" />
              </button>
            </form>
          ) : (
            <div className="mb-10 p-8 bg-slate-50 border border-dashed border-slate-200 rounded-3xl text-center">
              <p className="text-slate-500 font-medium">
                로그인 후 의견을 나누어보세요. <a href="/login" className="text-indigo-600 font-bold hover:underline ml-1">Login <ChevronRight className="inline h-3 w-3" /></a>
              </p>
            </div>
          )}

          {/* Comments List */}
          <div className="space-y-6">
            {comments.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-slate-400 italic">첫 댓글의 주인공이 되어보세요!</p>
              </div>
            ) : (
              <div className="space-y-6">
                {comments.map((comment) => (
                  <div key={comment.id} className="group relative flex space-x-4 p-6 bg-slate-50/50 rounded-[2rem] hover:bg-white transition-all border border-transparent hover:border-slate-100 hover:shadow-xl hover:shadow-slate-100/50">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-slate-400 shadow-sm group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-all">
                        <User className="h-6 w-6" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="text-sm font-extrabold text-slate-900 leading-none mb-1">{comment.author?.nickname || 'Unknown'}</p>
                          <p className="text-[10px] text-slate-400 font-semibold">{new Date(comment.createdAt).toLocaleString()}</p>
                        </div>
                        <button
                          onClick={() => setReportData({ type: 'comment', id: comment.id })}
                          className="opacity-0 group-hover:opacity-100 p-2 text-slate-300 hover:text-amber-500 transition-all"
                        >
                          <AlertTriangle className="h-4 w-4" />
                        </button>
                      </div>
                      <p className="text-sm text-slate-700 font-medium leading-relaxed">{comment.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      {reportData && (
        <ReportModal
          targetType={reportData.type}
          targetId={reportData.id}
          onClose={() => setReportData(null)}
          onSuccess={() => setReportData(null)}
        />
      )}
    </Layout>
  );
}
