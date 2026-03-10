import { useState, useEffect } from 'react';
import { Building2, PlusCircle, X, Mail, Shield, AlertCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import axiosInstance from '../api/axiosInstance';

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]).{8,}$/;

const CompaniesPage = () => {
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const { register, handleSubmit, reset, formState: { errors } } = useForm();

    const fetchCompanies = async () => {
        try {
            setLoading(true);
            const res = await axiosInstance.get('/admin/company-admins');
            if (res.data.success) {
                setCompanies(res.data.companyAdmins);
            }
        } catch {
            toast.error('Failed to load companies');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCompanies();
    }, []);

    const onSubmit = async (data) => {
        setIsSubmitting(true);
        try {
            const res = await axiosInstance.post('/admin/company-admins', data);
            if (res.data.success) {
                toast.success('Company added successfully!');
                setIsModalOpen(false);
                reset();
                fetchCompanies();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to add company');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Companies</h1>
                    <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
                        Manage all registered organisations in the system.
                    </p>
                </div>
                <button 
                    onClick={() => { reset(); setIsModalOpen(true); }}
                    className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-all shadow-md shadow-blue-900/20"
                >
                    <PlusCircle size={16} /> Add Company
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : companies.length === 0 ? (
                <div className="rounded-2xl border" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                            <Building2 size={28} className="text-purple-600" />
                        </div>
                        <div className="text-center">
                            <h3 className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>No companies yet</h3>
                            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                Add your first company to get started.
                            </p>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {companies.map((company) => (
                        <div key={company.id} className="rounded-2xl border p-6 hover:shadow-lg transition-all" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
                            <div className="flex items-start gap-4 mb-4">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                                    {company.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg leading-tight" style={{ color: 'var(--text-primary)' }}>{company.name}</h3>
                                    <div className="flex items-center gap-1 mt-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                                        <Mail size={12} />
                                        <span className="truncate max-w-[150px]">{company.email}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="pt-4 mt-4 border-t flex justify-between items-center text-xs" style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}>
                                <div className="flex items-center gap-1.5">
                                    <Shield size={14} className="text-emerald-500" /> 
                                    <span>Company Admin</span>
                                </div>
                                <span>Joined {new Date(company.created_at).toLocaleDateString()}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add Company Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-2xl shadow-2xl overflow-hidden" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
                        <div className="px-6 py-4 border-b flex justify-between items-center bg-slate-50 dark:bg-slate-900/50" style={{ borderColor: 'var(--border-color)' }}>
                            <h3 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>Add New Company</h3>
                            <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-md transition-colors" style={{ color: 'var(--text-secondary)' }}>
                                <X size={20} />
                            </button>
                        </div>
                        
                        <form onSubmit={handleSubmit(onSubmit)} className="p-6">
                            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/50 rounded-xl flex gap-3 text-sm text-blue-800 dark:text-blue-300">
                                <AlertCircle className="flex-shrink-0 mt-0.5" size={16} />
                                <p>This will create a new <strong>Company Admin</strong> user account. The company will use these credentials to sign in and manage their pledge.</p>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Company Name</label>
                                    <input
                                        {...register('name', { required: 'Company name is required' })}
                                        className="w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-transparent"
                                        style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                                        placeholder="Acme Corp"
                                    />
                                    {errors.name && <p className="text-red-500 text-xs mt-1.5">{errors.name.message}</p>}
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Admin Login Email</label>
                                    <input
                                        type="email"
                                        {...register('email', { 
                                            required: 'Email is required',
                                            pattern: { value: /^\S+@\S+\.\S+$/i, message: 'Invalid email format' }
                                        })}
                                        className="w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-transparent"
                                        style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                                        placeholder="admin@acmecorp.com"
                                    />
                                    {errors.email && <p className="text-red-500 text-xs mt-1.5">{errors.email.message}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Admin Password</label>
                                    <input
                                        type="password"
                                        {...register('password', { 
                                            required: 'Password is required',
                                            validate: value => PASSWORD_REGEX.test(value) || 'Must contain at least 8 chars, 1 uppercase, 1 lowercase, 1 number, and 1 special char'
                                        })}
                                        className="w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-transparent"
                                        style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                                        placeholder="••••••••"
                                    />
                                    {errors.password && <p className="text-red-500 text-xs mt-1.5 leading-tight">{errors.password.message}</p>}
                                    <p className="text-[10px] mt-1.5 text-slate-500">Provide these credentials to the company admin securely.</p>
                                </div>
                            </div>

                            <div className="mt-8 flex justify-end gap-3">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium rounded-xl border hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
                                    Cancel
                                </button>
                                <button type="submit" disabled={isSubmitting} className="px-5 py-2 text-sm font-semibold rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-all disabled:opacity-70 flex items-center justify-center min-w-[120px]">
                                    {isSubmitting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'Create Company'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CompaniesPage;
