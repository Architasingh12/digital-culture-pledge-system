import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import axiosInstance from '../api/axiosInstance';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarClock, PlusCircle, CheckCircle2, Play, Pause, Trash2, LayoutList, History } from 'lucide-react';

const INTERVAL_PRESETS = [
    { label: '30 Days', value: 30 },
    { label: '60 Days', value: 60 },
    { label: '90 Days', value: 90 },
    { label: 'Custom', value: 'custom' },
];

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariants = {
    hidden: { opacity: 0, scale: 0.98, y: 10 },
    visible: { opacity: 1, scale: 1, y: 0 }
};

const AdminSurveys = () => {
    const [programs, setPrograms] = useState([]);
    const [schedules, setSchedules] = useState([]);
    const [instances, setInstances] = useState([]);
    const [tab, setTab] = useState('schedules'); // 'schedules' | 'instances'
    const [loading, setLoading] = useState(true);

    // Create form
    const [form, setForm] = useState({ program_id: '', label: '', interval_days: 30, start_date: new Date().toISOString().slice(0, 10) });
    const [customInterval, setCustomInterval] = useState('');
    const [selectedPreset, setSelectedPreset] = useState(30);
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            await Promise.all([
                fetchPrograms(),
                fetchSchedules(),
                fetchInstances()
            ]);
            setLoading(false);
        };
        init();
    }, []);

    const fetchPrograms = async () => {
        try {
            const res = await axiosInstance.get('/programs');
            setPrograms(res.data.programs || []);
        } catch { /* ignore */ }
    };

    const fetchSchedules = async () => {
        try {
            const res = await axiosInstance.get('/surveys/schedules');
            setSchedules(res.data.schedules || []);
        } catch { /* ignore */ }
    };

    const fetchInstances = async () => {
        try {
            const res = await axiosInstance.get('/surveys/all-instances');
            setInstances(res.data.instances || []);
        } catch { /* ignore */ }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!form.program_id || !form.label) return toast.error('Please fill all required fields.');
        const days = selectedPreset === 'custom' ? parseInt(customInterval) : selectedPreset;
        if (!days || days < 1) return toast.error('Please enter a valid interval.');
        setCreating(true);
        try {
            await axiosInstance.post('/surveys/schedules', { ...form, interval_days: days });
            toast.success('Survey schedule created successfully!');
            setForm({ program_id: '', label: '', interval_days: 30, start_date: new Date().toISOString().slice(0, 10) });
            setSelectedPreset(30);
            fetchSchedules();
        } catch {
            toast.error('Failed to create schedule.');
        } finally {
            setCreating(false);
        }
    };

    const toggleActive = async (schedule) => {
        try {
            await axiosInstance.put('/surveys/schedules/' + schedule.id, { is_active: !schedule.is_active });
            toast.success(`Schedule ${!schedule.is_active ? 'activated' : 'deactivated'}`);
            fetchSchedules();
        } catch {
            toast.error('Failed to update schedule status.');
        }
    };

    const deleteSchedule = async (id) => {
        if (!window.confirm('Delete this schedule? All related survey instances will also be removed. This cannot be undone.')) return;
        try {
            await axiosInstance.delete('/surveys/schedules/' + id);
            toast.success('Schedule deleted successfully.');
            fetchSchedules();
        } catch {
            toast.error('Failed to delete schedule.');
        }
    };

    const statusBadge = (completed_at) => completed_at
        ? <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50">Completed</span>
        : <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50">Pending</span>;

    if (loading) {
        return (
            <div className="p-12 text-center text-slate-500 flex flex-col items-center gap-4">
                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <p className="font-bold tracking-widest uppercase text-xs">Loading Scheduler Engine...</p>
            </div>
        );
    }

    return (
        <div className="p-4 lg:p-8 max-w-7xl mx-auto pb-24">
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                <span className="inline-block px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-[10px] font-black tracking-widest mb-3 rounded-full uppercase border border-blue-200 dark:border-blue-800">
                    Automation Engine
                </span>
                <h1 className="text-3xl lg:text-4xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>Survey Scheduler</h1>
                <p className="mt-2 text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Configure automated survey intervals and track participant pulse responses across programs.</p>
            </motion.div>

            {/* Tabs */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2 mb-8 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl w-fit border shadow-inner" style={{ borderColor: 'var(--border-color)' }}>
                {[
                    { key: 'schedules', label: 'Configuration Matrix', icon: <LayoutList className="w-4 h-4" /> },
                    { key: 'instances', label: 'Delivery Log', icon: <History className="w-4 h-4" /> }
                ].map(({ key, label, icon }) => (
                    <button
                        key={key}
                        onClick={() => setTab(key)}
                        className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${tab === key ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400 border border-slate-200 dark:border-slate-600' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700/50 border border-transparent'}`}
                    >
                        {icon} {label}
                    </button>
                ))}
            </motion.div>

            {tab === 'schedules' && (
                <div className="grid lg:grid-cols-5 gap-6">
                    {/* Create Form */}
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-2 rounded-3xl border shadow-sm p-6 lg:p-8" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
                        <div className="flex items-center gap-3 mb-6 pb-6 border-b" style={{ borderColor: 'var(--border-color)' }}>
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold shadow-lg shadow-blue-900/20">
                                <PlusCircle className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="font-black text-xl tracking-tight" style={{ color: 'var(--text-primary)' }}>Create Schedule</h2>
                                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>Automation Rule</p>
                            </div>
                        </div>

                        <form onSubmit={handleCreate} className="flex flex-col gap-5">
                            <div>
                                <label className="text-[11px] font-black uppercase tracking-widest block mb-2" style={{ color: 'var(--text-secondary)' }}>Target Program *</label>
                                <select
                                    value={form.program_id}
                                    onChange={e => setForm(f => ({ ...f, program_id: e.target.value }))}
                                    className="w-full rounded-xl px-4 py-3.5 text-sm font-bold focus:ring-2 focus:ring-blue-500 border outline-none transition-shadow shadow-sm cursor-pointer appearance-none bg-slate-50 dark:bg-slate-800/50"
                                    style={{ color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
                                    required
                                >
                                    <option value="">Select a program...</option>
                                    {programs.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-[11px] font-black uppercase tracking-widest block mb-2" style={{ color: 'var(--text-secondary)' }}>Schedule Label *</label>
                                <input
                                    type="text"
                                    value={form.label}
                                    onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
                                    placeholder="e.g. Q1 Pulse Survey"
                                    className="w-full rounded-xl px-4 py-3.5 text-sm font-bold focus:ring-2 focus:ring-blue-500 border outline-none transition-shadow bg-transparent placeholder-slate-400 shadow-sm"
                                    style={{ color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-[11px] font-black uppercase tracking-widest block mb-3" style={{ color: 'var(--text-secondary)' }}>Delivery Interval</label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-2 mb-3">
                                    {INTERVAL_PRESETS.map(p => (
                                        <button
                                            key={p.value}
                                            type="button"
                                            onClick={() => setSelectedPreset(p.value)}
                                            className={`px-3 py-2.5 rounded-xl text-xs font-bold border-2 transition-all ${selectedPreset === p.value ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-500 shadow-sm' : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                                        >
                                            {p.label}
                                        </button>
                                    ))}
                                </div>
                                {selectedPreset === 'custom' && (
                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                                        <input
                                            type="number"
                                            min="1"
                                            value={customInterval}
                                            onChange={e => setCustomInterval(e.target.value)}
                                            placeholder="Enter precise days (e.g. 45)"
                                            className="w-full rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-500 border outline-none transition-shadow bg-transparent shadow-sm mt-1"
                                            style={{ color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
                                        />
                                    </motion.div>
                                )}
                            </div>
                            <div>
                                <label className="text-[11px] font-black uppercase tracking-widest block mb-2" style={{ color: 'var(--text-secondary)' }}>Commencement Date</label>
                                <input
                                    type="date"
                                    value={form.start_date}
                                    onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))}
                                    className="w-full rounded-xl px-4 py-3.5 text-sm font-bold focus:ring-2 focus:ring-blue-500 border outline-none transition-shadow bg-transparent shadow-sm"
                                    style={{ color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={creating}
                                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-slate-800 to-slate-900 dark:from-blue-600 dark:to-indigo-600 hover:from-slate-700 hover:to-slate-800 dark:hover:from-blue-700 dark:hover:to-indigo-700 text-white font-bold py-4 rounded-xl shadow-xl shadow-slate-900/20 dark:shadow-blue-900/20 transition-all hover:scale-[1.02] active:scale-[0.98] mt-2 disabled:opacity-70 disabled:transform-none"
                            >
                                {creating ? 'Deploying...' : 'Deploy Schedule'}
                            </button>
                        </form>
                    </motion.div>

                    {/* Schedules Table */}
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-3 rounded-3xl border shadow-sm overflow-hidden flex flex-col" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
                        <div className="px-6 py-5 border-b bg-slate-50/50 dark:bg-slate-900/50" style={{ borderColor: 'var(--border-color)' }}>
                            <h2 className="font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                                <span className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                                    <CalendarClock className="w-4 h-4" />
                                </span>
                                Active Automation Rules
                            </h2>
                        </div>
                        <div className="divide-y overflow-y-auto custom-scrollbar flex-1" style={{ divideColor: 'var(--border-color)', maxHeight: '600px' }}>
                            {schedules.length === 0 ? (
                                <div className="p-16 text-center">
                                    <CalendarClock className="w-12 h-12 mx-auto mb-4 opacity-30" style={{ color: 'var(--text-secondary)' }} />
                                    <p className="font-bold text-lg mb-1" style={{ color: 'var(--text-primary)' }}>No Schedules Configured</p>
                                    <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Create rules to automate survey dispatch.</p>
                                </div>
                            ) : (
                                <AnimatePresence>
                                    {schedules.map(s => (
                                        <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} key={s.id} className="px-6 py-5 flex items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-3 mb-1.5">
                                                    <p className="font-bold text-base truncate" style={{ color: 'var(--text-primary)' }}>{s.label}</p>
                                                    <span className={`px-2 py-0.5 text-[10px] font-black uppercase tracking-widest rounded-md border ${s.is_active ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'}`}>
                                                        {s.is_active ? 'Active' : 'Paused'}
                                                    </span>
                                                </div>
                                                <p className="text-sm font-medium leading-relaxed truncate mb-1" style={{ color: 'var(--text-secondary)' }}>{s.program_title} <span className="opacity-50 mx-1">•</span> <span className="font-bold">Every {s.interval_days} days</span></p>
                                                <p className="text-[11px] font-bold uppercase tracking-widest flex items-center gap-1.5" style={{ color: 'var(--text-tertiary)' }}>
                                                    <CalendarClock className="w-3.5 h-3.5" /> Next trigger: <span className="text-indigo-600 dark:text-indigo-400">{s.next_due_date?.slice(0, 10) || 'Pending'}</span>
                                                </p>
                                            </div>
                                            <div className="flex flex-col sm:flex-row items-center gap-2 shrink-0 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => toggleActive(s)}
                                                    className={`p-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center ${s.is_active ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-800' : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-800'}`}
                                                    title={s.is_active ? "Pause Schedule" : "Resume Schedule"}
                                                >
                                                    {s.is_active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                                                </button>
                                                <button
                                                    onClick={() => deleteSchedule(s.id)}
                                                    className="p-2.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-800 rounded-xl transition-colors shadow-sm"
                                                    title="Delete Schedule"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}

            {tab === 'instances' && (
                <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="rounded-3xl border shadow-sm overflow-hidden" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
                    <div className="px-6 py-5 border-b bg-slate-50/50 dark:bg-slate-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4" style={{ borderColor: 'var(--border-color)' }}>
                        <div>
                            <h2 className="font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                                <span className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                                    <History className="w-4 h-4" />
                                </span>
                                Dispatched Instances Log
                            </h2>
                            <p className="text-[11px] font-black uppercase tracking-widest mt-1.5 ml-10" style={{ color: 'var(--text-tertiary)' }}>System-generated records</p>
                        </div>
                    </div>
                    <div className="overflow-x-auto p-1">
                        <table className="w-full text-sm min-w-[900px]">
                            <thead>
                                <tr className="border-b" style={{ borderColor: 'var(--border-color)', color: 'var(--text-tertiary)' }}>
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-left">Participant</th>
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-left">Program Alignment</th>
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-left">Parent Schedule</th>
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-left">Due Threshold</th>
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-left">Current Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y" style={{ divideColor: 'var(--border-color)' }}>
                                {instances.length === 0 ? (
                                    <tr><td colSpan={5} className="text-center py-16 text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>No survey instances dispatched yet.</td></tr>
                                ) : (
                                    <AnimatePresence>
                                        {instances.map(inst => (
                                            <motion.tr layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} key={inst.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                                                <td className="px-6 py-4 font-bold" style={{ color: 'var(--text-primary)' }}>
                                                    {inst.user_name} <span className="block text-[11px] font-semibold mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{inst.email}</span>
                                                </td>
                                                <td className="px-6 py-4 font-medium" style={{ color: 'var(--text-secondary)' }}>{inst.program_title}</td>
                                                <td className="px-6 py-4 font-medium" style={{ color: 'var(--text-secondary)' }}>{inst.label}</td>
                                                <td className="px-6 py-4 font-medium flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                                                    <CalendarClock className="w-3.5 h-3.5 opacity-50" /> {inst.due_date?.slice(0, 10)}
                                                </td>
                                                <td className="px-6 py-4">{statusBadge(inst.completed_at)}</td>
                                            </motion.tr>
                                        ))}
                                    </AnimatePresence>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="px-6 py-4 border-t text-[10px] font-black uppercase tracking-widest bg-slate-50/50 dark:bg-slate-900/50" style={{ borderColor: 'var(--border-color)', color: 'var(--text-tertiary)' }}>
                        Showing {instances.length} historical records
                    </div>
                </motion.div>
            )}
        </div>
    );
};

export default AdminSurveys;
