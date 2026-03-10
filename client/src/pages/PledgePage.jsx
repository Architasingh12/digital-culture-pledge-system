import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import axiosInstance from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import { Target, Star, Calendar, Clock, BookOpen, Repeat, TrendingUp, CheckCircle, Edit3, Type, ArrowRight, Save, Trash2, Plus } from 'lucide-react';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0 }
};

// ─── Main Component ─────────────────────────────────────────────────────────────
const PledgePage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [loadingInitial, setLoadingInitial] = useState(true);
    const [programs, setPrograms] = useState([]);
    const [selectedProgramId, setSelectedProgramId] = useState('');
    const [practices, setPractices] = useState([]);
    const [submitting, setSubmitting] = useState(false);

    // Section A
    const [sectionA, setSectionA] = useState({ problem_statement: '', north_star: '', success_metric: '', timeline: '' });

    // Section B/C/D — track checked practices and their selected action
    const [practiceSelections, setPracticeSelections] = useState({});

    // Section E
    const [sectionE, setSectionE] = useState({ personal_habit: '', habit_frequency: 'weekly', measure_success: '' });

    // Section F — behaviours (max 5)
    const [behaviours, setBehaviours] = useState([
        { behaviour_text: '', type: 'start', why_it_matters: '', first_action_date: '' }
    ]);

    // Load programs
    useEffect(() => {
        axiosInstance.get('/programs')
            .then(res => {
                const progs = res.data.programs || [];
                setPrograms(progs);
                if (progs.length > 0) setSelectedProgramId(String(progs[0].id));
            })
            .catch(() => toast.error('Failed to load programs'))
            .finally(() => setLoadingInitial(false));
    }, []);

    // Load practices when program changes
    useEffect(() => {
        if (!selectedProgramId) return;
        axiosInstance.get(`/practices/program/${selectedProgramId}`)
            .then(res => {
                setPractices(res.data.practices || []);
                setPracticeSelections({});
            })
            .catch(() => toast.error('Failed to load practices'));
    }, [selectedProgramId]);

    const weeklyPractices = practices.filter(p => p.type === 'weekly');
    const monthlyPractices = practices.filter(p => p.type === 'monthly');
    const quarterlyPractices = practices.filter(p => p.type === 'quarterly');

    const togglePractice = (id) => {
        setPracticeSelections(prev => {
            const updated = { ...prev };
            if (id in updated) delete updated[id];
            else updated[id] = '';
            return updated;
        });
    };

    const selectAction = (id, action) => {
        setPracticeSelections(prev => ({ ...prev, [id]: action }));
    };

    const addBehaviour = () => {
        if (behaviours.length >= 5) return toast.error('Maximum 5 behaviours allowed');
        setBehaviours(prev => [...prev, { behaviour_text: '', type: 'start', why_it_matters: '', first_action_date: '' }]);
    };

    const removeBehaviour = (idx) => {
        setBehaviours(prev => prev.filter((_, i) => i !== idx));
    };

    const updateBehaviour = (idx, field, value) => {
        setBehaviours(prev => prev.map((b, i) => i === idx ? { ...b, [field]: value } : b));
    };

    const selectedMonthlyCount = monthlyPractices.filter(p => p.id in practiceSelections).length;
    const selectedQuarterlyCount = quarterlyPractices.filter(p => p.id in practiceSelections).length;

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!sectionA.problem_statement.trim()) return toast.error('Please fill in your Problem Statement (Section A)');
        if (!sectionA.success_metric.trim()) return toast.error('Please fill in your Success Metric (Section A)');
        if (!sectionA.timeline.trim()) return toast.error('Please fill in your Timeline (Section A)');
        if (monthlyPractices.length > 0 && selectedMonthlyCount < 2 && monthlyPractices.length >= 2)
            return toast.error('Please choose at least 2 Monthly Practices (Section C)');
        if (quarterlyPractices.length > 0 && selectedQuarterlyCount < 2 && quarterlyPractices.length >= 2)
            return toast.error('Please choose at least 2 Quarterly Practices (Section D)');
        if (!sectionE.personal_habit.trim()) return toast.error('Please fill in your Personal Habit (Section E)');

        const filledBehaviours = behaviours.filter(b => b.behaviour_text.trim());
        if (filledBehaviours.length === 0) return toast.error('Please add at least one Behaviour (Section F)');

        const pledge_practices = Object.entries(practiceSelections)
            .filter(([, action]) => action && action.trim())
            .map(([id, action]) => {
                const practice = practices.find(p => String(p.id) === String(id));
                return {
                    practice_id: parseInt(id),
                    selected_action: action,
                    practice_title: practice?.title || '',
                };
            });

        setSubmitting(true);
        try {
            const payload = {
                program_id: selectedProgramId,
                problem_statement: sectionA.problem_statement,
                north_star: sectionA.north_star,
                success_metric: sectionA.success_metric,
                timeline: sectionA.timeline,
                personal_habit: sectionE.personal_habit,
                habit_frequency: sectionE.habit_frequency,
                measure_success: sectionE.measure_success,
                pledge_practices,
                behaviours: filledBehaviours,
            };

            const resPledge = await axiosInstance.post('/pledges', payload);
            toast.success('Pledge submitted! Generating certificate...');

            const pledgeId = resPledge.data.pledge.id;
            try {
                const pdfRes = await axiosInstance.get(`/pledges/${pledgeId}/certificate`, { responseType: 'blob' });
                const url = window.URL.createObjectURL(new Blob([pdfRes.data], { type: 'application/pdf' }));
                const link = document.createElement('a');
                link.href = url;

                let filename = `pledge-certificate-${user?.name?.replace(/\\s+/g, '-') || 'participant'}.pdf`;
                const contentDisposition = pdfRes.headers['content-disposition'];
                if (contentDisposition && contentDisposition.includes('filename=')) {
                    filename = contentDisposition.split('filename=')[1].replace(/"/g, '');
                }

                link.setAttribute('download', filename);
                document.body.appendChild(link);
                link.click();
                link.parentNode.removeChild(link);
                window.URL.revokeObjectURL(url);
            } catch (pdfErr) {
                console.error('Failed to download PDF:', pdfErr);
                toast.error('Saved, but failed to auto-download certificate. View it in My Pledges.');
            }

            navigate('/pledge-success');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to submit pledge. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loadingInitial) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (programs.length === 0) {
        return (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-2xl mx-auto mt-16 p-12 rounded-[2rem] border text-center shadow-lg" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
                <Target className="w-16 h-16 mx-auto mb-6 text-blue-500" />
                <h2 className="text-2xl font-black mb-2" style={{ color: 'var(--text-primary)' }}>No Programs Available</h2>
                <p style={{ color: 'var(--text-secondary)' }}>An admin must create a Program before you can sign a pledge.</p>
            </motion.div>
        );
    }

    const sectionHeader = (label, icon, colorClass) => (
        <div className={`flex items-center gap-3 mb-6 pb-4 border-b-2`} style={{ borderBottomColor: `var(--color-${colorClass}-500, #3b82f6)` }}>
            <div className={`p-2 rounded-xl bg-${colorClass}-100 dark:bg-${colorClass}-900/30 text-${colorClass}-600 dark:text-${colorClass}-400`}>
                {icon}
            </div>
            <h2 className="text-xl font-black" style={{ color: 'var(--text-primary)' }}>{label}</h2>
        </div>
    );

    const inputCls = "w-full border rounded-xl p-3.5 text-sm outline-none transition-all focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-transparent placeholder-slate-400 dark:placeholder-slate-500";
    const labelCls = "block text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5";

    return (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="p-4 lg:p-8 max-w-4xl mx-auto pb-24 space-y-8">
            {/* Page Header */}
            <motion.div variants={itemVariants} className="mb-2">
                <span className="inline-block px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-[10px] font-black tracking-widest mb-3 rounded-full uppercase border border-blue-200 dark:border-blue-800">
                    Commitment Form
                </span>
                <h1 className="text-3xl lg:text-4xl font-black" style={{ color: 'var(--text-primary)' }}>Sign Your Digital Pledge</h1>
                <p className="mt-2 text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Take structured steps towards digital culture excellence within your organization.</p>
            </motion.div>

            {/* Program Selector */}
            <motion.div variants={itemVariants} className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/50 rounded-2xl p-6">
                <label className="block text-xs font-black text-blue-700 dark:text-blue-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <BookOpen className="w-4 h-4" /> Select Program *
                </label>
                <select
                    value={selectedProgramId}
                    onChange={e => setSelectedProgramId(e.target.value)}
                    className="w-full border border-blue-200 dark:border-blue-800/50 rounded-xl p-3.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-white dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 shadow-sm"
                >
                    {programs.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                </select>
            </motion.div>

            <form onSubmit={handleSubmit} className="space-y-8">

                {/* ── SECTION A: Digital North Star ───────────────────────────── */}
                <motion.div variants={itemVariants} className="rounded-3xl border shadow-sm p-6 lg:p-8" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
                    {sectionHeader('A. Digital North Star', <Star className="w-6 h-6" />, 'blue')}
                    <div className="space-y-6">
                        <div>
                            <label className={labelCls} style={{ color: 'var(--text-secondary)' }}><Type className="w-3.5 h-3.5" /> Problem Statement *</label>
                            <textarea
                                required
                                rows={3}
                                placeholder="What digital culture challenge are you solving?"
                                value={sectionA.problem_statement}
                                onChange={e => setSectionA(p => ({ ...p, problem_statement: e.target.value }))}
                                className={inputCls}
                                style={{ color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
                            />
                        </div>
                        <div>
                            <label className={labelCls} style={{ color: 'var(--text-secondary)' }}><Target className="w-3.5 h-3.5" /> My North Star / Vision</label>
                            <textarea
                                rows={2}
                                placeholder="What ultimate goal do you want to achieve?"
                                value={sectionA.north_star}
                                onChange={e => setSectionA(p => ({ ...p, north_star: e.target.value }))}
                                className={inputCls}
                                style={{ color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className={labelCls} style={{ color: 'var(--text-secondary)' }}><TrendingUp className="w-3.5 h-3.5" /> Success Metric *</label>
                                <input
                                    required
                                    type="text"
                                    placeholder="How will you measure success?"
                                    value={sectionA.success_metric}
                                    onChange={e => setSectionA(p => ({ ...p, success_metric: e.target.value }))}
                                    className={inputCls}
                                    style={{ color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
                                />
                            </div>
                            <div>
                                <label className={labelCls} style={{ color: 'var(--text-secondary)' }}><Clock className="w-3.5 h-3.5" /> Timeline *</label>
                                <input
                                    required
                                    type="text"
                                    placeholder="e.g. Q3 2026 · 3 months"
                                    value={sectionA.timeline}
                                    onChange={e => setSectionA(p => ({ ...p, timeline: e.target.value }))}
                                    className={inputCls}
                                    style={{ color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
                                />
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* ── SECTION B: Weekly Practices ─────────────────────────────── */}
                {weeklyPractices.length > 0 && (
                    <motion.div variants={itemVariants} className="rounded-3xl border shadow-sm p-6 lg:p-8" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
                        {sectionHeader('B. Weekly Practices', <Calendar className="w-6 h-6" />, 'emerald')}
                        <p className="text-sm mb-6 font-medium" style={{ color: 'var(--text-tertiary)' }}>Check the practices you commit to, then select one action for each.</p>
                        <div className="space-y-4">
                            {weeklyPractices.map(pr => (
                                <PracticeCard
                                    key={pr.id}
                                    practice={pr}
                                    checked={pr.id in practiceSelections}
                                    selectedAction={practiceSelections[pr.id] || ''}
                                    onToggle={() => togglePractice(pr.id)}
                                    onSelectAction={action => selectAction(pr.id, action)}
                                    colorTheme="emerald"
                                />
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* ── SECTION C: Monthly Practices ────────────────────────────── */}
                {monthlyPractices.length > 0 && (
                    <motion.div variants={itemVariants} className="rounded-3xl border shadow-sm p-6 lg:p-8" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
                        {sectionHeader('C. Monthly Practices', <Calendar className="w-6 h-6" />, 'indigo')}
                        <div className="flex flex-wrap items-center justify-between mb-6 gap-3">
                            <p className="text-sm font-medium" style={{ color: 'var(--text-tertiary)' }}>Choose at least 2, then select an action for each.</p>
                            <span className={`text-xs font-bold px-3 py-1 rounded-full border ${selectedMonthlyCount >= 2 ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800' : 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800'}`}>
                                {selectedMonthlyCount} / {monthlyPractices.length} selected
                            </span>
                        </div>
                        <div className="space-y-4">
                            {monthlyPractices.map(pr => (
                                <PracticeCard
                                    key={pr.id}
                                    practice={pr}
                                    checked={pr.id in practiceSelections}
                                    selectedAction={practiceSelections[pr.id] || ''}
                                    onToggle={() => togglePractice(pr.id)}
                                    onSelectAction={action => selectAction(pr.id, action)}
                                    colorTheme="indigo"
                                />
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* ── SECTION D: Quarterly Practices ──────────────────────────── */}
                {quarterlyPractices.length > 0 && (
                    <motion.div variants={itemVariants} className="rounded-3xl border shadow-sm p-6 lg:p-8" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
                        {sectionHeader('D. Quarterly Practices', <Calendar className="w-6 h-6" />, 'orange')}
                        <div className="flex flex-wrap items-center justify-between mb-6 gap-3">
                            <p className="text-sm font-medium" style={{ color: 'var(--text-tertiary)' }}>Choose at least 2 strategic quarterly reviews.</p>
                            <span className={`text-xs font-bold px-3 py-1 rounded-full border ${selectedQuarterlyCount >= 2 ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800' : 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800'}`}>
                                {selectedQuarterlyCount} / {quarterlyPractices.length} selected
                            </span>
                        </div>
                        <div className="space-y-4">
                            {quarterlyPractices.map(pr => (
                                <PracticeCard
                                    key={pr.id}
                                    practice={pr}
                                    checked={pr.id in practiceSelections}
                                    selectedAction={practiceSelections[pr.id] || ''}
                                    onToggle={() => togglePractice(pr.id)}
                                    onSelectAction={action => selectAction(pr.id, action)}
                                    colorTheme="orange"
                                />
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* ── SECTION E: Personal Habit ────────────────────────────────── */}
                <motion.div variants={itemVariants} className="rounded-3xl border shadow-sm p-6 lg:p-8" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
                    {sectionHeader('E. Personal Habit', <Target className="w-6 h-6" />, 'violet')}
                    <div className="space-y-6">
                        <div>
                            <label className={labelCls} style={{ color: 'var(--text-secondary)' }}><Edit3 className="w-3.5 h-3.5" /> Habit I Will Build *</label>
                            <textarea
                                required
                                rows={2}
                                placeholder="Describe the specific habit you will develop…"
                                value={sectionE.personal_habit}
                                onChange={e => setSectionE(p => ({ ...p, personal_habit: e.target.value }))}
                                className={inputCls}
                                style={{ color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className={labelCls} style={{ color: 'var(--text-secondary)' }}><Repeat className="w-3.5 h-3.5" /> Frequency</label>
                                <select
                                    value={sectionE.habit_frequency}
                                    onChange={e => setSectionE(p => ({ ...p, habit_frequency: e.target.value }))}
                                    className={`${inputCls} bg-white dark:bg-[#0f172a]`}
                                    style={{ color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
                                >
                                    <option value="daily">Daily</option>
                                    <option value="weekly">Weekly</option>
                                    <option value="monthly">Monthly</option>
                                    <option value="quarterly">Quarterly</option>
                                </select>
                            </div>
                            <div>
                                <label className={labelCls} style={{ color: 'var(--text-secondary)' }}><TrendingUp className="w-3.5 h-3.5" /> How I Will Measure Success</label>
                                <input
                                    type="text"
                                    placeholder="KPI / observable outcome…"
                                    value={sectionE.measure_success}
                                    onChange={e => setSectionE(p => ({ ...p, measure_success: e.target.value }))}
                                    className={inputCls}
                                    style={{ color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
                                />
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* ── SECTION F: Behaviours ────────────────────────────────────── */}
                <motion.div variants={itemVariants} className="rounded-3xl border shadow-sm p-6 lg:p-8" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
                    {sectionHeader('F. Behaviour Commitments', <RefreshIcon className="w-6 h-6" />, 'rose')}
                    <p className="text-sm font-medium mb-6" style={{ color: 'var(--text-tertiary)' }}>Add behaviours you will start, reduce, or stop. Maximum 5 rows.</p>

                    <div className="hidden md:grid grid-cols-[2fr_1fr_2fr_1fr_auto] gap-4 mb-3 px-3">
                        {['Behaviour', 'Type', 'Why it matters', 'First action date', ''].map(h => (
                            <span key={h} className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>{h}</span>
                        ))}
                    </div>

                    <div className="space-y-4">
                        {behaviours.map((b, idx) => (
                            <motion.div key={idx} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className={`border rounded-2xl p-4 transition-all ${b.type === 'start' ? 'border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/40 dark:bg-emerald-900/10' : b.type === 'reduce' ? 'border-amber-200 dark:border-amber-900/50 bg-amber-50/40 dark:bg-amber-900/10' : 'border-rose-200 dark:border-rose-900/50 bg-rose-50/40 dark:bg-rose-900/10'}`}>
                                <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_2fr_1fr_auto] gap-4 items-start">
                                    <div>
                                        <label className="md:hidden block text-[10px] font-bold uppercase mb-1.5" style={{ color: 'var(--text-secondary)' }}>Behaviour</label>
                                        <input
                                            type="text"
                                            placeholder="Describe the behaviour…"
                                            value={b.behaviour_text}
                                            onChange={e => updateBehaviour(idx, 'behaviour_text', e.target.value)}
                                            className={`${inputCls} bg-white dark:bg-[#0f172a] shadow-sm`}
                                            style={{ color: 'var(--text-primary)' }}
                                        />
                                    </div>
                                    <div>
                                        <label className="md:hidden block text-[10px] font-bold uppercase mb-1.5" style={{ color: 'var(--text-secondary)' }}>Type</label>
                                        <select
                                            value={b.type}
                                            onChange={e => updateBehaviour(idx, 'type', e.target.value)}
                                            className={`${inputCls} bg-white dark:bg-[#0f172a] font-semibold shadow-sm`}
                                            style={{ color: 'var(--text-primary)' }}
                                        >
                                            <option value="start">🟢 Start</option>
                                            <option value="reduce">🟡 Reduce</option>
                                            <option value="stop">🔴 Stop</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="md:hidden block text-[10px] font-bold uppercase mb-1.5" style={{ color: 'var(--text-secondary)' }}>Why it matters</label>
                                        <input
                                            type="text"
                                            placeholder="Impact on goals…"
                                            value={b.why_it_matters}
                                            onChange={e => updateBehaviour(idx, 'why_it_matters', e.target.value)}
                                            className={`${inputCls} bg-white dark:bg-[#0f172a] shadow-sm`}
                                            style={{ color: 'var(--text-primary)' }}
                                        />
                                    </div>
                                    <div>
                                        <label className="md:hidden block text-[10px] font-bold uppercase mb-1.5" style={{ color: 'var(--text-secondary)' }}>First action date</label>
                                        <input
                                            type="date"
                                            value={b.first_action_date}
                                            onChange={e => updateBehaviour(idx, 'first_action_date', e.target.value)}
                                            className={`${inputCls} bg-white dark:bg-[#0f172a] shadow-sm`}
                                            style={{ color: 'var(--text-primary)' }}
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeBehaviour(idx)}
                                        disabled={behaviours.length === 1}
                                        className="self-center p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {behaviours.length < 5 && (
                        <button
                            type="button"
                            onClick={addBehaviour}
                            className="mt-6 flex items-center gap-2 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors py-2 px-4 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20"
                        >
                            <Plus className="w-4 h-4" /> Add another behaviour
                        </button>
                    )}
                </motion.div>

                {/* ── Submit ───────────────────────────────────────────────────── */}
                <motion.div variants={itemVariants} className="sticky bottom-6 z-20">
                    <div className="backdrop-blur-xl border rounded-[2rem] shadow-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-6" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)', opacity: 0.95 }}>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                                <Save className="w-5 h-5" />
                            </div>
                            <div className="text-sm font-medium hidden sm:block" style={{ color: 'var(--text-secondary)' }}>
                                A stunning PDF certificate will be generated upon submission.
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full sm:w-auto flex-shrink-0 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold px-8 py-3.5 rounded-2xl shadow-lg shadow-blue-900/25 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
                        >
                            {submitting ? (
                                <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Submitting…</>
                            ) : (
                                <>Submit Pledge <ArrowRight className="w-5 h-5" /></>
                            )}
                        </button>
                    </div>
                </motion.div>

            </form>
        </motion.div>
    );
};

// Component for repeating icon
const RefreshIcon = ({ className }) => <Repeat className={className} />;

// ─── Practice Card Sub-component ─────────────────────────────────────────────
const PracticeCard = ({ practice, checked, selectedAction, onToggle, onSelectAction, colorTheme }) => {
    // Dynamic classes based on theme string without string interpolation for tailwind purging safety?
    // Tailwind v4 uses variable interpolation, but let's be safe.
    const tMap = {
        emerald: { border: 'border-emerald-200 dark:border-emerald-800', bg: 'bg-emerald-50 dark:bg-emerald-900/10', text: 'text-emerald-700 dark:text-emerald-400', badge: 'bg-emerald-100 dark:bg-emerald-900/40', radio: 'accent-emerald-600' },
        indigo: { border: 'border-indigo-200 dark:border-indigo-800', bg: 'bg-indigo-50 dark:bg-indigo-900/10', text: 'text-indigo-700 dark:text-indigo-400', badge: 'bg-indigo-100 dark:bg-indigo-900/40', radio: 'accent-indigo-600' },
        orange: { border: 'border-orange-200 dark:border-orange-800', bg: 'bg-orange-50 dark:bg-orange-900/10', text: 'text-orange-700 dark:text-orange-400', badge: 'bg-orange-100 dark:bg-orange-900/40', radio: 'accent-orange-600' },
    };

    const c = tMap[colorTheme] || tMap.emerald;
    const actions = Array.isArray(practice.actions) ? practice.actions : [];

    return (
        <div className={`border rounded-2xl transition-all ${checked ? `${c.border} ${c.bg}` : 'border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-[#0f172a]'}`}>
            <label className="flex items-center gap-4 p-5 cursor-pointer group">
                <input
                    type="checkbox"
                    checked={checked}
                    onChange={onToggle}
                    className={`w-5 h-5 rounded border-slate-300 dark:border-slate-700 ${c.radio} cursor-pointer transition-transform group-active:scale-90`}
                />
                <div className="flex-1">
                    <span className="font-bold text-sm tracking-wide" style={{ color: 'var(--text-primary)' }}>{practice.title}</span>
                    <span className={`ml-3 text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${c.badge} ${c.text}`}>{practice.type}</span>
                </div>
            </label>

            <motion.div animate={{ height: checked ? 'auto' : 0, opacity: checked ? 1 : 0 }} className="overflow-hidden">
                {checked && actions.length > 0 && (
                    <div className="px-5 pb-5 pl-14">
                        <p className="text-[10px] font-bold uppercase tracking-widest mb-3 flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                            <CheckCircle className="w-3.5 h-3.5" /> Select your committed action:
                        </p>
                        <div className="space-y-3">
                            {actions.map((action, idx) => (
                                <label
                                    key={idx}
                                    className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${selectedAction === action ? `border-transparent shadow-md bg-white dark:bg-slate-800 ring-2 ring-${colorTheme}-500/50` : 'border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 hover:border-slate-300 dark:hover:border-slate-600'}`}
                                >
                                    <input
                                        type="radio"
                                        name={`practice_${practice.id}`}
                                        checked={selectedAction === action}
                                        onChange={() => onSelectAction(action)}
                                        className={`mt-0.5 w-4 h-4 cursor-pointer transition-all ${c.radio}`}
                                    />
                                    <span className="text-sm font-medium leading-snug" style={{ color: 'var(--text-primary)' }}>{action}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                )}
            </motion.div>
        </div>
    );
};

export default PledgePage;
