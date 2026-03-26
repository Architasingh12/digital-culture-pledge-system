import { useState, useEffect } from 'react';
import { UserCog, PlusCircle, X, Shield, Mail, AlertCircle, Pencil, Trash2, Building2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import axiosInstance from '../api/axiosInstance';

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]).{8,}$/;

const CompanyAdminsPage = () => {
    const [admins, setAdmins] = useState([]);
    const [companies, setCompanies] = useState([]); // for dropdown
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingAdmin, setEditingAdmin] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const { register, handleSubmit, reset, formState: { errors } } = useForm();

    const fetchData = async () => {
        try {
            setLoading(true);
            const adminsRes = await axiosInstance.get('/admin/company-admins');
            if (adminsRes.data.success) {
                setAdmins(adminsRes.data.companyAdmins);
                setCompanies(adminsRes.data.companyAdmins); // use existing companies as dropdown options
            }
        } catch {
            toast.error('Failed to load company admins');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const openCreate = () => {
        setEditingAdmin(null);
        reset({ name: '', email: '', password: '', company_id: '' });
        setIsModalOpen(true);
    };

    const openEdit = (admin) => {
        setEditingAdmin(admin);
        reset({ name: admin.name, email: admin.email, password: '', company_id: admin.company_id || '' });
        setIsModalOpen(true);
    };

    const onSubmit = async (data) => {
        setIsSubmitting(true);
        try {
            let res;
            if (editingAdmin) {
                res = await axiosInstance.put(`/admin/company-admins/${editingAdmin.id}`, {
                    name: data.name,
                    email: data.email,
                    company_id: data.company_id || null,
                });
            } else {
                res = await axiosInstance.post('/admin/company-admins', data);
            }
            if (res.data.success) {
                toast.success(editingAdmin ? 'Admin updated!' : 'Company Admin added!');
                setIsModalOpen(false);
                reset();
                fetchData();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save company admin');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        try {
            const res = await axiosInstance.delete(`/admin/company-admins/${deleteTarget.id}`);
            if (res.data.success) {
                toast.success('Admin deleted.');
                setDeleteTarget(null);
                fetchData();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete admin.');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Company Admins</h1>
                    <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
                        Manage administrators assigned to companies.
                    </p>
                </div>
                <button
                    onClick={openCreate}
                    className="flex items-center justify-center sm:justify-start gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-all shadow-md shadow-blue-900/20 w-full sm:w-auto"
                >
                    <PlusCircle size={16} /> Add Admin
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : admins.length === 0 ? (
                <div className="rounded-2xl border" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                            <UserCog size={28} className="text-blue-600" />
                        </div>
                        <div className="text-center">
                            <h3 className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>No company admins yet</h3>
                            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                Assign company admins to allow them to manage their programme.
                            </p>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {admins.map((admin) => (
                        <div key={admin.id} className="rounded-2xl border p-6 hover:shadow-lg transition-all" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
                            <div className="flex items-start gap-4 mb-4">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                                    {admin.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h3 className="font-bold text-lg leading-tight truncate" style={{ color: 'var(--text-primary)' }} title={admin.name}>{admin.name}</h3>
                                    <div className="flex items-center gap-1 mt-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                                        <Mail size={12} className="flex-shrink-0" />
                                        <span className="truncate">{admin.email}</span>
                                    </div>
                                    {admin.company_id && (
                                        <div className="flex items-center gap-1 mt-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                                            <Building2 size={11} className="flex-shrink-0" />
                                            <span className="truncate">
                                                {companies.find(c => c.id === admin.company_id)?.name || `Company #${admin.company_id}`}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="pt-4 mt-4 border-t flex flex-wrap gap-2 justify-between items-center text-xs" style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}>
                                <div className="flex items-center gap-1.5">
                                    <Shield size={14} className="text-blue-500" />
                                    <span>Company Admin</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => openEdit(admin)}
                                        title="Edit"
                                        className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 transition-colors"
                                    >
                                        <Pencil size={14} />
                                    </button>
                                    <button
                                        onClick={() => setDeleteTarget(admin)}
                                        title="Delete"
                                        className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/20 text-rose-500 transition-colors"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add / Edit Admin Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
                    <div className="relative w-full max-w-md rounded-2xl shadow-2xl overflow-hidden my-8" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
                        <div className="px-6 py-4 border-b flex justify-between items-center bg-slate-50 dark:bg-slate-900/50" style={{ borderColor: 'var(--border-color)' }}>
                            <h3 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
                                {editingAdmin ? 'Edit Admin' : 'Add New Admin'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-md transition-colors" style={{ color: 'var(--text-secondary)' }}>
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)} className="p-6">
                            {!editingAdmin && (
                                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/50 rounded-xl flex gap-3 text-sm text-blue-800 dark:text-blue-300">
                                    <AlertCircle className="flex-shrink-0 mt-0.5" size={16} />
                                    <p>You are creating a new <strong>Company Admin</strong> user account capable of managing their internal program operations.</p>
                                </div>
                            )}

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Admin Name</label>
                                    <input
                                        {...register('name', { required: 'Name is required' })}
                                        className="w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-transparent"
                                        style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                                        placeholder="Admin Full Name"
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
                                        placeholder="admin@company.com"
                                    />
                                    {errors.email && <p className="text-red-500 text-xs mt-1.5">{errors.email.message}</p>}
                                </div>

                                {!editingAdmin && (
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
                                    </div>
                                )}

                                {/* Company Assignment Dropdown */}
                                <div>
                                    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                                        Assign to Company <span className="text-xs font-normal" style={{ color: 'var(--text-tertiary)' }}>(optional)</span>
                                    </label>
                                    <select
                                        {...register('company_id')}
                                        className="w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-transparent"
                                        style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                                    >
                                        <option value="">— No assignment —</option>
                                        {companies.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="mt-8 flex flex-col-reverse sm:flex-row justify-end gap-3 w-full">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="w-full sm:w-auto px-4 py-2 text-sm font-medium rounded-xl border hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
                                    Cancel
                                </button>
                                <button type="submit" disabled={isSubmitting} className="w-full sm:w-auto px-5 py-2 text-sm font-semibold rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-all disabled:opacity-70 flex items-center justify-center min-w-[130px]">
                                    {isSubmitting
                                        ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        : editingAdmin ? 'Save Changes' : 'Create Admin'
                                    }
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="w-full max-w-sm rounded-2xl shadow-2xl p-6" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
                        <div className="w-12 h-12 rounded-xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center mb-4">
                            <Trash2 size={22} className="text-rose-600" />
                        </div>
                        <h3 className="font-bold text-lg mb-2" style={{ color: 'var(--text-primary)' }}>Delete Admin?</h3>
                        <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
                            Are you sure you want to delete <strong>{deleteTarget.name}</strong>? This action cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteTarget(null)}
                                className="flex-1 px-4 py-2 text-sm font-medium rounded-xl border hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="flex-1 px-4 py-2 text-sm font-semibold rounded-xl bg-rose-600 hover:bg-rose-700 text-white transition-all disabled:opacity-70 flex items-center justify-center"
                            >
                                {isDeleting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CompanyAdminsPage;
