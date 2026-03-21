import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import axiosInstance from '../api/axiosInstance';
import { Link } from 'react-router-dom';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import { ClipboardList, Star, TrendingUp, Calendar, ArrowRight, CirclePlay, CheckCircle2, XCircle } from 'lucide-react';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0 }
};

const SkeletonCard = () => (
    <div className="rounded-3xl shadow-sm border p-6 animate-pulse" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
        <div className="flex justify-between items-center mb-6 border-b pb-4" style={{ borderColor: 'var(--border-color)' }}>
            <div className="space-y-3 w-1/2">
                <div className="h-3 w-24 rounded bg-slate-200 dark:bg-slate-700"></div>
                <div className="h-5 w-48 rounded bg-slate-200 dark:bg-slate-700"></div>
            </div>
            <div className="h-8 w-24 rounded bg-slate-200 dark:bg-slate-700"></div>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
            <div className="h-24 rounded-2xl bg-slate-200 dark:bg-slate-700/50"></div>
            <div className="h-24 rounded-2xl bg-slate-200 dark:bg-slate-700/50"></div>
        </div>
    </div>
);

const MyPledgesPage = () => {
    const [pledges, setPledges] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axiosInstance.get('/pledges/my')
            .then(res => setPledges(res.data.pledges || []))
            .catch(() => toast.error('Failed to load pledges'))
            .finally(() => setLoading(false));
    }, []);

    const getTypeColor = (type) => {
        if (type === 'start') return 'emerald';
        if (type === 'reduce') return 'amber';
        return 'rose';
    };

    const getTypeIcon = (type) => {
        if (type === 'start') return <CirclePlay className="w-3.5 h-3.5" />;
        if (type === 'reduce') return <CheckCircle2 className="w-3.5 h-3.5" />;
        return <XCircle className="w-3.5 h-3.5" />;
    };

    return (
        <div className="p-4 lg:p-8 max-w-5xl mx-auto pb-24">
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
                <div>
                    <span className="inline-block px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-[10px] font-black tracking-widest mb-3 rounded-full uppercase border border-blue-200 dark:border-blue-800">
                        My Commitments
                    </span>
                    <h1 className="text-3xl lg:text-4xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>My Pledges</h1>
                    <p className="mt-2 text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Review and track your ongoing digital culture commitments.</p>
                </div>
                <Link to="/pledge" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold px-6 py-3 rounded-xl shadow-md transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 shrink-0">
                    Create New Pledge <ArrowRight className="w-4 h-4" />
                </Link>
            </motion.div>

            {loading ? (
                <div className="space-y-6">
                    <SkeletonCard />
                    <SkeletonCard />
                </div>
            ) : pledges.length === 0 ? (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="rounded-3xl shadow-sm border p-12 lg:p-16 text-center mt-8" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
                    <div className="w-20 h-20 rounded-full bg-blue-50 dark:bg-slate-800/50 border border-blue-100 dark:border-slate-700 flex items-center justify-center mx-auto mb-6 text-blue-500">
                        <ClipboardList className="w-10 h-10" />
                    </div>
                    <h3 className="font-bold text-2xl mb-2" style={{ color: 'var(--text-primary)' }}>No pledges signed yet</h3>
                    <p className="mb-8 font-medium" style={{ color: 'var(--text-tertiary)' }}>You haven't made any commitments to our digital culture programs. Take the first step today.</p>
                    <Link to="/pledge" className="inline-flex bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold px-8 py-3.5 rounded-xl transition-all hover:scale-105">
                        Create Your First Pledge
                    </Link>
                </motion.div>
            ) : (
                <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
                    {pledges.map((p) => (
                        <motion.div key={p.id} variants={itemVariants} className="rounded-3xl shadow-sm border overflow-hidden hover:shadow-md transition-shadow group" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>

                            {/* Header */}
                            <div className="px-6 py-5 border-b grid sm:grid-cols-[1fr_auto] gap-4 items-center bg-slate-50/50 dark:bg-slate-900/50" style={{ borderColor: 'var(--border-color)' }}>
                                <div>
                                    <span className="text-[10px] font-black uppercase tracking-widest block mb-1" style={{ color: 'var(--text-tertiary)' }}>Program</span>
                                    <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{p.program_title}</h3>
                                </div>
                                <div className="sm:text-right border-t sm:border-none pt-3 sm:pt-0 border-slate-200 dark:border-slate-800">
                                    <span className="text-[10px] font-bold uppercase tracking-widest block mb-1" style={{ color: 'var(--text-tertiary)' }}>Submitted On</span>
                                    <span className="text-sm font-semibold inline-flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-slate-800 border rounded-full" style={{ color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}>
                                        <Calendar className="w-3.5 h-3.5 text-blue-500" />
                                        {new Date(p.submitted_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                    </span>
                                </div>
                            </div>

                            {/* Body */}
                            <div className="p-6">
                                {/* Core Ambition */}
                                <div className="grid md:grid-cols-2 gap-6 mb-8">
                                    <div className="bg-blue-50 dark:bg-blue-900/10 p-5 rounded-2xl border border-blue-100 dark:border-blue-900/50">
                                        <h4 className="text-[11px] font-black text-blue-700 dark:text-blue-400 uppercase tracking-widest mb-3 flex items-center gap-2"><Star className="w-4 h-4" /> My North Star</h4>
                                        <p className="text-sm font-medium leading-relaxed" style={{ color: 'var(--text-primary)' }}>{p.north_star || 'Not specified'}</p>
                                    </div>
                                    <div className="bg-emerald-50 dark:bg-emerald-900/10 p-5 rounded-2xl border border-emerald-100 dark:border-emerald-900/50">
                                        <h4 className="text-[11px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest mb-3 flex items-center gap-2"><TrendingUp className="w-4 h-4" /> Success Metric</h4>
                                        <p className="text-sm font-medium leading-relaxed" style={{ color: 'var(--text-primary)' }}>{p.success_metric}</p>
                                        <div className="mt-4 text-xs text-emerald-800 dark:text-emerald-300 font-bold bg-emerald-100 dark:bg-emerald-900/40 inline-flex px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800/50">Timeline: {p.timeline}</div>
                                    </div>
                                </div>

                                {/* Personal Habit Grid */}
                                <div className="mb-8 border-t pt-6" style={{ borderColor: 'var(--border-color)' }}>
                                    <h4 className="text-sm font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                                        <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] text-slate-500">🎯</span> Core Habit
                                    </h4>
                                    <div className="flex flex-col sm:flex-row gap-4 sm:items-start bg-slate-50/50 dark:bg-slate-800/20 p-5 rounded-2xl border" style={{ borderColor: 'var(--border-color)' }}>
                                        <div className="flex-1">
                                            <p className="text-sm font-semibold mb-1.5" style={{ color: 'var(--text-primary)' }}>{p.personal_habit}</p>
                                            <p className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}><span className="font-bold opacity-80 uppercase tracking-wider text-[10px]">Measurement:</span> {p.measure_success || 'Not specified'}</p>
                                        </div>
                                        <span className="bg-slate-200 dark:bg-slate-700 text-xs font-black px-3 py-1.5 rounded-lg uppercase tracking-widest shrink-0" style={{ color: 'var(--text-secondary)' }}>
                                            {p.habit_frequency}
                                        </span>
                                    </div>
                                </div>

                                {/* Behaviours */}
                                {p.behaviours && p.behaviours.length > 0 && (
                                    <div className="border-t pt-6" style={{ borderColor: 'var(--border-color)' }}>
                                        <h4 className="text-sm font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                                            <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] text-slate-500">🔄</span> Behaviour Changes
                                        </h4>
                                        <div className="grid sm:grid-cols-2 gap-4">
                                            {p.behaviours.map((b, idx) => {
                                                const color = getTypeColor(b.type);
                                                return (
                                                    <div key={idx} className={`p-4 rounded-xl border-l-4 border-${color}-500 bg-${color}-50/50 dark:bg-${color}-900/10 border-y border-r border-slate-100 dark:border-slate-800/50`}>
                                                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md mb-2 inline-flex items-center gap-1.5 bg-${color}-100 dark:bg-${color}-900/30 text-${color}-800 dark:text-${color}-400`}>
                                                            {getTypeIcon(b.type)} {b.type}
                                                        </span>
                                                        <p className="text-sm font-semibold leading-relaxed" style={{ color: 'var(--text-primary)' }}>{b.behaviour_text}</p>
                                                        {b.why_it_matters && (
                                                            <p className="text-[11px] mt-2 font-medium bg-white/60 dark:bg-slate-900/30 px-3 py-2 rounded-lg border" style={{ color: 'var(--text-secondary)', borderColor: 'var(--border-color)' }}>
                                                                <span className="font-bold opacity-70 uppercase tracking-wider block mb-0.5" style={{ fontSize: '9px' }}>Why it matters:</span>
                                                                {b.why_it_matters}
                                                            </p>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            )}
        </div>
    );
};

export default MyPledgesPage;
