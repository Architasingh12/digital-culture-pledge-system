import { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import toast from 'react-hot-toast';

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
            } catch (err) {
                toast.error('Failed to load dashboard metrics');
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center p-24">
                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-4 lg:p-8 max-w-7xl mx-auto animate-in fade-in">
            <div className="mb-8">
                <h1 className="text-slate-900 font-bold text-3xl">Dashboard Overview</h1>
                <p className="text-slate-500 mt-1">Real-time metrics for your organization's cultural pledges.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

                {/* Card 1 */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                    <div className="relative z-10">
                        <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex flex-col justify-center items-center text-2xl shadow-sm mb-4">👥</div>
                        <p className="text-slate-500 font-medium text-sm">Total Participants</p>
                        <h3 className="text-3xl font-black text-slate-800 mt-1">{stats.totalParticipants}</h3>
                    </div>
                </div>

                {/* Card 2 */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                    <div className="relative z-10">
                        <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex flex-col justify-center items-center text-2xl shadow-sm mb-4">📋</div>
                        <p className="text-slate-500 font-medium text-sm">Pledges Submitted</p>
                        <h3 className="text-3xl font-black text-slate-800 mt-1">{stats.totalPledges}</h3>
                    </div>
                </div>

                {/* Card 3 */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                    <div className="relative z-10">
                        <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex flex-col justify-center items-center text-2xl shadow-sm mb-4">✅</div>
                        <p className="text-slate-500 font-medium text-sm">Survey Completion</p>
                        <h3 className="text-3xl font-black text-slate-800 mt-1">{stats.surveyCompletionRate}</h3>
                    </div>
                </div>

                {/* Card 4 */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                    <div className="relative z-10">
                        <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex flex-col justify-center items-center text-2xl shadow-sm mb-4">🔥</div>
                        <p className="text-slate-500 font-medium text-sm">Avg Execution %</p>
                        <h3 className="text-3xl font-black text-slate-800 mt-1">{stats.avgExecutionPercentage}</h3>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default AdminDashboardOverview;
