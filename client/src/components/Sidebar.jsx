import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: '🏠' },
    { to: '/pledge', label: 'Sign Pledge', icon: '✍️' },
    { to: '/my-pledges', label: 'My Pledges', icon: '📋' },
];

const adminItems = [
    { to: '/admin', label: 'Dashboard Overview', icon: '📊' },
    { to: '/admin/wizard', label: 'New Program Wizard', icon: '✨' },
    { to: '/admin/programs', label: 'Programs', icon: '🎯' },
    { to: '/admin/practices', label: 'Manage Practices', icon: '⚙️' },
    { to: '/admin/surveys', label: 'Survey Scheduler', icon: '📅' },
    { to: '/admin/reports', label: 'Reports', icon: '📈' },
    { to: '/admin/participants', label: 'Participants List', icon: '👥' },
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
                    className="fixed inset-0 bg-black/50 z-20 lg:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <aside className={`
        fixed top-0 left-0 h-full w-64 z-30 flex flex-col
        bg-gradient-to-b from-[#0f172a] to-[#1e3a5f]
        shadow-2xl transition-transform duration-300
        ${open ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
      `}>
                {/* Logo */}
                <div className="flex items-center gap-3 px-6 py-6 border-b border-white/10">
                    <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center text-xl shadow-lg">
                        🏛️
                    </div>
                    <div>
                        <p className="text-white font-bold text-sm leading-tight">Digital Culture</p>
                        <p className="text-blue-300 text-xs">Pledge System</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="ml-auto text-white/60 hover:text-white lg:hidden text-xl"
                    >✕</button>
                </div>

                {/* User info */}
                <div className="px-6 py-4 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-blue-500/30 border border-blue-400/40 flex items-center justify-center text-white font-bold text-sm">
                            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div className="min-w-0">
                            <p className="text-white text-sm font-semibold truncate">{user?.name || 'User'}</p>
                            <p className="text-blue-300/80 text-xs truncate">{user?.email}</p>
                        </div>
                    </div>
                    {isAdmin && (
                        <span className="mt-2 inline-block px-2 py-0.5 bg-amber-400/20 text-amber-300 text-xs rounded-full font-semibold border border-amber-400/30">
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
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40'
                                    : 'text-white/70 hover:text-white hover:bg-white/10'
                                }`
                            }
                        >
                            <span className="text-base">{icon}</span>
                            {label}
                        </NavLink>
                    ))}
                </nav>

                {/* Logout */}
                <div className="px-4 py-4 border-t border-white/10">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-red-400 hover:text-white hover:bg-red-500/20 transition-all duration-200 font-medium"
                    >
                        <span>🚪</span> Logout
                    </button>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
