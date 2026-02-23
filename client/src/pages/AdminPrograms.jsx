import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import axiosInstance from '../api/axiosInstance';

const AdminPrograms = () => {
    const [programs, setPrograms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [newProgram, setNewProgram] = useState({ title: '', description: '', start_date: '', end_date: '' });

    const fetchPrograms = async () => {
        setLoading(true);
        try {
            const res = await axiosInstance.get('/programs');
            setPrograms(res.data.programs || []);
        } catch (err) {
            toast.error('Failed to load programs');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPrograms();
    }, []);

    const handleCreateProgram = async (e) => {
        e.preventDefault();
        try {
            await axiosInstance.post('/programs', newProgram);
            toast.success('Program created');
            setShowModal(false);
            setNewProgram({ title: '', description: '', start_date: '', end_date: '' });
            fetchPrograms();
        } catch (err) {
            toast.error('Failed to create program');
        }
    };

    return (
        <div className="p-4 lg:p-8 max-w-5xl mx-auto animate-in fade-in">
            <div className="flex justify-between items-end mb-8 border-b border-slate-200 pb-4">
                <div>
                    <h1 className="text-slate-900 font-bold text-3xl">Programs</h1>
                    <p className="text-slate-500 mt-1">Manage corporate culture initiative programs.</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-blue-600/20 transition-all hover:scale-105"
                >
                    + New Program
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center p-12">
                    <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="divide-y divide-slate-100">
                        {programs.length === 0 ? (
                            <p className="p-12 text-center text-slate-500">No programs created yet.</p>
                        ) : programs.map(p => (
                            <div key={p.id} className="p-6 hover:bg-slate-50 transition-colors flex justify-between items-center group">
                                <div>
                                    <h3 className="font-bold text-slate-800 text-lg">{p.title}</h3>
                                    <p className="text-slate-500 mt-1">{p.description}</p>
                                    <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full border border-blue-100 uppercase tracking-wide">
                                        📅 {p.start_date ? new Date(p.start_date).toLocaleDateString() : 'No Set Date'} → {p.end_date ? new Date(p.end_date).toLocaleDateString() : 'Present'}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Create Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
                        <h2 className="text-xl font-bold text-slate-800 mb-6">Create New Program</h2>
                        <form onSubmit={handleCreateProgram} className="space-y-5">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-2">Title *</label>
                                <input required autoFocus className="w-full border-slate-200 bg-slate-50 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 border outline-none" value={newProgram.title} onChange={e => setNewProgram({ ...newProgram, title: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-2">Description</label>
                                <textarea rows="3" className="w-full border-slate-200 bg-slate-50 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 border outline-none resize-none" value={newProgram.description} onChange={e => setNewProgram({ ...newProgram, description: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-2">Start Date</label>
                                    <input type="date" className="w-full border-slate-200 bg-slate-50 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 border outline-none" value={newProgram.start_date} onChange={e => setNewProgram({ ...newProgram, start_date: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-2">End Date</label>
                                    <input type="date" className="w-full border-slate-200 bg-slate-50 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 border outline-none" value={newProgram.end_date} onChange={e => setNewProgram({ ...newProgram, end_date: e.target.value })} />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-6 mt-2">
                                <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
                                <button type="submit" className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-md transition-colors">Create</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPrograms;
