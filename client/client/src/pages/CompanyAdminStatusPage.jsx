/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Activity, Target, Search, RefreshCw, Layers } from 'lucide-react';
import toast from 'react-hot-toast';
import axiosInstance from '../api/axiosInstance';

const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0 }
};

const CompanyAdminStatusPage = () => {
    const [participants, setParticipants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    const fetchStatus = async () => {
        setLoading(true);
        try {
            const res = await axiosInstance.get('/company-admin/status');
            if (res.data.success) {
                setParticipants(res.data.participants || []);
            }
        } catch (error) {
            console.error('Fetch status error:', error);
            toast.error('Failed to load participant status');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStatus();
    }, []);

    const filtered = participants.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.email.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="p-4 lg:p-8 max-w-7xl mx-auto pb-24">
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                <div>
                    <span className="inline-block px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-[10px] font-black tracking-widest mb-3 rounded-full uppercase border border-blue-200 dark:border-blue-800">
                        Company Overview
                    </span>
                    <h1 className="text-3xl lg:text-4xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>Participant Status</h1>
                    <p className="mt-2 text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Monitor login activity, pledges, and survey completions in real-time.</p>
                </div>
                <div className="flex gap-3 shrink-0">
                    <button onClick={fetchStatus} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-sm font-bold transition-colors flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                        <RefreshCw className="w-4 h-4" /> Refresh
                    </button>
                </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="rounded-3xl border shadow-sm overflow-hidden" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
                <div className="px-6 py-5 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/50" style={{ borderColor: 'var(--border-color)' }}>
                    <h2 className="font-bold flex items-center gap-2 text-lg" style={{ color: 'var(--text-primary)' }}>
                        <span className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                            <Activity className="w-4 h-4" />
                        </span>
                        Directory
                    </h2>
                    <div className="relative w-full sm:w-72 shrink-0">
                        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search participants..."
                            className="w-full border rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all shadow-sm bg-white dark:bg-[#0f172a] placeholder-slate-400 dark:placeholder-slate-500"
                            style={{ color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto p-1">
                    <table className="w-full text-left border-collapse min-w-[1000px]">
                        <thead>
                            <tr className="border-b text-[10px] uppercase tracking-widest font-black" style={{ borderColor: 'var(--border-color)', color: 'var(--text-tertiary)' }}>
                                <th className="px-6 py-5">Participant</th>
                                <th className="px-6 py-5">Login Status</th>
                                <th className="px-6 py-5">Last Login</th>
                                <th className="px-6 py-5">Pledge Status</th>
                                <th className="px-6 py-5">Survey Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y" style={{ divideColor: 'var(--border-color)' }}>
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center opacity-50">Loading data...</td>
                                </tr>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center justify-center opacity-40">
                                            <Users className="w-12 h-12 mb-3" style={{ color: 'var(--text-secondary)' }} />
                                            <p className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>No participants found</p>
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
                                                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 border flex items-center justify-center font-black text-sm" style={{ borderColor: 'var(--border-color)', color: 'var(--text-tertiary)' }}>
                                                        {p.name?.charAt(0) || 'U'}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold whitespace-nowrap" style={{ color: 'var(--text-primary)' }}>{p.name}</p>
                                                        <p className="text-[10px] font-medium mt-0.5 opacity-70" style={{ color: 'var(--text-tertiary)' }}>{p.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${p.status === 'Active' ? 'bg-emerald-100/50 text-emerald-700 dark:text-emerald-400' : 'bg-red-100/50 text-red-700 dark:text-red-400'}`}>
                                                    {p.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 font-medium" style={{ color: 'var(--text-secondary)' }}>
                                                {p.last_login ? new Date(p.last_login).toLocaleDateString() : 'Never'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${p.pledge_status === 'Submitted' ? 'bg-blue-100/50 text-blue-700 dark:text-blue-400' : 'bg-orange-100/50 text-orange-700 dark:text-orange-400'}`}>
                                                    {p.pledge_status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${p.survey_status === 'Submitted' ? 'bg-purple-100/50 text-purple-700 dark:text-purple-400' : 'bg-slate-100/50 text-slate-700 dark:text-slate-400'}`}>
                                                    {p.survey_status}
                                                </span>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </AnimatePresence>
                            )}
                        </tbody>
                    </table>
                </div>
            </motion.div>
        </div>
    );
};

export default CompanyAdminStatusPage;
