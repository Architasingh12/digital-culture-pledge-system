import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import axiosInstance from '../api/axiosInstance';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Calendar, Target, LayoutGrid } from 'lucide-react';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0 }
};

// Simple skeleton card
const SkeletonCard = () => (
    <div className="p-6 border-b animate-pulse flex justify-between items-start" style={{ borderColor: 'var(--border-color)' }}>
        <div className="space-y-3 w-3/4">
            <div className="h-5 w-1/3 bg-slate-200 dark:bg-slate-700 rounded-md"></div>
            <div className="h-4 w-full bg-slate-200 dark:bg-slate-700 rounded-md"></div>
            <div className="h-6 w-1/4 bg-slate-200 dark:bg-slate-700 rounded-full mt-2"></div>
        </div>
    </div>
);

const AdminPrograms = () => {
    const [programs, setPrograms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [newProgram, setNewProgram] = useState({ title: '', description: '', start_date: '', end_date: '' });

    const fetchPrograms = async () => {
        setLoading(true);
        try {
            const res = await axiosInstance.get('/programs');
            setPrograms(res.data.programs || []);
        } catch {
            toast.error('Failed to load programs');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPrograms();
    }, []);

    const handleCreateProgram = async (e) => {
        e.preventDefault();
        try {
            await axiosInstance.post('/programs', newProgram);
            toast.success('Program created successfully!');
            setShowModal(false);
            setNewProgram({ title: '', description: '', start_date: '', end_date: '' });
            fetchPrograms();
        } catch {
            toast.error('Failed to create program');
        }
    };

    return (
        <div className="p-4 lg:p-8 max-w-5xl mx-auto pb-24">
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 border-b pb-6" style={{ borderColor: 'var(--border-color)' }}>
                <div>
                    <span className="inline-block px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-[10px] font-black tracking-widest mb-3 rounded-full uppercase border border-purple-200 dark:border-purple-800">
                        Initiative Management
                    </span>
                    <h1 className="text-3xl lg:text-4xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>Programs</h1>
                    <p className="mt-2 text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Manage and configure corporate culture initiative programs.</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex shrink-0 items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl text-sm font-bold shadow-lg shadow-blue-900/20 transition-all hover:scale-105 active:scale-95"
                >
                    <Plus className="w-5 h-5" /> New Program
                </button>
            </motion.div>

            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="rounded-3xl border shadow-sm overflow-hidden" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
                {/* Header */}
                <div className="px-6 py-5 border-b bg-slate-50/50 dark:bg-slate-900/50" style={{ borderColor: 'var(--border-color)' }}>
                    <h2 className="font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                        <span className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0"><LayoutGrid className="w-4 h-4" /></span>
                        Active Programs
                    </h2>
                </div>

                <div className="divide-y" style={{ divideColor: 'var(--border-color)' }}>
                    {loading ? (
                        <>
                            <SkeletonCard />
                            <SkeletonCard />
                            <SkeletonCard />
                        </>
                    ) : programs.length === 0 ? (
                        <div className="p-16 text-center">
                            <Target className="w-12 h-12 mx-auto mb-4 opacity-40" style={{ color: 'var(--text-secondary)' }} />
                            <p className="font-bold text-lg mb-1" style={{ color: 'var(--text-primary)' }}>No Programs Yet</p>
                            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Create your first program to start measuring culture pledges.</p>
                        </div>
                    ) : (
                        <motion.div variants={containerVariants} initial="hidden" animate="visible">
                            {programs.map(p => (
                                <motion.div key={p.id} variants={itemVariants} className="p-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex justify-between items-center group">
                                    <div>
                                        <h3 className="font-bold text-lg leading-tight" style={{ color: 'var(--text-primary)' }}>{p.title}</h3>
                                        <p className="mt-1.5 text-sm font-medium leading-relaxed max-w-3xl" style={{ color: 'var(--text-secondary)' }}>{p.description}</p>
                                        <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/10 text-blue-700 dark:text-blue-400 text-xs font-bold rounded-lg border border-blue-200 dark:border-blue-800/50 uppercase tracking-widest shadow-sm">
                                            <Calendar className="w-3.5 h-3.5" />
                                            {p.start_date ? new Date(p.start_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'No Start Date'}
                                            <span className="opacity-50 mx-1">→</span>
                                            {p.end_date ? new Date(p.end_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Present'}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    )}
                </div>
            </motion.div>

            {/* Create Modal */}
            <AnimatePresence>
                {showModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-slate-900/40 dark:bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            className="rounded-3xl p-8 w-full max-w-md shadow-2xl border"
                            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}
                        >
                            <h2 className="text-2xl font-black mb-6" style={{ color: 'var(--text-primary)' }}>Create New Program</h2>
                            <form onSubmit={handleCreateProgram} className="space-y-5">
                                <div>
                                    <label className="block text-[11px] font-black uppercase tracking-widest mb-2" style={{ color: 'var(--text-secondary)' }}>Title *</label>
                                    <input
                                        required
                                        autoFocus
                                        className="w-full rounded-xl p-3.5 text-sm font-bold focus:ring-2 focus:ring-blue-500 border outline-none transition-shadow bg-transparent placeholder-slate-400 dark:placeholder-slate-500 shadow-sm"
                                        style={{ color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
                                        value={newProgram.title}
                                        onChange={e => setNewProgram({ ...newProgram, title: e.target.value })}
                                        placeholder="e.g. Q3 Culture Launch"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-black uppercase tracking-widest mb-2" style={{ color: 'var(--text-secondary)' }}>Description</label>
                                    <textarea
                                        rows="3"
                                        className="w-full rounded-xl p-3.5 text-sm font-medium focus:ring-2 focus:ring-blue-500 border outline-none resize-none transition-shadow bg-transparent placeholder-slate-400 dark:placeholder-slate-500 shadow-sm"
                                        style={{ color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
                                        value={newProgram.description}
                                        onChange={e => setNewProgram({ ...newProgram, description: e.target.value })}
                                        placeholder="Program goals and targets..."
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[11px] font-black uppercase tracking-widest mb-2" style={{ color: 'var(--text-secondary)' }}>Start Date</label>
                                        <input
                                            type="date"
                                            className="w-full rounded-xl p-3.5 text-sm font-bold focus:ring-2 focus:ring-blue-500 border outline-none transition-shadow bg-transparent shadow-sm"
                                            style={{ color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
                                            value={newProgram.start_date}
                                            onChange={e => setNewProgram({ ...newProgram, start_date: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-black uppercase tracking-widest mb-2" style={{ color: 'var(--text-secondary)' }}>End Date</label>
                                        <input
                                            type="date"
                                            className="w-full rounded-xl p-3.5 text-sm font-bold focus:ring-2 focus:ring-blue-500 border outline-none transition-shadow bg-transparent shadow-sm"
                                            style={{ color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
                                            value={newProgram.end_date}
                                            onChange={e => setNewProgram({ ...newProgram, end_date: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end gap-3 pt-6 mt-2 border-t" style={{ borderColor: 'var(--border-color)' }}>
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="px-6 py-3 text-sm font-bold rounded-xl transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
                                        style={{ color: 'var(--text-secondary)' }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-900/20 transition-all hover:scale-105 active:scale-95"
                                    >
                                        Create
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminPrograms;
