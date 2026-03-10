import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { Moon, Sun, Bell, Menu, LogOut, ChevronDown } from 'lucide-react';

const Navbar = ({ onMenuToggle }) => {
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const [dropdownOpen, setDropdownOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <header className="h-16 flex items-center px-4 lg:px-6 gap-4 sticky top-0 z-30 transition-colors shadow-sm" style={{ backgroundColor: 'var(--bg-surface)', borderBottom: '1px solid var(--border-color)' }}>
            {/* Hamburger */}
            <button
                onClick={onMenuToggle}
                className="lg:hidden p-2 rounded-lg transition-colors hover:bg-slate-500/10"
                style={{ color: 'var(--text-secondary)' }}
                aria-label="Toggle menu"
            >
                <Menu className="w-5 h-5" />
            </button>

            {/* Title */}
            <div className="flex-1">
                <h1 className="font-bold text-base lg:text-lg" style={{ color: 'var(--text-primary)' }}>
                    Digital Culture Pledge System
                </h1>
                <p className="text-xs hidden sm:block" style={{ color: 'var(--text-tertiary)' }}>Building a culture of excellence</p>
            </div>

            {/* Right section */}
            <div className="flex items-center gap-1 sm:gap-3">
                {/* Theme Toggle */}
                <button
                    onClick={toggleTheme}
                    className="p-2 rounded-lg transition-colors hover:bg-slate-500/10"
                    style={{ color: 'var(--text-secondary)' }}
                    title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                >
                    {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>

                {/* Notification */}
                <button className="relative p-2 hidden sm:block rounded-lg transition-colors hover:bg-slate-500/10" style={{ color: 'var(--text-secondary)' }}>
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 border-2" style={{ borderColor: 'var(--bg-surface)' }}></span>
                </button>

                

                {/* User Dropdown */}
                <div className="relative">
                    <button
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        className="flex items-center gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl transition-colors hover:bg-slate-500/10 group"
                    >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-sm ring-2 ring-transparent group-hover:ring-blue-500/50 transition-all">
                            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div className="hidden sm:block text-left">
                            <p className="text-sm font-semibold leading-tight" style={{ color: 'var(--text-primary)' }}>{user?.name}</p>
                            <p className="text-xs truncate max-w-[120px]" style={{ color: 'var(--text-tertiary)' }}>{user?.email}</p>
                        </div>
                        <ChevronDown className="w-4 h-4 hidden sm:block" style={{ color: 'var(--text-tertiary)' }} />
                    </button>

                    {dropdownOpen && (
                        <div className="absolute right-0 top-12 w-56 rounded-xl shadow-xl py-1 z-50 border backdrop-blur-md" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
                            <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border-color)' }}>
                                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{user?.name}</p>
                                <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>{user?.email}</p>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-500/10 transition-colors flex items-center gap-2 font-medium"
                            >
                                <LogOut className="w-4 h-4" /> Logout
                                
                            </button>
                            
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Navbar;
