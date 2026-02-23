import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import axiosInstance from '../api/axiosInstance';
import { useNavigate } from 'react-router-dom';

const PledgePage = () => {
    const [step, setStep] = useState(1);
    const navigate = useNavigate();

    // Data Loading
    const [loadingInitial, setLoadingInitial] = useState(true);
    const [programs, setPrograms] = useState([]);
    const [selectedProgram, setSelectedProgram] = useState('');
    const [practices, setPractices] = useState([]);

    // Form State
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        north_star: '',
        success_metric: '',
        timeline: '',
        personal_habit: '',
        habit_frequency: '',
        measure_success: '',
    });

    const [selectedPractices, setSelectedPractices] = useState({}); // { practiceId: selectedAction }
    const [behaviours, setBehaviours] = useState([
        { type: 'start', behaviour_text: '', why_it_matters: '', first_action_date: '', action_taken: '', action_needed_next: '' },
        { type: 'stop', behaviour_text: '', why_it_matters: '', first_action_date: '', action_taken: '', action_needed_next: '' }
    ]);

    useEffect(() => {
        // Load active programs first
        axiosInstance.get('/programs')
            .then(res => {
                setPrograms(res.data.programs || []);
                if (res.data.programs.length > 0) {
                    setSelectedProgram(res.data.programs[0].id);
                }
            })
            .catch(() => toast.error('Failed to load programs'))
            .finally(() => setLoadingInitial(false));
    }, []);

    useEffect(() => {
        if (selectedProgram) {
            axiosInstance.get(`/practices/program/${selectedProgram}`)
                .then(res => setPractices(res.data.practices || []))
                .catch(() => toast.error('Failed to load practices'));
        }
    }, [selectedProgram]);

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handlePracticeSelect = (practiceId, action) => {
        setSelectedPractices(prev => ({ ...prev, [practiceId]: action }));
    };

    const handleBehaviourChange = (index, field, value) => {
        const updated = [...behaviours];
        updated[index][field] = value;
        setBehaviours(updated);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedProgram) return toast.error('Please select a program');

        // Format for backend
        const pledge_practices = Object.entries(selectedPractices)
            .filter(([_, action]) => action && action.trim() !== '')
            .map(([id, action]) => ({ practice_id: parseInt(id), selected_action: action }));

        const filteredBehaviours = behaviours.filter(b => b.behaviour_text.trim() !== '');

        setSubmitting(true);
        try {
            await axiosInstance.post('/pledges', {
                program_id: selectedProgram,
                ...formData,
                pledge_practices,
                behaviours: filteredBehaviours
            });
            toast.success('🎉 Pledge submitted successfully!');
            navigate('/my-pledges');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to submit pledge.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loadingInitial) {
        return (
            <div className="flex items-center justify-center min-h-96">
                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (programs.length === 0) {
        return (
            <div className="max-w-3xl mx-auto mt-12 bg-white p-12 rounded-2xl border text-center">
                <h2 className="text-xl font-bold text-slate-800">No Programs Available</h2>
                <p className="text-slate-500 mt-2">Before you can make a pledge, an admin must create a Program.</p>
            </div>
        );
    }

    return (
        <div className="p-4 lg:p-8 max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-slate-900 font-bold text-3xl">Sign Your Pledge</h1>
                <p className="text-slate-500 mt-1 text-sm">Design your digital culture commitment</p>
            </div>

            <div className="flex gap-2 mb-8 bg-slate-100 p-1.5 rounded-2xl w-full max-w-md mx-auto relative hidden md:flex">
                <div className="absolute top-1/2 left-0 w-full h-[2px] bg-slate-200 -z-10" />
                {[1, 2, 3].map(s => (
                    <div key={s} className="flex-1 flex justify-center z-10">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all shadow-sm ${step >= s ? 'bg-blue-600 text-white border-4 border-blue-100' : 'bg-white text-slate-400 border border-slate-200'}`}>
                            {s}
                        </div>
                    </div>
                ))}
            </div>

            <form onSubmit={step === 3 ? handleSubmit : (e) => { e.preventDefault(); setStep(s => s + 1); }}>

                {/* STEP 1: Core Pledge & Program */}
                {step === 1 && (
                    <div className="space-y-6 animate-in slide-in-from-right-4 fade-in">
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                            <h2 className="text-lg font-bold text-slate-800 mb-4">1. Core Ambition</h2>

                            <div className="mb-5">
                                <label className="block text-slate-700 text-sm font-semibold mb-2">Select Program *</label>
                                <select
                                    value={selectedProgram}
                                    onChange={(e) => setSelectedProgram(e.target.value)}
                                    className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50 outline-none"
                                    required
                                >
                                    {programs.map(p => (
                                        <option key={p.id} value={p.id}>{p.title}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-5">
                                <div>
                                    <label className="block text-slate-700 text-sm font-semibold mb-2">My North Star (Vision) *</label>
                                    <textarea name="north_star" required value={formData.north_star} onChange={handleInputChange} rows={3} placeholder="What is the ultimate goal or vision you want to achieve?" className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none" />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-slate-700 text-sm font-semibold mb-2">Success Metric *</label>
                                        <input name="success_metric" required value={formData.success_metric} onChange={handleInputChange} type="text" placeholder="How will you measure success?" className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-slate-700 text-sm font-semibold mb-2">Timeline *</label>
                                        <input name="timeline" required value={formData.timeline} onChange={handleInputChange} type="text" placeholder="e.g. Next 3 months, Q3 2026" className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-slate-700 text-sm font-semibold mb-2">Personal Habit *</label>
                                    <textarea name="personal_habit" required value={formData.personal_habit} onChange={handleInputChange} rows={2} placeholder="What specific habit will help you achieve this?" className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none" />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-slate-700 text-sm font-semibold mb-2">Habit Frequency</label>
                                        <input name="habit_frequency" value={formData.habit_frequency} onChange={handleInputChange} type="text" placeholder="e.g. Daily, 3 times a week" className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-slate-700 text-sm font-semibold mb-2">Measure Habit Success</label>
                                        <input name="measure_success" value={formData.measure_success} onChange={handleInputChange} type="text" placeholder="How will you track this habit?" className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* STEP 2: Practices */}
                {step === 2 && (
                    <div className="space-y-6 animate-in slide-in-from-right-4 fade-in">
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                            <h2 className="text-lg font-bold text-slate-800 mb-4">2. Select Key Practices</h2>
                            <p className="text-sm text-slate-500 mb-6">Choose exactly how you'll implement the program's core practices. Select an action for each practice you want to commit to.</p>

                            {practices.length === 0 ? (
                                <div className="text-center p-8 bg-slate-50 rounded-xl border border-slate-200">
                                    <p className="text-slate-500 text-sm">No specific practices defined for this program yet.</p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {practices.map((pr) => (
                                        <div key={pr.id} className="p-4 border border-blue-100 bg-blue-50/30 rounded-xl">
                                            <div className="flex items-center gap-2 mb-3">
                                                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold uppercase rounded-md tracking-wider">{pr.type}</span>
                                                <h4 className="font-bold text-slate-800">{pr.title}</h4>
                                            </div>

                                            <div className="space-y-2">
                                                <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Select your action:</p>
                                                {pr.actions?.map((actionText, idx) => (
                                                    <label key={idx} className="flex items-start gap-3 p-3 bg-white rounded-lg border border-slate-200 cursor-pointer hover:border-blue-400 transition-colors">
                                                        <input
                                                            type="radio"
                                                            name={`practice_${pr.id}`}
                                                            checked={selectedPractices[pr.id] === actionText}
                                                            onChange={() => handlePracticeSelect(pr.id, actionText)}
                                                            className="mt-1 accent-blue-600"
                                                        />
                                                        <span className="text-sm text-slate-700">{actionText}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* STEP 3: Behaviours */}
                {step === 3 && (
                    <div className="space-y-6 animate-in slide-in-from-right-4 fade-in">
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                            <h2 className="text-lg font-bold text-slate-800 mb-4">3. Behaviour Change</h2>
                            <p className="text-sm text-slate-500 mb-6">Describe the specific behaviours you want to start, stop, or reduce to achieve your pledge.</p>

                            {behaviours.map((b, index) => (
                                <div key={index} className={`p-5 rounded-xl border-l-4 mb-6 ${b.type === 'start' ? 'border-green-500 bg-green-50/50' : 'border-red-500 bg-red-50/50'}`}>
                                    <div className="flex items-center gap-4 mb-4">
                                        <h3 className="font-bold text-slate-800 capitalize">{b.type} Behaviour</h3>
                                        <select
                                            value={b.type}
                                            onChange={(e) => handleBehaviourChange(index, 'type', e.target.value)}
                                            className="text-xs bg-white border border-slate-200 rounded p-1"
                                        >
                                            <option value="start">Start (New Habit)</option>
                                            <option value="reduce">Reduce</option>
                                            <option value="stop">Stop</option>
                                        </select>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-slate-700 text-xs font-semibold mb-1">Behaviour description *</label>
                                            <input required value={b.behaviour_text} onChange={(e) => handleBehaviourChange(index, 'behaviour_text', e.target.value)} placeholder={`What behavior do you want to ${b.type}?`} className="w-full text-sm border border-slate-200 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
                                        </div>
                                        <div>
                                            <label className="block text-slate-700 text-xs font-semibold mb-1">Why it matters</label>
                                            <input value={b.why_it_matters} onChange={(e) => handleBehaviourChange(index, 'why_it_matters', e.target.value)} placeholder="How does this impact your goals?" className="w-full text-sm border border-slate-200 rounded-lg p-2.5 outline-none bg-white" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-slate-700 text-xs font-semibold mb-1">First Action Date</label>
                                                <input type="date" value={b.first_action_date} onChange={(e) => handleBehaviourChange(index, 'first_action_date', e.target.value)} className="w-full text-sm border border-slate-200 rounded-lg p-2.5 outline-none bg-white" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            <button
                                type="button"
                                onClick={() => setBehaviours([...behaviours, { type: 'start', behaviour_text: '', why_it_matters: '', first_action_date: '', action_taken: '', action_needed_next: '' }])}
                                className="text-sm font-semibold text-blue-600 hover:text-blue-800"
                            >
                                + Add another behaviour
                            </button>
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-200">
                    <button
                        type="button"
                        onClick={() => setStep(s => Math.max(1, s - 1))}
                        className={`px-6 py-2.5 font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors ${step === 1 ? 'invisible' : ''}`}
                    >
                        ← Back
                    </button>

                    <button
                        type="submit"
                        disabled={submitting}
                        className="px-8 py-2.5 font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-lg shadow-blue-900/20 flex items-center gap-2"
                    >
                        {submitting ? (
                            <><div className="w-4 h-4 border-2 border-white rounded-full border-t-transparent animate-spin" /> Submitting...</>
                        ) : step === 3 ? (
                            'Submit Complete Pledge ✓'
                        ) : (
                            'Next Step →'
                        )}
                    </button>
                </div>

            </form>
        </div>
    );
};

export default PledgePage;
