import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PledgeSuccessPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    return (
        <div className="min-h-[80vh] flex items-center justify-center p-4">
            <div className="max-w-lg w-full text-center">

                {/* Animated check */}
                <div className="relative mx-auto w-28 h-28 mb-8">
                    <div className="absolute inset-0 bg-green-100 rounded-full animate-ping opacity-40" />
                    <div className="relative w-28 h-28 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-xl shadow-green-200">
                        <svg className="w-14 h-14 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                </div>

                <h1 className="text-3xl font-black text-slate-900 mb-2">
                    Pledge Submitted! 🎉
                </h1>
                <p className="text-slate-500 text-lg mb-2">
                    Well done, <span className="font-bold text-slate-700">{user?.name || 'Participant'}</span>!
                </p>
                <p className="text-slate-400 text-sm mb-8">
                    Your digital culture commitment has been recorded and a PDF certificate was downloaded to your device.
                </p>

                {/* Info cards */}
                <div className="grid grid-cols-3 gap-3 mb-8">
                    {[
                        { icon: '📋', label: 'Pledge', sub: 'Saved' },
                        { icon: '📄', label: 'Certificate', sub: 'Downloaded' },
                        { icon: '🏆', label: 'Journey', sub: 'Begins' },
                    ].map(c => (
                        <div key={c.label} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
                            <div className="text-2xl mb-1">{c.icon}</div>
                            <p className="font-bold text-slate-800 text-sm">{c.label}</p>
                            <p className="text-xs text-slate-400">{c.sub}</p>
                        </div>
                    ))}
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                        onClick={() => navigate('/my-pledges')}
                        className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-blue-900/20 hover:shadow-xl hover:-translate-y-0.5 transition-all"
                    >
                        📋 View My Pledges
                    </button>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 font-semibold px-6 py-3 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
                    >
                        🏠 Go to Dashboard
                    </button>
                </div>

                {/* Quote */}
                <p className="mt-10 text-xs text-slate-300 italic">
                    "Culture is not just one aspect of the game — it is the game." — Lou Gerstner
                </p>
            </div>
        </div>
    );
};

export default PledgeSuccessPage;
