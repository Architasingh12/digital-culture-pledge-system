import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import axiosInstance from '../api/axiosInstance';
import { Link } from 'react-router-dom';

const MyPledgesPage = () => {
    const [pledges, setPledges] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axiosInstance.get('/pledges/my')
            .then(res => setPledges(res.data.pledges || []))
            .catch(() => toast.error('Failed to load pledges'))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-96">
                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-4 lg:p-8 max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-slate-900 font-bold text-3xl">My Pledges</h1>
                    <p className="text-slate-500 mt-1">Review your digital culture commitments</p>
                </div>
                <Link to="/pledge" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-xl shadow-sm transition-colors">
                    + New Pledge
                </Link>
            </div>

            {pledges.length === 0 ? (
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-16 text-center">
                    <div className="text-5xl mb-4">📋</div>
                    <h3 className="text-slate-700 font-bold text-xl mb-2">No pledges yet</h3>
                    <p className="text-slate-400 mb-6">You haven't signed any program pledges. Get started today.</p>
                    <Link to="/pledge" className="inline-flex bg-blue-600 text-white font-bold px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors">
                        ✍️ Create Your First Pledge
                    </Link>
                </div>
            ) : (
                <div className="space-y-6">
                    {pledges.map((p) => (
                        <div key={p.id} className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow">

                            {/* Header */}
                            <div className="bg-gradient-to-r from-slate-50 to-white px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                                <div>
                                    <span className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-1 block">Program</span>
                                    <h3 className="text-lg font-bold text-slate-800">{p.program_title}</h3>
                                </div>
                                <div className="text-right">
                                    <span className="text-xs text-slate-400 block mb-1">Submitted On</span>
                                    <span className="text-sm font-semibold text-slate-700">
                                        {new Date(p.submitted_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                    </span>
                                </div>
                            </div>

                            {/* Body */}
                            <div className="p-6">

                                {/* Core Ambition */}
                                <div className="grid md:grid-cols-2 gap-6 mb-8">
                                    <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100/50">
                                        <h4 className="text-xs font-bold text-blue-800 uppercase tracking-wide mb-2 flex items-center gap-2"><span>⭐</span> My North Star</h4>
                                        <p className="text-slate-700 text-sm leading-relaxed">{p.north_star}</p>
                                    </div>
                                    <div className="bg-green-50/50 p-4 rounded-2xl border border-green-100/50">
                                        <h4 className="text-xs font-bold text-green-800 uppercase tracking-wide mb-2 flex items-center gap-2"><span>📈</span> Success Metric</h4>
                                        <p className="text-slate-700 text-sm leading-relaxed">{p.success_metric}</p>
                                        <div className="mt-3 text-xs text-green-700/80 font-semibold bg-green-100/50 inline-block px-2 py-1 rounded">Timeline: {p.timeline}</div>
                                    </div>
                                </div>

                                {/* Personal Habit Grid */}
                                <div className="mb-8">
                                    <h4 className="text-sm font-bold text-slate-800 mb-3 block border-b border-slate-100 pb-2">Core Habit</h4>
                                    <div className="flex gap-4 items-start">
                                        <div className="flex-1">
                                            <p className="text-slate-700 text-sm"><strong>Habit:</strong> {p.personal_habit}</p>
                                            <p className="text-slate-500 text-xs mt-1"><strong>Measurement:</strong> {p.measure_success}</p>
                                        </div>
                                        <span className="bg-slate-100 text-slate-600 text-xs font-bold px-3 py-1.5 rounded-lg whitespace-nowrap">
                                            {p.habit_frequency}
                                        </span>
                                    </div>
                                </div>

                                {/* Behaviours */}
                                {p.behaviours && p.behaviours.length > 0 && (
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-800 mb-3 block border-b border-slate-100 pb-2">Behaviour Changes</h4>
                                        <div className="grid sm:grid-cols-2 gap-3">
                                            {p.behaviours.map((b, idx) => (
                                                <div key={idx} className={`p-3 rounded-xl border-l-4 ${b.type === 'start' ? 'border-green-500 bg-green-50' : b.type === 'reduce' ? 'border-amber-500 bg-amber-50' : 'border-red-500 bg-red-50'}`}>
                                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded mb-1.5 inline-block
                             ${b.type === 'start' ? 'bg-green-200 text-green-800' : b.type === 'reduce' ? 'bg-amber-200 text-amber-800' : 'bg-red-200 text-red-800'}
                           `}>{b.type}</span>
                                                    <p className="text-sm font-medium text-slate-800">{b.behaviour_text}</p>
                                                    {b.why_it_matters && <p className="text-xs text-slate-500 mt-1 pl-2 border-l-2 border-slate-200">{b.why_it_matters}</p>}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MyPledgesPage;
