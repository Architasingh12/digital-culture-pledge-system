import { useState, useEffect, useCallback } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';
import ExcelJS from 'exceljs';
import toast from 'react-hot-toast';
import axiosInstance from '../api/axiosInstance';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import { Users, CalendarClock, CalendarDays, Award, Star, TrendingDown, TrendingUp, Target, Search, RefreshCw, FileSpreadsheet, FileText, ChevronUp, ChevronDown } from 'lucide-react';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 15 },
    visible: { opacity: 1, scale: 1, y: 0 }
};

// ─── Colour palette ──────────────────────────────────────────────────────────
const PIE_COLORS = { H: '#10b981', M: '#f59e0b', L: '#f43f5e' }; // Emerald, Amber, Rose
const BAR_COLOR = '#6366f1'; // Indigo

// ─── KPI card component ───────────────────────────────────────────────────────
const KpiCard = ({ icon, label, value, sub, theme = 'blue' }) => {
    return (
        <motion.div variants={itemVariants} className="rounded-3xl border shadow-sm p-5 flex flex-col h-full group hover:shadow-md transition-shadow" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
            <div className="flex items-start gap-4 mb-2">
                <div className={`w-12 h-12 rounded-xl bg-${theme}-50 dark:bg-${theme}-900/10 text-${theme}-600 dark:text-${theme}-400 border border-${theme}-200 dark:border-${theme}-800/50 flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-110`}>
                    {icon}
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-semibold uppercase tracking-widest truncate leading-tight" style={{ color: 'var(--text-tertiary)' }}>{label}</p>
                    <p className="text-2xl lg:text-3xl font-semibold mt-1 leading-snug tracking-tight whitespace-normal break-normal" style={{ color: 'var(--text-primary)' }}>{value}</p>
                </div>
            </div>
            {sub && <p className="text-[11px] font-medium mt-auto pt-2 border-t" style={{ color: 'var(--text-secondary)', borderColor: 'var(--border-color)' }}>{sub}</p>}
        </motion.div>
    );
};

