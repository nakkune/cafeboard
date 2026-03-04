import { useState, useEffect, useMemo, useRef } from 'react';
import { api } from '../api';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { Layout } from '../components/Layout';
import { BlockEditor } from '../components/BlockEditor';
import {
  ArrowLeft,
  Loader2,
  Settings,
  MoreHorizontal,
  Share,
  CalendarDays,
  Image as ImageIcon,
  Smile,
  Clock,
  FileText,
  Trash2,
  CheckCircle2,
  Globe,
  Lock,
  Zap
} from 'lucide-react';

interface Page {
  id: number;
  title: string;
  icon: string | null;
  cover: string | null;
  authorId: number | null;
  content: any;
  spaceType: 'task' | 'personal';
  isPublic: boolean;
  updatedAt?: string;
}

const PREMIUM_COVERS = [
  'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500',
  'bg-gradient-to-r from-cyan-500 to-blue-500',
  'bg-gradient-to-r from-emerald-500 to-teal-500',
  'bg-gradient-to-r from-orange-400 to-rose-400',
  'bg-gradient-to-r from-slate-900 to-slate-700',
  'bg-[url("https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=2000")] bg-cover bg-center',
  'bg-[url("https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&q=80&w=2000")] bg-cover bg-center',
  'bg-[url("https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&q=80&w=2000")] bg-cover bg-center',
  'bg-[url("https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&q=80&w=2000")] bg-cover bg-center',
  'bg-[url("https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&q=80&w=2000")] bg-cover bg-center',
];

const PAGE_ICONS = [
  '📄', '📝', '📒', '📚', '📊', '📅', '📋', // Documents
  '💻', '🚀', '💡', '🛠️', '🎯', '💼', '📌', '⚙️', '🧪', // Work/Tech
  '⭐', '🔥', '✨', '🌈', '🎨', '☕', '🎮', '🎬', '🎧', // Fun/Art
  '🏠', '🌿', '🌊', '⛰️', '🌍', '🛰️', '🏝️', '🏙️', // Nature/Places
  '🍎', '🍕', '🍦', '🥂', '🍿', '🥨', // Food
  '🦁', '🐋', '🦄', '🍀', '🌸', '🌻' // Nature/Life
];

