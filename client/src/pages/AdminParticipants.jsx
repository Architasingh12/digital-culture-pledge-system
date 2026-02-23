import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import axiosInstance from '../api/axiosInstance';

const AdminParticipants = () => {
    const [pledges, setPledges] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPledges = async () => {
            try {
                const res = await axiosInstance.get('/pledges/all');
                setPledges(res.data.pledges || []);
            } catch (err) {
                toast.error('Failed to load participants data');
            } finally {
                setLoading(false);
            }
        };
        fetchPledges();
    }, []);

    return (
        <div className="p-4 lg:p-8 max-w-7xl mx-auto animate-in fade-in">
            <div className="mb-8 border-b border-slate-200 pb-4">
                <h1 className="text-slate-900 font-bold text-3xl">Participants List</h1>
                <p className="text-slate-500 mt-1">Review all pledges submitted by employees across different programs.</p>
            </div>

            {loading ? (
                <div className="flex justify-center p-12">
                    <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : (
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-bold">
                                    <th className="px-6 py-5">Participant Details</th>
                                    <th className="px-6 py-5">Assigned Program</th>
                                    <th className="px-6 py-5 text-center">Submitted Date</th>
                                    <th className="px-6 py-5">Core Personal Habit</th>
                                    <th className="px-6 py-5 text-center">Behaviours</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {pledges.map(p => (
                                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 font-bold">
                                                    {p.user_name?.charAt(0) || 'U'}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-800 text-sm">{p.user_name}</p>
                                                    <p className="text-xs text-slate-500 font-medium">{p.user_designation}</p>
                                                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">{p.user_email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-block px-3 py-1.5 bg-blue-50/50 text-blue-700 text-xs font-bold rounded-lg border border-blue-100 shadow-sm">
                                                {p.program_title}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="text-sm font-semibold text-slate-600">
                                                {new Date(p.submitted_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 max-w-[200px]">
                                            <p className="text-sm font-semibold text-slate-700 truncate" title={p.personal_habit}>{p.personal_habit}</p>
                                            <p className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-500 font-bold uppercase tracking-widest rounded inline-block mt-1.5">{p.habit_frequency}</p>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 font-black text-sm">
                                                {p.behaviours?.length || 0}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {pledges.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-16 text-center text-slate-500 font-medium">No participant pledges found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminParticipants;
