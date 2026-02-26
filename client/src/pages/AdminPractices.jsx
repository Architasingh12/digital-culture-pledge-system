import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import axiosInstance from '../api/axiosInstance';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, PlusCircle, CheckCircle2, LayoutTemplate, Activity } from 'lucide-react';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariants = {
    hidden: { opacity: 0, scale: 0.98, y: 10 },
    visible: { opacity: 1, scale: 1, y: 0 }
};

const SkeletonPractice = () => (
    <div className="bg-slate-50 dark:bg-slate-900/40 p-5 rounded-2xl border animate-pulse" style={{ borderColor: 'var(--border-color)' }}>
        <div className="flex gap-2 mb-4">
            <div className="h-5 w-16 bg-slate-200 dark:bg-slate-800 rounded"></div>
            <div className="h-5 w-40 bg-slate-200 dark:bg-slate-800 rounded"></div>
        </div>
        <div className="space-y-2 pl-4">
            <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-800 rounded"></div>
            <div className="h-4 w-5/6 bg-slate-200 dark:bg-slate-800 rounded"></div>
            <div className="h-4 w-1/2 bg-slate-200 dark:bg-slate-800 rounded"></div>
        </div>
    </div>
);

const AdminPractices = () => {
    const [programs, setPrograms] = useState([]);
    const [selectedProgramId, setSelectedProgramId] = useState('');
    const [practices, setPractices] = useState([]);
    const [loadingSettings, setLoadingSettings] = useState(true);

    // Form State
    const [newPractice, setNewPractice] = useState({ type: 'weekly', title: '', actionsText: '' });
    const [submitting, setSubmitting] = useState(false);

    // Fetch programs for dropdown
    useEffect(() => {
        const init = async () => {
            try {
                const res = await axiosInstance.get('/programs');
                const progs = res.data.programs || [];
                setPrograms(progs);
                if (progs.length > 0) {
                    setSelectedProgramId(progs[0].id.toString());
                }
            } catch {
                toast.error('Failed to load programs list');
            } finally {
                setLoadingSettings(false);
            }
        };
        init();
    }, []);

    // Fetch practices when program selection changes
    useEffect(() => {
        if (!selectedProgramId) return;
        const fetchPractices = async () => {
            try {
                const res = await axiosInstance.get(`/practices/program/${selectedProgramId}`);
                setPractices(res.data.practices || []);
            } catch {
                toast.error('Failed to load practices');
            }
        };
        fetchPractices();
    }, [selectedProgramId]);

    const handleCreatePractice = async (e) => {
        e.preventDefault();
        if (!selectedProgramId) {
            toast.error('Please select a program first');
            return;
        }

        const actions = newPractice.actionsText.split(';').map(a => a.trim()).filter(a => a);
        setSubmitting(true);
        try {
            await axiosInstance.post('/practices', {
                program_id: selectedProgramId,
                type: newPractice.type,
                title: newPractice.title,
                actions
            });
            toast.success('Practice added successfully!');
            setNewPractice({ type: 'weekly', title: '', actionsText: '' });

            // Refresh practices manually
            const res = await axiosInstance.get(`/practices/program/${selectedProgramId}`);
            setPractices(res.data.practices || []);

        } catch {
            toast.error('Failed to add practice');
        } finally {
            setSubmitting(false);
        }
    };

    if (loadingSettings) {
        return (
            <div className="p-12 text-center text-slate-500 flex flex-col items-center gap-4">
                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <p className="font-bold tracking-widest uppercase text-xs">Loading Configuration...</p>
            </div>
        );
    }

    const selectedProgramName = programs.find(p => p.id.toString() === selectedProgramId)?.title || 'Selected Program';

    return (
        <div className="p-4 lg:p-8 max-w-6xl mx-auto pb-24">
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8 border-b pb-6" style={{ borderColor: 'var(--border-color)' }}>
                <span className="inline-block px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[10px] font-black tracking-widest mb-3 rounded-full uppercase border border-amber-200 dark:border-amber-800">
                    Configuration Matrix
                </span>
                <h1 className="text-3xl lg:text-4xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>Manage Practices</h1>
                <p className="mt-2 text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Configure selectable behaviours, cadences, and actions assigned to specific programs.</p>
            </motion.div>

            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="rounded-3xl border shadow-sm flex flex-col lg:flex-row overflow-hidden" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>

                {/* Left Side: Program Selection & Existing Practices */}
                <div className="flex-1 border-b lg:border-b-0 lg:border-r bg-slate-50/30 dark:bg-slate-900/20" style={{ borderColor: 'var(--border-color)' }}>
                    <div className="p-6 border-b" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
                        <label className="block text-[11px] font-black uppercase tracking-widest mb-3 flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                            <LayoutTemplate className="w-4 h-4" /> Select Program to Configure
                        </label>
                        <select
                            value={selectedProgramId}
                            onChange={(e) => setSelectedProgramId(e.target.value)}
                            className="w-full rounded-2xl p-4 font-bold focus:ring-2 focus:ring-blue-500 outline-none border transition-shadow shadow-sm cursor-pointer appearance-none bg-slate-50 dark:bg-slate-800/50"
                            style={{ color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
                        >
                            {programs.map(p => (
                                <option key={p.id} value={p.id}>{p.title}</option>
                            ))}
                        </select>
                    </div>

                    <div className="p-6 lg:p-8 space-y-5 max-h-[650px] overflow-y-auto custom-scrollbar">
                        <div className="flex items-center gap-2 mb-4">
                            <h3 className="text-xs font-black uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>Current Practices in</h3>
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50">{selectedProgramName}</span>
                        </div>

                        {practices.length === 0 ? (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-12 text-center rounded-3xl border-2 border-dashed" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-surface)' }}>
                                <Activity className="w-12 h-12 mx-auto mb-4 opacity-30" style={{ color: 'var(--text-secondary)' }} />
                                <p className="font-bold text-lg mb-1" style={{ color: 'var(--text-primary)' }}>No Configured Practices</p>
                                <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Use the form on the right to build your first practice template.</p>
                            </motion.div>
                        ) : (
                            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-4">
                                <AnimatePresence>
                                    {practices.map(pr => (
                                        <motion.div key={pr.id} variants={itemVariants} className="p-6 rounded-2xl border shadow-sm relative group bg-white dark:bg-slate-900/50 hover:shadow-md transition-shadow" style={{ borderColor: 'var(--border-color)' }}>
                                            <div className="flex items-center gap-3 mb-4">
                                                <span className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg border 
                                                    ${pr.type === 'daily' ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800/50' :
                                                        pr.type === 'weekly' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800/50' :
                                                            'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800/50'}`
                                                }>
                                                    {pr.type}
                                                </span>
                                                <h4 className="font-bold text-base leading-tight" style={{ color: 'var(--text-primary)' }}>{pr.title}</h4>
                                            </div>
                                            <ul className="space-y-2.5">
                                                {pr.actions?.map((act, i) => (
                                                    <li key={i} className="text-sm font-medium flex items-start gap-2.5" style={{ color: 'var(--text-secondary)' }}>
                                                        <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 opacity-40 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--text-tertiary)' }} />
                                                        <span className="leading-relaxed">{act}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </motion.div>
                        )}
                    </div>
                </div>

                {/* Right Side: Create Form */}
                <div className="w-full lg:w-[420px] shrink-0 p-6 lg:p-8" style={{ backgroundColor: 'var(--bg-surface)' }}>
                    <div className="flex items-center gap-3 mb-8 pb-6 border-b" style={{ borderColor: 'var(--border-color)' }}>
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold shadow-lg shadow-blue-900/20">
                            <PlusCircle className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-black text-xl tracking-tight" style={{ color: 'var(--text-primary)' }}>Create New</h3>
                            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>Practice Template</p>
                        </div>
                    </div>

                    <form onSubmit={handleCreatePractice} className="space-y-6">
                        <div>
                            <label className="block text-[11px] font-black uppercase tracking-widest mb-2" style={{ color: 'var(--text-secondary)' }}>Cadence Type</label>
                            <select
                                value={newPractice.type}
                                onChange={e => setNewPractice({ ...newPractice, type: e.target.value })}
                                className="w-full rounded-xl p-3.5 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none border transition-shadow shadow-sm cursor-pointer appearance-none bg-slate-50 dark:bg-slate-800/50"
                                style={{ color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
                            >
                                <option value="daily">Daily Practice</option>
                                <option value="weekly">Weekly Practice</option>
                                <option value="monthly">Monthly Practice</option>
                                <option value="quarterly">Quarterly Practice</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-[11px] font-black uppercase tracking-widest mb-2" style={{ color: 'var(--text-secondary)' }}>Practice Title</label>
                            <input
                                required
                                placeholder="e.g. Transparent Reporting"
                                value={newPractice.title}
                                onChange={e => setNewPractice({ ...newPractice, title: e.target.value })}
                                className="w-full rounded-xl p-3.5 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none border transition-shadow shadow-sm bg-transparent placeholder-slate-400 dark:placeholder-slate-500"
                                style={{ color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
                            />
                        </div>

                        <div>
                            <div className="flex items-end justify-between mb-2">
                                <label className="block text-[11px] font-black uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>Available Actions</label>
                            </div>
                            <textarea
                                required
                                placeholder="Action 1;&#10;Action 2;&#10;Action 3;"
                                rows={7}
                                value={newPractice.actionsText}
                                onChange={e => setNewPractice({ ...newPractice, actionsText: e.target.value })}
                                className="w-full rounded-xl p-4 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none leading-relaxed border transition-shadow shadow-sm bg-transparent placeholder-slate-400 dark:placeholder-slate-500 font-medium"
                                style={{ color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
                            />
                            <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/50 rounded-lg p-3 mt-3 flex items-start gap-2 shadow-sm">
                                <Target className="w-4 h-4 mt-0.5 text-blue-600 dark:text-blue-400 shrink-0" />
                                <p className="text-[10px] font-bold text-blue-800 dark:text-blue-300 leading-tight">Separate multiple actions using a semicolon <code className="bg-blue-100 dark:bg-blue-800/50 text-blue-900 dark:text-blue-100 px-1 py-0.5 rounded mx-0.5 font-black">;</code> to render them as distinct bullet points.</p>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-slate-800 to-slate-900 dark:from-blue-600 dark:to-indigo-600 hover:from-slate-700 hover:to-slate-800 dark:hover:from-blue-700 dark:hover:to-indigo-700 text-white font-bold py-4 rounded-xl shadow-xl shadow-slate-900/20 dark:shadow-blue-900/20 transition-all hover:scale-[1.02] active:scale-[0.98] mt-6 disabled:opacity-70 disabled:transform-none"
                        >
                            {submitting ? 'Saving...' : 'Save Practice Template'}
                        </button>
                    </form>
                </div>
            </motion.div>
        </div>
    );
};

export default AdminPractices;
