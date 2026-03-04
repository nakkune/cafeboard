import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { api } from '../api';

interface ReportModalProps {
    targetType: 'post' | 'comment' | 'video';
    targetId: number;
    onClose: () => void;
    onSuccess: () => void;
}

export function ReportModal({ targetType, targetId, onClose, onSuccess }: ReportModalProps) {
    const [reason, setReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!reason.trim()) return;

        setIsSubmitting(true);
        try {
            await api.post('/reports', {
                targetType,
                targetId,
                reason
            });
            alert('신고가 정상적으로 접수되었습니다. 관리자가 검토 후 처리하겠습니다.');
            onSuccess();
        } catch (error: any) {
            console.error('Failed to submit report:', error);
            alert(error.response?.data?.error || '신고 제출에 실패했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
            <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-amber-500" />
                        <h2 className="text-lg font-bold text-gray-800 uppercase tracking-tight">신고하기</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white rounded-xl text-gray-400 transition-all border border-transparent hover:border-gray-100 hover:shadow-sm"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    <div className="mb-4">
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">
                            신고 사유
                        </label>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="부적절한 내용이나 위반 사항을 상세히 적어주세요."
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-amber-100 focus:border-amber-400 transition-all outline-none h-40 resize-none text-sm font-medium leading-relaxed"
                            autoFocus
                            required
                        />
                    </div>

                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-4 text-gray-500 font-bold hover:bg-gray-50 rounded-2xl transition-all"
                        >
                            취소
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || !reason.trim()}
                            className="flex-1 px-6 py-4 bg-amber-500 text-white rounded-2xl font-bold shadow-lg shadow-amber-200 hover:bg-amber-600 disabled:bg-gray-300 transition-all flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? '제출 중...' : '신고 제출'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