// ─── Pie label ───────────────────────────────────────────────────────────────
const PieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) => {
    if (percent < 0.05) return null;
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.55;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return (
        <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={700}>
            {name} {Math.round(percent * 100)}%
        </text>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const AdminReports = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [sortKey, setSortKey] = useState('name');
    const [sortDir, setSortDir] = useState('asc');

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await axiosInstance.get('/admin/report');
            setData(res.data);
        } catch {
            toast.error('Failed to load report data.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    // ── Derived ──────────────────────────────────────────────────────────────
    const pieData = data && data.levelDistribution ? [
        { name: 'H', value: parseInt(data.levelDistribution.H || 0, 10) },
        { name: 'M', value: parseInt(data.levelDistribution.M || 0, 10) },
        { name: 'L', value: parseInt(data.levelDistribution.L || 0, 10) },
    ] : [];

    // const totalSurveyResponses = pieData.reduce((acc, curr) => acc + curr.value, 0);+
     const totalSurveyResponses = data?.participants?.reduce(
        (sum, p) => sum + (parseInt(p.surveys_completed || 0, 10)),
        0
        ) || 0;

    const sortedParticipants = data ? [...data.participants]
        .filter(p => (p.name || '').toLowerCase().includes(search.toLowerCase()) ||
            (p.program_title || '').toLowerCase().includes(search.toLowerCase()))
        .sort((a, b) => {
            const av = a[sortKey] ?? ''; const bv = b[sortKey] ?? '';
            const cmp = typeof av === 'number' ? av - bv : String(av).localeCompare(String(bv));
            return sortDir === 'asc' ? cmp : -cmp;
        }) : [];

    const handleSort = (key) => {
        if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setSortKey(key); setSortDir('asc'); }
    };

    const SortIcon = ({ columnKey }) => {
        if (sortKey !== columnKey) return null;
        return sortDir === 'asc' ? <ChevronUp className="w-3 h-3 inline ml-1 text-blue-500" /> : <ChevronDown className="w-3 h-3 inline ml-1 text-blue-500" />;
    };

    // ── Export Excel ─────────────────────────────────────────────────────────
    const exportExcel = async () => {
        if (!data) return;
        try {
            const wb = new ExcelJS.Workbook();

            // Summary sheet
            const summarySheet = wb.addWorksheet('Summary');
            summarySheet.addRow(['Metric', 'Value']);
            summarySheet.addRow(['Total Participants', data.summary.totalParticipants]);
            summarySheet.addRow(['Avg Weekly Execution %', data.summary.avgWeeklyExecution + '%']);
            summarySheet.addRow(['Avg Monthly Execution %', data.summary.avgMonthlyExecution + '%']);
            summarySheet.addRow(['% with 100% Adherence', data.summary.adherencePct + '%']);
            summarySheet.addRow(['Most Chosen Practice', data.summary.mostChosenPractice]);
            summarySheet.addRow(['Least Chosen Practice', data.summary.leastChosenPractice]);
            summarySheet.addRow(['Avg Improvement Score', (data.summary.avgImprovementScore >= 0 ? '+' : '') + data.summary.avgImprovementScore + ' pts']);

            // Participants sheet
            const partSheet = wb.addWorksheet('Participants');
            partSheet.addRow(['Name', 'Email', 'Program', 'Weekly Practices', 'Monthly Practices', 'Key Behaviour', 'Surveys Completed', 'Surveys Total', 'Completion %']);
            data.participants.forEach(p => {
                partSheet.addRow([
                    p.name, p.email, p.program_title || '—',
                    p.weekly_count, p.monthly_count,
                    p.key_behaviour || '—',
                    p.surveys_completed, p.surveys_total, p.completion_pct + '%',
                ]);
            });

            // Download
            const buffer = await wb.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'digital-pledge-report.xlsx');
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            URL.revokeObjectURL(url);
            toast.success('Excel report downloaded!');
        } catch (err) {
            console.error('Excel export error:', err);
            toast.error('Failed to generate Excel report.');
        }
    };

    // ── Export PDF ───────────────────────────────────────────────────────────
    const exportPDF = async () => {
        const toastId = toast.loading('Generating PDF report...');
        try {
            const res = await axiosInstance.get('/admin/report/pdf', { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'digital-pledge-report.pdf');
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);
            toast.success('PDF report downloaded!', { id: toastId });
        } catch {
            toast.error('PDF generation failed. Please try Excel export.', { id: toastId });
        }
    };

    // ── Completion colour ─────────────────────────────────────────────────────
    const completionColor = (pct) => {
        if (pct >= 80) return 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800/50';
        if (pct >= 50) return 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/50';
        return 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/10 border-rose-200 dark:border-rose-800/50';
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="flex flex-col items-center gap-4">
                <div className="animate-spin h-10 w-10 rounded-full border-4 border-blue-600 border-t-transparent shadow-lg" />
                <p className="text-sm font-bold tracking-widest uppercase" style={{ color: 'var(--text-tertiary)' }}>Aggregating Analytics…</p>
            </div>
        </div>
    );

    if (!data) return (
        <div className="p-8 text-center" style={{ color: 'var(--text-secondary)' }}>Failed to load report data.</div>
    );

    const s = data.summary;

    return (
        <div className="p-4 lg:p-8 max-w-7xl mx-auto pb-24">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                <div>
                    <span className="inline-block px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 text-[10px] font-black tracking-widest mb-3 rounded-full uppercase border border-indigo-200 dark:border-indigo-800">
                        Admin Analytics
                    </span>
                    <h1 className="text-3xl lg:text-4xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>Reports & Insights</h1>
                    <p className="mt-2 text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Organization-wide digital culture pledge analytics</p>
                </div>
                <div className="flex flex-wrap gap-3 shrink-0">
                    <button onClick={load}
                        className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2"
                        style={{ color: 'var(--text-primary)' }}>
                        <RefreshCw className="w-4 h-4" /> Refresh
                    </button>
                    <button onClick={exportExcel}
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-md shadow-emerald-900/20 transition-all flex items-center justify-center gap-2 hover:scale-105 active:scale-95">
                        <FileSpreadsheet className="w-4 h-4" /> Export Excel
                    </button>
                    <button onClick={exportPDF}
                        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-900/20 transition-all flex items-center justify-center gap-2 hover:scale-105 active:scale-95">
                        <FileText className="w-4 h-4" /> Export PDF
                    </button>
                </div>
            </motion.div>

            {/* KPI Cards */}
            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
                <KpiCard icon={<Users className="w-5 h-5" />} label="Total Participants" value={s.totalParticipants} theme="blue" />
                <KpiCard icon={<CalendarClock className="w-5 h-5" />} label="Avg Weekly Execution" value={s.avgWeeklyExecution + '%'} theme="indigo" sub="Based on survey H/M/L responses" />
                <KpiCard icon={<CalendarDays className="w-5 h-5" />} label="Avg Monthly Execution" value={s.avgMonthlyExecution + '%'} theme="purple" />
                <KpiCard icon={<Award className="w-5 h-5" />} label="100% Adherence" value={s.adherencePct + '%'} theme="emerald" sub="Participants with all-H responses" />
                <KpiCard icon={<Star className="w-5 h-5" />} label="Most Chosen Practice" value={s.mostChosenPractice} theme="amber" sub="Top selected practice" />
                <KpiCard icon={<TrendingDown className="w-5 h-5" />} label="Least Chosen Practice" value={s.leastChosenPractice} theme="rose" sub="Bottom selected practice" />
                <KpiCard icon={<TrendingUp className="w-5 h-5" />} label="Avg Improvement Score" value={(s.avgImprovementScore >= 0 ? '+' : '') + s.avgImprovementScore + ' pts'} theme="cyan" sub="First vs latest survey wave" />
                <KpiCard icon={<Target className="w-5 h-5" />} label="Overall Execution" value={s.avgExecutionPct + '%'} theme="slate" sub="Across all survey responses" />
            </motion.div>

            {/* Charts row */}
            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid md:grid-cols-2 gap-6 mb-8">
                {/* Bar chart — practice popularity */}
                <motion.div variants={itemVariants} className="rounded-3xl border shadow-sm p-6 lg:p-8" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
                    <h2 className="font-bold mb-6 text-sm flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                        <span className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">📊</span>
                        Practice Popularity (Selections)
                    </h2>
                    {data.practiceCounts.length === 0 ? (
                        <p className="text-sm text-center py-12" style={{ color: 'var(--text-secondary)' }}>No practices selected yet.</p>
                    ) : (
                        <div className="w-full flex justify-center items-center min-h-[340px]">
                            <ResponsiveContainer width="100%" height={340}>
                                <BarChart data={data.practiceCounts} margin={{ top: 20, right: 20, left: -20, bottom: 90 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.2} vertical={false} />
                                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} angle={-45} textAnchor="end" interval={0} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} allowDecimals={false} />
                                <Tooltip
                                    formatter={(v, _n, props) => [v + ' selections', props.payload?.fullName || '']}
                                    contentStyle={{ borderRadius: '12px', fontSize: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)', backgroundColor: 'var(--bg-surface)', color: 'var(--text-primary)' }}
                                    cursor={{ fill: 'var(--text-tertiary)', opacity: 0.1 }}
                                />
                                    <Bar dataKey="count" fill={BAR_COLOR} radius={[6, 6, 0, 0]} maxBarSize={60} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </motion.div>

                {/* Pie chart — survey level distribution */}
                <motion.div variants={itemVariants} className="rounded-3xl border shadow-sm p-6 lg:p-8" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
                    <h2 className="font-bold mb-6 text-sm flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                        <span className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">🥧</span>
                        Survey Level Distribution (H / M / L)
                    </h2>
                    {totalSurveyResponses === 0 ? (
                        <p className="text-sm text-center py-12" style={{ color: 'var(--text-secondary)' }}>No survey responses yet.</p>
                    ) : (
                        <div className="w-full flex justify-center items-center min-h-[340px]">
                            <ResponsiveContainer width="100%" height={340}>
                                <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%"
                                        outerRadius={110} labelLine={false} label={<PieLabel />} stroke="var(--bg-surface)" strokeWidth={2}>
                                        {pieData.map(entry => (
                                            <Cell key={entry.name} fill={PIE_COLORS[entry.name]} />
                                        ))}
                                    </Pie>
                                <Legend
                                    formatter={(name) => <span style={{ color: 'var(--text-primary)', fontSize: '12px', fontWeight: 600 }}>{name === 'H' ? 'High (H)' : name === 'M' ? 'Medium (M)' : 'Low (L)'}</span>}
                                    iconType="circle"
                                />
                                <Tooltip
                                    formatter={(v, n) => [v + ' responses', n === 'H' ? 'High' : n === 'M' ? 'Medium' : 'Low']}
                                        contentStyle={{ borderRadius: '12px', fontSize: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)', backgroundColor: 'var(--bg-surface)', color: 'var(--text-primary)' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </motion.div>
            </motion.div>

            {/* Participant Table */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border shadow-sm overflow-hidden" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
                <div className="px-6 py-5 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/50" style={{ borderColor: 'var(--border-color)' }}>
                    <h2 className="font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                        <span className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">👥</span>
                        Participant-wise Summary
                    </h2>
                    <div className="relative w-full sm:w-64 shrink-0">
                        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search participants…"
                            className="w-full border rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all bg-white dark:bg-[#0f172a] placeholder-slate-400 dark:placeholder-slate-500 shadow-sm"
                            style={{ color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
                        />
                    </div>
                </div>
                <div className="overflow-x-auto p-1">
                    <table className="w-full text-sm min-w-[1000px]">
                        <thead>
                            <tr className="text-left border-b" style={{ borderColor: 'var(--border-color)' }}>
                                {[
                                    ['name', 'Participant'],
                                    ['program_title', 'Program'],
                                    ['weekly_count', 'Weekly'],
                                    ['monthly_count', 'Monthly'],
                                    ['completion_pct', 'Completion'],
                                    ['key_behaviour', 'Key Behaviour'],
                                    ['surveys_completed', 'Surveys Done'],
                                ].map(([key, label]) => (
                                    <th key={key}
                                        onClick={() => handleSort(key)}
                                        className="px-5 py-4 text-[10px] font-black uppercase tracking-widest cursor-pointer hover:text-blue-500 transition-colors select-none whitespace-nowrap group"
                                        style={{ color: 'var(--text-tertiary)' }}>
                                        <div className="flex items-center gap-1">
                                            {label} <SortIcon columnKey={key} />
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y" style={{ divideColor: 'var(--border-color)' }}>
                            {sortedParticipants.length === 0 ? (
                                <tr><td colSpan={7} className="text-center py-16 text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>No participants match your search criteria.</td></tr>
                            ) : sortedParticipants.map((p, i) => (
                                <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-xs lg:text-sm">
                                    <td className="px-5 py-4 font-bold whitespace-nowrap" style={{ color: 'var(--text-primary)' }}>
                                        {p.name}
                                        <span className="block text-[11px] font-semibold mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{p.email}</span>
                                    </td>
                                    <td className="px-5 py-4 font-medium" style={{ color: 'var(--text-secondary)' }}>{p.program_title || '—'}</td>
                                    <td className="px-5 py-4">
                                        <span className="px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-900/10 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50 font-bold textxs">{p.weekly_count}</span>
                                    </td>
                                    <td className="px-5 py-4">
                                        <span className="px-2.5 py-1 rounded-full bg-purple-50 dark:bg-purple-900/10 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800/50 font-bold text-xs">{p.monthly_count}</span>
                                    </td>
                                    <td className="px-5 py-4">
                                        <span className={`px-2.5 py-1 rounded-full border font-bold text-xs ${completionColor(parseInt(p.completion_pct) || 0)}`}>
                                            {p.completion_pct}%
                                        </span>
                                    </td>
                                    <td className="px-5 py-4 font-medium max-w-[200px] truncate" style={{ color: 'var(--text-secondary)' }} title={p.key_behaviour || ''}>
                                        {p.key_behaviour || '—'}
                                    </td>
                                    <td className="px-5 py-4 font-bold" style={{ color: 'var(--text-secondary)' }}>
                                        {p.surveys_completed} <span className="opacity-50">/ {p.surveys_total}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="px-6 py-4 border-t text-xs font-bold uppercase tracking-widest bg-slate-50/50 dark:bg-slate-900/50" style={{ borderColor: 'var(--border-color)', color: 'var(--text-tertiary)' }}>
                    Showing {sortedParticipants.length} of {data.participants.length} participants
                </div>
            </motion.div>
        </div>
    );
};

export default AdminReports;
