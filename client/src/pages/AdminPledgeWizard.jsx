import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import axiosInstance from '../api/axiosInstance';

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
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between p-4 bg-slate-50 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Practice {index + 1}</span>
                <button onClick={() => onRemove(index)} className="text-red-400 hover:text-red-600 text-sm font-bold transition-colors">✕ Remove</button>
            </div>

            <div className="p-5 space-y-4">
                {/* Title */}
                <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-1.5">Practice Title *</label>
                    <input
                        required
                        placeholder="e.g. Share Weekly Progress Report"
                        value={practice.title}
                        onChange={e => onChange(index, { ...practice, title: e.target.value })}
                        className="w-full border border-slate-200 bg-slate-50 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>

                {/* Actions List */}
                <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-1.5">Selectable Actions</label>
                    <div className="space-y-2 mb-3">
                        {(practice.actions || []).map((action, ai) => (
                            <div key={ai} className="flex items-center gap-2 bg-blue-50 border border-blue-100 px-3 py-2 rounded-lg group">
                                <span className="text-blue-600 text-xs">▸</span>
                                <span className="flex-1 text-sm text-slate-700 font-medium">{action}</span>
                                <button
                                    onClick={() => handleRemoveAction(ai)}
                                    className="text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 text-xs font-bold ml-auto"
                                >✕</button>
                            </div>
                        ))}
                        {(practice.actions || []).length === 0 && (
                            <p className="text-xs text-slate-400 italic">No actions added yet.</p>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <input
                            placeholder="Type an action and press Add →"
                            value={newAction}
                            onChange={e => setNewAction(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddAction())}
                            className="flex-1 border border-slate-200 bg-slate-50 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                        <button
                            onClick={handleAddAction}
                            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors shadow-sm"
                        >Add</button>
                    </div>
                </div>
            </div>
        </div>
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
        weekly: { label: 'Weekly', icon: '📅', color: 'blue', desc: 'Recurring practices that happen every week.' },
        monthly: { label: 'Monthly', icon: '🗓️', color: 'purple', desc: 'Milestone practices reviewed once a month.' },
        quarterly: { label: 'Quarterly', icon: '📊', color: 'amber', desc: 'Strategic reviews and reflections every quarter.' },
    }[type];

    return (
        <div className="space-y-6">
            <div>
                <div className="flex items-center gap-3 mb-1">
                    <span className="text-2xl">{typeInfo.icon}</span>
                    <h2 className="text-xl font-bold text-slate-800">{typeInfo.label} Practices</h2>
                </div>
                <p className="text-slate-500 text-sm ml-10">{typeInfo.desc}</p>
            </div>

            {practices.map((p, i) => (
                <PracticeCard key={i} practice={p} index={i} onChange={handleChange} onRemove={handleRemove} />
            ))}

            <button
                onClick={addPractice}
                className="w-full py-4 border-2 border-dashed border-slate-300 rounded-2xl text-slate-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all font-semibold text-sm"
            >
                + Add {typeInfo.label} Practice
            </button>
        </div>
    );
};

