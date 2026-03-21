import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Building2, UserCog, Users, TrendingUp } from 'lucide-react';
import axiosInstance from '../api/axiosInstance';

const StatCard = ({ icon, label, value, sub, color }) => (
    <div className="rounded-2xl border p-5 sm:p-6 flex items-start gap-4 transition-all hover:shadow-md min-w-0"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
        <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
            {icon}
        </div>
        <div className="min-w-0">
            <p className="text-2xl font-bold truncate" style={{ color: 'var(--text-primary)' }}>{value}</p>
            <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{label}</p>
            {sub && <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{sub}</p>}
        </div>
    </div>
);

const SuperAdminDashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        totalCompanies: '—',
        companyAdmins: '—',
        totalParticipants: '—',
        activeProgrammes: '—',
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await axiosInstance.get('/admin/super-dashboard-stats');
                if (res.data.success) {
                    setStats(res.data.stats);
                }
            } catch {
                // Keep defaults on error
            }
        };
        fetchStats();
    }, []);

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-6 sm:mb-8">
                <h1 className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                    Super Admin Dashboard
                </h1>
                <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    Welcome back, {user?.name}. Here&apos;s a system-wide overview.
                </p>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6 sm:mb-8">
                <StatCard
                    icon={<Building2 size={22} className="text-purple-600" />}
                    label="Total Companies"
                    value={stats.totalCompanies}
                    sub="Registered organisations"
                    color="bg-purple-100 dark:bg-purple-900/30"
                />
                <StatCard
                    icon={<UserCog size={22} className="text-blue-600" />}
                    label="Company Admins"
                    value={stats.companyAdmins}
                    sub="Active admins"
                    color="bg-blue-100 dark:bg-blue-900/30"
                />
                <StatCard
                    icon={<Users size={22} className="text-emerald-600" />}
                    label="Total Participants"
                    value={stats.totalParticipants}
                    sub="Across all companies"
                    color="bg-emerald-100 dark:bg-emerald-900/30"
                />
                <StatCard
                    icon={<TrendingUp size={22} className="text-amber-600" />}
                    label="Active Programmes"
                    value={stats.activeProgrammes}
                    sub="Running across companies"
                    color="bg-amber-100 dark:bg-amber-900/30"
                />
            </div>

            {/* Info banner */}
            <div className="rounded-2xl border p-5 sm:p-6" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
                <h2 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>System Management</h2>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    Use the sidebar to manage <strong>Companies</strong>, assign <strong>Company Admins</strong>,
                    and view system-wide <strong>Analytics</strong>.
                </p>
            </div>
        </div>
    );
};

export default SuperAdminDashboard;
