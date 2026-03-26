/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, Send, Save, Users, Clock, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import axiosInstance from '../api/axiosInstance';

const AUDIENCES = [
    { id: 'inactive', label: 'Inactive Users', desc: 'Participants who have never logged in.', icon: Users },
    { id: 'pending_pledge', label: 'Pending Pledges', desc: "Participants who haven't submitted their pledge.", icon: AlertCircle },
    { id: 'pending_survey', label: 'Pending Surveys', desc: 'Participants with overdue or pending surveys.', icon: Clock },
];

const FREQUENCIES = [
    { id: 'weekly', label: 'Weekly' },
    { id: 'monthly', label: 'Monthly' },
    { id: 'quarterly', label: 'Quarterly' },
];

const ReminderCard = ({ audienceDef, configs, handleSave, handleSendNow, updateFrequency }) => {
    const config = configs[audienceDef.id] || { frequency: 'weekly', last_sent: null };
    const Icon = audienceDef.icon;

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl border p-6 lg:p-8 flex flex-col md:flex-row justify-between gap-8 bg-slate-50/50 dark:bg-slate-900/50"
            style={{ borderColor: 'var(--border-color)' }}
        >
            <div className="flex gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-200 dark:border-indigo-800/50">
                    <Icon strokeWidth={2.5} size={20} />
                </div>
                <div>
                    <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{audienceDef.label}</h3>
                    <p className="text-sm font-medium mt-1 mb-4" style={{ color: 'var(--text-secondary)' }}>{audienceDef.desc}</p>
                    {config.last_sent && (
                        <p className="text-[11px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                            Last Sent: {new Date(config.last_sent).toLocaleDateString()}
                        </p>
                    )}
                </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 shrink-0">

                <div className="w-full sm:w-auto">
                    <label className="block text-[10px] font-black uppercase tracking-widest mb-1.5 ml-1"
                        style={{ color: 'var(--text-tertiary)' }}>
                        Frequency
                    </label>

                    <select
                        value={config.frequency}
                        onChange={e => updateFrequency(audienceDef.id, e.target.value)}
                        className="w-full sm:w-40 border rounded-xl px-4 py-2.5 text-sm font-bold min-h-[44px] bg-white dark:bg-[#0f172a] shadow-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
                        style={{ color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
                    >
                        {FREQUENCIES.map(f => (
                            <option key={f.id} value={f.id}>{f.label}</option>
                        ))}
                    </select>
                </div>

                {/* Buttons aligned center */}
                <div className="flex items-center gap-2 w-full sm:w-auto sm:mt-5">
                    <button
                        onClick={() => handleSave(audienceDef.id)}
                        className="flex-1 sm:flex-none px-4 py-2.5 h-[44px] bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                        style={{ color: 'var(--text-primary)' }}
                    >
                        <Save className="w-4 h-4" /> Save
                    </button>

                    <button
                        onClick={() => handleSendNow(audienceDef.id)}
                        className="flex-1 sm:flex-none px-4 py-2.5 h-[44px] bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20"
                    >
                        <Send className="w-4 h-4" /> Send Now
                    </button>
                </div>

            </div>
        </motion.div>
    );
};

const CompanyAdminRemindersPage = () => {
    const [configs, setConfigs] = useState({});
    const [loading, setLoading] = useState(true);

    const fetchConfigs = async () => {
        setLoading(true);
        try {
            const res = await axiosInstance.get('/company-admin/reminders/config');
            if (res.data.success) {
                const configMap = {};
                res.data.configs.forEach(c => {
                    configMap[c.audience] = c;
                });
                setConfigs(configMap);
            }
        } catch (error) {
            console.error('fetchConfigs error:', error);
            toast.error('Failed to load reminder settings');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchConfigs();
    }, []);

    const handleSave = async (audience) => {
        const config = configs[audience] || { frequency: 'weekly' };
        const toastId = toast.loading('Saving schedule...');
        try {
            await axiosInstance.post('/company-admin/reminders/config', {
                audience,
                frequency: config.frequency
            });
            toast.success('Schedule saved!', { id: toastId });
            fetchConfigs();
        } catch (error) {
            console.error('handleSave error:', error);
            toast.error('Failed to save schedule.', { id: toastId });
        }
    };

    const handleSendNow = async (audience) => {
        const toastId = toast.loading('Triggering reminders immediately...');
        try {
            const res = await axiosInstance.post('/company-admin/reminders/send', { audience });
            toast.success(res.data.message || 'Reminders sent out!', { id: toastId });
            fetchConfigs(); // To update last_sent
        } catch (error) {
            console.error('handleSendNow error:', error);
            toast.error('Failed to send reminders.', { id: toastId });
        }
    };

    const updateFrequency = (audience, frequency) => {
        setConfigs({
            ...configs,
            [audience]: {
                ...configs[audience],
                audience,
                frequency
            }
        });
    };

    return (
        <div className="p-4 lg:p-8 max-w-7xl mx-auto pb-24">
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
                <span className="inline-block px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-[10px] font-black tracking-widest mb-3 rounded-full uppercase border border-red-200 dark:border-red-800">
                    Notifications
                </span>
                <h1 className="text-3xl lg:text-4xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>Reminders &amp; Engagement</h1>
                <p className="mt-2 text-sm font-medium max-w-2xl" style={{ color: 'var(--text-secondary)' }}>
                    Trigger real-time communication pushes to specific segments of your workforce, or configure scheduled automated follow-ups.
                </p>
            </motion.div>

            {loading ? (
                <div className="animate-pulse space-y-6">
                    <div className="h-40 bg-slate-100 dark:bg-slate-800/50 rounded-3xl"></div>
                    <div className="h-40 bg-slate-100 dark:bg-slate-800/50 rounded-3xl"></div>
                </div>
            ) : (
                <div className="space-y-6">
                    {AUDIENCES.map(aud => (
                        <ReminderCard
                            key={aud.id}
                            audienceDef={aud}
                            configs={configs}
                            handleSave={handleSave}
                            handleSendNow={handleSendNow}
                            updateFrequency={updateFrequency}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default CompanyAdminRemindersPage;
