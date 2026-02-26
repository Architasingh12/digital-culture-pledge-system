import { useEffect, useState } from 'react';
import axiosInstance from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { Target, ClipboardList, ShieldCheck, PieChart, ArrowRight } from 'lucide-react';

const StatCard = ({ label, value, icon, colorClass }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded-3xl p-6 shadow-sm border flex items-center justify-between hover:shadow-md transition-shadow group cursor-default"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}
    >
        <div>
            <p className="text-xs font-bold tracking-wide uppercase mb-1" style={{ color: 'var(--text-tertiary)' }}>{label}</p>
            <p className="text-4xl font-black" style={{ color: 'var(--text-primary)' }}>{value ?? '—'}</p>
        </div>
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-inner ${colorClass} group-hover:scale-105 transition-transform`}>
            {icon}
        </div>
    </motion.div>
);

const SkeletonCard = () => (
    <div className="rounded-3xl p-6 shadow-sm border animate-pulse flex justify-between items-center" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
        <div className="space-y-3">
            <div className="h-3 w-24 rounded" style={{ backgroundColor: 'var(--border-color)' }}></div>
            <div className="h-8 w-16 rounded" style={{ backgroundColor: 'var(--border-color)' }}></div>
        </div>
        <div className="w-14 h-14 rounded-2xl" style={{ backgroundColor: 'var(--border-color)' }}></div>
    </div>
);

const DashboardPage = () => {
    const { user, isAdmin } = useAuth();
    const [stats, setStats] = useState({ myTotal: 0, adminTotal: 0, programs: 0, users: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        const fetchData = async () => {
            setLoading(true);
            try {
                const [myRes, progRes] = await Promise.all([
                    axiosInstance.get('/pledges/my').catch(() => ({ data: { pledges: [] } })),
                    axiosInstance.get('/programs').catch(() => ({ data: { programs: [] } }))
                ]);

                let adminTotal = 0;
                if (isAdmin) {
                    try {
                        const adminRes = await axiosInstance.get('/pledges/all');
                        adminTotal = adminRes.data?.total || (adminRes.data?.pledges || []).length || 0;
                    } catch (adminErr) {
                        console.error('Admin pledges fetch error:', adminErr);
                    }
                }

                if (isMounted) {
                    setStats({
                        myTotal: (myRes.data?.pledges || []).length,
                        adminTotal,
                        programs: (progRes.data?.programs || []).length,
                        users: 0
                    });
                }
            } catch (err) {
                console.error('Dashboard fetch error:', err);
            } finally {
                if (isMounted) setLoading(false);
            }
        };
        fetchData();
        return () => { isMounted = false; };
    }, [isAdmin]);

    return (
        <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-8">
            {/* Welcome banner */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="bg-gradient-to-br from-blue-900 via-indigo-800 to-indigo-600 rounded-3xl p-8 lg:p-10 text-white relative overflow-hidden shadow-xl shadow-indigo-900/20"
            >
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
                <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <span className="inline-block px-3 py-1 bg-white/10 rounded-full text-blue-100 text-[10px] font-black tracking-widest mb-4 border border-white/10 uppercase">
                            Dashboard Overview
                        </span>
                        <h2 className="text-3xl lg:text-4xl font-black mb-2 tracking-tight">Welcome back, {user?.name.split(' ')[0]} </h2>
                        <p className="text-indigo-100 text-sm opacity-90 font-medium">
                            {user?.designation && <span className="mr-3">{user.designation}</span>}
                            {user?.email}
                        </p>
                    </div>
                    <div className="flex gap-3 shrink-0">
                        <Link
                            to="/pledge"
                            className="bg-white text-indigo-900 font-bold px-6 py-3.5 rounded-xl hover:bg-indigo-50 transition-colors shadow-lg shadow-black/10 flex items-center gap-2 group"
                        >
                            Make a Pledge <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                </div>
            </motion.div>

            {/* Content Area */}
            <div className="space-y-8">
                {/* My Activity Section */}
                <div>
                    <h3 className="text-lg font-bold mb-4 px-1" style={{ color: 'var(--text-primary)' }}>My Activity</h3>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {loading ? (
                            <>
                                <SkeletonCard />
                                <SkeletonCard />
                            </>
                        ) : stats.myTotal === 0 && stats.programs === 0 ? (
                            <p className="col-span-full text-sm font-medium py-4 px-1" style={{ color: 'var(--text-tertiary)' }}>No activity available yet</p>
                        ) : (
                            <>
                                <StatCard label="My Total Pledges" value={stats.myTotal} icon={<ClipboardList size={28} />} colorClass="bg-gradient-to-br from-blue-400 to-blue-600" />
                                <StatCard label="Active Programs" value={stats.programs} icon={<Target size={28} />} colorClass="bg-gradient-to-br from-indigo-400 to-indigo-600" />
                            </>
                        )}
                    </div>
                </div>

                {/* Admin Section */}
                {isAdmin ? (
                    <div>
                        <h3 className="text-lg font-bold mb-4 px-1 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                            Organization Stats
                            <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-widest border border-amber-200 dark:border-amber-800">Admin</span>
                        </h3>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {loading ? (
                                <>
                                    <SkeletonCard />
                                    <SkeletonCard />
                                </>
                            ) : stats.adminTotal === 0 && stats.programs === 0 ? (
                                <p className="col-span-full text-sm font-medium py-4 px-1" style={{ color: 'var(--text-tertiary)' }}>No organization data available yet</p>
                            ) : (
                                <>
                                    <StatCard label="Total Org Pledges" value={stats.adminTotal} icon={<ShieldCheck size={28} />} colorClass="bg-gradient-to-br from-slate-500 to-slate-700" />
                                    <StatCard label="Total Programs" value={stats.programs} icon={<PieChart size={28} />} colorClass="bg-gradient-to-br from-emerald-400 to-emerald-600" />
                                </>
                            )}
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    );
};

export default DashboardPage;
