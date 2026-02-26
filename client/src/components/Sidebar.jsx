import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, PenTool, ClipboardList, BarChart, Settings, Users, Sparkles, BookOpen, LogOut, FileText, CheckCircle, Database } from 'lucide-react';

const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { to: '/pledge', label: 'Sign Pledge', icon: <PenTool size={20} /> },
    { to: '/my-pledges', label: 'My Pledges', icon: <ClipboardList size={20} /> },
    { to: '/my-surveys', label: 'My Surveys', icon: <CheckCircle size={20} /> },
];

const adminItems = [
    { to: '/admin', label: 'Dashboard Overview', icon: <LayoutDashboard size={20} /> },
    { to: '/admin/wizard', label: 'New Program Wizard', icon: <Sparkles size={20} /> },
    { to: '/admin/programs', label: 'Programs', icon: <BookOpen size={20} /> },
    { to: '/admin/practices', label: 'Manage Practices', icon: <Database size={20} /> },
    { to: '/admin/surveys', label: 'Survey Scheduler', icon: <Settings size={20} /> },
    { to: '/admin/reports', label: 'Reports', icon: <BarChart size={20} /> },
    { to: '/admin/participants', label: 'Participants List', icon: <Users size={20} /> },
];

const Sidebar = ({ open, onClose }) => {
    const { user, logout, isAdmin } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const allItems = isAdmin ? [...navItems, ...adminItems] : navItems;

    return (
        <>
            {/* Mobile overlay */}
            {open && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <aside className={`
        fixed top-0 left-0 h-full w-64 z-50 flex flex-col
        shadow-2xl transition-transform duration-300
        ${open ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
      `} style={{ backgroundColor: 'var(--bg-surface)', borderRight: '1px solid var(--border-color)' }}>
                {/* Logo */}
                <div className="flex items-center gap-3 px-6 py-6 border-b" style={{ borderColor: 'var(--border-color)' }}>
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-lg">
                        <FileText size={20} />
                    </div>
                    <div>
                        <p className="font-bold text-sm leading-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">Digital Culture</p>
                        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Pledge System</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="ml-auto lg:hidden p-1 rounded-md" style={{ color: 'var(--text-tertiary)' }}
                    >✕</button>
                </div>

                {/* User info */}
                <div className="px-6 py-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-slate-800 flex items-center justify-center text-blue-700 dark:text-blue-400 font-bold text-sm">
                            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{user?.name || 'User'}</p>
                            <p className="text-xs truncate" style={{ color: 'var(--text-tertiary)' }}>{user?.email}</p>
                        </div>
                    </div>
                    {isAdmin && (
                        <span className="mt-2 inline-block px-2 py-0.5 bg-amber-100/50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-xs rounded-full font-semibold border border-amber-200 dark:border-amber-800">
                            Admin
                        </span>
                    )}
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
                    {allItems.map(({ to, label, icon }) => (
                        <NavLink
                            key={to}
                            to={to}
                            onClick={onClose}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 
                ${isActive
                                    ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-900/20'
                                    : 'hover:bg-slate-100 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400'
                                }`
                            }
                        >
                            {icon}
                            {label}
                        </NavLink>
                    ))}
                </nav>

                {/* Logout */}
                <div className="px-4 py-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all duration-200 font-medium"
                    >
                        <LogOut size={20} /> Logout
                    </button>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
