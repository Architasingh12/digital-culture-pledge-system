import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import axiosInstance from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import { Target, Star, Calendar, Clock, BookOpen, Repeat, TrendingUp, CheckCircle, Edit3, Type, ArrowRight, Save, Trash2, Plus, PenLine, CalendarCheck, User, Briefcase } from 'lucide-react';

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

    // Section A – Digital North Star
    const [sectionA, setSectionA] = useState({
        problem_statement: '',
        success_metric: '',   // "Key Success Metric (baseline to target)"
        timeline_quarter: '', // Quarter e.g. Q3
        timeline_year: '',    // Year e.g. 2026
    });

    // Section B – Digital Culture Practices
    const [practiceSelections, setPracticeSelections] = useState({});

    // Section C – My Own Digital Habit
    const [sectionC, setSectionC] = useState({
        personal_habit: '',
        habit_frequency: 'weekly',
        measure_success: '',
    });

    // Section D – Key Digital Behaviours (max 5 rows)
    const [behaviours, setBehaviours] = useState([
        { behaviour_text: '', type: 'start', why_it_matters: '', first_action_date: '' }
    ]);

    // Section E – Review and Sign-off
    const today = new Date().toISOString().slice(0, 10);
    const [sectionE, setSectionE] = useState({
        review_date_1: '',
        review_date_2: '',
        review_date_3: '',
        signature_name: user?.name || '',
        signoff_designation: user?.designation || '',
        digital_signature: '',
        submission_date: today,
    });

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

    // Populate name from user when loaded
    useEffect(() => {
        if (user) {
            setSectionE(prev => ({
                ...prev,
                signature_name: prev.signature_name || user.name || '',
                signoff_designation: prev.signoff_designation || user.designation || '',
            }));
        }
    }, [user]);

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

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Section A validation
        if (!sectionA.problem_statement.trim()) return toast.error('Please fill in your Problem Statement (Section A)');
        if (!sectionA.success_metric.trim()) return toast.error('Please fill in your Key Success Metric (Section A)');
        if (!sectionA.timeline_quarter.trim() || !sectionA.timeline_year.trim()) return toast.error('Please fill in your Timeline Quarter and Year (Section A)');

        // Section C validation
        if (!sectionC.personal_habit.trim()) return toast.error('Please fill in your Personal Habit (Section C)');

        // Section D validation
        const filledBehaviours = behaviours.filter(b => b.behaviour_text.trim());
        if (filledBehaviours.length === 0) return toast.error('Please add at least one Behaviour (Section D)');

        // Section E validation
        if (!sectionE.signature_name.trim()) return toast.error('Please enter your Name (Section E)');
        if (!sectionE.digital_signature.trim()) return toast.error('Please enter your Digital Signature (Section E)');

        const timeline = `${sectionA.timeline_quarter} ${sectionA.timeline_year}`.trim();
        const reviewDates = [sectionE.review_date_1, sectionE.review_date_2, sectionE.review_date_3]
            .filter(Boolean).join(',');

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
                north_star: sectionA.success_metric, // reusing north_star field for success metric
                success_metric: sectionA.success_metric,
                timeline,
                personal_habit: sectionC.personal_habit,
                habit_frequency: sectionC.habit_frequency,
                measure_success: sectionC.measure_success,
                pledge_practices,
                behaviours: filledBehaviours,
                // Section E
                review_dates: reviewDates || null,
                signature_name: sectionE.signature_name,
                signoff_designation: sectionE.signoff_designation,
                digital_signature: sectionE.digital_signature,
                submission_date: sectionE.submission_date || today,
            };

            const resPledge = await axiosInstance.post('/pledges', payload);
            toast.success('Pledge submitted! Generating certificate...');

            const pledgeId = resPledge.data.pledge.id;
            try {
                const pdfRes = await axiosInstance.get(`/pledges/${pledgeId}/certificate`, { responseType: 'blob' });
                const url = window.URL.createObjectURL(new Blob([pdfRes.data], { type: 'application/pdf' }));
                const link = document.createElement('a');
                link.href = url;

                let filename = `pledge-certificate-${user?.name?.replace(/\s+/g, '-') || 'participant'}.pdf`;
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

                {/* ── SECTION A: Digital North Star ─────────────────────────── */}
                <motion.div variants={itemVariants} className="rounded-3xl border shadow-sm p-6 lg:p-8" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
                    {sectionHeader('A. Digital North Star', <Star className="w-6 h-6" />, 'blue')}
                    <div className="space-y-6">
                        {/* Problem Statement */}
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

                        {/* Key Success Metric */}
                        <div>
                            <label className={labelCls} style={{ color: 'var(--text-secondary)' }}><TrendingUp className="w-3.5 h-3.5" /> Key Success Metric (Baseline → Target) *</label>
                            <input
                                required
                                type="text"
                                placeholder="e.g. Digital adoption score from 45% to 80%"
                                value={sectionA.success_metric}
                                onChange={e => setSectionA(p => ({ ...p, success_metric: e.target.value }))}
                                className={inputCls}
                                style={{ color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
                            />
                        </div>

                        {/* Timeline to Impact */}
                        <div>
                            <label className={labelCls} style={{ color: 'var(--text-secondary)' }}><Clock className="w-3.5 h-3.5" /> Timeline to Impact *</label>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <select
                                        value={sectionA.timeline_quarter}
                                        onChange={e => setSectionA(p => ({ ...p, timeline_quarter: e.target.value }))}
                                        className={`${inputCls} bg-white dark:bg-[#0f172a]`}
                                        style={{ color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
                                    >
                                        <option value="">Quarter…</option>
                                        <option value="Q1">Q1</option>
                                        <option value="Q2">Q2</option>
                                        <option value="Q3">Q3</option>
                                        <option value="Q4">Q4</option>
                                    </select>
                                </div>
                                <div>
                                    <input
                                        type="number"
                                        min="2024"
                                        max="2030"
                                        placeholder="Year e.g. 2026"
                                        value={sectionA.timeline_year}
                                        onChange={e => setSectionA(p => ({ ...p, timeline_year: e.target.value }))}
                                        className={inputCls}
                                        style={{ color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* ── SECTION B: Digital Culture Practices ─────────────────── */}
                <motion.div variants={itemVariants} className="rounded-3xl border shadow-sm p-6 lg:p-8" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
                    {sectionHeader('B. Digital Culture Practices', <Calendar className="w-6 h-6" />, 'emerald')}
                    <p className="text-sm mb-6 font-medium" style={{ color: 'var(--text-tertiary)' }}>
                        Select practices you commit to for each frequency. For each selected practice, choose one action commitment.
                    </p>

                    {practices.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 rounded-2xl border border-dashed" style={{ borderColor: 'var(--border-color)' }}>
                            <Calendar className="w-10 h-10 mb-3 opacity-30" style={{ color: 'var(--text-tertiary)' }} />
                            <p className="text-sm font-semibold" style={{ color: 'var(--text-tertiary)' }}>No practices configured for this program yet.</p>
                            <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>An admin can add practices from the Admin panel.</p>
                        </div>
                    ) : (<>

                        {/* Weekly */}
                        {weeklyPractices.length > 0 && (
                            <div className="mb-8">
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-emerald-200 dark:border-emerald-800">
                                        <Calendar className="w-3 h-3" /> Weekly Practices
                                    </span>
                                </div>
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
                            </div>
                        )}

                        {/* Monthly */}
                        {monthlyPractices.length > 0 && (
                            <div className="mb-8">
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-indigo-200 dark:border-indigo-800">
                                        <Calendar className="w-3 h-3" /> Monthly Practices
                                    </span>
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${monthlyPractices.filter(p => p.id in practiceSelections).length >= 2 ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800' : 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800'}`}>
                                        {monthlyPractices.filter(p => p.id in practiceSelections).length} / {monthlyPractices.length} (min 2)
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
                            </div>
                        )}

                        {/* Quarterly */}
                        {quarterlyPractices.length > 0 && (
                            <div>
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-orange-200 dark:border-orange-800">
                                        <Calendar className="w-3 h-3" /> Quarterly Practices
                                    </span>
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${quarterlyPractices.filter(p => p.id in practiceSelections).length >= 2 ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800' : 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800'}`}>
                                        {quarterlyPractices.filter(p => p.id in practiceSelections).length} / {quarterlyPractices.length} (min 2)
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
                            </div>
                        )}
                    </>)}
                </motion.div>

                {/* ── SECTION C: My Own Digital Habit ──────────────────────── */}
                <motion.div variants={itemVariants} className="rounded-3xl border shadow-sm p-6 lg:p-8" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
                    {sectionHeader('C. My Own Digital Habit', <Target className="w-6 h-6" />, 'violet')}
                    <div className="space-y-6">
                        <div>
                            <label className={labelCls} style={{ color: 'var(--text-secondary)' }}><Edit3 className="w-3.5 h-3.5" /> Habit Description *</label>
                            <textarea
                                required
                                rows={3}
                                placeholder="Describe the specific digital habit you will develop…"
                                value={sectionC.personal_habit}
                                onChange={e => setSectionC(p => ({ ...p, personal_habit: e.target.value }))}
                                className={inputCls}
                                style={{ color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className={labelCls} style={{ color: 'var(--text-secondary)' }}><Repeat className="w-3.5 h-3.5" /> Frequency</label>
                                <select
                                    value={sectionC.habit_frequency}
                                    onChange={e => setSectionC(p => ({ ...p, habit_frequency: e.target.value }))}
                                    className={`${inputCls} bg-white dark:bg-[#0f172a]`}
                                    style={{ color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
                                >
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
                                    value={sectionC.measure_success}
                                    onChange={e => setSectionC(p => ({ ...p, measure_success: e.target.value }))}
                                    className={inputCls}
                                    style={{ color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
                                />
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* ── SECTION D: Key Digital Behaviours ────────────────────── */}
                <motion.div variants={itemVariants} className="rounded-3xl border shadow-sm p-6 lg:p-8" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
                    {sectionHeader('D. Key Digital Behaviours', <Repeat className="w-6 h-6" />, 'rose')}
                    <p className="text-sm font-medium mb-6" style={{ color: 'var(--text-tertiary)' }}>Add behaviours you will start, reduce, or stop. Maximum 5 rows.</p>

                    <div className="hidden md:grid grid-cols-[2fr_1fr_2fr_1fr_auto] gap-4 mb-3 px-3">
                        {['Behaviour', 'Start / Reduce / Stop', 'Why it matters', 'First Action by Date', ''].map(h => (
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
                                        <label className="md:hidden block text-[10px] font-bold uppercase mb-1.5" style={{ color: 'var(--text-secondary)' }}>First action by date</label>
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

                {/* ── SECTION E: Review and Sign-off ───────────────────────── */}
                <motion.div variants={itemVariants} className="rounded-3xl border shadow-sm p-6 lg:p-8" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
                    {sectionHeader('E. Review and Sign-off', <PenLine className="w-6 h-6" />, 'amber')}
                    <div className="space-y-6">

                        {/* Self-review check-in dates */}
                        <div>
                            <label className={labelCls} style={{ color: 'var(--text-secondary)' }}><CalendarCheck className="w-3.5 h-3.5" /> Self-Review Check-in Dates (up to 3)</label>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {['review_date_1', 'review_date_2', 'review_date_3'].map((key, i) => (
                                    <div key={key}>
                                        <span className="block text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-tertiary)' }}>Check-in {i + 1}</span>
                                        <input
                                            type="date"
                                            value={sectionE[key]}
                                            onChange={e => setSectionE(p => ({ ...p, [key]: e.target.value }))}
                                            className={`${inputCls} bg-white dark:bg-[#0f172a]`}
                                            style={{ color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Name + Designation */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className={labelCls} style={{ color: 'var(--text-secondary)' }}><User className="w-3.5 h-3.5" /> Name *</label>
                                <input
                                    required
                                    type="text"
                                    placeholder="Your full name"
                                    value={sectionE.signature_name}
                                    onChange={e => setSectionE(p => ({ ...p, signature_name: e.target.value }))}
                                    className={inputCls}
                                    style={{ color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
                                />
                            </div>
                            <div>
                                <label className={labelCls} style={{ color: 'var(--text-secondary)' }}><Briefcase className="w-3.5 h-3.5" /> Designation</label>
                                <input
                                    type="text"
                                    placeholder="Your job title / role"
                                    value={sectionE.signoff_designation}
                                    onChange={e => setSectionE(p => ({ ...p, signoff_designation: e.target.value }))}
                                    className={inputCls}
                                    style={{ color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
                                />
                            </div>
                        </div>

                        {/* Digital Signature */}
                        <div>
                            <label className={labelCls} style={{ color: 'var(--text-secondary)' }}><PenLine className="w-3.5 h-3.5" /> Digital Signature *</label>
                            <p className="text-xs mb-2 font-medium" style={{ color: 'var(--text-tertiary)' }}>Type your full name below as your digital signature affirming your commitment to this pledge.</p>
                            <input
                                required
                                type="text"
                                placeholder="Type your full name to sign…"
                                value={sectionE.digital_signature}
                                onChange={e => setSectionE(p => ({ ...p, digital_signature: e.target.value }))}
                                className={`${inputCls} font-semibold italic`}
                                style={{ color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
                            />
                        </div>

                        {/* Submission Date */}
                        <div className="md:w-1/2">
                            <label className={labelCls} style={{ color: 'var(--text-secondary)' }}><Calendar className="w-3.5 h-3.5" /> Submission Date</label>
                            <input
                                type="date"
                                value={sectionE.submission_date}
                                onChange={e => setSectionE(p => ({ ...p, submission_date: e.target.value }))}
                                className={`${inputCls} bg-white dark:bg-[#0f172a]`}
                                style={{ color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
                            />
                        </div>
                    </div>
                </motion.div>

                {/* ── Submit Bar ───────────────────────────────────────────── */}
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

// ─── Practice Card Sub-component ─────────────────────────────────────────────
const PracticeCard = ({ practice, checked, selectedAction, onToggle, onSelectAction, colorTheme }) => {
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
