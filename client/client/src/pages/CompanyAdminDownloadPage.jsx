/* eslint-disable no-unused-vars */
import React from 'react';
import { motion } from 'framer-motion';
import { Download, Users, FileText, Activity } from 'lucide-react';
import toast from 'react-hot-toast';
import axiosInstance from '../api/axiosInstance';

const ReportCard = ({ title, desc, type, icon: Icon, colorClass, onDownload }) => (
    <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl border p-6 shadow-sm relative overflow-hidden group"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}
    >
        <div className={`absolute top-0 right-0 w-32 h-32 opacity-5 rounded-bl-full -z-10 ${colorClass}`} />

        <div className="flex items-start justify-between mb-8 z-10 relative">
            <div>
                <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>{title}</h3>
                <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{desc}</p>
            </div>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${colorClass}`}>
                <Icon className="w-5 h-5 text-white" />
            </div>
        </div>

        <div className="flex items-center gap-3 z-10 relative">
            <button
                onClick={() => onDownload(type, 'csv')}
                className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                style={{ color: 'var(--text-primary)' }}
            >
                CSV <Download className="w-4 h-4" />
            </button>
            <button
                onClick={() => onDownload(type, 'pdf')}
                className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
                PDF <Download className="w-4 h-4" />
            </button>
        </div>
    </motion.div>
);

const CompanyAdminDownloadPage = () => {

    const handleDownload = async (type, format) => {
        const toastId = toast.loading(`Generating ${format.toUpperCase()} report...`);
        try {
            const res = await axiosInstance.get(`/company-admin/downloads/${type}/${format}`, {
                responseType: 'blob'
            });

            const blob = new Blob([res.data], {
                type: format === 'pdf' ? 'application/pdf' : 'text/csv'
            });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Company-${type}-${new Date().toISOString().split('T')[0]}.${format}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            toast.success(`${format.toUpperCase()} report downloaded!`, { id: toastId });
        } catch (error) {
            console.error('Download err:', error);
            toast.error('Failed to generate report.', { id: toastId });
        }
    };

    return (
        <div className="p-4 lg:p-8 max-w-7xl mx-auto pb-24">
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
                <span className="inline-block px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[10px] font-black tracking-widest mb-3 rounded-full uppercase border border-amber-200 dark:border-amber-800">
                    Exports
                </span>
                <h1 className="text-3xl lg:text-4xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>Company Data</h1>
                <p className="mt-2 text-sm font-medium max-w-2xl" style={{ color: 'var(--text-secondary)' }}>
                    Export your company's participation metrics instantly. All data is exclusively scoped to your assigned workforce.
                </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <ReportCard
                    title="Participant Data"
                    desc="Export a comprehensive list of all assigned participants and their basic status details."
                    type="participants"
                    icon={Users}
                    colorClass="bg-emerald-500"
                    onDownload={handleDownload}
                />
                <ReportCard
                    title="Pledge Report"
                    desc="Download detailed pledge commitments, selected practices, and frequencies."
                    type="pledges"
                    icon={FileText}
                    colorClass="bg-blue-500"
                    onDownload={handleDownload}
                />
                <ReportCard
                    title="Survey Report"
                    desc="Retrieve raw survey results, completion timelines, and engagement metrics."
                    type="surveys"
                    icon={Activity}
                    colorClass="bg-purple-500"
                    onDownload={handleDownload}
                />
            </div>
        </div>
    );
};

export default CompanyAdminDownloadPage;
