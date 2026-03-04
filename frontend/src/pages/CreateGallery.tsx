import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { api } from '../api';
import { Camera, X, Plus, Loader2, Image as ImageIcon } from 'lucide-react';

export function CreateGallery() {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [images, setImages] = useState<string[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setIsUploading(true);
        const formData = new FormData();
        for (let i = 0; i < files.length; i++) {
            formData.append('files', files[i]);
        }

        try {
            // 기존 업로드 API 활용 (/api/upload/files)
            const response = await api.post('/upload/files', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            // 서버 응답 구조에 따라 수정 필요 (보통 [{url: '...'}, ...] 형태)
            const newUrls = response.data.files.map((f: any) => f.url);
            setImages([...images, ...newUrls]);
        } catch (error) {
            console.error('Image upload failed:', error);
            alert('Failed to upload images');
        } finally {
            setIsUploading(false);
        }
    };

    const removeImage = (index: number) => {
        setImages(images.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (images.length === 0) {
            alert('Please upload at least one photo');
            return;
        }

        setIsSubmitting(true);
        try {
            await api.post('/gallery', {
                title,
                content,
                images
            });
            navigate('/gallery');
        } catch (error) {
            console.error('Create gallery failed:', error);
            alert('Failed to save gallery post');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Layout>
            <div className="max-w-4xl mx-auto">
                <header className="mb-12">
                    <button
                        onClick={() => navigate('/gallery')}
                        className="text-slate-400 font-bold text-[10px] uppercase tracking-widest hover:text-slate-600 mb-4 transition-colors"
                    >
                        ← Back to Gallery
                    </button>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4">
                        <Camera className="text-pink-600 h-9 w-9" />
                        Share New Moment
                    </h1>
                </header>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Title Input */}
                    <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Give your moment a title..."
                            className="w-full text-2xl font-black bg-transparent border-none outline-none placeholder:text-slate-200"
                            required
                        />
                    </div>

                    {/* Photo Upload Section */}
                    <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100">
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                            {images.map((url, index) => (
                                <div key={index} className="relative aspect-square rounded-3xl overflow-hidden group">
                                    <img src={url} alt="" className="w-full h-full object-cover" />
                                    <button
                                        type="button"
                                        onClick={() => removeImage(index)}
                                        className="absolute top-2 right-2 bg-black/50 text-white p-2 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            ))}

                            <label className="aspect-square rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-all group">
                                {isUploading ? (
                                    <Loader2 className="h-8 w-8 animate-spin text-pink-500" />
                                ) : (
                                    <>
                                        <div className="w-12 h-12 bg-pink-50 text-pink-500 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                            <Plus size={24} />
                                        </div>
                                        <span className="text-[10px] font-black uppercase text-slate-400">Add Photos</span>
                                    </>
                                )}
                                <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageUpload} disabled={isUploading} />
                            </label>
                        </div>

                        {images.length === 0 && !isUploading && (
                            <div className="mt-8 text-center flex flex-col items-center">
                                <ImageIcon className="text-slate-100 h-16 w-16 mb-4" />
                                <p className="text-slate-300 font-bold text-sm">Visuals speak louder than words</p>
                            </div>
                        )}
                    </div>

                    {/* Content TextArea */}
                    <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Tell us the story behind these photos (optional)..."
                            className="w-full min-h-[150px] bg-transparent border-none outline-none text-slate-600 font-medium resize-none placeholder:text-slate-200"
                        />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-end gap-4">
                        <button
                            type="button"
                            onClick={() => navigate('/gallery')}
                            className="px-8 py-4 text-slate-400 font-black text-xs uppercase tracking-widest hover:text-slate-600"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || images.length === 0}
                            className="bg-slate-900 text-white px-12 py-5 rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl hover:-translate-y-1 active:scale-95 disabled:opacity-50 disabled:translate-y-0"
                        >
                            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : 'Publish to Gallery'}
                        </button>
                    </div>
                </form>
            </div>
        </Layout>
    );
}
