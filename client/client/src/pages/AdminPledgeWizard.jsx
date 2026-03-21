import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import axiosInstance from '../api/axiosInstance';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Target, Calendar, Settings, Plus, X, ChevronRight, Check, Activity, BarChart, ArrowRight } from 'lucide-react';



// ─── Helper: Single Practice Card ───────────────────────────────────────────
const PracticeCard = ({ practice, index, onChange, onRemove }) => {
    const [newAction, setNewAction] = useState('');

    const handleAddAction = () => {
        const trimmed = newAction.trim();
        if (!trimmed) return;
        onChange(index, { ...practice, actions: [...(practice.actions || []), trimmed] });
        setNewAction('');
    };

    const handleRemoveAction = (i) => {
        onChange(index, { ...practice, actions: practice.actions.filter((_, ai) => ai !== i) });
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            layout
            className="rounded-2xl border shadow-sm overflow-hidden bg-white dark:bg-slate-900/50" style={{ borderColor: 'var(--border-color)' }}>
            <div className="flex items-center justify-between p-4 bg-slate-50/50 dark:bg-slate-800/20 border-b" style={{ borderColor: 'var(--border-color)' }}>
                <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>Practice Template {index + 1}</span>
                <button onClick={() => onRemove(index)} className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-xs font-bold transition-colors flex items-center gap-1">
                    <X className="w-3.5 h-3.5" /> Remove
                </button>
            </div>

            <div className="p-5 lg:p-6 space-y-5">
                {/* Title */}
                <div>
                    <label className="block text-[11px] font-black uppercase tracking-widest mb-2" style={{ color: 'var(--text-secondary)' }}>Practice Title *</label>
                    <input
                        required
                        placeholder="e.g. Share Weekly Progress Report"
                        value={practice.title}
                        onChange={e => onChange(index, { ...practice, title: e.target.value })}
                        className="w-full rounded-xl p-3.5 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none border transition-shadow shadow-sm bg-transparent placeholder-slate-400 dark:placeholder-slate-500"
                        style={{ color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
                    />
                </div>

                {/* Actions List */}
                <div>
                    <label className="block text-[11px] font-black uppercase tracking-widest mb-2" style={{ color: 'var(--text-secondary)' }}>Configured Actions</label>
                    <div className="space-y-2 mb-3">
                        <AnimatePresence>
                            {(practice.actions || []).map((action, ai) => (
                                <motion.div
                                    key={ai}
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="flex items-center gap-3 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/50 px-3.5 py-2.5 rounded-xl group overflow-hidden"
                                >
                                    <ChevronRight className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                                    <span className="flex-1 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{action}</span>
                                    <button
                                        onClick={() => handleRemoveAction(ai)}
                                        className="text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-900/30"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                        {(practice.actions || []).length === 0 && (
                            <p className="text-xs text-center py-4 rounded-xl border border-dashed font-medium opacity-60" style={{ color: 'var(--text-secondary)', borderColor: 'var(--border-color)' }}>
                                No selectable actions added yet.
                            </p>
                        )}
                    </div>
                    <div className="flex gap-2 relative">
                        <input
                            placeholder="Type a concrete action and press Enter..."
                            value={newAction}
                            onChange={e => setNewAction(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddAction())}
                            className="flex-1 rounded-xl p-3 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none border transition-shadow shadow-sm bg-transparent pr-20 placeholder-slate-400 dark:placeholder-slate-500"
                            style={{ color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
                        />
                        <button
                            type="button"
                            onClick={handleAddAction}
                            disabled={!newAction.trim()}
                            className="absolute right-1.5 top-1.5 bottom-1.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center gap-1.5"
                        >
                            <Plus className="w-3.5 h-3.5" /> Add
                        </button>
                    </div>
                </div>
            </div>
        </motion.div >
    );
};

// ─── Helper: Step for Practices by Type ────────────────────────────────────
const PracticesStep = ({ type, practices, setPractices }) => {
    const addPractice = () => {
        setPractices([...practices, { type, title: '', actions: [] }]);
    };

    const handleChange = (index, updated) => {
        const copy = [...practices];
        copy[index] = updated;
        setPractices(copy);
    };

    const handleRemove = (index) => {
        setPractices(practices.filter((_, i) => i !== index));
    };

    const typeInfo = {
        weekly: { label: 'Weekly', icon: <Activity className="w-6 h-6" />, color: 'blue', desc: 'Recurring practices that happen every week.' },
        monthly: { label: 'Monthly', icon: <Calendar className="w-6 h-6" />, color: 'purple', desc: 'Milestone practices reviewed once a month.' },
        quarterly: { label: 'Quarterly', icon: <BarChart className="w-6 h-6" />, color: 'amber', desc: 'Strategic reviews and reflections every quarter.' },
    }[type];

    return (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className={`w-12 h-12 rounded-xl bg-${typeInfo.color}-100 dark:bg-${typeInfo.color}-900/30 text-${typeInfo.color}-600 dark:text-${typeInfo.color}-400 flex items-center justify-center shadow-sm`}>
                        {typeInfo.icon}
                    </div>
                    <div>
                        <h2 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>{typeInfo.label} Configuration</h2>
                        <p className="text-sm font-medium mt-0.5" style={{ color: 'var(--text-secondary)' }}>{typeInfo.desc}</p>
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                {practices.map((p, i) => (
                    <PracticeCard key={i} practice={p} index={i} onChange={handleChange} onRemove={handleRemove} />
                ))}
            </div>

            <button
                onClick={addPractice}
                className="w-full py-4 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-2 group transition-all"
                style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
            >
                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    <Plus className="w-5 h-5" />
                </div>
                <span className="font-bold text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400">Add {typeInfo.label} Practice Definition</span>
            </button>
        </motion.div>
    );
};

// ─── Main Wizard Component ──────────────────────────────────────────────────
const AdminPledgeWizard = () => {
    const navigate = useNavigate();

    // Step management
    const [currentStep, setCurrentStep] = useState(1);
    const totalSteps = 4;

    // Companies list for selector
    const [companies, setCompanies] = useState([]);

    // Step 1: Program details
    const [program, setProgram] = useState({
        title: '',
        description: '',
        start_date: '',
        end_date: '',
        max_practices: 3,
        max_behaviours: 5,
        company_id: '',
    });

    // Steps 2, 3, 4: Practices by type
    const [weeklyPractices, setWeeklyPractices] = useState([]);
    const [monthlyPractices, setMonthlyPractices] = useState([]);
    const [quarterlyPractices, setQuarterlyPractices] = useState([]);

    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        axiosInstance.get('/admin/company-admins')
            .then(res => setCompanies(res.data.companyAdmins || []))
            .catch(() => toast.error('Failed to load companies'));
    }, []);

    const steps = [
        { number: 1, label: 'Core Details', icon: <Target className="w-4 h-4" /> },
        { number: 2, label: 'Weekly', icon: <Activity className="w-4 h-4" /> },
        { number: 3, label: 'Monthly', icon: <Calendar className="w-4 h-4" /> },
        { number: 4, label: 'Quarterly', icon: <BarChart className="w-4 h-4" /> },
    ];

    const canNext = () => {
        if (currentStep === 1) {
            return program.title.trim() !== '' && program.company_id !== '';
        }
        return true;
    };

    const handleNext = () => {
        if (!canNext()) {
            if (!program.title.trim()) toast.error('Please specify a program title before continuing.');
            else toast.error('Please select a company before continuing.');
            return;
        }
        setCurrentStep(s => Math.min(s + 1, totalSteps));
    };

    const handleBack = () => setCurrentStep(s => Math.max(s - 1, 1));

    const handleSubmit = async () => {
        if (!program.title.trim()) {
            toast.error('Program title is required.');
            return;
        }
        if (!program.company_id) {
            toast.error('Please select a company.');
            return;
        }

        setSubmitting(true);
        const allPractices = [
            ...weeklyPractices,
            ...monthlyPractices,
            ...quarterlyPractices
        ];

        try {
            const res = await axiosInstance.post('/admin/create-program-with-practices', {
                ...program,
                max_practices: parseInt(program.max_practices) || 3,
                max_behaviours: parseInt(program.max_behaviours) || 5,
                practices: allPractices
            });

            toast.success(res.data.message || 'Program structure deployed successfully!');
            navigate('/admin/programs');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Deployment failed. Please verify your inputs.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="p-4 lg:p-8 max-w-4xl mx-auto pb-24">
            {/* Page Header */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                <button onClick={() => navigate('/admin/programs')} className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 mb-4 flex items-center gap-1.5 transition-colors">
                    <ArrowLeft className="w-3.5 h-3.5" /> Return to Programs
                </button>
                <div className="flex items-center gap-3 mb-2">
                    <span className="inline-block px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[10px] font-black tracking-widest rounded-full uppercase border border-amber-200 dark:border-amber-800">
                        Guided Builder
                    </span>
                </div>
                <h1 className="text-3xl lg:text-4xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>Pledge Matrix Creator</h1>
                <p className="mt-2 text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Construct a complete program and define its permissible practice catalogue dynamically.</p>
            </motion.div>

            {/* Visual Step Indicator */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-10 relative px-2">
                <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-200 dark:bg-slate-800 -translate-y-1/2 rounded-full z-0 pointer-events-none" />
                <div className="absolute top-1/2 left-0 h-1 bg-blue-600 dark:bg-blue-500 -translate-y-1/2 rounded-full z-0 transition-all duration-500 ease-out" style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }} />

                <div className="relative z-10 flex justify-between">
                    {steps.map((step) => {
                        const isPast = currentStep > step.number;
                        const isCurrent = currentStep === step.number;

                        return (
                            <div key={step.number} className="flex flex-col items-center gap-2">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm border-2 transition-all duration-300 ${isCurrent ? 'bg-blue-600 border-blue-600 text-white shadow-blue-900/30 scale-110' :
                                    isPast ? 'bg-emerald-500 border-emerald-500 text-white scale-100' :
                                        'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-400 scale-100'
                                    }`}>
                                    {isPast ? <Check className="w-5 h-5" strokeWidth={3} /> : step.icon}
                                </div>
                                <span className={`text-[10px] font-black uppercase tracking-widest absolute -bottom-6 whitespace-nowrap transition-colors ${isCurrent ? 'text-blue-600 dark:text-blue-400' :
                                    isPast ? 'text-slate-700 dark:text-slate-300' :
                                        'text-slate-400 dark:text-slate-600'
                                    }`}>
                                    {step.label}
                                </span>
                            </div>
                        )
                    })}
                </div>
            </motion.div>

            {/* Step Panels */}
            <div className="bg-white dark:bg-slate-900/60 rounded-3xl border shadow-sm p-6 lg:p-10 min-h-[500px] mb-8 relative overflow-hidden" style={{ borderColor: 'var(--border-color)' }}>
                <AnimatePresence mode="wait">
                    {/* ── STEP 1: Program Details ── */}
                    {currentStep === 1 && (
                        <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                            <div className="mb-8">
                                <h2 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>Program Configuration</h2>
                                <p className="text-sm font-medium mt-1" style={{ color: 'var(--text-secondary)' }}>Establish the core metadata and parameters for this initiative.</p>
                            </div>

                            <div className="space-y-5">
                                {/* Select Company — Required */}
                                <div>
                                    <label className="block text-[11px] font-black uppercase tracking-widest mb-2" style={{ color: 'var(--text-secondary)' }}>Select Company *</label>
                                    <select
                                        required
                                        className="w-full border rounded-xl p-4 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-shadow shadow-sm"
                                        style={{ color: 'var(--text-primary)', borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-surface)' }}
                                        value={program.company_id}
                                        onChange={e => setProgram({ ...program, company_id: e.target.value })}
                                    >
                                        <option value="">— Select a company —</option>
                                        {companies.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-black uppercase tracking-widest mb-2" style={{ color: 'var(--text-secondary)' }}>Initiative Title *</label>
                                    <input
                                        required
                                        autoFocus
                                        placeholder="e.g. FY25 Culture Amplification"
                                        value={program.title}
                                        onChange={e => setProgram({ ...program, title: e.target.value })}
                                        className="w-full border rounded-xl p-4 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-shadow bg-transparent placeholder-slate-400 shadow-sm"
                                        style={{ color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-black uppercase tracking-widest mb-2" style={{ color: 'var(--text-secondary)' }}>Strategic Objective (Description)</label>
                                    <textarea
                                        rows={4}
                                        placeholder="Define the scope and intended outcomes of this program..."
                                        value={program.description}
                                        onChange={e => setProgram({ ...program, description: e.target.value })}
                                        className="w-full border rounded-xl p-4 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none resize-none leading-relaxed transition-shadow bg-transparent placeholder-slate-400 shadow-sm"
                                        style={{ color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-[11px] font-black uppercase tracking-widest mb-2" style={{ color: 'var(--text-secondary)' }}>Commencement Date</label>
                                        <input
                                            type="date"
                                            value={program.start_date}
                                            onChange={e => setProgram({ ...program, start_date: e.target.value })}
                                            className="w-full border rounded-xl p-4 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-shadow bg-transparent shadow-sm"
                                            style={{ color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-black uppercase tracking-widest mb-2" style={{ color: 'var(--text-secondary)' }}>Conclusion Date</label>
                                        <input
                                            type="date"
                                            value={program.end_date}
                                            onChange={e => setProgram({ ...program, end_date: e.target.value })}
                                            className="w-full border rounded-xl p-4 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-shadow bg-transparent shadow-sm"
                                            style={{ color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
                                        />
                                    </div>
                                </div>

                            </div>
                        </motion.div>
                    )}

                    {/* ── STEP 2: Weekly Practices ── */}
                    {currentStep === 2 && (
                        <PracticesStep key="step2" type="weekly" practices={weeklyPractices} setPractices={setWeeklyPractices} />
                    )}

                    {/* ── STEP 3: Monthly Practices ── */}
                    {currentStep === 3 && (
                        <PracticesStep key="step3" type="monthly" practices={monthlyPractices} setPractices={setMonthlyPractices} />
                    )}

                    {/* ── STEP 4: Quarterly Practices ── */}
                    {currentStep === 4 && (
                        <PracticesStep key="step4" type="quarterly" practices={quarterlyPractices} setPractices={setQuarterlyPractices} />
                    )}
                </AnimatePresence>
            </div>

            {/* Float Nav */}
            <div className="sticky bottom-6 z-20">
                <div className="backdrop-blur-xl border rounded-[2rem] shadow-2xl p-4 lg:p-5 flex items-center justify-between" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)', opacity: 0.95 }}>
                    <button
                        onClick={handleBack}
                        disabled={currentStep === 1}
                        className="px-6 py-3.5 text-sm font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" /> Prev Step
                    </button>

                    {currentStep < totalSteps ? (
                        <button
                            onClick={handleNext}
                            className="px-8 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl text-sm font-bold shadow-lg shadow-blue-900/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                        >
                            Next Step <ArrowRight className="w-4 h-4" />
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="px-8 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-60 disabled:transform-none text-white rounded-2xl text-sm font-bold shadow-lg shadow-emerald-900/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                        >
                            {submitting ? (
                                <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Compiling Matrix...</>
                            ) : (
                                <><Check className="w-4 h-4" strokeWidth={3} /> Finalize Program Setup</>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminPledgeWizard;