export function PageDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [page, setPage] = useState<Page | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthor, setIsAuthor] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState<any>({});

  // 기능 컨텍스트 상태
  const [showMenu, setShowMenu] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // 20년차 개발자의 Outside Click 감지 로직 (Backdrop보다 훨씬 견고함)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  useEffect(() => {
    if (id) {
      fetchPage();
    }
  }, [id, user]);

  const fetchPage = async () => {
    try {
      const response = await api.get(`/pages/${id}`);
      const pageData = response.data.page;
      setPage(pageData);
      setTitle(pageData.title);
      setContent(pageData.content || { json: [] });
      setIsAuthor(user?.id === pageData.authorId);
    } catch (error) {
      console.error('Failed to fetch page:', error);
      navigate('/taskspace');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveTitle = async () => {
    if (!page) return;
    try {
      await api.put(`/pages/${page.id}`, { title });
      setPage({ ...page, title });
      setEditingTitle(false);
    } catch (error) {
      console.error('Failed to update title:', error);
    }
  };

  const handleContentChange = async (newContent: any) => {
    if (!page) return;
    setContent(newContent);
    try {
      await api.put(`/pages/${page.id}`, { content: newContent });
    } catch (error) {
      console.error('Failed to save content:', error);
    }
  };

  const handleIconChange = async (icon: string) => {
    if (!page) return;
    try {
      await api.put(`/pages/${page.id}`, { icon });
      setPage({ ...page, icon });
    } catch (error) {
      console.error('Failed to update icon:', error);
    }
  };

  const handleChangeCover = async () => {
    if (!page || !isAuthor) return;
    const currentCover = page.cover || '';
    const currentIdx = PREMIUM_COVERS.indexOf(currentCover);
    const nextCover = PREMIUM_COVERS[(currentIdx + 1) % PREMIUM_COVERS.length];

    try {
      await api.put(`/pages/${page.id}`, { cover: nextCover });
      setPage({ ...page, cover: nextCover });
    } catch (error) {
      console.error('Failed to update cover:', error);
    }
  };

  const handleCustomCoverUrl = async () => {
    if (!page || !isAuthor) return;
    const url = prompt('이미지 URL을 입력하세요 (예: https://example.com/image.jpg)');
    if (!url) return;

    // Tailwind의 임의 값 기능을 활용하여 bg-[url('...')] 형식으로 변환
    const coverValue = `bg-[url("${url}")] bg-cover bg-center`;

    try {
      await api.put(`/pages/${page.id}`, { cover: coverValue });
      setPage({ ...page, cover: coverValue });
      setShowMenu(false);
    } catch (error) {
      console.error('Failed to set custom cover:', error);
      alert('커스텀 커버 설정에 실패했습니다.');
    }
  };

  const handleToggleSpaceType = async () => {
    if (!page || !isAuthor) return;
    const newType = page.spaceType === 'task' ? 'personal' : 'task';
    const newIsPublic = newType === 'task';

    try {
      await api.put(`/pages/${page.id}`, {
        spaceType: newType,
        isPublic: newIsPublic
      });
      setPage({ ...page, spaceType: newType, isPublic: newIsPublic });
    } catch (error) {
      console.error('Failed to toggle space type:', error);
    }
  };

  const handleDeletePage = async () => {
    if (!page || !confirm('정말 이 페이지를 삭제하시겠습니까?')) return;
    try {
      await api.delete(`/pages/${page.id}`);
      navigate('/taskspace');
    } catch (error) {
      console.error('Failed to delete page:', error);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // 노션식 통계 계산 (실제 블록 내용 기반으로 정밀 측정)
  const stats = useMemo(() => {
    try {
      if (!content || !content.json || !Array.isArray(content.json)) {
        return { words: 0, readingTime: 1 };
      }

      // 재귀적으로 텍스트를 추출하는 시니어 로직
      let text = '';
      const extractText = (blocks: any[]) => {
        blocks.forEach(block => {
          if (block.content && Array.isArray(block.content)) {
            block.content.forEach((item: any) => {
              if (item.type === 'text') text += ' ' + (item.text || '');
            });
          }
          if (block.children && Array.isArray(block.children)) {
            extractText(block.children);
          }
        });
      };

      extractText(content.json);
      const wordCount = text.trim().split(/\s+/).filter(w => w.length > 0).length;
      const readTimeMin = Math.max(1, Math.ceil(wordCount / 200));
      return { words: wordCount, readingTime: readTimeMin };
    } catch (e) {
      return { words: 0, readingTime: 1 };
    }
  }, [content]);

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[calc(100vh-10rem)]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-[2rem] bg-indigo-50 shadow-inner flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            </div>
            <p className="text-sm font-black tracking-widest text-slate-400 uppercase animate-pulse italic">Syncing Your Space...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!page) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[calc(100vh-10rem)] bg-white/70 backdrop-blur-2xl border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem]">
          <h2 className="text-xl font-black text-rose-500 tracking-tight">페이지를 찾을 수 없습니다</h2>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-[1100px] mx-auto bg-white/95 backdrop-blur-3xl border border-white shadow-[0_40px_100px_-20px_rgba(0,0,0,0.12)] rounded-[3rem] min-h-[calc(100vh-10rem)] overflow-y-auto flex flex-col relative custom-scrollbar transition-all duration-500">

        {/* 다이내믹 커버 영역 - Stacking Context 최적화 */}
        <div className="relative group/cover w-full">
          {page.cover ? (
            <div className={`h-64 sm:h-72 w-full transition-all duration-700 ease-in-out ${page.cover} relative z-0`}>
              {/* 커버 관리 버튼 (호버 시 노출) */}
              {isAuthor && (
                <div className="absolute bottom-4 right-10 opacity-0 group-hover/cover:opacity-100 transition-opacity flex gap-2 z-10">
                  <button
                    onClick={handleChangeCover}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white/20 backdrop-blur-md border border-white/30 rounded-xl text-white text-[11px] font-bold hover:bg-white/40 transition-all shadow-lg"
                  >
                    <ImageIcon size={14} /> Change Cover
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        await api.put(`/pages/${page.id}`, { cover: null });
                        setPage({ ...page, cover: null });
                      } catch (error) {
                        console.error('Failed to remove cover:', error);
                      }
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white/20 backdrop-blur-md border border-white/30 rounded-xl text-white text-[11px] font-bold hover:bg-rose-500/50 transition-all shadow-lg"
                  >
                    <Trash2 size={14} /> Remove
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="h-24 w-full relative">
              {isAuthor && (
                <div className="absolute bottom-2 left-24 opacity-0 group-hover/cover:opacity-100 transition-opacity z-40">
                  <button
                    onClick={handleChangeCover}
                    className="flex items-center gap-2 px-3 py-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl text-[11px] font-bold transition-all border border-transparent hover:border-indigo-100"
                  >
                    <ImageIcon size={14} /> Add Cover
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Top Actions overlay (커버 위에 플로팅) - 최상위 레이어 유지 */}
          <div className="absolute top-8 left-8 right-8 flex justify-between items-center z-40">
            <Link
              to="/taskspace"
              className={`group inline-flex items-center justify-center w-10 h-10 rounded-xl transition-all shadow-lg border active:scale-95 ${page.cover ? 'bg-white/80 text-slate-800 border-white/50 hover:bg-white' : 'bg-white text-slate-400 border-slate-100 hover:text-indigo-600 hover:bg-indigo-50'}`}
            >
              <ArrowLeft className="h-5 w-5 transform group-hover:-translate-x-1 transition-transform" />
            </Link>

            <div className="flex gap-2 relative">
              <button
                onClick={handleCopyLink}
                className={`flex items-center gap-2 px-4 h-10 rounded-xl transition-all shadow-lg border text-[13px] font-bold active:scale-95 ${page.cover ? 'bg-white/80 text-slate-800 border-white/50 hover:bg-white' : 'bg-white text-slate-600 border-slate-100 hover:bg-emerald-50 hover:text-emerald-600'}`}
              >
                {isCopied ? <CheckCircle2 className="h-4 w-4" /> : <Share className="h-4 w-4" />}
                {isCopied ? 'Copied' : 'Share'}
              </button>

              <button
                onClick={() => setShowMenu(!showMenu)}
                className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all shadow-lg border active:scale-90 ${page.cover ? 'bg-white/80 text-slate-800 border-white/50 hover:bg-white' : 'bg-white text-slate-800 border-slate-100 hover:text-slate-900 hover:bg-slate-50'}`}
              >
                <MoreHorizontal className="h-5 w-5" />
              </button>

              {/* 더보기 팝업 메뉴 (Stacking Context 격리 및 Outside Click Ref 연결) */}
              {showMenu && (
                <div
                  ref={menuRef}
                  onClick={(e) => e.stopPropagation()}
                  className="absolute top-12 right-0 w-64 bg-white border border-slate-200 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] p-2 z-[9999] animate-in fade-in slide-in-from-top-2 duration-200"
                >
                  <div className="px-3 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 mb-1">
                    Advanced Controls
                  </div>

                  {isAuthor && (
                    <button
                      onClick={() => {
                        handleToggleSpaceType();
                        setShowMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-indigo-600 hover:text-white rounded-xl text-[13px] font-bold text-slate-600 transition-all group/item"
                    >
                      {page.spaceType === 'task' ? <Lock size={16} className="text-amber-500 group-hover:text-white" /> : <Globe size={16} className="text-indigo-500 group-hover:text-white" />}
                      {page.spaceType === 'task' ? 'Make Personal' : 'Make Public Task'}
                    </button>
                  )}

                  <button
                    onClick={() => {
                      handleChangeCover();
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-indigo-500 hover:text-white rounded-xl text-[13px] font-bold text-slate-600 transition-all group/item"
                  >
                    <ImageIcon size={16} className="text-indigo-500 group-hover/item:text-white transition-colors" /> Change Atmosphere
                  </button>
                  <button
                    onClick={() => {
                      handleCustomCoverUrl();
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-fuchsia-500 hover:text-white rounded-xl text-[13px] font-bold text-slate-600 transition-all group/item"
                  >
                    <Settings size={16} className="text-fuchsia-500 group-hover/item:text-white transition-colors" /> Set Custom URL
                  </button>
                  <button
                    onClick={() => {
                      const idx = PAGE_ICONS.indexOf(page.icon || '📄');
                      handleIconChange(PAGE_ICONS[(idx + 1) % PAGE_ICONS.length]);
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-amber-500 hover:text-white rounded-xl text-[13px] font-bold text-slate-600 transition-all group/item"
                  >
                    <Smile size={16} className="text-amber-500 group-hover/item:text-white transition-colors" /> Random Expression
                  </button>
                  {isAuthor && (
                    <>
                      <div className="my-1.5 h-px bg-slate-50"></div>
                      <button
                        onClick={handleDeletePage}
                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-rose-500 hover:text-white rounded-xl text-[13px] font-bold text-rose-500 transition-all group/item"
                      >
                        <Trash2 size={16} /> Archive Page
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 본문 에리어 */}
        <div className="px-10 md:px-24 pb-32 relative flex-1 flex flex-col z-20">

          {/* 아이콘 아바타 & 타이틀 영역 */}
          <div className={`${page.cover ? '-mt-20' : 'mt-10'} mb-12 flex flex-col items-start relative z-20 group/titlearea`}>
            {/* 아이콘 선택 */}
            <div className="mb-6 relative group/icon">
              <button
                onClick={() => {
                  if (!isAuthor) return;
                  const currentIndex = PAGE_ICONS.indexOf(page.icon || '📄');
                  const nextIcon = PAGE_ICONS[(currentIndex + 1) % PAGE_ICONS.length];
                  handleIconChange(nextIcon);
                }}
                className={`w-[140px] h-[140px] text-[80px] flex items-center justify-center bg-white rounded-[2.5rem] shadow-2xl border-[6px] border-white transform transition-all duration-500 ${isAuthor ? 'hover:scale-110 hover:-translate-y-4 cursor-pointer active:scale-95' : 'cursor-default'}`}
              >
                {page.icon || '📄'}
              </button>
              {isAuthor && (
                <div className="absolute -top-4 -right-4 w-10 h-10 rounded-2xl bg-slate-900 border-[3px] border-white flex items-center justify-center text-white opacity-0 group-hover/icon:opacity-100 transition-all shadow-2xl transform rotate-12 group-hover/icon:rotate-0">
                  <Settings size={18} className="animate-spin-slow" />
                </div>
              )}
            </div>

            {/* 타이틀 컨트롤 */}
            <div className="w-full">
              {editingTitle ? (
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={handleSaveTitle}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
                  className="text-5xl md:text-6xl lg:text-[68px] font-black text-slate-900 w-full bg-transparent border-0 focus:ring-0 focus:outline-none placeholder-slate-200 py-2 transition-all tracking-tighter leading-tight"
                  placeholder="제목 없는 페이지"
                  autoFocus
                />
              ) : (
                <h1
                  onClick={() => isAuthor && setEditingTitle(true)}
                  className={`text-5xl md:text-6xl lg:text-[68px] font-black text-slate-900 tracking-tighter py-2 transition-all break-words leading-tight ${isAuthor ? 'cursor-text hover:bg-slate-50/70 rounded-3xl px-4 -ml-4 active:scale-[0.99] origin-left' : ''}`}
                >
                  {page.title || <span className="text-slate-200">Untitled Space</span>}
                </h1>
              )}
            </div>

            {/* 메타데이터 바 - 정교한 정보 표시 */}
            <div className="flex flex-wrap items-center gap-4 mt-8 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-100/50 cursor-default ${page.spaceType === 'task' ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'bg-amber-50 text-amber-600 shadow-sm'}`}>
                {page.spaceType === 'task' ? <Globe size={14} /> : <Lock size={14} />}
                {page.spaceType === 'task' ? 'TaskSpace (Public)' : 'PersonalSpace (Private)'}
              </div>
              <div className="flex items-center gap-2 bg-slate-50/80 px-3 py-1.5 rounded-xl border border-slate-100/50 cursor-default">
                <CalendarDays size={14} className="text-indigo-400" />
                Updated at {page.updatedAt ? new Date(page.updatedAt).toLocaleDateString() : 'Today'}
              </div>
              <div className="flex items-center gap-2 bg-slate-50/80 px-3 py-1.5 rounded-xl border border-slate-100/50 cursor-default">
                <FileText size={14} className="text-amber-400" />
                {stats.words} Words
              </div>
              <div className="flex items-center gap-2 bg-slate-50/80 px-3 py-1.5 rounded-xl border border-slate-100/50 cursor-default">
                <Clock size={14} className="text-emerald-400" />
                {stats.readingTime} Min Read
              </div>
              {isAuthor && (
                <div className="bg-slate-900 text-white px-4 py-1.5 rounded-xl flex items-center gap-2">
                  <Zap size={12} className="text-yellow-400 animate-pulse" />
                  Owner Access
                </div>
              )}
            </div>
          </div>

          {/* 에디터 구분선 */}
          <div className="w-full h-px bg-gradient-to-r from-transparent via-slate-100 to-transparent mb-16"></div>

          {/* 블록 에디터 영역 - 에디터 자체의 여백 최적화 */}
          <div className="flex-1 w-full max-w-[900px] mx-auto min-h-[500px] relative z-20">
            {/* Key를 사용함으로써 페이지가 바뀔 때 에디터를 완전히 새롭게 초기화 (시니어의 정석) */}
            <BlockEditor
              key={page.id}
              content={content}
              onChange={handleContentChange}
              editable={isAuthor}
            />
          </div>
        </div>
      </div>

    </Layout >
  );
}
