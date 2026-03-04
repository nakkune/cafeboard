import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { Layout } from '../components/Layout';
import { useTranslation } from 'react-i18next';
import {
    Plus,
    ChevronRight,
    ChevronDown,
    Trash2,
    Sparkles,
    FolderOpen,
    Search,
    Command,
    Star,
    Copy,
    Globe,
    Lock,
    User
} from 'lucide-react';

interface Page {
    id: number;
    title: string;
    icon: string | null;
    parentId: number | null;
    authorId: number | null;
    spaceType: 'task' | 'personal';
    children?: Page[];
}

export function Taskspace() {
    const [taskPages, setTaskPages] = useState<Page[]>([]);
    const [personalPages, setPersonalPages] = useState<Page[]>([]);
    const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
    const [isLoading, setIsLoading] = useState(true);

    const [searchQuery, setSearchQuery] = useState('');
    const [starredIds, setStarredIds] = useState<Set<number>>(() => {
        const saved = localStorage.getItem('taskspace_starred');
        return saved ? new Set(JSON.parse(saved)) : new Set();
    });
    const searchInputRef = useRef<HTMLInputElement>(null);

    const { isAuthenticated, user } = useAuthStore();
    const navigate = useNavigate();
    const { t } = useTranslation();

    useEffect(() => {
        fetchAllPages();

        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                searchInputRef.current?.focus();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isAuthenticated]);

    const fetchAllPages = async () => {
        setIsLoading(true);
        try {
            // 태스크스페이스 (모두 공개 가능한 영역)
            const taskRes = await api.get('/pages/root?spaceType=task');
            setTaskPages(taskRes.data.pages || []);

            // 퍼스널스페이스 (로그인한 본인의 영역)
            if (isAuthenticated) {
                const devRes = await api.get('/pages/root?spaceType=personal');
                setPersonalPages(devRes.data.pages || []);
            } else {
                setPersonalPages([]);
            }
        } catch (error) {
            console.error('Failed to fetch pages:', error);
        } finally {
            setIsLoading(false);
        }
    };



    const fetchChildPages = async (parentId: number): Promise<Page[]> => {
        try {
            const response = await api.get(`/pages?parentId=${parentId}`);
            return response.data.pages || [];
        } catch (error) {
            console.error('Failed to fetch child pages:', error);
            return [];
        }
    };

    const toggleExpand = async (pageId: number) => {
        const newExpanded = new Set(expandedIds);
        if (newExpanded.has(pageId)) {
            newExpanded.delete(pageId);
        } else {
            const children = await fetchChildPages(pageId);
            setTaskPages(prev => updatePageChildren(prev, pageId, children));
            setPersonalPages(prev => updatePageChildren(prev, pageId, children));
            newExpanded.add(pageId);
        }
        setExpandedIds(newExpanded);
    };

    const updatePageChildren = (pages: Page[], parentId: number, children: Page[]): Page[] => {
        return pages.map(page => {
            if (page.id === parentId) {
                return { ...page, children };
            }
            if (page.children) {
                return { ...page, children: updatePageChildren(page.children, parentId, children) };
            }
            return page;
        });
    };

    const handleCreatePage = async (parentId?: number, spaceType: 'task' | 'personal' = 'personal') => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }

        try {
            const response = await api.post('/pages', {
                title: 'Untitled',
                parentId: parentId || null,
                spaceType,
                isPublic: spaceType === 'task'
            });
            navigate(`/taskspace/${response.data.page.id}`);
        } catch (error) {
            console.error('Failed to create page:', error);
        }
    };

    const handleDeletePage = async (pageId: number, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!confirm(t('workspace.deleteConfirm'))) return;

        try {
            await api.delete(`/pages/${pageId}`);
            setTaskPages(prev => removePageFromTree(prev, pageId));
            setPersonalPages(prev => removePageFromTree(prev, pageId));
        } catch (error) {
            console.error('Failed to delete page:', error);
        }
    };

    const removePageFromTree = (pages: Page[], pageId: number): Page[] => {
        return pages
            .filter(page => page.id !== pageId)
            .map(page => ({
                ...page,
                children: page.children ? removePageFromTree(page.children, pageId) : undefined
            }));
    };

    const handleToggleStar = (e: React.MouseEvent, pageId: number) => {
        e.preventDefault();
        e.stopPropagation();
        const next = new Set(starredIds);
        if (next.has(pageId)) next.delete(pageId);
        else next.add(pageId);
        setStarredIds(next);
        localStorage.setItem('taskspace_starred', JSON.stringify(Array.from(next)));
    };

    const handleCopyLink = (e: React.MouseEvent, pageId: number) => {
        e.preventDefault();
        e.stopPropagation();
        navigator.clipboard.writeText(window.location.origin + `/taskspace/${pageId}`);
        alert('문서 링크가 복사되었습니다!');
    };

    const renderPageTree = (pagesList: Page[], depth = 0) => {
        return pagesList
            .filter(p => !searchQuery || p.title.toLowerCase().includes(searchQuery.toLowerCase()))
            .map(page => (
                <div key={page.id} className="my-0.5 relative group/item">
                    <Link
                        to={`/taskspace/${page.id}`}
                        className="group flex items-center gap-1.5 py-1.5 pr-3 rounded-xl transition-all hover:bg-slate-100/80 hover:shadow-sm"
                        style={{ paddingLeft: `${depth * 16 + 12}px` }}
                    >
                        <div className="flex items-center min-w-[20px] justify-center">
                            {page.children && page.children.length > 0 ? (
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        toggleExpand(page.id);
                                    }}
                                    className="w-5 h-5 flex items-center justify-center hover:bg-slate-200/80 rounded-lg transition-colors"
                                >
                                    {expandedIds.has(page.id) ? (
                                        <ChevronDown className="h-4 w-4 text-slate-500" />
                                    ) : (
                                        <ChevronRight className="h-4 w-4 text-slate-500" />
                                    )}
                                </button>
                            ) : (
                                <span className="w-5" />
                            )}
                        </div>

                        <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-white shadow-sm border border-slate-100 text-[13px]">
                            {page.icon || '📄'}
                        </div>
                        <span className="flex-1 truncate text-[13px] font-semibold text-slate-700 group-hover:text-indigo-600 transition-colors">
                            {page.title}
                        </span>

                        <div className="opacity-0 group-hover/item:opacity-100 flex items-center gap-0.5 transition-opacity absolute right-2 bg-white/95 p-1 rounded-xl shadow-[0_4px_20px_rgb(0,0,0,0.08)] border border-slate-100 backdrop-blur-md z-10">
                            <button
                                onClick={(e) => handleToggleStar(e, page.id)}
                                className={`w-7 h-7 flex flex-shrink-0 items-center justify-center rounded-lg transition-colors ${starredIds.has(page.id) ? 'bg-amber-50 text-amber-500 hover:bg-amber-100' : 'text-slate-400 hover:bg-slate-50 hover:text-amber-500'}`}
                                title={starredIds.has(page.id) ? '즐겨찾기 해제' : '즐겨찾기 추가'}
                            >
                                <Star className="h-3.5 w-3.5" fill={starredIds.has(page.id) ? 'currentColor' : 'none'} />
                            </button>

                            <button
                                onClick={(e) => handleCopyLink(e, page.id)}
                                className="w-7 h-7 flex flex-shrink-0 items-center justify-center hover:bg-slate-50 rounded-lg transition-colors text-slate-400 hover:text-indigo-500"
                                title="링크 복사"
                            >
                                <Copy className="h-3.5 w-3.5" />
                            </button>

                            {page.authorId === user?.id && (
                                <>
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            handleCreatePage(page.id, page.spaceType);
                                        }}
                                        className="w-7 h-7 flex flex-shrink-0 items-center justify-center hover:bg-indigo-50 rounded-lg transition-colors text-slate-400 hover:text-indigo-500"
                                        title={t('workspace.addSubPage')}
                                    >
                                        <Plus className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={(e) => handleDeletePage(page.id, e)}
                                        className="w-7 h-7 flex flex-shrink-0 items-center justify-center hover:bg-rose-50 rounded-lg transition-colors text-slate-400 hover:text-rose-500"
                                        title={t('workspace.delete')}
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                </>
                            )}
                        </div>
                    </Link>

                    {expandedIds.has(page.id) && page.children && page.children.length > 0 && !searchQuery && (
                        <div className="relative">
                            <div className="absolute left-[18px] top-0 bottom-0 w-px bg-slate-200/60" style={{ left: `${depth * 16 + 22}px` }}></div>
                            {renderPageTree(page.children, depth + 1)}
                        </div>
                    )}
                </div>
            ));
    };

    const renderFavorites = () => {
        const flatFavorites: Page[] = [];
        const allPages = [...taskPages, ...personalPages];
        allPages.forEach(p => {
            if (starredIds.has(p.id)) flatFavorites.push(p);
            if (p.children) {
                p.children.forEach(cp => {
                    if (starredIds.has(cp.id)) flatFavorites.push(cp);
                });
            }
        });

        if (flatFavorites.length === 0) return null;

        return (
            <div className="mb-6">
                <h3 className="px-3 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <Star className="h-3 w-3 text-amber-500" fill="currentColor" />
                    즐겨찾기
                </h3>
                <div className="space-y-0.5">
                    {flatFavorites.map(page => (
                        <Link
                            key={`fav-${page.id}`}
                            to={`/taskspace/${page.id}`}
                            className="group flex items-center gap-2 py-1.5 px-3 rounded-xl transition-all hover:bg-amber-50/50"
                        >
                            <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-white shadow-sm border border-slate-100 text-[13px]">
                                {page.icon || '📄'}
                            </div>
                            <span className="flex-1 truncate text-[13px] font-semibold text-slate-700 group-hover:text-amber-700 transition-colors">
                                {page.title}
                            </span>
                        </Link>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <Layout>
            <div className="flex flex-col lg:flex-row h-auto lg:h-[calc(100vh-10rem)] min-h-[calc(100vh-10rem)] gap-8">
                <div className="w-full lg:w-[40%] h-full flex flex-col bg-white/70 backdrop-blur-2xl border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem] overflow-hidden">
                    <div className="p-6 border-b border-slate-100 bg-white/50 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100/50">
                                    <FolderOpen className="h-5 w-5" />
                                </div>
                                <h2 className="text-lg font-black text-slate-800 tracking-tight">태스크스페이스</h2>
                            </div>
                        </div>

                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                <Search className="h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                            </div>
                            <input
                                ref={searchInputRef}
                                type="text"
                                placeholder={t('workspace.searchPlaceholder')}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-12 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-slate-700 placeholder-slate-400 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]"
                            />
                            <div className="absolute inset-y-0 right-0 pr-2 flex items-center">
                                <div className="flex items-center gap-0.5 px-1.5 py-1 text-[10px] font-black text-slate-400 bg-slate-100 rounded-md border border-slate-200">
                                    <Command className="h-3 w-3" />
                                    <span>K</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto px-4 py-5 custom-scrollbar">
                        {!searchQuery && renderFavorites()}

                        <div className="space-y-8">
                            {/* 태스크스페이스 섹션 (공용) */}
                            <div>
                                <div className="flex items-center justify-between px-3 mb-3">
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                        <Globe className="h-3 w-3 text-indigo-400" />
                                        TaskSpace Menu (Public)
                                    </h3>
                                    <button
                                        onClick={() => handleCreatePage(undefined, 'task')}
                                        className="p-1 hover:bg-indigo-50 text-indigo-600 rounded-lg transition-colors"
                                        title="새 태스크 페이지"
                                    >
                                        <Plus className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                                {taskPages.length === 0 && !isLoading && (
                                    <p className="px-3 py-2 text-xs text-slate-400 italic">표시할 공용 페이지가 없습니다.</p>
                                )}
                                {renderPageTree(taskPages)}
                            </div>

                            {/* 퍼스널스페이스 섹션 (개인) */}
                            {isAuthenticated && (
                                <div>
                                    <div className="flex items-center justify-between px-3 mb-3">
                                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                            <Lock className="h-3 w-3 text-amber-400" />
                                            PersonalSpace Menu (Private)
                                        </h3>
                                        <button
                                            onClick={() => handleCreatePage(undefined, 'personal')}
                                            className="p-1 hover:bg-amber-50 text-amber-600 rounded-lg transition-colors"
                                            title="새 개인 페이지"
                                        >
                                            <Plus className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                    {personalPages.length === 0 && !isLoading && (
                                        <p className="px-3 py-2 text-xs text-slate-400 italic">본인만 볼 수 있는 페이지를 작성해 보세요.</p>
                                    )}
                                    {renderPageTree(personalPages)}
                                </div>
                            )}

                            {!isAuthenticated && (
                                <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
                                    <p className="text-[11px] text-slate-500 text-center leading-relaxed">
                                        <User className="h-3.5 w-3.5 mx-auto mb-1 text-slate-300" />
                                        로그인하면 본인만의<br /><b>퍼스널스페이스</b>를 사용할 수 있습니다.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex-1 w-full min-h-[400px] lg:min-h-0 flex flex-col items-center justify-center bg-white/70 backdrop-blur-2xl border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem] relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-purple-50 opacity-50 z-0"></div>

                    <div className="relative z-10 text-center max-w-sm px-6">
                        <div className="w-24 h-24 mx-auto mb-8 rounded-[2rem] bg-white shadow-xl shadow-slate-200/50 flex items-center justify-center transform group-hover:-translate-y-2 transition-transform duration-500 border border-white">
                            <Sparkles className="h-10 w-10 text-indigo-500" />
                        </div>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight mb-3">
                            {t('workspace.title') || '지식의 공간에 오신 것을 환영합니다'}
                        </h2>
                        <p className="text-slate-500 font-medium mb-8">
                            태스크스페이스는 모두가 볼 수 있는 공용 공간이며,<br />
                            퍼스널스페이스는 나만의 아이디어를 보관하는 개인 공간입니다.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <button
                                onClick={() => handleCreatePage(undefined, 'task')}
                                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all"
                            >
                                <Plus className="h-5 w-5" />
                                새 태스크 페이지
                            </button>
                            <button
                                onClick={() => handleCreatePage(undefined, 'personal')}
                                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold shadow-sm hover:bg-slate-50 hover:-translate-y-0.5 transition-all"
                            >
                                <Plus className="h-5 w-5" />
                                새 개인 페이지
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
