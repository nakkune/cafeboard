import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { api } from '../api';
import { Loader2, ArrowLeft, Heart, MessageCircle, User, Trash2, ChevronLeft, ChevronRight, Send, Clock } from 'lucide-react';
import { useAuthStore } from '../store/auth';

interface GalleryDetail {
    id: number;
    title: string;
    content: string;
    authorId: number;
    author: {
        nickname: string;
        profileImage: string | null;
    };
    images: {
        id: number;
        imageUrl: string;
    }[];
    comments: {
        id: number;
        content: string;
        author: {
            nickname: string;
            profileImage: string | null;
        };
        createdAt: string;
    }[];
    likeCount: number;
    viewCount: number;
    createdAt: string;
}

export function GalleryDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuthStore();

    const [gallery, setGallery] = useState<GalleryDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [newComment, setNewComment] = useState('');
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);

    useEffect(() => {
        fetchGalleryDetail();
    }, [id]);

    const fetchGalleryDetail = async () => {
        setIsLoading(true);
        try {
            const response = await api.get(`/gallery/${id}`);
            setGallery(response.data);
        } catch (error) {
            console.error('Failed to fetch gallery detail:', error);
            alert('Gallery post not found');
            navigate('/gallery');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this moment?')) return;
        try {
            await api.delete(`/gallery/${id}`);
            navigate('/gallery');
        } catch (error) {
            console.error('Delete failed:', error);
            alert('Failed to delete');
        }
    };

    const handleCommentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        setIsSubmittingComment(true);
        try {
            await api.post(`/gallery/${id}/comments`, { content: newComment });
            setNewComment('');
            fetchGalleryDetail();
        } catch (error) {
            console.error('Failed to post comment:', error);
            alert('Failed to post comment. Please try again.');
        } finally {
            setIsSubmittingComment(false);
        }
    };

    const getImageUrl = (url: string) => {
        if (!url) return '';
        if (url.startsWith('http') || url.startsWith('/')) return url;
        // 파일명만 있는 경우 경로 보정
        return `/uploads/images/${url}`;
    };

    if (isLoading) {
        return (
            <Layout>
                <div className="flex items-center justify-center py-40">
                    <Loader2 className="h-12 w-12 animate-spin text-pink-500" />
                </div>
            </Layout>
        );
    }

    if (!gallery) return null;

    const isAuthor = user?.id === gallery.authorId || user?.role === 'admin';

    return (
        <Layout>
            <div className="max-w-6xl mx-auto">
                <button
                    onClick={() => navigate('/gallery')}
                    className="flex items-center gap-2 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-slate-900 transition-colors mb-8"
                >
                    <ArrowLeft size={16} />
                    Back to Gallery
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    <div className="lg:col-span-7 space-y-12">
                        <div className="relative aspect-[4/5] bg-slate-100 rounded-[3rem] overflow-hidden shadow-2xl group">
                            <img
                                src={getImageUrl(gallery.images[currentImageIndex]?.imageUrl)}
                                alt=""
                                className="w-full h-full object-cover transition-transform duration-700"
                            />
                            {gallery.images.length > 1 && (
                                <>
                                    <button
                                        onClick={() => setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : gallery.images.length - 1))}
                                        className="absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 backdrop-blur-md rounded-2xl flex items-center justify-center text-slate-900 shadow-xl opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
                                    >
                                        <ChevronLeft size={24} />
                                    </button>
                                    <button
                                        onClick={() => setCurrentImageIndex((prev) => (prev < gallery.images.length - 1 ? prev + 1 : 0))}
                                        className="absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 backdrop-blur-md rounded-2xl flex items-center justify-center text-slate-900 shadow-xl opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
                                    >
                                        <ChevronRight size={24} />
                                    </button>
                                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
                                        {gallery.images.map((_, idx) => (
                                            <div
                                                key={idx}
                                                className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentImageIndex ? 'w-8 bg-pink-500' : 'w-2 bg-white/50'}`}
                                            />
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="bg-white p-12 rounded-[3.5rem] shadow-sm border border-slate-50">
                            <div className="flex justify-between items-start mb-8">
                                <h1 className="text-3xl font-black text-slate-900 tracking-tight">{gallery.title}</h1>
                                {isAuthor && (
                                    <button onClick={handleDelete} className="p-3 text-slate-300 hover:text-red-500 transition-colors">
                                        <Trash2 size={20} />
                                    </button>
                                )}
                            </div>
                            <p className="text-slate-600 leading-relaxed font-medium whitespace-pre-wrap text-lg">
                                {gallery.content || 'No description provided.'}
                            </p>
                        </div>
                    </div>

                    <div className="lg:col-span-5 space-y-8">
                        <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-50">
                            <div className="flex items-center gap-4 mb-8 pb-8 border-b border-slate-50">
                                <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center overflow-hidden border-2 border-slate-50 shadow-inner">
                                    {gallery.author.profileImage ? (
                                        <img src={getImageUrl(gallery.author.profileImage)} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <User size={28} className="text-slate-300" />
                                    )}
                                </div>
                                <div>
                                    <h3 className="font-black text-slate-900 uppercase tracking-tight">{gallery.author.nickname}</h3>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mt-1">
                                        <Clock size={10} className="text-pink-500" />
                                        {new Date(gallery.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-50/50 p-6 rounded-[2rem] text-center">
                                    <div className="flex items-center justify-center gap-2 text-pink-500 mb-1">
                                        <Heart size={16} fill="currentColor" />
                                        <span className="text-xl font-black tabular-nums">{gallery.likeCount}</span>
                                    </div>
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Appreciations</span>
                                </div>
                                <div className="bg-slate-50/50 p-6 rounded-[2rem] text-center">
                                    <div className="flex items-center justify-center gap-2 text-blue-500 mb-1">
                                        <MessageCircle size={16} fill="currentColor" />
                                        <span className="text-xl font-black tabular-nums">{gallery.comments.length}</span>
                                    </div>
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Thoughts</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-[3rem] shadow-sm border border-slate-50 overflow-hidden flex flex-col h-[500px]">
                            <div className="p-8 border-b border-slate-50">
                                <h3 className="text-sm font-black text-slate-800 uppercase tracking-[0.2em]">Community Feedback</h3>
                            </div>

                            <div className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-hide">
                                {gallery.comments.length === 0 ? (
                                    <div className="text-center py-12">
                                        <p className="text-slate-300 font-bold text-xs uppercase tracking-widest">No comments yet</p>
                                    </div>
                                ) : (
                                    gallery.comments.map((comment) => (
                                        <div key={comment.id} className="group">
                                            <div className="flex items-start gap-3">
                                                <div className="w-8 h-8 rounded-xl bg-slate-50 flex-shrink-0 border border-slate-100 overflow-hidden mt-1">
                                                    {comment.author.profileImage ? (
                                                        <img src={getImageUrl(comment.author.profileImage)} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <User size={12} className="text-slate-300 m-auto mt-2 ml-2" />
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="font-black text-[10px] text-slate-900 uppercase">{comment.author.nickname}</span>
                                                        <span className="text-[9px] text-slate-300 font-medium">
                                                            {new Date(comment.createdAt).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                    <p className="text-slate-600 text-[13px] leading-relaxed font-medium bg-slate-50/50 p-4 rounded-2xl group-hover:bg-slate-50 transition-colors">
                                                        {comment.content}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className="p-8 bg-slate-50/30">
                                <form onSubmit={handleCommentSubmit} className="relative">
                                    <input
                                        type="text"
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        placeholder="Add a comment..."
                                        className="w-full bg-white border border-slate-100 rounded-2xl py-4 pl-6 pr-14 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-pink-100 transition-all placeholder:text-slate-300"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!newComment.trim() || isSubmittingComment}
                                        className="absolute right-2 top-2 w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center hover:bg-pink-600 transition-all disabled:opacity-30 disabled:hover:bg-slate-900 shadow-lg"
                                    >
                                        {isSubmittingComment ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
