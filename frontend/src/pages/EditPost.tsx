import { Layout } from '../components/Layout';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import { useAuthStore } from '../store/auth';
import type { Category, Post } from '../types';
import { RichTextEditor } from '../components/RichTextEditor';
import { Image as ImageIcon, File, X, Loader2, Upload, ArrowLeft, Save, Tag, AlertCircle, Globe, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface UploadedFile {
  url: string;
  filename: string;
  originalname: string;
  size: number;
  type: 'image' | 'file';
}

export function EditPost() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState('');
  const [uploadedImages, setUploadedImages] = useState<UploadedFile[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const adminOnlyCategories = ['공지사항', '홍보게시판', 'Announcements', 'Promotions'];

  const availableCategories = useMemo(() => {
    const isAdmin = user?.role === 'admin' || user?.role === 'moderator';
    if (isAdmin) {
      return categories;
    }
    return categories.filter(cat => !adminOnlyCategories.includes(cat.name));
  }, [categories, user]);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchPost();
  }, [id]);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      const allCategories = response.data.categories || [];
      setCategories(allCategories);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchPost = async () => {
    if (!id) return;

    try {
      const response = await api.get(`/posts/${id}`);
      const post: Post = response.data.post;

      if (post.author?.id !== user?.id) {
        setError('게시글 수정 권한이 없습니다.');
        return;
      }

      setTitle(post.title);
      setContent(post.content);
      if (post.category?.id) {
        setCategoryId(post.category.id.toString());
      }

      // 기존 이미지 설정
      if (post.images && post.images.length > 0) {
        setUploadedImages(post.images.map(img => ({
          url: img.imageUrl,
          filename: img.fileName || '',
          originalname: img.fileName || '',
          size: img.fileSize || 0,
          type: 'image' as const
        })));
      }

      // 기존 파일 설정
      if (post.files && post.files.length > 0) {
        setUploadedFiles(post.files.map(file => ({
          url: file.fileUrl,
          filename: file.fileName,
          originalname: file.originalName,
          size: file.fileSize || 0,
          type: 'file' as const
        })));
      }
    } catch (error) {
      console.error('Failed to fetch post:', error);
      setError('게시글을 불러오는데 실패했습니다.');
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    if (availableCategories.length > 0 && categoryId === '' && !isFetching) {
      const postCategory = categories.find(cat => cat.id.toString() === categoryId);
      if (!postCategory) {
        setCategoryId(availableCategories[0].id.toString());
      }
    }
  }, [availableCategories, categoryId, isFetching, categories]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const formData = new FormData();

    Array.from(files).forEach(file => {
      formData.append('images', file);
    });

    try {
      const response = await api.post('/upload/images', formData);
      const newImages = response.data.files.map((file: any) => ({
        ...file,
        type: 'image' as const
      }));
      setUploadedImages(prev => [...prev, ...newImages]);
    } catch (error) {
      console.error('Failed to upload images:', error);
      alert('이미지 업로드에 실패했습니다.');
    } finally {
      setIsUploading(false);
      if (imageInputRef.current) {
        imageInputRef.current.value = '';
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);

    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post('/upload/file', formData);
        setUploadedFiles(prev => [...prev, {
          ...response.data,
          type: 'file' as const
        }]);
      }
    } catch (error) {
      console.error('Failed to upload files:', error);
      alert('파일 업로드에 실패했습니다.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const insertImageToContent = (imageUrl: string) => {
    const imageMarkdown = `\n![image](${imageUrl})\n`;
    setContent(prev => prev + imageMarkdown);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!title.trim() || !content.trim() || !id) return;

    setIsLoading(true);
    try {
      const imageUrls = uploadedImages.map(img => img.url);
      await api.put(`/posts/${id}`, {
        title,
        content,
        categoryId: parseInt(categoryId),
        images: imageUrls,
        files: uploadedFiles
      });
      navigate(`/posts/${id}`);
    } catch (error) {
      console.error('Failed to update post:', error);
      alert('게시글 수정에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  if (isFetching) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-100 border-t-indigo-600 mb-4"></div>
          <p className="text-slate-500 font-medium">{t('common.loading') || '불러오는 중...'}</p>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="max-w-md mx-auto mt-20">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 text-center">
            <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">오류가 발생했습니다</h2>
            <p className="text-slate-500 mb-6">{error}</p>
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

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <button
              onClick={() => navigate(`/posts/${id}`)}
              className="group flex items-center text-slate-500 hover:text-indigo-600 transition-colors mb-2"
            >
              <ArrowLeft className="h-4 w-4 mr-1 group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm font-medium">{t('common.back') || '취소'}</span>
            </button>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 font-outfit">
              {t('post.edit') || '게시글 수정'}
            </h1>
            <p className="text-slate-500 mt-1">게시글 내용을 수정하고 업데이트하세요.</p>
          </div>
          <div className="hidden sm:flex space-x-3">
            <button
              type="button"
              onClick={() => navigate(`/posts/${id}`)}
              className="px-5 py-2.5 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all font-medium flex items-center shadow-sm"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={() => handleSubmit()}
              disabled={isLoading || isUploading || availableCategories.length === 0}
              className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-all font-medium flex items-center shadow-lg shadow-indigo-200"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white mr-2"></div>
                  {t('common.loading')}
                </div>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {t('post.submit') || '수정 완료'}
                </>
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6 text-left">
            <div className="bg-white/70 backdrop-blur-xl border border-white/40 shadow-xl rounded-3xl p-8 card-glass">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Title (Read Only style or just display) */}
                <div className="space-y-2 text-left">
                  <label className="block text-sm font-semibold text-slate-700 ml-1">
                    {t('post.title')}
                  </label>
                  <div className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-500 font-medium">
                    {title}
                  </div>
                </div>

                {/* Content Editor */}
                <div className="space-y-2 text-left">
                  <label className="block text-sm font-semibold text-slate-700 ml-1">
                    {t('post.content')} <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <div className="border border-slate-200 rounded-2xl overflow-hidden focus-within:ring-4 focus-within:ring-indigo-100 focus-within:border-indigo-500 transition-all">
                    <RichTextEditor
                      value={content}
                      onChange={setContent}
                      placeholder={t('post.contentPlaceholder')}
                    />
                  </div>
                </div>

                {/* Attachments Sections */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                  <div className="space-y-4">
                    <label className="flex items-center text-sm font-semibold text-slate-700 ml-1">
                      <ImageIcon className="h-4 w-4 mr-2 text-indigo-500" />
                      {t('post.images')}
                    </label>
                    <div className="relative">
                      <input
                        ref={imageInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => imageInputRef.current?.click()}
                        disabled={isUploading}
                        className="w-full flex items-center justify-center p-4 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl hover:bg-slate-100/50 hover:border-indigo-300 transition-all group"
                      >
                        {isUploading ? (
                          <Loader2 className="h-5 w-5 animate-spin text-indigo-500" />
                        ) : (
                          <div className="text-center">
                            <Upload className="h-6 w-6 text-slate-400 mx-auto mb-1 group-hover:text-indigo-500 transition-colors" />
                            <span className="text-xs font-bold text-slate-500">{t('post.addImages')}</span>
                          </div>
                        )}
                      </button>
                    </div>
                    {uploadedImages.length > 0 && (
                      <div className="grid grid-cols-3 gap-2">
                        {uploadedImages.map((image, index) => (
                          <div key={index} className="relative aspect-square group rounded-xl overflow-hidden border border-slate-200">
                            <img src={image.url} alt="preview" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                              <button
                                type="button"
                                onClick={() => insertImageToContent(image.url)}
                                className="p-1.5 bg-white text-indigo-600 rounded-lg hover:bg-indigo-50"
                              >
                                <Upload className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => removeImage(index)}
                                className="p-1.5 bg-white text-rose-500 rounded-lg hover:bg-rose-50"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <label className="flex items-center text-sm font-semibold text-slate-700 ml-1">
                      <File className="h-4 w-4 mr-2 text-indigo-500" />
                      {t('post.files')}
                    </label>
                    <div className="relative">
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="w-full flex items-center justify-center p-4 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl hover:bg-slate-100/50 hover:border-indigo-300 transition-all group"
                      >
                        {isUploading ? (
                          <Loader2 className="h-5 w-5 animate-spin text-indigo-500" />
                        ) : (
                          <div className="text-center">
                            <Upload className="h-6 w-6 text-slate-400 mx-auto mb-1 group-hover:text-indigo-500 transition-colors" />
                            <span className="text-xs font-bold text-slate-500">{t('post.addFiles')}</span>
                          </div>
                        )}
                      </button>
                    </div>
                    {uploadedFiles.length > 0 && (
                      <div className="space-y-2">
                        {uploadedFiles.map((file, index) => (
                          <div key={index} className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                            <div className="flex items-center min-w-0 pr-2">
                              <div className="p-2 bg-white rounded-lg border border-slate-100 mr-3 flex-shrink-0">
                                <File className="h-4 w-4 text-slate-400" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-[11px] font-bold text-slate-700 truncate">{file.originalname}</p>
                                <p className="text-[10px] text-slate-400">{formatFileSize(file.size)}</p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeFile(index)}
                              className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </form>
            </div>
          </div>

          <div className="space-y-6 text-left">
            <div className="bg-white/70 backdrop-blur-xl border border-white/40 shadow-xl rounded-3xl p-6 space-y-6 text-left">
              <h3 className="text-lg font-bold text-slate-900 flex items-center font-outfit">
                <Tag className="h-5 w-5 mr-2 text-indigo-500" />
                분류
              </h3>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                  {t('post.category')}
                </label>
                <div className="w-full px-4 py-3 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-900 font-bold flex items-center shadow-inner">
                  <Tag className="h-4 w-4 mr-2" />
                  {availableCategories.find(cat => cat.id.toString() === categoryId)?.name || t('post.selectCategory')}
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                  {t('video.status') || '게시 상태'}
                </label>
                <div className="space-y-2">
                  {[
                    { value: 'published', label: t('video.published') || '공개', icon: Globe, color: 'indigo' },
                  ].map((status) => (
                    <div key={status.value} className="flex items-center p-3 bg-slate-50 border border-slate-100 rounded-xl">
                      <status.icon className="h-4 w-4 mr-3 text-emerald-500" />
                      <span className="text-sm font-semibold text-slate-600">{status.label}</span>
                      <CheckCircle2 className="h-4 w-4 ml-auto text-emerald-500" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-amber-50 rounded-3xl p-6 border border-amber-100/50 shadow-sm text-left">
              <div className="flex items-center text-amber-800 mb-2">
                <AlertCircle className="h-5 w-5 mr-2" />
                <span className="font-bold text-sm">수정 가이드라인</span>
              </div>
              <ul className="text-xs text-amber-700/80 space-y-2 leading-relaxed">
                <li>• 수정된 내용은 즉시 게시판에 반영됩니다.</li>
                <li>• 제목은 수정이 불가능하며 본문만 수정 가능합니다.</li>
                <li>• 불필요한 이미지나 파일은 삭제하여 관리해주세요.</li>
              </ul>
            </div>

            {/* Mobile Actions */}
            <div className="flex flex-col gap-3 sm:hidden pt-4">
              <button
                type="button"
                onClick={() => handleSubmit()}
                className="w-full px-6 py-4 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 disabled:opacity-50 transition-all font-bold flex items-center justify-center shadow-lg shadow-indigo-100"
              >
                {isLoading ? t('common.loading') : (t('post.submit') || '수정 완료')}
              </button>
              <button
                type="button"
                onClick={() => navigate(`/posts/${id}`)}
                className="w-full px-6 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl hover:bg-slate-50 transition-all font-bold"
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
