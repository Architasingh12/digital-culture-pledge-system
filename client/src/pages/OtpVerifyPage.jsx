import { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import axiosInstance from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';

const OtpVerifyPage = () => {
    const [otp, setOtp] = useState(Array(6).fill(''));
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const inputRefs = useRef([]);
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();

    const email = location.state?.email || '';

    const handleChange = (i, value) => {
        if (!/^\d?$/.test(value)) return;
        const newOtp = [...otp];
        newOtp[i] = value;
        setOtp(newOtp);
        if (value && i < 5) inputRefs.current[i + 1]?.focus();
    };

    const handleKeyDown = (i, e) => {
        if (e.key === 'Backspace' && !otp[i] && i > 0) {
            inputRefs.current[i - 1]?.focus();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        const newOtp = [...otp];
        paste.split('').forEach((ch, i) => { newOtp[i] = ch; });
        setOtp(newOtp);
        inputRefs.current[Math.min(paste.length, 5)]?.focus();
    };

    const handleVerify = async () => {
        const code = otp.join('');
        if (code.length < 6) {
            toast.error('Please enter the complete 6-digit OTP');
            return;
        }

        setLoading(true);
        try {
            const res = await axiosInstance.post('/auth/verify-otp', { email, otp: code });
            login(res.data.user);
            toast.success('Logged in successfully!');
            navigate('/dashboard');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Invalid OTP. Try again.');
            setOtp(Array(6).fill(''));
            inputRefs.current[0]?.focus();
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        setResending(true);
        try {
            await axiosInstance.post('/auth/send-otp', { email });
            toast.success('New OTP sent!');
            setOtp(Array(6).fill(''));
            inputRefs.current[0]?.focus();
        } catch {
            toast.error('Failed to resend OTP');
        } finally {
            setResending(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e3a5f] to-[#1d4ed8] flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl mb-4">
                        <span className="text-3xl">📧</span>
                    </div>
                    <h1 className="text-white text-2xl font-bold">Check Your Email</h1>
                    <p className="text-blue-200 mt-1 text-sm">
                        We sent a 6-digit code to<br />
                        <span className="text-white font-semibold">{email || 'your email'}</span>
                    </p>
                </div>

                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 shadow-2xl">
                    <h2 className="text-white font-semibold text-center mb-6">Enter OTP</h2>

                    {/* OTP Inputs */}
                    <div className="flex gap-3 justify-center mb-6" onPaste={handlePaste}>
                        {otp.map((digit, i) => (
                            <input
                                key={i}
                                id={`otp-${i}`}
                                ref={el => inputRefs.current[i] = el}
                                type="text"
                                inputMode="numeric"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => handleChange(i, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(i, e)}
                                className="w-12 h-14 text-center text-2xl font-bold bg-white/10 border-2 border-white/20 text-white rounded-xl focus:outline-none focus:border-blue-400 focus:bg-white/20 transition-all"
                            />
                        ))}
                    </div>

                    {/* Verify button */}
                    <button
                        onClick={handleVerify}
                        disabled={loading || otp.join('').length < 6}
                        className="w-full py-3.5 bg-blue-500 hover:bg-blue-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-900/40"
                    >
                        {loading ? (
                            <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Verifying...</>
                        ) : 'Verify OTP & Sign In'}
                    </button>

                    <div className="mt-4 text-center space-y-3">
                        <p className="text-blue-200/70 text-sm">Didn't receive the code?</p>
                        <button
                            onClick={handleResend}
                            disabled={resending}
                            className="text-blue-300 hover:text-white text-sm underline transition-colors disabled:opacity-50"
                        >
                            {resending ? 'Resending...' : 'Resend OTP'}
                        </button>
                    </div>

                    <div className="mt-4 text-center">
                        <button
                            onClick={() => navigate('/login')}
                            className="text-blue-300/60 hover:text-blue-200 text-xs transition-colors"
                        >
                            ← Back to Login
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OtpVerifyPage;
