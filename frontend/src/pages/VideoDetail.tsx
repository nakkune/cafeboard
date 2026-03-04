import { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { videoApi } from '../api/videos';
import type { Video } from '../types';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Eye, Calendar, Edit, Trash2, ArrowLeft, Video as VideoIcon, HardDrive, Youtube, FileText, AlertTriangle } from 'lucide-react';
import { ReportModal } from '../components/ReportModal';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/auth';

export function VideoDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [video, setVideo] = useState<Video | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showReportModal, setShowReportModal] = useState(false);
  const { user, isAuthenticated } = useAuthStore();
  const { t } = useTranslation();

  useEffect(() => {
    if (id) {
      fetchVideo();
    }
  }, [id]);

  const fetchVideo = async () => {
    try {
      const response = await videoApi.getVideo(Number(id));
      setVideo(response.data.video);
    } catch (error) {
      console.error('Failed to fetch video:', error);
      navigate('/videos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(t('video.deleteConfirm') || '정말 이 동영상을 삭제하시겠습니까?')) {
      return;
    }
    try {
      await videoApi.deleteVideo(Number(id));
      navigate('/videos');
    } catch (error) {
      console.error('Failed to delete video:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const isOwner = isAuthenticated && user?.id === video?.authorId;

  if (isLoading) {
    return (
      <Layout>
        <div className="flex-1 flex justify-center items-center h-[calc(100vh-10rem)]">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 flex items-center justify-center shadow-inner">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!video) {
    return (
      <Layout>
        <div className="flex-1 flex flex-col items-center justify-center bg-white/50 backdrop-blur-xl border border-white/60 rounded-[2rem] p-12 text-center shadow-sm h-[calc(100vh-10rem)]">
          <div className="w-20 h-20 rounded-[2rem] bg-slate-100 flex items-center justify-center text-slate-300 mb-6">
            <VideoIcon className="h-10 w-10" />
          </div>
          <h3 className="text-xl font-bold text-slate-700 mb-2">{t('video.notFound') || '영상을 찾을 수 없습니다'}</h3>
          <p className="text-slate-400 font-medium">잘못된 접근이거나 이미 삭제된 영상입니다.</p>
          <button onClick={() => navigate('/videos')} className="mt-8 px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20 active:scale-95 flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            돌아가기
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto flex flex-col pb-12">
        {/* 네비게이션 헤더 */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/videos')}
            className="group flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors w-min"
          >
            <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center group-hover:bg-slate-50 transition-colors shadow-sm">
              <ArrowLeft className="h-4 w-4" />
            </div>
            {t('video.backToList') || '목록으로'}
          </button>
        </div>

        {/* 메인 콘텐츠 카드 (Glassmorphism) */}
        <div className="bg-white/80 backdrop-blur-xl border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.06)] rounded-[2rem] overflow-hidden flex flex-col relative z-10">

          {/* 동영상 플레이어 영역 */}
          <div className="w-full aspect-video bg-slate-950 relative overflow-hidden group">
            {video.videoType === 'local' ? (
              <video
                src={video.videoUrl}
                controls
                controlsList="nodownload"
                className="w-full h-full object-contain"
                onError={(e) => console.error('Video load error:', e, 'URL:', (e.target as HTMLVideoElement).src)}
                poster={video.thumbnailUrl || undefined}
              />
            ) : (
              <iframe
                src={video.videoUrl}
                title={video.title}
                className="w-full h-full border-0 shadow-inner"
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              />
            )}

            {/* 소스 태그 */}
            <div className="absolute top-4 right-4 z-20 pointer-events-none transition-opacity duration-300 opacity-50 group-hover:opacity-100">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-black rounded-lg shadow-lg backdrop-blur-md ${video.videoType === 'local'
                ? 'bg-emerald-500/80 text-white border border-emerald-400/30'
                : 'bg-rose-500/80 text-white border border-rose-400/30'
                }`}>
                {video.videoType === 'local' ? <HardDrive className="h-4 w-4" /> : <Youtube className="h-4 w-4" />}
                {video.videoType === 'local' ? t('video.local') || '서버' : t('video.external') || '외부'}
              </span>
            </div>
          </div>

          {/* 콘텐츠 영역 */}
          <div className="p-6 md:p-10 flex flex-col gap-8 bg-white/40">
            {/* 제목 및 액션 버튼들 (반응형 대응 flex-col -> sm:flex-row) */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 sm:gap-6 border-b border-slate-200/50 pb-8">
              <div className="flex-1 min-w-0">
                {video.category && (
                  <div className="mb-4">
                    <span className="inline-block px-3 py-1.5 bg-indigo-50/80 text-indigo-700 text-xs font-black tracking-wider uppercase rounded-lg border border-indigo-100/50">
                      {video.category.name}
                    </span>
                  </div>
                )}

                <h1 className="text-3xl sm:text-4xl font-black text-slate-800 tracking-tight leading-tight mb-4 break-keep">
                  {video.title}
                </h1>

                {/* 메타데이터 바 */}
                <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm font-semibold text-slate-500">
                  <span className="flex items-center gap-2 px-3 py-1 bg-white border border-slate-100 rounded-full shadow-sm text-slate-700">
                    <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-[10px]">
                      {(video.author?.nickname?.charAt(0) || '?').toUpperCase()}
                    </div>
                    {video.author?.nickname}
                  </span>

                  <span className="flex items-center gap-1.5" title="조회수">
                    <Eye className="h-4 w-4 text-slate-400" />
                    조회 {video.viewCount}회
                  </span>

                  <span className="flex items-center gap-1.5" title="업로드 날짜">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    {formatDate(video.createdAt)}
                  </span>
                </div>
              </div>

              {/* 시니어 리팩토링 - 반응형 액션 버튼 */}
              {isOwner && (
                <div className="flex sm:flex-col lg:flex-row items-stretch sm:items-end lg:items-center gap-2 flex-shrink-0 mt-2 sm:mt-0 w-full sm:w-auto">
                  <Link
                    to={`/videos/${video.id}/edit`}
                    className="flex-1 sm:flex-none flex items-center justify-center px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 hover:text-indigo-600 transition-all shadow-sm active:scale-95 group"
                  >
                    <Edit className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                    <span className="whitespace-nowrap">{t('common.edit') || '수정 단추'}</span>
                  </Link>
                  <button
                    onClick={handleDelete}
                    className="flex-1 sm:flex-none flex items-center justify-center px-4 py-2.5 bg-white border border-rose-200 text-rose-600 rounded-xl font-bold hover:bg-rose-50 transition-all shadow-sm active:scale-95 group"
                  >
                    <Trash2 className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                    <span className="whitespace-nowrap">{t('common.delete') || '삭제 단추'}</span>
                  </button>
                  <button
                    onClick={() => setShowReportModal(true)}
                    className="flex-1 sm:flex-none flex items-center justify-center px-4 py-2.5 bg-white border border-amber-200 text-amber-600 rounded-xl font-bold hover:bg-amber-50 transition-all shadow-sm active:scale-95 group"
                    title="신고하기"
                  >
                    <AlertTriangle className="h-4 w-4 mr-2 group-hover:rotate-12 transition-transform" />
                    <span className="whitespace-nowrap">신고</span>
                  </button>
                </div>
              )}
            </div>

            {/* 설명 (Description) 영역 */}
            {video.description && (
              <div className="bg-slate-50/50 rounded-2xl p-6 sm:p-8 border border-slate-100">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="h-5 w-5 text-slate-400" />
                  <h3 className="text-lg font-black text-slate-700">{t('video.description') || '영상 설명'}</h3>
                </div>
                <p className="text-slate-600 whitespace-pre-wrap leading-relaxed font-medium">
                  {video.description}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      {showReportModal && video && (
        <ReportModal
          targetType="video"
          targetId={video.id}
          onClose={() => setShowReportModal(false)}
          onSuccess={() => setShowReportModal(false)}
        />
      )}
    </Layout>
  );
}
