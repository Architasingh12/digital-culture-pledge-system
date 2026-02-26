import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import axiosInstance from '../api/axiosInstance';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Search, Target, RefreshCw } from 'lucide-react';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0 }
};

const SkeletonRow = () => (
    <tr className="animate-pulse">
        <td className="px-6 py-4">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700"></div>
                <div className="space-y-2">
                    <div className="h-3 w-24 bg-slate-200 dark:bg-slate-700 rounded"></div>
                    <div className="h-2 w-32 bg-slate-200 dark:bg-slate-700 rounded"></div>
                </div>
            </div>
        </td>
        <td className="px-6 py-4"><div className="h-6 w-24 bg-slate-200 dark:bg-slate-700 rounded-lg"></div></td>
        <td className="px-6 py-4"><div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded mx-auto"></div></td>
        <td className="px-6 py-4">
            <div className="space-y-2">
                <div className="h-3 w-32 bg-slate-200 dark:bg-slate-700 rounded"></div>
                <div className="h-4 w-16 bg-slate-200 dark:bg-slate-700 rounded"></div>
            </div>
        </td>
        <td className="px-6 py-4"><div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 mx-auto"></div></td>
    </tr>
);

const AdminParticipants = () => {
    const [pledges, setPledges] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    const fetchPledges = async () => {
        setLoading(true);
        try {
            const res = await axiosInstance.get('/pledges/all');
            setPledges(res.data.pledges || []);
        } catch {
            toast.error('Failed to load participants data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPledges();
    }, []);

    const filtered = pledges.filter(p =>
        (p.user_name || '').toLowerCase().includes(search.toLowerCase()) ||
        (p.program_title || '').toLowerCase().includes(search.toLowerCase()) ||
        (p.user_email || '').toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="p-4 lg:p-8 max-w-7xl mx-auto pb-24">
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                <div>
                    <span className="inline-block px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 text-[10px] font-black tracking-widest mb-3 rounded-full uppercase border border-indigo-200 dark:border-indigo-800">
                        Workforce Directory
                    </span>
                    <h1 className="text-3xl lg:text-4xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>Participants List</h1>
                    <p className="mt-2 text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Review all commitments submitted by employees across different programs.</p>
                </div>
                <div className="flex gap-3 shrink-0">
                    <button onClick={fetchPledges} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-sm font-bold transition-colors flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                        <RefreshCw className="w-4 h-4" /> Refresh
                    </button>
                </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="rounded-3xl border shadow-sm overflow-hidden" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
                {/* Table Header/Controls */}
                <div className="px-6 py-5 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/50" style={{ borderColor: 'var(--border-color)' }}>
                    <h2 className="font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                        <span className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0"><Users className="w-4 h-4" /></span>
                        Submitted Pledges
                    </h2>
                    <div className="relative w-full sm:w-72 shrink-0">
                        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search name, email, or program…"
                            className="w-full border rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all shadow-sm bg-white dark:bg-[#0f172a] placeholder-slate-400 dark:placeholder-slate-500"
                            style={{ color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto p-1">
                    <table className="w-full text-left border-collapse min-w-[1000px]">
                        <thead>
                            <tr className="border-b text-[10px] uppercase tracking-widest font-black" style={{ borderColor: 'var(--border-color)', color: 'var(--text-tertiary)' }}>
                                <th className="px-6 py-5">Participant Details</th>
                                <th className="px-6 py-5">Assigned Program</th>
                                <th className="px-6 py-5 text-center">Submitted Date</th>
                                <th className="px-6 py-5">Core Personal Habit</th>
                                <th className="px-6 py-5 text-center">Behaviours</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y" style={{ divideColor: 'var(--border-color)' }}>
                            {loading ? (
                                <>
                                    <SkeletonRow />
                                    <SkeletonRow />
                                    <SkeletonRow />
                                </>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center justify-center opacity-40">
                                            <Target className="w-12 h-12 mb-3" style={{ color: 'var(--text-secondary)' }} />
                                            <p className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>No pledges found</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                <AnimatePresence>
                                    {filtered.map(p => (
                                        <motion.tr
                                            key={p.id}
                                            variants={itemVariants}
                                            initial="hidden"
                                            animate="visible"
                                            exit="hidden"
                                            layout
                                            className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group text-sm"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-11 h-11 rounded-full bg-slate-100 dark:bg-slate-800 border flex items-center justify-center font-black text-lg" style={{ borderColor: 'var(--border-color)', color: 'var(--text-tertiary)' }}>
                                                        {p.user_name?.charAt(0) || 'U'}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold whitespace-nowrap" style={{ color: 'var(--text-primary)' }}>{p.user_name}</p>
                                                        <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{p.user_designation || 'Participant'}</p>
                                                        <p className="text-[10px] font-medium mt-0.5 opacity-70" style={{ color: 'var(--text-tertiary)' }}>{p.user_email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-block px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/10 text-indigo-700 dark:text-indigo-400 text-xs font-bold rounded-lg border border-indigo-200 dark:border-indigo-800/50 shadow-sm whitespace-nowrap">
                                                    {p.program_title || 'Unassigned'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
                                                    {new Date(p.submitted_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 max-w-[250px]">
                                                <p className="font-semibold truncate leading-relaxed" style={{ color: 'var(--text-primary)' }} title={p.personal_habit}>{p.personal_habit}</p>
                                                <span className="text-[10px] px-2.5 py-1 bg-slate-100 dark:bg-slate-800 border font-black uppercase tracking-widest rounded inline-block mt-2" style={{ color: 'var(--text-tertiary)', borderColor: 'var(--border-color)' }}>{p.habit_frequency}</span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800/50 text-emerald-600 dark:text-emerald-400 font-black shadow-sm">
                                                    {p.behaviours?.length || 0}
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </AnimatePresence>
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="px-6 py-4 border-t bg-slate-50/50 dark:bg-slate-900/50 text-xs font-bold uppercase tracking-widest" style={{ borderColor: 'var(--border-color)', color: 'var(--text-tertiary)' }}>
                    Showing {filtered.length} of {pledges.length} pledges
                </div>
            </motion.div>
        </div>
    );
};

export default AdminParticipants;
