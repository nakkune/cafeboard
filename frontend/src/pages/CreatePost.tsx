import { Layout } from '../components/Layout';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { useAuthStore } from '../store/auth';
import type { Category } from '../types';
import { RichTextEditor } from '../components/RichTextEditor';
import { Image as ImageIcon, File, X, Loader2, Upload, ArrowLeft, Save, Tag, AlertCircle, Clock, Globe, CheckCircle2 as CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// 업로드된 파일 정보 인터페이스
interface UploadedFile {
  url: string;           // 파일 URL
  filename: string;      // 저장된 파일명
  originalname: string; // 원본 파일명
  size: number;         // 파일 크기
  type: 'image' | 'file'; // 파일 타입 (이미지 또는 일반 파일)
}

// 새 게시글 작성 페이지 컴포넌트
export function CreatePost() {
  const navigate = useNavigate(); // 페이지 이동 함수
  const [searchParams] = useSearchParams(); // URL 검색 파라미터
  const { t } = useTranslation();

  // 인증 정보에서 사용자 정보 가져오기
  const { user } = useAuthStore();

  // 상태 변수들
  const [title, setTitle] = useState('');          // 게시물 제목
  const [content, setContent] = useState('');      // 게시물 내용
  const [categoryId, setCategoryId] = useState(searchParams.get('categoryId') || ''); // 선택된 카테고리 ID
  const [categories, setCategories] = useState<Category[]>([]); // 카테고리 목록
  const [isLoading, setIsLoading] = useState(false); // 제출 로딩 상태
  const [uploadedImages, setUploadedImages] = useState<UploadedFile[]>([]); // 업로드된 이미지 목록
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);   // 업로드된 파일 목록
  const [isUploading, setIsUploading] = useState(false); // 파일 업로드 로딩 상태

  // 파일 입력 필드 참조
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 관리자 전용 카테고리 목록
  const adminOnlyCategories = ['공지사항', '홍보게시판', 'Announcements', 'Promotions'];

  // 사용자 권한에 따른 사용 가능한 카테고리 필터링
  const availableCategories = useMemo(() => {
    const isAdmin = user?.role === 'admin' || user?.role === 'moderator';
    if (isAdmin) {
      return categories;
    }
    return categories.filter(cat => !adminOnlyCategories.includes(cat.name));
  }, [categories, user]);

  // 서버에서 카테고리 목록 가져오기
  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      const allCategories = response.data.categories || [];
      setCategories(allCategories);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  // 컴포넌트 마운트 시 카테고리 목록 가져오기
  useEffect(() => {
    fetchCategories();
  }, []);

  // URL 파라미터 또는 사용 가능한 카테고리가 변경될 때 카테고리 ID 설정
  useEffect(() => {
    const paramCategoryId = searchParams.get('categoryId');
    if (paramCategoryId) {
      setCategoryId(paramCategoryId);
    } else if (availableCategories.length > 0 && !categoryId) {
      setCategoryId(availableCategories[0].id.toString());
    }
  }, [searchParams, availableCategories]);

  // 이미지 업로드 핸들러
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

  // 파일 업로드 핸들러
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
    } catch (error: any) {
      console.error('Failed to upload files:', error);
      alert(error.response?.data?.error || '파일 업로드에 실패했습니다.');
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
    if (!title.trim() || !content.trim()) {
      alert('제목과 내용을 입력해주세요.');
      return;
    }

    setIsLoading(true);
    try {
      const imageUrls = uploadedImages.map(img => img.url);
      await api.post('/posts', {
        title,
        content,
        categoryId: parseInt(categoryId),
        images: imageUrls,
        files: uploadedFiles
      });
      navigate(categoryId ? `/posts?categoryId=${categoryId}` : '/posts');
    } catch (error) {
      console.error('Failed to create post:', error);
      alert('게시글 등록에 실패했습니다.');
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

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <button
              onClick={() => navigate(categoryId ? `/posts?categoryId=${categoryId}` : '/posts')}
              className="group flex items-center text-slate-500 hover:text-indigo-600 transition-colors mb-2"
            >
              <ArrowLeft className="h-4 w-4 mr-1 group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm font-medium">{t('common.back') || '목록으로'}</span>
            </button>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 font-outfit">
              {t('post.createPost') || '새 게시글 작성'}
            </h1>
            <p className="text-slate-500 mt-1">새로운 생각과 정보를 커뮤니티에 공유해보세요.</p>
          </div>
          <div className="hidden sm:flex space-x-3">
            <button
              type="button"
              onClick={() => navigate(categoryId ? `/posts?categoryId=${categoryId}` : '/posts')}
              className="px-5 py-2.5 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all font-medium flex items-center shadow-sm"
            >
              {t('common.cancel') || '취소'}
            </button>
            <button
              onClick={() => handleSubmit()}
              disabled={isLoading || isUploading || availableCategories.length === 0}
              className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-all font-medium flex items-center shadow-lg shadow-indigo-200"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white mr-2"></div>
                  {t('common.loading') || '저장 중...'}
                </div>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {t('post.submit') || '게시글 등록'}
                </>
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-6 text-left">
            <div className="bg-white/70 backdrop-blur-xl border border-white/40 shadow-xl rounded-3xl p-8 card-glass">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Title Input */}
                <div className="space-y-2 text-left">
                  <label className="block text-sm font-semibold text-slate-700 ml-1">
                    {t('post.title')} <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400 font-medium"
                    placeholder={t('post.titlePlaceholder') || '제목을 입력하세요'}
                    required
                  />
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
                  {/* Image Upload Area */}
                  <div className="space-y-4">
                    <label className="flex items-center text-sm font-semibold text-slate-700 ml-1">
                      <ImageIcon className="h-4 w-4 mr-2 text-indigo-500" />
                      {t('post.images') || '이미지 첨부'}
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
                            <span className="text-xs font-bold text-slate-500">{t('post.addImages') || '이미지 추가'}</span>
                          </div>
                        )}
                      </button>
                    </div>
                    {/* Image Preview Grid */}
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

                  {/* File Upload Area */}
                  <div className="space-y-4">
                    <label className="flex items-center text-sm font-semibold text-slate-700 ml-1">
                      <File className="h-4 w-4 mr-2 text-indigo-500" />
                      {t('post.files') || '파일 첨부'}
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
                            <span className="text-xs font-bold text-slate-500">{t('post.addFiles') || '파일 추가'}</span>
                          </div>
                        )}
                      </button>
                    </div>
                    {/* File List */}
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

          {/* Sidebar Section */}
          <div className="space-y-6 text-left">
            <div className="bg-white/70 backdrop-blur-xl border border-white/40 shadow-xl rounded-3xl p-6 space-y-6">
              <h3 className="text-lg font-bold text-slate-900 flex items-center font-outfit">
                <Tag className="h-5 w-5 mr-2 text-indigo-500" />
                설정 및 분류
              </h3>

              {/* Category Picker */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                  {t('post.category')}
                </label>
                {availableCategories.length === 0 ? (
                  <div className="flex items-center p-3 bg-rose-50 text-rose-600 rounded-xl border border-rose-100 text-xs italic">
                    <AlertCircle className="h-3.5 w-3.5 mr-2" />
                    {t('post.noCategory')}
                  </div>
                ) : (
                  <div className="w-full px-4 py-3 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-900 font-bold flex items-center shadow-inner">
                    <Tag className="h-4 w-4 mr-2" />
                    {availableCategories.find(cat => cat.id.toString() === categoryId)?.name || t('post.selectCategory')}
                  </div>
                )}
              </div>

              {/* Status Section */}
              <div className="space-y-4">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                  {t('video.status') || '게시 상태'}
                </label>
                <div className="space-y-2">
                  {[
                    { value: 'published', label: t('video.published') || '공개', icon: Globe, color: 'indigo' },
                    { value: 'draft', label: t('video.draft') || '임시저장', icon: Clock, color: 'slate' },
                  ].map((status) => (
                    <div key={status.value} className="flex items-center p-3 bg-slate-50 border border-slate-100 rounded-xl opacity-60">
                      <status.icon className="h-4 w-4 mr-3 text-slate-400" />
                      <span className="text-sm font-semibold text-slate-600">{status.label}</span>
                      {status.value === 'published' && <CheckCircle className="h-4 w-4 ml-auto text-emerald-500" />}
                    </div>
                  ))}
                  <p className="text-[10px] text-slate-400 px-1 pt-1 italic">* 게시판 작성은 기본적으로 공개 상태로 등록됩니다.</p>
                </div>
              </div>
            </div>

            {/* Hint Box */}
            <div className="bg-amber-50 rounded-3xl p-6 border border-amber-100/50 shadow-sm text-left">
              <div className="flex items-center text-amber-800 mb-2">
                <AlertCircle className="h-5 w-5 mr-2" />
                <span className="font-bold text-sm">작성 가이드라인</span>
              </div>
              <ul className="text-xs text-amber-700/80 space-y-2 leading-relaxed">
                <li>• 부적절한 언어 사용 시 제재를 받을 수 있습니다.</li>
                <li>• 대용량 파일 첨부(최대 100MB)가 가능합니다.</li>
                <li>• 에디터에 이미지를 업로드한 후 본문 삽입 버튼을 클릭하세요.</li>
              </ul>
            </div>

            {/* Mobile Actions */}
            <div className="flex flex-col gap-3 sm:hidden pt-4">
              <button
                type="button"
                onClick={() => handleSubmit()}
                className="w-full px-6 py-4 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 disabled:opacity-50 transition-all font-bold flex items-center justify-center shadow-lg shadow-indigo-100"
              >
                {isLoading ? t('common.loading') : t('post.submit')}
              </button>
              <button
                type="button"
                onClick={() => navigate(categoryId ? `/posts?categoryId=${categoryId}` : '/posts')}
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
