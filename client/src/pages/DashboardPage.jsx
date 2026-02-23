import { useEffect, useState } from 'react';
import axiosInstance from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const StatCard = ({ label, value, icon, color }) => (
    <div className={`bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex items-center justify-between hover:shadow-md transition-shadow`}>
        <div>
            <p className="text-slate-500 text-sm font-bold tracking-wide uppercase">{label}</p>
            <p className="text-slate-900 text-4xl font-black mt-1">{value ?? '—'}</p>
        </div>
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl ${color}`}>
            {icon}
        </div>
    </div>
);

const DashboardPage = () => {
    const { user, isAdmin } = useAuth();
    const [stats, setStats] = useState({ myTotal: 0, adminTotal: 0, programs: 0, users: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [myRes, adminRes, progRes] = await Promise.all([
                    axiosInstance.get('/pledges/my'),
                    isAdmin ? axiosInstance.get('/pledges/all') : Promise.resolve({ data: { total: 0 } }),
                    axiosInstance.get('/programs')
                ]);

                setStats({
                    myTotal: myRes.data.pledges?.length || 0,
                    adminTotal: adminRes.data.total || 0,
                    programs: progRes.data.programs?.length || 0,
                    users: 0 // Will implement unique user count later if needed
                });
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [isAdmin]);

    return (
        <div className="p-4 lg:p-8 max-w-7xl mx-auto">
            {/* Welcome banner */}
            <div className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-600 rounded-3xl p-8 lg:p-10 mb-8 text-white relative overflow-hidden shadow-xl shadow-blue-900/20">
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
                <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <span className="inline-block px-3 py-1 bg-white/10 rounded-full text-blue-200 text-xs font-bold tracking-wider mb-4 border border-white/10 uppercase">
                            Dashboard Overview
                        </span>
                        <h2 className="text-3xl lg:text-4xl font-black mb-2 tracking-tight">Welcome back, {user?.name.split(' ')[0]} 👋</h2>
                        <p className="text-blue-100 text-lg opacity-90">
                            {user?.designation && <span className="mr-3">{user.designation}</span>}
                            {user?.email}
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <Link
                            to="/pledge"
                            className="bg-white text-blue-900 font-bold px-6 py-3.5 rounded-xl hover:bg-blue-50 transition-colors shadow-lg shadow-black/10 flex items-center gap-2"
                        >
                            <span>✍️</span> Make a Pledge
                        </Link>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center p-12">
                    <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : (
                <div className="space-y-8">

                    <div>
                        <h3 className="text-xl font-bold text-slate-800 mb-4 px-1">My Activity</h3>
                        <div className="grid sm:grid-cols-2 gap-4">
                            <StatCard label="My Total Pledges" value={stats.myTotal} icon="📋" color="bg-blue-100 text-blue-600" />
                            <StatCard label="Active Programs" value={stats.programs} icon="🎯" color="bg-indigo-100 text-indigo-600" />
                        </div>
                    </div>

                    {isAdmin && (
                        <div>
                            <h3 className="text-xl font-bold text-slate-800 mb-4 px-1 flex items-center gap-2">
                                Organization Stats <span className="bg-amber-100 text-amber-700 text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-widest">Admin</span>
                            </h3>
                            <div className="grid sm:grid-cols-2 gap-4">
                                <StatCard label="Total Org Pledges" value={stats.adminTotal} icon="🏛️" color="bg-slate-100 text-slate-600" />
                                <StatCard label="Total Programs" value={stats.programs} icon="📊" color="bg-emerald-100 text-emerald-600" />
                            </div>
                        </div>
                    )}

                </div>
            )}
        </div>
    );
};

export default DashboardPage;
