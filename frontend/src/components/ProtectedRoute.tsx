import React from 'react';
import { useAuthStore } from '../store/auth';
import { Lock } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
    const { isAuthenticated } = useAuthStore();

    if (!isAuthenticated) {
        const errorContent = (
            <div className="flex h-screen items-center justify-center bg-gray-100 w-full">
                <div className="text-center p-8 bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-xl border border-white/60">
                    <div className="w-20 h-20 mx-auto rounded-full bg-slate-50 flex items-center justify-center text-slate-400 mb-6 border border-slate-100 shadow-inner">
                        <Lock size={40} className="text-slate-400" />
                    </div>
                    <h2 className="text-xl font-black text-slate-800 tracking-tight mb-2">접근 제한됨</h2>
                    <p className="text-slate-500 font-medium mb-8">안전한 서비스 이용을 위해 로그인이 필요합니다.</p>
                    <Link
                        to="/login"
                        className="inline-flex items-center justify-center px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-600/20 active:scale-95 transition-all"
                    >
                        로그인 페이지로 이동
                    </Link>
                </div>
            </div>
        );

        // If the child component usually renders its own Layout, we should match it
        // But since the design of DM/Chat was full-screen "로그인이 필요합니다", 
        // it's cleaner to return a full-screen block without the sidebar for unauthenticated users.
        return (
            <>
                {errorContent}
            </>
        );
    }

    return <>{children}</>;
}
