import { useState } from 'react';
import { Globe, Download, FileText, FileSpreadsheet, Users, BookOpen, BarChart2 } from 'lucide-react';
import toast from 'react-hot-toast';
import axiosInstance from '../api/axiosInstance';

const ReportSection = ({ icon, title, description, csvEndpoint, pdfEndpoint }) => {
    const [loadingCsv, setLoadingCsv] = useState(false);
    const [loadingPdf, setLoadingPdf] = useState(false);

    const downloadFile = async (endpoint, filename, type, setLoading) => {
        setLoading(true);
        const toastId = toast.loading(`Generating ${type.toUpperCase()}…`);
        try {
            const res = await axiosInstance.get(endpoint, { responseType: 'blob' });
            const mime = type === 'pdf' ? 'application/pdf' : 'text/csv';
            const url = window.URL.createObjectURL(new Blob([res.data], { type: mime }));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);
            toast.success(`${type.toUpperCase()} downloaded!`, { id: toastId });
        } catch {
            toast.error(`Failed to download ${type.toUpperCase()}.`, { id: toastId });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="rounded-2xl border p-5 sm:p-6" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
            <div className="flex items-start gap-4 mb-4">
                <div className="w-11 h-11 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 flex-shrink-0">
                    {icon}
                </div>
                <div>
                    <h2 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>{title}</h2>
                    <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>{description}</p>
                </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 mt-4 pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
                <button
                    onClick={() => downloadFile(csvEndpoint, csvEndpoint.split('/').pop().replace('csv', '') + 'report.csv', 'csv', setLoadingCsv)}
                    disabled={loadingCsv}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-70"
                >
                    {loadingCsv
                        ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        : <><FileSpreadsheet size={15} /> Download CSV</>
                    }
                </button>
                <button
                    onClick={() => downloadFile(pdfEndpoint, pdfEndpoint.split('/').pop().replace('pdf', '') + 'report.pdf', 'pdf', setLoadingPdf)}
                    disabled={loadingPdf}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-70"
                >
                    {loadingPdf
                        ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        : <><FileText size={15} /> Download PDF</>
                    }
                </button>
            </div>
        </div>
    );
};

const GlobalReportsPage = () => {
    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-6 sm:mb-8">
                <div className="flex items-center gap-2 mb-1">
                    <Globe size={22} className="text-blue-600" />
                    <h1 className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Global Reports</h1>
                </div>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    Download system-wide data across all companies in PDF or CSV format.
                </p>
            </div>

            {/* Report Sections */}
            <div className="space-y-4 sm:space-y-5">
                <ReportSection
                    icon={<Users size={20} />}
                    title="Participant Data"
                    description="All participants across every company — includes name, email, company, program, pledges, and survey completions."
                    csvEndpoint="/admin/global-reports/participants/csv"
                    pdfEndpoint="/admin/global-reports/participants/pdf"
                />
                <ReportSection
                    icon={<BookOpen size={20} />}
                    title="Pledge Reports"
                    description="All pledges signed across all companies — includes participant, program, north star, practices chosen, and submission date."
                    csvEndpoint="/admin/global-reports/pledges/csv"
                    pdfEndpoint="/admin/global-reports/pledges/pdf"
                />
                <ReportSection
                    icon={<BarChart2 size={20} />}
                    title="Survey Reports"
                    description="Survey completion data across all companies — includes participant, program, total surveys, completed count, and completion percentage."
                    csvEndpoint="/admin/global-reports/surveys/csv"
                    pdfEndpoint="/admin/global-reports/surveys/pdf"
                />
            </div>

            {/* Info note */}
            <div className="mt-6 p-4 rounded-xl border text-sm" style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-surface)' }}>
                <div className="flex items-start gap-2">
                    <Download size={15} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--text-tertiary)' }} />
                    <p>Reports include data from <strong style={{ color: 'var(--text-primary)' }}>all companies</strong>. CSV files open in Excel or Google Sheets. PDF files are formatted for printing.</p>
                </div>
            </div>
        </div>
    );
};

export default GlobalReportsPage;
