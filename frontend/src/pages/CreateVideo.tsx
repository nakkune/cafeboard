import React, { useState, useEffect, useRef } from 'react';
import { Layout } from '../components/Layout';
import { videoApi } from '../api/videos';
import { api } from '../api';
import type { Category } from '../types';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, Link as LinkIcon, X, Film, Image as ImageIcon, CheckCircle2, AlertCircle, Clock, Tag, Globe, Save } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function CreateVideo() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [videoType, setVideoType] = useState<'local' | 'external'>('local');
  const [uploadedFile, setUploadedFile] = useState<{ filename: string; url: string } | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<{ filename: string; url: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    videoUrl: '',
    thumbnailUrl: '',
    duration: '',
    categoryId: '',
    status: 'published' as const,
  });
  const { t } = useTranslation();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await api.get<{ categories: Category[] }>('/categories');
      setCategories(response.data.categories);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const generateThumbnail = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      video.preload = 'metadata';
      video.muted = true;
      video.playsInline = true;

      video.onloadedmetadata = () => {
        video.currentTime = Math.min(1, video.duration / 2);
      };

      video.onseeked = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          canvas.toBlob((blob) => {
            URL.revokeObjectURL(video.src);
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to create thumbnail blob'));
            }
          }, 'image/jpeg', 0.8);
        } else {
          reject(new Error('Canvas context not available'));
        }
      };

      video.onerror = () => {
        reject(new Error('Failed to load video'));
      };

      video.src = URL.createObjectURL(file);
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const validTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
    if (!validTypes.includes(file.type)) {
      alert('MP4, WebM, OGG 형식의 동영상 파일만 업로드 가능합니다.');
      return;
    }

    setIsUploading(true);
    try {
      const formDataFile = new FormData();
      formDataFile.append('file', file);

      const response = await api.post<{ filename: string; url: string }>('/upload/video', formDataFile);

      setUploadedFile(response.data);
      setFormData(prev => ({ ...prev, videoUrl: response.data.url }));

      try {
        const thumbnailBlob = await generateThumbnail(file);

        const thumbnailFormData = new FormData();
        thumbnailFormData.append('image', thumbnailBlob, 'thumbnail.jpg');

        const thumbnailUploadResponse = await api.post<{ url: string; filename: string }>('/upload/image', thumbnailFormData);

        setThumbnailFile({ url: thumbnailUploadResponse.data.url, filename: thumbnailUploadResponse.data.filename });
        setFormData(prev => ({ ...prev, thumbnailUrl: thumbnailUploadResponse.data.url }));
      } catch (thumbError) {
        console.error('Failed to generate thumbnail:', thumbError);
      }

    } catch (error) {
      console.error('Failed to upload video:', error);
      alert(t('video.createError') || '동영상 업로드에 실패했습니다.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    setThumbnailFile(null);
    setFormData(prev => ({ ...prev, videoUrl: '', thumbnailUrl: '' }));
  };

  const handleRemoveThumbnail = () => {
    setThumbnailFile(null);
    setFormData(prev => ({ ...prev, thumbnailUrl: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.videoUrl) {
      alert(t('video.titleRequired') || '제목과 동영상 파일을 입력해주세요.');
      return;
    }

    setIsLoading(true);
    try {
      await videoApi.createVideo({
        title: formData.title,
        description: formData.description,
        videoType,
        videoUrl: formData.videoUrl,
        thumbnailUrl: formData.thumbnailUrl || undefined,
        duration: formData.duration ? parseInt(formData.duration) : undefined,
        categoryId: formData.categoryId ? parseInt(formData.categoryId) : undefined,
        status: formData.status,
      });
      navigate('/videos');
    } catch (error) {
      console.error('Failed to create video:', error);
      alert(t('video.createError') || '동영상 등록에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <button
              onClick={() => navigate('/videos')}
              className="group flex items-center text-slate-500 hover:text-indigo-600 transition-colors mb-2"
            >
              <ArrowLeft className="h-4 w-4 mr-1 group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm font-medium">{t('video.backToList') || '목록으로 돌아가기'}</span>
            </button>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 font-outfit">
              {t('video.upload') || '동영상 업로드'}
            </h1>
            <p className="text-slate-500 mt-1">새로운 동영상을 공유하고 팀원들과 소통해보세요.</p>
          </div>
          <div className="hidden sm:flex space-x-3">
            <button
              type="button"
              onClick={() => navigate('/videos')}
              className="px-5 py-2.5 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all font-medium flex items-center shadow-sm"
            >
              {t('common.cancel') || '취소'}
            </button>
            <button
              onClick={handleSubmit}
              disabled={isLoading || isUploading}
              className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-all font-medium flex items-center shadow-lg shadow-indigo-200"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white mr-2"></div>
                  {t('video.uploading') || '업로드 중...'}
                </div>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {t('video.upload') || '동영상 게시'}
                </>
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form Content */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white/70 backdrop-blur-xl border border-white/40 shadow-xl rounded-3xl p-8 card-glass">
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Title and Description */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2 px-1 flex items-center">
                      <Film className="h-4 w-4 mr-1.5 text-indigo-500" />
                      {t('video.title')} <span className="text-rose-500 ml-1 font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400 font-medium"
                      placeholder={t('video.titlePlaceholder') || '동영상 제목을 입력하세요'}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2 px-1">
                      {t('video.description')}
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400 font-medium resize-none"
                      rows={6}
                      placeholder={t('video.descPlaceholder') || '동영상에 대한 설명을 자세히 적어주세요'}
                    />
                  </div>
                </div>

                {/* Video Upload Section */}
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-slate-700 mb-2 px-1 flex items-center">
                      <Upload className="h-4 w-4 mr-1.5 text-indigo-500" />
                      {videoType === 'local' ? t('video.videoFile') : t('video.videoUrl')} <span className="text-rose-500 ml-1 font-bold">*</span>
                    </label>

                    {/* Video Type Switcher */}
                    <div className="flex p-1 bg-slate-100 rounded-xl mb-2">
                      <button
                        type="button"
                        onClick={() => {
                          setVideoType('local');
                          handleRemoveFile();
                        }}
                        className={`flex items-center px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${videoType === 'local'
                            ? 'bg-white text-indigo-600 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                          }`}
                      >
                        <Upload className="h-3.5 w-3.5 mr-1.5" />
                        {t('video.local') || '로컬'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setVideoType('external');
                          handleRemoveFile();
                        }}
                        className={`flex items-center px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${videoType === 'external'
                            ? 'bg-white text-indigo-600 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                          }`}
                      >
                        <LinkIcon className="h-3.5 w-3.5 mr-1.5" />
                        {t('video.external') || '외부'}
                      </button>
                    </div>
                  </div>

                  {videoType === 'local' ? (
                    <div>
                      {uploadedFile ? (
                        <div className="group relative overflow-hidden rounded-2xl border-2 border-indigo-100 bg-indigo-50/50 p-6 transition-all hover:bg-indigo-50">
                          <div className="flex items-center">
                            <div className="p-3 bg-indigo-100 rounded-xl mr-4 group-hover:scale-110 transition-transform">
                              <Film className="h-8 w-8 text-indigo-600" />
                            </div>
                            <div className="flex-1 min-w-0 text-left">
                              <p className="text-sm font-bold text-slate-900 truncate">
                                {uploadedFile.filename}
                              </p>
                              <p className="text-xs text-slate-500 mt-1 flex items-center">
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 mr-1" />
                                파일 업로드 완료
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={handleRemoveFile}
                              className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                            >
                              <X className="h-5 w-5" />
                            </button>
                          </div>

                          {thumbnailFile && (
                            <div className="mt-4 flex items-center p-3 bg-white/60 rounded-xl border border-indigo-100/50">
                              <div className="h-14 w-24 rounded-lg overflow-hidden flex-shrink-0 bg-slate-200 mr-4">
                                <img
                                  src={thumbnailFile.url}
                                  alt="Preview"
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="flex-1">
                                <p className="text-xs font-bold text-slate-700 flex items-center">
                                  <ImageIcon className="h-3 w-3 mr-1 text-indigo-500" />
                                  섬네일 자동 생성됨
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={handleRemoveThumbnail}
                                className="p-1 px-2 text-[10px] font-bold text-slate-400 hover:text-rose-500 transition-colors"
                              >
                                {t('common.remove') || '제거'}
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="relative">
                          <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                            accept="video/mp4,video/webm,video/ogg,video/quicktime"
                            className="hidden"
                            id="video-upload"
                          />
                          <label
                            htmlFor="video-upload"
                            className={`group flex flex-col items-center justify-center w-full h-56 border-2 border-dashed border-slate-200 rounded-3xl cursor-pointer bg-slate-50/50 hover:bg-indigo-50/30 hover:border-indigo-300 transition-all duration-300 ${isUploading ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
                          >
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                              {isUploading ? (
                                <>
                                  <div className="relative mb-4">
                                    <div className="h-16 w-16 rounded-full border-4 border-slate-100"></div>
                                    <div className="absolute top-0 h-16 w-16 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin"></div>
                                  </div>
                                  <p className="text-indigo-600 font-bold">비디오를 분석하고 업로드 중입니다...</p>
                                  <p className="text-xs text-slate-400 mt-2">잠시만 기다려주세요</p>
                                </>
                              ) : (
                                <>
                                  <div className="h-16 w-16 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300">
                                    <Upload className="h-8 w-8 text-indigo-500" />
                                  </div>
                                  <p className="text-sm font-bold text-slate-700">여기를 클릭하거나 파일을 드래그하여 업로드</p>
                                  <p className="text-xs text-slate-400 mt-2">MP4, WebM, OGG (최대 500MB)</p>
                                </>
                              )}
                            </div>
                          </label>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                        <LinkIcon className="h-5 w-5" />
                      </div>
                      <input
                        type="url"
                        value={formData.videoUrl}
                        onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400 font-medium"
                        placeholder="https://www.youtube.com/embed/..."
                        required
                      />
                    </div>
                  )}
                </div>
              </form>
            </div>
          </div>

          {/* Sidebar Settings Content */}
          <div className="space-y-6">
            <div className="bg-white/70 backdrop-blur-xl border border-white/40 shadow-xl rounded-3xl p-6 space-y-6">
              <h3 className="text-lg font-bold text-slate-900 flex items-center font-outfit">
                <Tag className="h-5 w-5 mr-2 text-indigo-500" />
                추가 설정
              </h3>

              {/* Category Selection */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                  {t('video.category')}
                </label>
                <div className="relative">
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all font-medium appearance-none"
                  >
                    <option value="">{t('video.selectCategory') || '카테고리 선택'}</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                    <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Video Status */}
              <div className="space-y-4">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                  {t('video.status') || '게시 상태'}
                </label>
                <div className="space-y-3">
                  {[
                    { value: 'published', label: t('video.published') || '공개', desc: '모든 사용자가 볼 수 있습니다.', icon: Globe },
                    { value: 'draft', label: t('video.draft') || '임시저장', desc: '초안으로 저장합니다.', icon: Clock },
                    { value: 'hidden', label: t('video.hidden') || '숨김', desc: '본인만 확인 가능합니다.', icon: AlertCircle },
                  ].map((status) => (
                    <label
                      key={status.value}
                      className={`flex items-start p-3 rounded-xl border-2 cursor-pointer transition-all ${formData.status === status.value
                          ? 'border-indigo-500 bg-indigo-50/50 ring-2 ring-indigo-50'
                          : 'border-slate-100 hover:border-slate-200'
                        }`}
                    >
                      <input
                        type="radio"
                        name="videoStatus"
                        value={status.value}
                        checked={formData.status === status.value}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                        className="sr-only"
                      />
                      <div className={`p-2 rounded-lg mr-3 ${formData.status === status.value ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>
                        <status.icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className={`text-sm font-bold ${formData.status === status.value ? 'text-indigo-900' : 'text-slate-700'}`}>
                          {status.label}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{status.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Duration */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  {t('video.duration')} (초)
                </label>
                <input
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all font-medium"
                  placeholder="예: 120"
                />
              </div>
            </div>

            {/* Hint Box */}
            <div className="bg-amber-50 rounded-3xl p-6 border border-amber-100/50 shadow-sm">
              <div className="flex items-center text-amber-800 mb-2">
                <AlertCircle className="h-5 w-5 mr-2" />
                <span className="font-bold text-sm">업로드 도움말</span>
              </div>
              <ul className="text-xs text-amber-700/80 space-y-2 leading-relaxed">
                <li>• 비디오 파일 용량은 최대 500MB까지 지원됩니다.</li>
                <li>• 로컬 파일을 업로드하면 썸네일이 자동으로 생성됩니다.</li>
                <li>• 외부 URL의 경우 YouTube 또는 Vimeo 링크를 권장합니다.</li>
              </ul>
            </div>

            {/* Mobile Actions */}
            <div className="flex flex-col gap-3 sm:hidden pt-4">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isLoading || isUploading}
                className="w-full px-6 py-4 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 disabled:opacity-50 transition-all font-bold flex items-center justify-center shadow-lg shadow-indigo-100"
              >
                {isLoading ? t('video.uploading') || '업로드 중...' : t('video.upload')}
              </button>
              <button
                type="button"
                onClick={() => navigate('/videos')}
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
