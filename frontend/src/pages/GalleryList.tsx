import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { api } from '../api';
import { Loader2, Camera, Plus, Image as ImageIcon, Heart, MessageCircle, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface GalleryPost {
    id: number;
    title: string;
    content: string;
    author: {
        nickname: string;
        profileImage: string | null;
    };
    images: {
        imageUrl: string;
    }[];
    likeCount: number;
    _count?: {
        comments: number;
    };
    createdAt: string;
}

export function GalleryList() {
    const [posts, setPosts] = useState<GalleryPost[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { t } = useTranslation();
    const navigate = useNavigate();

    useEffect(() => {
        fetchGalleryPosts();
    }, []);

    const fetchGalleryPosts = async () => {
        setIsLoading(true);
        try {
            // 전용 사진첩 테이블 API 호출 (/api/gallery)
            const response = await api.get('/gallery', {
                params: { page: 1, limit: 12 }
            });
            setPosts(response.data.galleries);
        } catch (error) {
            console.error('Failed to fetch gallery posts:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const getImageUrl = (url: string) => {
        if (!url) return 'https://images.unsplash.com/photo-1620121692029-d088224ddc74?q=80&w=2000&auto=format&fit=crop';
        if (url.startsWith('http') || url.startsWith('/')) return url;
        return `/uploads/images/${url}`;
    };

    return (
        <Layout>
            <div className="max-w-7xl mx-auto">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 mb-2 tracking-tight flex items-center gap-3">
                            <Camera className="text-pink-500 h-9 w-9" />
                            {t('sidebar.gallery')}
                        </h1>
                        <p className="text-slate-500 font-bold ml-12 uppercase tracking-widest text-[10px]">
                            Capture and share your aesthetic moments
                        </p>
                    </div>

                    <button
                        onClick={() => navigate('/gallery/new')}
                        className="flex items-center justify-center gap-2 bg-slate-900 text-white px-8 py-1.5 rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl hover:-translate-y-1 active:scale-95 group"
                    >
                        <Plus className="h-4 w-4 transition-transform group-hover:rotate-90" />
                        Upload Photo
                    </button>
                </div>

                {/* Content Section */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-40">
                        <Loader2 className="h-12 w-12 animate-spin text-pink-500" />
                    </div>
                ) : posts.length === 0 ? (
                    <div className="text-center py-32 bg-white/50 rounded-[3rem] border border-dashed border-slate-200 backdrop-blur-sm">
                        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-slate-200 mx-auto mb-8 shadow-inner">
                            <ImageIcon size={48} />
                        </div>
                        <h3 className="text-xl font-black text-slate-800 mb-3">Your Gallery is Empty</h3>
                        <p className="text-slate-400 font-bold text-sm mb-8">Be the first one to share a beautiful photo!</p>
                        <button
                            onClick={() => navigate('/gallery/new')}
                            className="px-6 py-3 bg-white text-slate-900 border border-slate-200 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm"
                        >
                            Start Creating
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                        {posts.map((post) => (
                            <div
                                key={post.id}
                                onClick={() => navigate(`/gallery/${post.id}`)}
                                className="group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer border border-slate-100"
                            >
                                {/* Image Container */}
                                <div className="aspect-square overflow-hidden bg-slate-50 relative">
                                    <img
                                        src={getImageUrl(post.images?.[0]?.imageUrl)}
                                        alt={post.title}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    />

                                    {/* Overlay on Hover (More Compact) */}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-4">
                                        <div className="flex items-center gap-1 text-white">
                                            <Heart className="h-4 w-4 fill-white" />
                                            <span className="text-[10px] font-black">{post.likeCount}</span>
                                        </div>
                                        <div className="flex items-center gap-1 text-white">
                                            <MessageCircle className="h-4 w-4 fill-white" />
                                            <span className="text-[10px] font-black">{post._count?.comments || 0}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Info Container (Compact) */}
                                <div className="p-3">
                                    <h4 className="text-[11px] font-black text-slate-800 mb-2 line-clamp-1 group-hover:text-pink-600 transition-colors">
                                        {post.title}
                                    </h4>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-50">
                                                {post.author.profileImage ? (
                                                    <img src={getImageUrl(post.author.profileImage)} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <User size={10} className="text-slate-400" />
                                                )}
                                            </div>
                                            <span className="text-[9px] font-bold text-slate-500 truncate max-w-[60px]">
                                                {post.author.nickname}
                                            </span>
                                        </div>
                                        <span className="text-[8px] font-medium text-slate-300">
                                            {new Date(post.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </Layout>
    );
}
