import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import axiosInstance from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]).{8,}$/;

const EyeIcon = ({ open }) => (
    open ? (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
    ) : (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.477 0-8.268-2.943-9.542-7a9.97 9.97 0 012.163-3.592m3.286-2.615A9.955 9.955 0 0112 5c4.477 0 8.268 2.943 9.542 7a9.97 9.97 0 01-1.93 3.153M15 12a3 3 0 11-6 0m6 0a3 3 0 01-4.95 2.121M3 3l18 18" />
        </svg>
    )
);

// Reusable login form that handles role-based redirect
const RoleLoginPage = ({ title, subtitle, accentFrom, accentTo, expectedRole, dashboardPath, icon }) => {
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const { register, handleSubmit, formState: { errors } } = useForm();
    const navigate = useNavigate();
    const { user, loading: authLoading, login, logout } = useAuth();

    const getRoleRedirect = (role) => {
        if (role === 'super_admin') return '/admin/dashboard';
        if (role === 'company_admin' || role === 'admin') return '/company/dashboard';
        return '/participant/dashboard';
    };

    // If user is already logged in, keep portal behavior consistent:
    // - correct role: go to its dashboard
    // - wrong role: log out so user can sign into this portal
    useEffect(() => {
        if (authLoading) return;
        if (!user) return;

        // If no expected role was provided, just go to the user's home.
        if (!expectedRole) {
            navigate(getRoleRedirect(user.role), { replace: true });
            return;
        }

        // Correct portal: go to its dashboard
        if (user.role === expectedRole) {
            navigate(dashboardPath ?? getRoleRedirect(user.role), { replace: true });
            return;
        }

        // Wrong portal: clear session so the login form can be used
        toast('You were logged in with a different role. Please sign in again for this portal.', { icon: 'ℹ️' });
        logout();
        // stay on the current login route
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [authLoading, user, expectedRole, dashboardPath, navigate]);

    const onSubmit = async (data) => {
        setLoading(true);
        try {
            const res = await axiosInstance.post('/auth/login', {
                email: data.email,
                password: data.password,
            });
            const user = res.data.user;

            // Warn if wrong portal but still log in
            if (expectedRole && user.role !== expectedRole) {
                toast(`Logged in as ${user.role.replace('_', ' ')}`, { icon: 'ℹ️' });
            } else {
                toast.success('Welcome back!');
            }

            login(user);
            navigate(dashboardPath ?? getRoleRedirect(user.role));
        } catch (err) {
            toast.error(err.response?.data?.message || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`min-h-screen bg-gradient-to-br ${accentFrom} via-[#1e3a5f] ${accentTo} flex items-center justify-center p-4`}>
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl mb-4">
                        <span className="text-3xl">{icon}</span>
                    </div>
                    <h1 className="text-white text-2xl font-bold tracking-tight">{title}</h1>
                    <p className="text-blue-200 mt-1 text-sm">{subtitle}</p>
                </div>

                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 shadow-2xl">
                    <h2 className="text-white font-semibold text-lg mb-6">Sign In</h2>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
                        <div>
                            <label className="block text-blue-100 text-sm font-medium mb-1.5">Work Email</label>
                            <input
                                {...register('email', {
                                    required: 'Email is required',
                                    pattern: { value: /^\S+@\S+\.\S+$/i, message: 'Enter a valid email address' },
                                })}
                                type="email" placeholder="you@company.com" autoComplete="email"
                                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-300/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                            />
                            {errors.email && <p className="text-red-300 text-xs mt-1.5">{errors.email.message}</p>}
                        </div>

                        <div>
                            <label className="block text-blue-100 text-sm font-medium mb-1.5">Password</label>
                            <div className="relative">
                                <input
                                    {...register('password', {
                                        required: 'Password is required',
                                        validate: v => PASSWORD_REGEX.test(v) || 'Invalid password format',
                                    })}
                                    type={showPassword ? 'text' : 'password'} placeholder="••••••••" autoComplete="current-password"
                                    className="w-full px-4 py-3 pr-12 bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-300/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                                />
                                <button type="button" onClick={() => setShowPassword(v => !v)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-300 hover:text-white transition-colors"
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}>
                                    <EyeIcon open={showPassword} />
                                </button>
                            </div>
                            {errors.password && <p className="text-red-300 text-xs mt-1.5">{errors.password.message}</p>}
                        </div>

                        <button type="submit" disabled={loading}
                            className="w-full mt-2 py-3.5 bg-blue-500 hover:bg-blue-400 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-blue-900/40">
                            {loading ? (
                                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Signing In...</>
                            ) : 'Sign In →'}
                        </button>
                    </form>

                    <div className="mt-6 text-center space-y-2">
                        <p className="text-blue-200/60 text-xs">Sign in with a different portal:</p>
                        <div className="flex justify-center gap-4 text-xs">
                            <Link to="/admin/login" className="text-blue-300 hover:text-white underline transition-colors">Super Admin</Link>
                            <Link to="/company/login" className="text-blue-300 hover:text-white underline transition-colors">Company Admin</Link>
                            <Link to="/participant/login" className="text-blue-300 hover:text-white underline transition-colors">Participant</Link>
                        </div>
                    </div>
                </div>

                <p className="text-center text-blue-300/50 text-xs mt-6">
                    © {new Date().getFullYear()} Digital Culture Pledge System
                </p>
            </div>
        </div>
    );
};

export default RoleLoginPage;
