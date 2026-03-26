import { useState, useEffect, useCallback } from 'react';
import { Activity, RefreshCw, Building2, CheckCircle, XCircle, Users, FileText, BarChart2 } from 'lucide-react';
import toast from 'react-hot-toast';
import axiosInstance from '../api/axiosInstance';

const StatusBadge = ({ isActive }) => (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
        isActive
            ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50'
            : 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/50'
    }`}>
        {isActive
            ? <><CheckCircle size={11} /> Active</>
            : <><XCircle size={11} /> Inactive</>
        }
    </span>
);

const CompanyStatusPage = () => {
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await axiosInstance.get('/admin/company-status');
            if (res.data.success) {
                setCompanies(res.data.companies);
            }
        } catch {
            toast.error('Failed to load company status.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const formatDate = (d) => {
        if (!d) return '—';
        return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Activity size={22} className="text-blue-600" />
                        <h1 className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Company Status</h1>
                    </div>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        Overview of all registered companies and their activity.
                    </p>
                </div>
                <button
                    onClick={load}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors w-full sm:w-auto justify-center sm:justify-start"
                    style={{ backgroundColor: 'var(--bg-surface)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
                >
                    <RefreshCw size={15} /> Refresh
                </button>
            </div>

            {/* Loading */}
            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : companies.length === 0 ? (
                <div className="rounded-2xl border flex flex-col items-center justify-center py-20 gap-4"
                    style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
                    <div className="w-16 h-16 rounded-2xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                        <Building2 size={28} className="text-purple-600" />
                    </div>
                    <div className="text-center">
                        <h3 className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>No companies found</h3>
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Add companies via the Companies page.</p>
                    </div>
                </div>
            ) : (
                <>
                    {/* Desktop Table */}
                    <div className="hidden md:block rounded-2xl border overflow-hidden"
                        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b text-left" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-muted, rgba(0,0,0,0.02))' }}>
                                        <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Company</th>
                                        <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Status</th>
                                        <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Last Activity</th>
                                        <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-center" style={{ color: 'var(--text-tertiary)' }}>Users</th>
                                        <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-center" style={{ color: 'var(--text-tertiary)' }}>Pledges</th>
                                        <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-center" style={{ color: 'var(--text-tertiary)' }}>Surveys Done</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
                                    {companies.map((co) => (
                                        <tr key={co.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                                        {co.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{co.name}</p>
                                                        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{co.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4"><StatusBadge isActive={co.isActive} /></td>
                                            <td className="px-5 py-4 text-sm" style={{ color: 'var(--text-secondary)' }}>{formatDate(co.lastLogin)}</td>
                                            <td className="px-5 py-4 text-center">
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50">
                                                    <Users size={10} /> {co.totalUsers}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-center">
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/50">
                                                    <FileText size={10} /> {co.totalPledges}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-center">
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50">
                                                    <BarChart2 size={10} /> {co.surveyCompletions}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="px-5 py-3 border-t text-xs font-medium" style={{ borderColor: 'var(--border-color)', color: 'var(--text-tertiary)' }}>
                            {companies.length} {companies.length === 1 ? 'company' : 'companies'} · {companies.filter(c => c.isActive).length} active
                        </div>
                    </div>

                    {/* Mobile Cards */}
                    <div className="md:hidden space-y-4">
                        {companies.map((co) => (
                            <div key={co.id} className="rounded-2xl border p-4"
                                style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                                            {co.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{co.name}</p>
                                            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{co.email}</p>
                                        </div>
                                    </div>
                                    <StatusBadge isActive={co.isActive} />
                                </div>
                                <div className="grid grid-cols-3 gap-2 pt-3 border-t" style={{ borderColor: 'var(--border-color)' }}>
                                    <div className="text-center">
                                        <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{co.totalUsers}</p>
                                        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Users</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{co.totalPledges}</p>
                                        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Pledges</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{co.surveyCompletions}</p>
                                        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Surveys</p>
                                    </div>
                                </div>
                                <p className="text-xs mt-2" style={{ color: 'var(--text-tertiary)' }}>
                                    Last activity: {formatDate(co.lastLogin)}
                                </p>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default CompanyStatusPage;
