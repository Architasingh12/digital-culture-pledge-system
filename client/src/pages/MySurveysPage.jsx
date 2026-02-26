import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import { motion, AnimatePresence } from 'framer-motion';
import { ClipboardCheck, CalendarClock, Inbox, ArrowRight, Clock, CheckCircle2 } from 'lucide-react';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
};

const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0 }
};

const SkeletonCard = () => (
    <div className="rounded-2xl border shadow-sm p-5 flex items-start gap-4 animate-pulse" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
        <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-800 shrink-0"></div>
        <div className="flex-1 space-y-3">
            <div className="h-4 w-1/3 bg-slate-200 dark:bg-slate-800 rounded"></div>
            <div className="h-3 w-1/4 bg-slate-200 dark:bg-slate-800 rounded"></div>
        </div>
        <div className="w-24 h-8 rounded-xl bg-slate-200 dark:bg-slate-800 shrink-0 hidden sm:block"></div>
    </div>
);

const MySurveysPage = () => {
    const navigate = useNavigate();
    const [instances, setInstances] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // 'all' | 'pending' | 'completed'

    useEffect(() => {
        axiosInstance.get('/surveys/my-instances')
            .then(res => setInstances(res.data.instances || []))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    const filtered = instances.filter(i => {
        if (filter === 'pending') return !i.completed_at;
        if (filter === 'completed') return !!i.completed_at;
        return true;
    });

    const getFilterClass = (key) => {
        return filter === key
            ? 'bg-white dark:bg-slate-800 shadow-sm text-blue-700 dark:text-blue-400'
            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300';
    };

    return (
        <div className="p-4 lg:p-8 max-w-4xl mx-auto pb-24">
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                <span className="inline-block px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 text-[10px] font-black tracking-widest mb-3 rounded-full uppercase border border-indigo-200 dark:border-indigo-800">
                    Feedback Forms
                </span>
                <h1 className="text-3xl lg:text-4xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>My Surveys</h1>
                <p className="mt-2 text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Review and submit your required practice progress surveys.</p>
            </motion.div>

            {/* Filter tabs */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-1 mb-6 p-1 rounded-xl w-fit border" style={{ backgroundColor: 'var(--bg-body)', borderColor: 'var(--border-color)' }}>
                {[['all', 'All'], ['pending', '⏳ Pending'], ['completed', '✅ Completed']].map(([key, label]) => (
                    <button
                        key={key}
                        onClick={() => setFilter(key)}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${getFilterClass(key)}`}
                    >
                        {label}
                    </button>
                ))}
            </motion.div>

            {loading ? (
                <div className="flex flex-col gap-4">
                    <SkeletonCard />
                    <SkeletonCard />
                    <SkeletonCard />
                </div>
            ) : filtered.length === 0 ? (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="rounded-3xl border shadow-sm p-12 text-center mt-4" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
                    <div className="w-20 h-20 rounded-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-center mx-auto mb-6">
                        <Inbox className="w-10 h-10 text-slate-400" />
                    </div>
                    <p className="font-bold text-2xl mb-2" style={{ color: 'var(--text-primary)' }}>No surveys found</p>
                    <p className="font-medium text-sm" style={{ color: 'var(--text-secondary)' }}>You'll receive an email notification when a survey is ready for you!</p>
                </motion.div>
            ) : (
                <motion.div variants={containerVariants} initial="hidden" animate="visible" className="flex flex-col gap-4">
                    <AnimatePresence mode="popLayout">
                        {filtered.map(inst => {
                            const isCompleted = !!inst.completed_at;
                            return (
                                <motion.div
                                    key={inst.id}
                                    layout
                                    variants={itemVariants}
                                    initial="hidden"
                                    animate="visible"
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="rounded-2xl border shadow-sm p-5 flex flex-col sm:flex-row sm:items-center gap-4 group hover:shadow-md transition-shadow"
                                    style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}
                                >
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${isCompleted ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'}`}>
                                        {isCompleted ? <CheckCircle2 className="w-6 h-6" /> : <CalendarClock className="w-6 h-6" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 flex-wrap mb-1.5">
                                            <h3 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>{inst.schedule_label}</h3>
                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${isCompleted ? 'bg-emerald-50 dark:bg-emerald-900/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' : 'bg-amber-50 dark:bg-amber-900/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800'}`}>
                                                {isCompleted ? 'Completed' : 'Pending'}
                                            </span>
                                        </div>
                                        <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>{inst.program_title}</p>
                                        <p className="text-xs font-medium flex items-center gap-1.5" style={{ color: 'var(--text-tertiary)' }}>
                                            <Clock className="w-3 h-3" /> Due: <span className="font-bold" style={{ color: 'var(--text-secondary)' }}>{inst.due_date?.slice(0, 10)}</span>
                                            {isCompleted && <span className="ml-2 pl-2 border-l" style={{ borderColor: 'var(--border-color)' }}>Submitted: <span className="font-bold">{inst.completed_at?.slice(0, 10)}</span></span>}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => navigate('/survey/' + inst.id)}
                                        className={`shrink-0 w-full sm:w-auto mt-4 sm:mt-0 px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${isCompleted ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-900/20 hover:shadow-lg'}`}
                                    >
                                        {isCompleted ? 'View Info' : 'Fill Survey'} <ArrowRight className="w-4 h-4" />
                                    </button>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </motion.div>
            )}
        </div>
    );
};

export default MySurveysPage;
