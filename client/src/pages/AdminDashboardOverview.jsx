import { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Users, ClipboardList, CheckCircle, TrendingUp } from 'lucide-react';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 15 },
    visible: { opacity: 1, scale: 1, y: 0 }
};

const AdminDashboardOverview = () => {
    const [stats, setStats] = useState({
        totalParticipants: 0,
        totalPledges: 0,
        surveyCompletionRate: '0%',
        avgExecutionPercentage: '0%'
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await axiosInstance.get('/admin/dashboard-stats');
                if (res.data.success) {
                    setStats(res.data.stats);
                }
            } catch {
                toast.error('Failed to load dashboard metrics');
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="p-4 lg:p-8 max-w-7xl mx-auto">
                <div className="h-20 w-1/3 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse mb-8"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-40 rounded-3xl bg-slate-200 dark:bg-slate-800 animate-pulse"></div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 lg:p-8 max-w-7xl mx-auto pb-24">
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                <span className="inline-block px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[10px] font-black tracking-widest mb-3 rounded-full uppercase border border-amber-200 dark:border-amber-800">
                    Admin Control Center
                </span>
                <h1 className="text-3xl lg:text-4xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>Dashboard Overview</h1>
                <p className="mt-2 text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Real-time metrics for your organization's cultural pledges and activity.</p>
            </motion.div>

            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

                {/* Card 1 */}
                <motion.div variants={itemVariants} className="rounded-3xl p-6 border shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 dark:bg-blue-900/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                    <div className="relative z-10">
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center text-xl shadow-sm mb-4 border border-blue-200 dark:border-blue-800/50">
                            <Users strokeWidth={2.5} />
                        </div>
                        <p className="font-bold text-xs uppercase tracking-widest block mb-1" style={{ color: 'var(--text-tertiary)' }}>Total Participants</p>
                        <h3 className="text-3xl font-black mt-1" style={{ color: 'var(--text-primary)' }}>{stats.totalParticipants}</h3>
                    </div>
                </motion.div>

                {/* Card 2 */}
                <motion.div variants={itemVariants} className="rounded-3xl p-6 border shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
                    <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 dark:bg-indigo-900/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                    <div className="relative z-10">
                        <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center text-xl shadow-sm mb-4 border border-indigo-200 dark:border-indigo-800/50">
                            <ClipboardList strokeWidth={2.5} />
                        </div>
                        <p className="font-bold text-xs uppercase tracking-widest block mb-1" style={{ color: 'var(--text-tertiary)' }}>Pledges Submitted</p>
                        <h3 className="text-3xl font-black mt-1" style={{ color: 'var(--text-primary)' }}>{stats.totalPledges}</h3>
                    </div>
                </motion.div>

                {/* Card 3 */}
                <motion.div variants={itemVariants} className="rounded-3xl p-6 border shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 dark:bg-emerald-900/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                    <div className="relative z-10">
                        <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center text-xl shadow-sm mb-4 border border-emerald-200 dark:border-emerald-800/50">
                            <CheckCircle strokeWidth={2.5} />
                        </div>
                        <p className="font-bold text-xs uppercase tracking-widest block mb-1" style={{ color: 'var(--text-tertiary)' }}>Survey Completion</p>
                        <h3 className="text-3xl font-black mt-1" style={{ color: 'var(--text-primary)' }}>{stats.surveyCompletionRate}</h3>
                    </div>
                </motion.div>

                {/* Card 4 */}
                <motion.div variants={itemVariants} className="rounded-3xl p-6 border shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
                    <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 dark:bg-amber-900/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                    <div className="relative z-10">
                        <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center text-xl shadow-sm mb-4 border border-amber-200 dark:border-amber-800/50">
                            <TrendingUp strokeWidth={2.5} />
                        </div>
                        <p className="font-bold text-xs uppercase tracking-widest block mb-1" style={{ color: 'var(--text-tertiary)' }}>Avg Execution %</p>
                        <h3 className="text-3xl font-black mt-1" style={{ color: 'var(--text-primary)' }}>{stats.avgExecutionPercentage}</h3>
                    </div>
                </motion.div>

            </motion.div>
        </div>
    );
};

export default AdminDashboardOverview;