// ─── Main Wizard Component ──────────────────────────────────────────────────
const AdminPledgeWizard = () => {
    const navigate = useNavigate();

    // Step management
    const [currentStep, setCurrentStep] = useState(1);
    const totalSteps = 4;

    // Step 1: Program details
    const [program, setProgram] = useState({
        title: '',
        description: '',
        start_date: '',
        end_date: '',
        max_practices: 3,
        max_behaviours: 5,
    });

    // Steps 2, 3, 4: Practices by type
    const [weeklyPractices, setWeeklyPractices] = useState([]);
    const [monthlyPractices, setMonthlyPractices] = useState([]);
    const [quarterlyPractices, setQuarterlyPractices] = useState([]);

    const [submitting, setSubmitting] = useState(false);

    const steps = [
        { number: 1, label: 'Program Details' },
        { number: 2, label: 'Weekly' },
        { number: 3, label: 'Monthly' },
        { number: 4, label: 'Quarterly' },
    ];

    const canNext = () => {
        if (currentStep === 1) {
            return program.title.trim() !== '';
        }
        return true; // practices are optional for each step
    };

    const handleNext = () => {
        if (!canNext()) {
            toast.error('Please fill in the program title before continuing.');
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

            if (res.data.success) {
                toast.success(res.data.message || 'Program created successfully!');
                navigate('/admin/programs');
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to save. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="p-4 lg:p-8 max-w-4xl mx-auto animate-in fade-in">
            {/* Page Header */}
            <div className="mb-8">
                <button onClick={() => navigate('/admin/programs')} className="text-slate-400 hover:text-slate-700 text-sm font-semibold mb-4 flex items-center gap-1 transition-colors">
                    ← Back to Programs
                </button>
                <h1 className="text-slate-900 font-bold text-3xl">Pledge Creator Wizard</h1>
                <p className="text-slate-500 mt-1">Define a Program and its Practice catalogue in one guided flow.</p>
            </div>

            {/* Step Indicator */}
            <div className="flex items-center gap-0 mb-10 relative">
                {steps.map((step, idx) => (
                    <div key={step.number} className="flex items-center flex-1">
                        <div className="flex flex-col items-center w-full">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-black border-2 transition-all duration-300
                                ${currentStep === step.number ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200' :
                                    currentStep > step.number ? 'bg-emerald-500 border-emerald-500 text-white' :
                                        'bg-white border-slate-300 text-slate-400'}`}
                            >
                                {currentStep > step.number ? '✓' : step.number}
                            </div>
                            <span className={`mt-2 text-xs font-bold whitespace-nowrap ${currentStep === step.number ? 'text-blue-600' : 'text-slate-400'}`}>
                                {step.label}
                            </span>
                        </div>
                        {idx < steps.length - 1 && (
                            <div className={`flex-1 h-0.5 mt-[-18px] transition-all duration-300 ${currentStep > step.number ? 'bg-emerald-400' : 'bg-slate-200'}`} />
                        )}
                    </div>
                ))}
            </div>

            {/* Step Panels */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 min-h-[400px]">

                {/* ── STEP 1: Program Details ── */}
                {currentStep === 1 && (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-xl font-bold text-slate-800 mb-1">Program Details</h2>
                            <p className="text-slate-500 text-sm">Set up the name and configuration for the new program.</p>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-2">Title *</label>
                            <input
                                required
                                autoFocus
                                placeholder="e.g. 2025 Integrity & Transparency Initiative"
                                value={program.title}
                                onChange={e => setProgram({ ...program, title: e.target.value })}
                                className="w-full border border-slate-200 bg-slate-50 rounded-xl p-3.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-2">Description</label>
                            <textarea
                                rows={4}
                                placeholder="Brief overview of this program's goals and context..."
                                value={program.description}
                                onChange={e => setProgram({ ...program, description: e.target.value })}
                                className="w-full border border-slate-200 bg-slate-50 rounded-xl p-3.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none leading-relaxed"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-2">Start Date</label>
                                <input type="date" value={program.start_date} onChange={e => setProgram({ ...program, start_date: e.target.value })}
                                    className="w-full border border-slate-200 bg-slate-50 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-2">End Date</label>
                                <input type="date" value={program.end_date} onChange={e => setProgram({ ...program, end_date: e.target.value })}
                                    className="w-full border border-slate-200 bg-slate-50 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                            </div>
                        </div>

                        {/* Admin Config */}
                        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
                            <h3 className="text-sm font-bold text-amber-900 mb-3 flex items-center gap-2">⚙️ Admin Configuration</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-amber-700 uppercase tracking-widest mb-1.5">Max Practices to Choose</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="20"
                                        value={program.max_practices}
                                        onChange={e => setProgram({ ...program, max_practices: e.target.value })}
                                        className="w-full border border-amber-200 bg-white rounded-xl p-3 text-sm focus:ring-2 focus:ring-amber-400 outline-none font-bold"
                                    />
                                    <p className="text-[11px] text-amber-600 mt-1">How many practices can a participant select per pledge?</p>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-amber-700 uppercase tracking-widest mb-1.5">Max Behaviours Allowed</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="20"
                                        value={program.max_behaviours}
                                        onChange={e => setProgram({ ...program, max_behaviours: e.target.value })}
                                        className="w-full border border-amber-200 bg-white rounded-xl p-3 text-sm focus:ring-2 focus:ring-amber-400 outline-none font-bold"
                                    />
                                    <p className="text-[11px] text-amber-600 mt-1">How many personal behaviours can they define?</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── STEP 2: Weekly Practices ── */}
                {currentStep === 2 && (
                    <PracticesStep type="weekly" practices={weeklyPractices} setPractices={setWeeklyPractices} />
                )}

                {/* ── STEP 3: Monthly Practices ── */}
                {currentStep === 3 && (
                    <PracticesStep type="monthly" practices={monthlyPractices} setPractices={setMonthlyPractices} />
                )}

                {/* ── STEP 4: Quarterly Practices ── */}
                {currentStep === 4 && (
                    <PracticesStep type="quarterly" practices={quarterlyPractices} setPractices={setQuarterlyPractices} />
                )}
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center mt-6">
                <button
                    onClick={handleBack}
                    disabled={currentStep === 1}
                    className="px-6 py-3 text-sm font-bold text-slate-500 hover:text-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                    ← Back
                </button>

                <div className="flex items-center gap-2">
                    {steps.map(s => (
                        <div key={s.number} className={`w-2 h-2 rounded-full transition-all ${currentStep === s.number ? 'bg-blue-600 w-5' : 'bg-slate-300'}`} />
                    ))}
                </div>

                {currentStep < totalSteps ? (
                    <button
                        onClick={handleNext}
                        className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-600/20 transition-all hover:-translate-y-0.5"
                    >
                        Next →
                    </button>
                ) : (
                    <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white rounded-xl text-sm font-bold shadow-md shadow-emerald-600/20 transition-all hover:-translate-y-0.5 flex items-center gap-2"
                    >
                        {submitting ? (
                            <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</>
                        ) : (
                            '✓ Save Program'
                        )}
                    </button>
                )}
            </div>
        </div>
    );
};

export default AdminPledgeWizard;
