import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import axiosInstance from '../api/axiosInstance';

const LoginPage = () => {
    const [loading, setLoading] = useState(false);
    const { register, handleSubmit, formState: { errors } } = useForm();
    const navigate = useNavigate();

    const onSubmit = async (data) => {
        setLoading(true);
        try {
            await axiosInstance.post('/auth/send-otp', {
                email: data.email,
                name: data.name,
                department: data.department,
            });
            toast.success('OTP sent! Check your email.');
            navigate('/verify-otp', { state: { email: data.email } });
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to send OTP. Try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e3a5f] to-[#1d4ed8] flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl mb-4">
                        <span className="text-3xl">🏛️</span>
                    </div>
                    <h1 className="text-white text-2xl font-bold tracking-tight">Digital Culture Pledge</h1>
                    <p className="text-blue-200 mt-1 text-sm">Sign in with your email — no password needed</p>
                </div>

                {/* Card */}
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 shadow-2xl">
                    <h2 className="text-white font-semibold text-lg mb-6">Get Started</h2>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        {/* Name */}
                        <div>
                            <label className="block text-blue-100 text-sm font-medium mb-1.5">Full Name</label>
                            <input
                                {...register('name', { required: 'Name is required' })}
                                type="text"
                                placeholder="e.g. John Smith"
                                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-300/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                            />
                            {errors.name && <p className="text-red-300 text-xs mt-1">{errors.name.message}</p>}
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-blue-100 text-sm font-medium mb-1.5">Work Email</label>
                            <input
                                {...register('email', {
                                    required: 'Email is required',
                                    pattern: { value: /^\S+@\S+$/i, message: 'Invalid email address' },
                                })}
                                type="email"
                                placeholder="you@company.com"
                                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-300/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                            />
                            {errors.email && <p className="text-red-300 text-xs mt-1">{errors.email.message}</p>}
                        </div>

                        {/* Department */}
                        <div>
                            <label className="block text-blue-100 text-sm font-medium mb-1.5">Department <span className="text-blue-300/50">(optional)</span></label>
                            <select
                                {...register('department')}
                                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all appearance-none"
                            >
                                <option value="" className="text-slate-800">Select Department</option>
                                <option value="HR" className="text-slate-800">Human Resources</option>
                                <option value="IT" className="text-slate-800">Information Technology</option>
                                <option value="Finance" className="text-slate-800">Finance</option>
                                <option value="Operations" className="text-slate-800">Operations</option>
                                <option value="Marketing" className="text-slate-800">Marketing</option>
                                <option value="Sales" className="text-slate-800">Sales</option>
                                <option value="Legal" className="text-slate-800">Legal</option>
                                <option value="Executive" className="text-slate-800">Executive</option>
                                <option value="Other" className="text-slate-800">Other</option>
                            </select>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full mt-2 py-3.5 bg-blue-500 hover:bg-blue-400 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-blue-900/40"
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Sending OTP...
                                </>
                            ) : (
                                <>Send OTP to Email →</>
                            )}
                        </button>
                    </form>

                    <p className="text-blue-200/60 text-xs text-center mt-6">
                        A 6-digit code will be emailed to you. Valid for {10} minutes.
                    </p>
                </div>

                {/* Footer */}
                <p className="text-center text-blue-300/50 text-xs mt-6">
                    © {new Date().getFullYear()} Digital Culture Pledge System
                </p>
            </div>
        </div>
    );
};

export default LoginPage;
