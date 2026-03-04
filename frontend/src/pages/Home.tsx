import { Layout } from '../components/Layout';
import { Link } from 'react-router-dom';
import { Smile, Quote, BookOpen, Sparkles, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../store/auth';

export function Home() {
  const { user, isAuthenticated } = useAuthStore();
  const isAdmin = user?.role === 'admin' || user?.role === 'moderator';

  return (
    <Layout>
      <div className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center relative bg-slate-50 overflow-hidden font-sans pb-24 pt-12">
        {/* Background Decorative Elements */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-500/10 blur-[120px] pointer-events-none"></div>

        {/* Hero Section */}
        <div className="relative z-10 text-center max-w-4xl mx-auto px-6">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-indigo-50/80 backdrop-blur-sm border border-indigo-100 text-indigo-600 text-[11px] font-black tracking-widest uppercase mb-8 shadow-sm">
            <Sparkles size={16} />
            Welcome to the new standard
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-slate-900 mb-8 tracking-tighter leading-tight">
            Elevate Your <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
              Community Experience
            </span>
          </h1>
          <p className="text-lg md:text-xl text-slate-500 font-semibold mb-12 max-w-2xl mx-auto leading-relaxed">
            프리미엄 커뮤니티 플랫폼, 카페보드에 오신 것을 환영합니다.<br />
            더 나은 소통과 영감을 나누기 위해 새롭게 단장했습니다.
          </p>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            {isAdmin && (
              <Link
                to="/posts"
                className="group w-full sm:w-auto flex items-center justify-center gap-2 bg-slate-900 text-white px-8 py-4 rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 font-bold text-lg hover:-translate-y-1"
              >
                게시물 관리
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            )}
            {!isAuthenticated && (
              <Link
                to="/register"
                className="group w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-2xl hover:opacity-90 transition-all shadow-xl shadow-indigo-600/30 font-bold text-lg hover:-translate-y-1"
              >
                지금 시작하기
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            )}
          </div>

          {/* Premium Modern Hero Image */}
          <div className="mt-16 mx-auto relative group max-w-5xl">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-[2.5rem] blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative rounded-[2rem] overflow-hidden border border-white/50 shadow-2xl">
              <img
                src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&q=80&w=1600"
                alt="Modern collaborative workspace"
                className="w-full h-auto max-h-[400px] object-cover scale-100 group-hover:scale-105 transition-transform duration-1000"
              />
              {/* Optional: subtle dark gradient overlay on image for better contrast if text was on top, or just style */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/20 to-transparent pointer-events-none"></div>
            </div>
          </div>
        </div>

        {/* Premium Cards Section */}
        <div className="grid md:grid-cols-3 gap-8 mt-20 max-w-[1280px] w-full mx-auto px-6 relative z-10 text-left">
          {/* 오늘의 유머 */}
          <div className="group relative bg-white/70 backdrop-blur-3xl border border-white p-10 rounded-[2.5rem] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_40px_-15px_rgba(79,70,229,0.15)] transition-all duration-500 hover:-translate-y-2 overflow-hidden flex flex-col">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
              <Smile size={120} />
            </div>
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white mb-8 shadow-lg shadow-orange-500/30 flex-shrink-0">
              <Smile size={32} />
            </div>
            <h3 className="text-2xl font-black text-slate-800 tracking-tight mb-6 flex items-center gap-2">
              오늘의 유머 <Sparkles size={20} className="text-amber-500" />
            </h3>
            <div className="space-y-4 text-slate-600 font-medium leading-relaxed text-lg flex-1">
              <p>Q: 세상에서 가장 가난한 왕은?</p>
              <div className="bg-orange-50/50 p-5 rounded-2xl border border-orange-100/50 mt-4">
                <p className="text-orange-600 font-black">A: 최저임금</p>
              </div>
            </div>
          </div>

          {/* 오늘의 명언 */}
          <div className="group relative bg-white/70 backdrop-blur-3xl border border-white p-10 rounded-[2.5rem] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_40px_-15px_rgba(79,70,229,0.15)] transition-all duration-500 hover:-translate-y-2 overflow-hidden flex flex-col">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:-translate-x-4 duration-500 text-indigo-500">
              <Quote size={120} />
            </div>
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white mb-8 shadow-lg shadow-indigo-500/30 flex-shrink-0">
              <Quote size={32} />
            </div>
            <h3 className="text-2xl font-black text-slate-800 tracking-tight mb-6">
              오늘의 명언
            </h3>
            <blockquote className="relative flex-1 flex flex-col">
              <p className="text-slate-700 font-bold leading-relaxed text-lg mb-6 flex-1">
                "성공은 수고의 대가라는 것을 기억하라. 노력 없이 얻을 수 있는 것은 이 세상에 아무것도 없다."
              </p>
              <footer className="text-sm font-black text-indigo-500 uppercase tracking-widest flex items-center gap-3 before:content-[''] before:w-8 before:h-px before:bg-indigo-500/50">
                Albert Schweitzer
              </footer>
            </blockquote>
          </div>

          {/* 오늘의 영어 한문장 */}
          <div className="group relative bg-white/70 backdrop-blur-3xl border border-white p-10 rounded-[2.5rem] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_40px_-15px_rgba(79,70,229,0.15)] transition-all duration-500 hover:-translate-y-2 overflow-hidden flex flex-col">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:rotate-12 duration-500 text-teal-500">
              <BookOpen size={120} />
            </div>
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white mb-8 shadow-lg shadow-teal-500/30 flex-shrink-0">
              <BookOpen size={32} />
            </div>
            <h3 className="text-2xl font-black text-slate-800 tracking-tight mb-6">
              오늘의 영어 한문장
            </h3>
            <div className="space-y-4 flex-1">
              <p className="font-black text-2xl text-slate-900 tracking-tight">
                It's a piece of cake.
              </p>
              <div className="h-1.5 w-16 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full my-6"></div>
              <p className="text-slate-500 font-bold text-lg">
                식은 죽 먹기죠! (누워서 떡 먹기)
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
