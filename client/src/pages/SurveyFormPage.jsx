import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import axiosInstance from '../api/axiosInstance';
import { motion } from 'framer-motion';
import { CalendarClock, CheckCircle, CheckCircle2, ChevronRight, Send, AlertTriangle, MessageSquareText, TrendingUp, HelpCircle } from 'lucide-react';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0 }
};

const SkeletonCard = () => (
    <div className="rounded-3xl border shadow-sm p-6 mb-4 animate-pulse" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
        <div className="flex gap-2 mb-3">
            <div className="w-6 h-4 rounded bg-slate-200 dark:bg-slate-700"></div>
            <div className="w-16 h-4 rounded-full bg-slate-200 dark:bg-slate-700"></div>
        </div>
        <div className="w-3/4 h-5 rounded mb-6 bg-slate-200 dark:bg-slate-700"></div>
        <div className="flex gap-2">
            <div className="flex-1 h-12 rounded-xl bg-slate-200 dark:bg-slate-800"></div>
            <div className="flex-1 h-12 rounded-xl bg-slate-200 dark:bg-slate-800"></div>
            <div className="flex-1 h-12 rounded-xl bg-slate-200 dark:bg-slate-800"></div>
        </div>
    </div>
);

const LEVEL_OPTIONS = [
    { value: 'H', label: 'High (Consistently applied)', theme: 'emerald', icon: <TrendingUp className="w-4 h-4" /> },
    { value: 'M', label: 'Medium (Partially applied)', theme: 'amber', icon: <HelpCircle className="w-4 h-4" /> },
    { value: 'L', label: 'Low (Not yet applied)', theme: 'rose', icon: <AlertTriangle className="w-4 h-4" /> },
];

const SurveyFormPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [instance, setInstance] = useState(null);
    const [practices, setPractices] = useState([]);
    const [responses, setResponses] = useState({});
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadSurvey();
    }, [id]);

    const loadSurvey = async () => {
        try {
            const res = await axiosInstance.get('/surveys/instances/' + id);
            setInstance(res.data.instance);
            setPractices(res.data.practices || []);
            const existingMap = {};
            for (const r of (res.data.responses || [])) {
                existingMap[r.practice_id] = {
                    action_taken_level: r.action_taken_level || '',
                    action_needed_next: r.action_needed_next || '',
                };
            }
            setResponses(existingMap);
        } catch {
            toast.error('Failed to load survey.');
        } finally {
            setLoading(false);
        }
    };

    const setResponse = (practiceId, field, value) => {
        setResponses(prev => ({
            ...prev,
            [practiceId]: { ...(prev[practiceId] || {}), [field]: value },
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        for (const p of practices) {
            if (!responses[p.practice_id]?.action_taken_level) {
                return toast.error(`Please select a rating for: "${p.title}"`);
            }
        }
        setSubmitting(true);
        try {
            const payload = practices.map(p => ({
                practice_id: p.practice_id,
                action_taken_level: responses[p.practice_id]?.action_taken_level || '',
                action_needed_next: responses[p.practice_id]?.action_needed_next || '',
            }));
            await axiosInstance.post('/surveys/instances/' + id + '/submit', { responses: payload });
            toast.success('Survey submitted successfully!');
            navigate('/my-surveys');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to submit survey.');
        } finally {
            setSubmitting(false);
        }
    };

    const typeBadgeColor = (type) => {
        const t = (type || '').toLowerCase();
        if (t === 'weekly') return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800';
        if (t === 'monthly') return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border border-purple-200 dark:border-purple-800';
        if (t === 'quarterly') return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border border-orange-200 dark:border-orange-800';
        return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700';
    };

    if (loading) return (
        <div className="max-w-3xl mx-auto p-4 lg:p-8">
            <div className="h-48 rounded-3xl bg-slate-200 dark:bg-slate-800 animate-pulse mb-8"></div>
            <SkeletonCard />
            <SkeletonCard />
        </div>
    );

    if (!instance) return (
        <div className="p-8 text-center" style={{ color: 'var(--text-secondary)' }}>Survey not found or access denied.</div>
    );

    const isCompleted = !!instance.completed_at;
    const progressCount = Object.keys(responses).filter(k => responses[k]?.action_taken_level).length;

    return (
        <div className="max-w-3xl mx-auto p-4 lg:p-8 pb-24">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-br from-indigo-700 via-blue-700 to-blue-600 rounded-3xl p-8 lg:p-10 text-white mb-8 shadow-xl shadow-blue-900/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                <div className="relative z-10">
                    <span className="inline-block px-3 py-1 bg-white/10 rounded-full text-blue-100 text-[10px] font-black tracking-widest mb-4 border border-white/10 uppercase">
                        {instance.program_title}
                    </span>
                    <h1 className="text-3xl lg:text-4xl font-black mb-2 tracking-tight">{instance.schedule_label}</h1>
                    <div className="flex flex-wrap items-center gap-4 text-sm font-medium mt-4">
                        <span className="flex items-center gap-1.5 opacity-90"><CalendarClock className="w-4 h-4" /> Due: {instance.due_date?.slice(0, 10)}</span>
                        {isCompleted && (
                            <span className="flex items-center gap-1.5 bg-emerald-500/20 text-emerald-100 border border-emerald-400/30 px-3 py-1 rounded-full font-bold">
                                <CheckCircle2 className="w-4 h-4" /> Submitted on {instance.completed_at?.slice(0, 10)}
                            </span>
                        )}
                    </div>
                </div>
            </motion.div>

            {isCompleted ? (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="rounded-3xl border shadow-sm p-12 text-center" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
                    <div className="w-20 h-20 rounded-full bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-10 h-10 text-emerald-500" />
                    </div>
                    <h2 className="text-2xl font-black mb-2" style={{ color: 'var(--text-primary)' }}>Survey Completed</h2>
                    <p className="text-sm font-medium mb-8" style={{ color: 'var(--text-secondary)' }}>This survey has already been submitted. Thank you for your feedback!</p>
                    <button onClick={() => navigate('/my-surveys')} className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-8 py-3.5 rounded-xl font-bold transition-all shadow-sm">
                        ← Return to My Surveys
                    </button>
                </motion.div>
            ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 text-amber-800 dark:text-amber-400 text-sm font-medium flex gap-3 shadow-sm items-start">
                        <AlertTriangle className="w-5 h-5 shrink-0" />
                        <p>Rate your progress on each of the practices below. Your genuine feedback helps identify areas for organizational improvement.</p>
                    </motion.div>

                    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
                        {practices.map((practice, i) => (
                            <motion.div key={practice.practice_id} variants={itemVariants} className="rounded-3xl border shadow-sm p-6 lg:p-8 transition-shadow hover:shadow-md" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>

                                {/* Practice header */}
                                <div className="mb-6">
                                    <div className="flex items-center flex-wrap gap-2 mb-2">
                                        <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800" style={{ color: 'var(--text-tertiary)' }}>#{i + 1}</span>
                                        <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full ${typeBadgeColor(practice.type)}`}>{practice.type || 'practice'}</span>
                                    </div>
                                    <h3 className="text-lg font-bold leading-snug" style={{ color: 'var(--text-primary)' }}>{practice.title}</h3>
                                    {practice.selected_action && (
                                        <p className="text-sm font-medium mt-1.5 p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border" style={{ color: 'var(--text-secondary)', borderColor: 'var(--border-color)' }}>
                                            <span className="font-bold opacity-70 uppercase tracking-wider text-[10px] block mb-0.5">Committed Action:</span>
                                            {practice.selected_action}
                                        </p>
                                    )}
                                </div>

                                {/* Level selector */}
                                <div className="mb-6">
                                    <label className="text-[11px] font-black uppercase tracking-widest block mb-3 flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                                        <TrendingUp className="w-3.5 h-3.5" /> Action Taken Level (Rate your consistency) *
                                    </label>
                                    <div className="flex flex-col sm:flex-row gap-3">
                                        {LEVEL_OPTIONS.map(opt => {
                                            const isSelected = responses[practice.practice_id]?.action_taken_level === opt.value;
                                            return (
                                                <button
                                                    key={opt.value}
                                                    type="button"
                                                    onClick={() => setResponse(practice.practice_id, 'action_taken_level', opt.value)}
                                                    className={`flex-1 py-4 px-3 rounded-2xl flex flex-col items-center justify-center gap-2 border-2 transition-all group ${isSelected ? `border-${opt.theme}-500 bg-${opt.theme}-50 dark:bg-${opt.theme}-900/20 text-${opt.theme}-700 dark:text-${opt.theme}-400 shadow-sm ring-4 ring-${opt.theme}-500/10` : 'border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                                                >
                                                    <span className={`text-2xl font-black ${isSelected ? '' : 'opacity-40 group-hover:opacity-60'} transition-opacity`}>{opt.value}</span>
                                                    <span className="text-[10px] font-bold text-center leading-tight uppercase tracking-wide opacity-80">{opt.label}</span>
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>

                                {/* Action Needed Next */}
                                <div>
                                    <label className="text-[11px] font-black uppercase tracking-widest block mb-3 flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                                        <MessageSquareText className="w-3.5 h-3.5" /> Action Needed Next <span className="text-slate-400 font-normal normal-case">(Optional)</span>
                                    </label>
                                    <textarea
                                        rows={2}
                                        value={responses[practice.practice_id]?.action_needed_next || ''}
                                        onChange={e => setResponse(practice.practice_id, 'action_needed_next', e.target.value)}
                                        placeholder="What is your next concrete step for this practice?"
                                        className="w-full border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all shadow-sm bg-transparent placeholder-slate-400 dark:placeholder-slate-500"
                                        style={{ color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
                                    />
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>

                    {practices.length === 0 && (
                        <div className="rounded-2xl border p-8 text-center" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}>
                            No practices found for this pledge survey.
                        </div>
                    )}

                    {/* Submit bar */}
                    <div className="sticky bottom-6 z-20">
                        <div className="backdrop-blur-xl border rounded-[2rem] shadow-2xl p-4 lg:p-5 flex flex-col sm:flex-row items-center justify-between gap-4" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)', opacity: 0.95 }}>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full border border-blue-100 dark:border-blue-900/50 flex items-center justify-center shrink-0">
                                    <div className="w-10 h-10 rounded-full border-4 border-slate-100 dark:border-slate-800 relative flex items-center justify-center font-bold text-[10px] text-blue-600 dark:text-blue-400">
                                        {/* Simple pure CSS progress ring representation */}
                                        <span className="z-10 bg-white dark:bg-[#0f172a] absolute inset-1 rounded-full flex items-center justify-center border border-slate-50 dark:border-slate-700/50">
                                            {progressCount}/{practices.length}
                                        </span>
                                    </div>
                                </div>
                                <div className="hidden sm:block">
                                    <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Survey Progress</p>
                                    <p className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>{practices.length - progressCount} {practices.length - progressCount === 1 ? 'practice' : 'practices'} remaining to rate</p>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={submitting || practices.length === 0}
                                className="w-full sm:w-auto flex-shrink-0 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold px-8 py-3.5 rounded-2xl shadow-lg shadow-blue-900/25 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
                            >
                                {submitting ? (
                                    <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Submitting…</>
                                ) : (
                                    <>Submit Feedback <Send className="w-4 h-4 ml-1" /></>
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            )}
        </div>
    );
};

export default SurveyFormPage;
