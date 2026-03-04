import { useState, useEffect } from 'react';
import { Header } from './Header';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuthStore } from '../store/auth';
import { MessageSquare, HelpCircle, Lightbulb, FileText, MessageCircle, Lock, ChevronLeft, ChevronRight, FolderOpen, Calendar, Video, Hash, Mail, Image } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// 게시판 정보 타입 정의
interface Board {
  name: string;
  label: string;
  icon: any;
  color: string;
  link: string;
  adminOnly?: boolean;
  loginRequired?: boolean;
}

// 전체 게시판 목록
const allBoards: Board[] = [
  { name: 'Chat', label: 'sidebar.chat', icon: Hash, color: 'text-green-600', link: '/chat', loginRequired: true },
  { name: 'DM', label: 'sidebar.dm', icon: Mail, color: 'text-blue-600', link: '/dm', loginRequired: true },
  { name: 'Taskspace', label: 'sidebar.workspace', icon: FolderOpen, color: 'text-yellow-600', link: '/taskspace', loginRequired: true },
  { name: 'Calendar', label: 'sidebar.calendar', icon: Calendar, color: 'text-indigo-600', link: '/calendar', loginRequired: true },
  { name: 'Videos', label: 'sidebar.videos', icon: Video, color: 'text-red-600', link: '/videos', loginRequired: true },
  { name: 'Gallery', label: 'sidebar.gallery', icon: Image, color: 'text-pink-500', link: '/gallery', loginRequired: true },
  { name: 'Announcements', label: 'sidebar.announcements', icon: MessageSquare, color: 'text-red-600', link: '/posts?categoryId=1', adminOnly: true },
  { name: 'Free Board', label: 'sidebar.freeBoard', icon: MessageCircle, color: 'text-blue-600', link: '/posts?categoryId=2', loginRequired: true },
  { name: 'Q&A', label: 'sidebar.qna', icon: HelpCircle, color: 'text-green-600', link: '/posts?categoryId=3', loginRequired: true },
  { name: 'Information', label: 'sidebar.information', icon: Lightbulb, color: 'text-purple-600', link: '/posts?categoryId=4', loginRequired: true },
  { name: 'Promotions', label: 'sidebar.promotions', icon: MessageSquare, color: 'text-pink-600', link: '/posts?categoryId=5', adminOnly: true },
  { name: 'Suggestions', label: 'sidebar.suggestions', icon: FileText, color: 'text-orange-600', link: '/posts?categoryId=6', loginRequired: true },
];

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuthStore();
  const isAdmin = user?.role === 'admin' || user?.role === 'moderator';
  const { t } = useTranslation();

  // 워크스페이스 페이지인지 확인
  const isWorkspacePage = location.pathname.startsWith('/taskspace');
  const isCalendarPage = location.pathname.startsWith('/calendar');
  const isVideosPage = location.pathname.startsWith('/videos');

  // 화면 크기에 따른 초기 상태 설정 (1024px 이하면 접힘)
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 1024;
    }
    return false;
  });

  // 화면 크기 변경 감지
  useEffect(() => {
    const handleResize = () => {
      setIsCollapsed(window.innerWidth < 1024);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 사용자에게 맞는 게시판 필터링
  const boards = allBoards.filter(b => {
    if (b.adminOnly && !isAdmin) return false;
    return true;
  });

  // 게시판 클릭 핸들러
  const handleBoardClick = (e: React.MouseEvent, board: Board) => {
    if (board.adminOnly && !isAdmin) {
      e.preventDefault();
      alert(t('sidebar.adminOnly'));
      return;
    }

    if (board.loginRequired && !isAuthenticated) {
      e.preventDefault();
      if (window.confirm(t('sidebar.loginRequired'))) {
        navigate('/login');
      }
      return;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-indigo-200 selection:text-indigo-900">
      <Header />
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
        <div className="flex gap-8">
          {/* 좌측 프리미엄 사이드바 */}
          <aside className={`flex-shrink-0 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${isCollapsed ? 'w[80px]' : 'w-56'} sticky top-28 h-[calc(100vh-10rem)] z-40`}>
            <div className="h-full bg-white/70 backdrop-blur-2xl border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem] p-4 flex flex-col justify-between overflow-hidden">
              <div>
                {/* 토글 버튼 */}
                <button
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  className="w-full flex items-center justify-center p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50/50 rounded-xl mb-6 transition-all"
                  title={isCollapsed ? t('sidebar.expand') : t('sidebar.collapse')}
                >
                  {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
                </button>

                {/* 접혔을 때 (아이콘만) */}
                {isCollapsed ? (
                  <nav className="space-y-2 flex flex-col items-center mt-4">
                    {boards.map((board) => {
                      const isActive = (board.name === 'Taskspace' && isWorkspacePage) || (board.name === 'Calendar' && isCalendarPage) || (board.name === 'Videos' && isVideosPage);
                      return (
                        <Link
                          key={board.name}
                          to={board.link}
                          onClick={(e) => handleBoardClick(e, board)}
                          className={`group flex items-center justify-center w-12 h-12 rounded-2xl transition-all ${isActive ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'hover:bg-slate-100/80 text-slate-500 hover:text-slate-800'}`}
                          title={t(board.label)}
                        >
                          <board.icon className={`h-6 w-6 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : board.color}`} />
                        </Link>
                      )
                    })}
                  </nav>
                ) : (
                  <div className="animate-in fade-in duration-500">
                    {/* 펼쳤을 때 (전체 메뉴) */}
                    <h2 className="text-xs font-black mb-3 text-slate-400 px-3 uppercase tracking-widest">{t('sidebar.menu')}</h2>
                    <nav className="space-y-1.5">
                      {boards.map((board) => {
                        const isActive = (board.name === 'Taskspace' && isWorkspacePage) || (board.name === 'Calendar' && isCalendarPage) || (board.name === 'Videos' && isVideosPage);
                        return (
                          <Link
                            key={board.name}
                            to={board.link}
                            onClick={(e) => handleBoardClick(e, board)}
                            className={`group flex items-center px-4 py-3 rounded-2xl transition-all font-semibold text-sm ${isActive ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 border border-transparent hover:border-slate-200/50'}`}
                          >
                            <board.icon className={`h-5 w-5 mr-3 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : board.color}`} />
                            <span className="flex-1">{t(board.label)}</span>
                            {board.loginRequired && !isAuthenticated && (
                              <Lock className={`h-3 w-3 ${isActive ? 'text-white/70' : 'text-slate-300'}`} />
                            )}
                          </Link>
                        );
                      })}
                    </nav>
                  </div>
                )}
              </div>
            </div>
          </aside>

          {/* 메인 콘텐츠 영역 */}
          <main className="flex-1">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
