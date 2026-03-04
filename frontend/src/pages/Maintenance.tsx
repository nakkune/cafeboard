import { Settings, AlertTriangle, Clock } from 'lucide-react';

interface MaintenanceProps {
    siteName?: string;
}

export function Maintenance({ siteName = 'CafeBoard' }: MaintenanceProps) {
    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
            <div className="max-w-2xl w-full text-center">
                {/* Animated Icon Container */}
                <div className="relative inline-block mb-12">
                    <div className="absolute inset-0 bg-indigo-500/20 blur-3xl rounded-full animate-pulse"></div>
                    <div className="relative bg-white p-8 rounded-[2.5rem] shadow-2xl border border-white/60 backdrop-blur-xl">
                        <Settings className="h-20 w-20 text-indigo-600 animate-[spin_8s_linear_infinite]" />
                        <AlertTriangle className="absolute -top-2 -right-2 h-10 w-10 text-rose-500 bg-white rounded-2xl p-2 shadow-lg animate-bounce" />
                    </div>
                </div>

                {/* Text Content */}
                <h1 className="text-5xl font-black text-slate-900 mb-6 tracking-tight">
                    {siteName} is undergoing <span className="text-indigo-600">Maintenance</span>
                </h1>

                <p className="text-xl text-slate-500 font-medium mb-12 leading-relaxed max-w-lg mx-auto">
                    We're currently updating our systems to provide you with an even better experience. We'll be back shortly!
                </p>

                {/* Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12 text-left">
                    <div className="bg-white/60 p-6 rounded-3xl border border-white shadow-sm backdrop-blur-sm">
                        <div className="flex items-center gap-3 mb-2">
                            <Clock className="h-5 w-5 text-indigo-500" />
                            <h3 className="font-black text-slate-800 uppercase tracking-widest text-[10px]">Estimated Time</h3>
                        </div>
                        <p className="font-bold text-slate-600 text-sm">Under 60 minutes</p>
                    </div>
                    <div className="bg-white/60 p-6 rounded-3xl border border-white shadow-sm backdrop-blur-sm">
                        <div className="flex items-center gap-3 mb-2">
                            <Settings className="h-5 w-5 text-emerald-500" />
                            <h3 className="font-black text-slate-800 uppercase tracking-widest text-[10px]">What's Changing?</h3>
                        </div>
                        <p className="font-bold text-slate-600 text-sm">Performance & Security Updates</p>
                    </div>
                </div>

                {/* Footer */}
                <div className="pt-8 border-t border-slate-200/60 inline-flex items-center gap-4">
                    <div className="w-2 h-2 rounded-full bg-indigo-600 animate-ping"></div>
                    <span className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Our team is working hard behind the scenes</span>
                </div>
            </div>
        </div>
    );
}
