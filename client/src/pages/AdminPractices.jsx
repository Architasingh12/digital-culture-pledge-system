import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import axiosInstance from '../api/axiosInstance';

const AdminPractices = () => {
    const [programs, setPrograms] = useState([]);
    const [selectedProgramId, setSelectedProgramId] = useState('');
    const [practices, setPractices] = useState([]);
    const [loadingSettings, setLoadingSettings] = useState(true);

    // Form State
    const [newPractice, setNewPractice] = useState({ type: 'weekly', title: '', actionsText: '' });

    // Fetch programs for dropdown
    useEffect(() => {
        const init = async () => {
            try {
                const res = await axiosInstance.get('/programs');
                const progs = res.data.programs || [];
                setPrograms(progs);
                if (progs.length > 0) {
                    setSelectedProgramId(progs[0].id.toString());
                }
            } catch (err) {
                toast.error('Failed to load programs list');
            } finally {
                setLoadingSettings(false);
            }
        };
        init();
    }, []);

    // Fetch practices when program selection changes
    useEffect(() => {
        if (!selectedProgramId) return;
        const fetchPractices = async () => {
            try {
                const res = await axiosInstance.get(`/practices/program/${selectedProgramId}`);
                setPractices(res.data.practices || []);
            } catch (err) {
                toast.error('Failed to load practices');
            }
        };
        fetchPractices();
    }, [selectedProgramId]);

    const handleCreatePractice = async (e) => {
        e.preventDefault();
        if (!selectedProgramId) {
            toast.error('Please select a program first');
            return;
        }

        const actions = newPractice.actionsText.split(';').map(a => a.trim()).filter(a => a);
        try {
            await axiosInstance.post('/practices', {
                program_id: selectedProgramId,
                type: newPractice.type,
                title: newPractice.title,
                actions
            });
            toast.success('Practice added');
            setNewPractice({ type: 'weekly', title: '', actionsText: '' });

            // Refresh practices manually
            const res = await axiosInstance.get(`/practices/program/${selectedProgramId}`);
            setPractices(res.data.practices || []);

        } catch (err) {
            toast.error('Failed to add practice');
        }
    };

    if (loadingSettings) {
        return <div className="p-12 text-center text-slate-500">Loading Configuration...</div>;
    }

    const selectedProgramName = programs.find(p => p.id.toString() === selectedProgramId)?.title || 'Selected Program';

    return (
        <div className="p-4 lg:p-8 max-w-5xl mx-auto animate-in fade-in">
            <div className="mb-8 border-b border-slate-200 pb-4">
                <h1 className="text-slate-900 font-bold text-3xl">Manage Practices</h1>
                <p className="text-slate-500 mt-1">Assign selectable behaviours/actions to specific programs.</p>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row">

                {/* Left Side: Program Selection & Existing Practices */}
                <div className="flex-1 border-r border-slate-100 bg-slate-50">
                    <div className="p-6 border-b border-slate-200 bg-white">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-2">Select Program to configure</label>
                        <select
                            value={selectedProgramId}
                            onChange={(e) => setSelectedProgramId(e.target.value)}
                            className="w-full border-slate-200 rounded-xl p-3 font-semibold text-slate-800 bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            {programs.map(p => (
                                <option key={p.id} value={p.id}>{p.title}</option>
                            ))}
                        </select>
                    </div>

                    <div className="p-6 space-y-4 max-h-[600px] overflow-y-auto">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Current Practices in "{selectedProgramName}"</h3>
                        {practices.length === 0 ? (
                            <div className="p-8 text-center bg-white border border-slate-200 border-dashed rounded-2xl">
                                <p className="text-sm text-slate-400">No practices defined yet.</p>
                            </div>
                        ) : practices.map(pr => (
                            <div key={pr.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)]">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest rounded-md 
                                        ${pr.type === 'daily' ? 'bg-orange-100 text-orange-700' :
                                            pr.type === 'weekly' ? 'bg-blue-100 text-blue-700' :
                                                'bg-purple-100 text-purple-700'}`
                                    }>
                                        {pr.type}
                                    </span>
                                    <h4 className="font-bold text-slate-800">{pr.title}</h4>
                                </div>
                                <ul className="list-disc pl-5 space-y-1.5 marker:text-slate-300">
                                    {pr.actions?.map((act, i) => (
                                        <li key={i} className="text-sm text-slate-600 leading-relaxed">{act}</li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Side: Create Form */}
                <div className="w-full md:w-96 bg-white p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">+</div>
                        <h3 className="font-bold text-slate-800 text-xl">Create New</h3>
                    </div>

                    <form onSubmit={handleCreatePractice} className="space-y-5">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-2">Cadence Type</label>
                            <select
                                value={newPractice.type}
                                onChange={e => setNewPractice({ ...newPractice, type: e.target.value })}
                                className="w-full border border-slate-200 bg-slate-50 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                            >
                                <option value="daily">Daily Practice</option>
                                <option value="weekly">Weekly Practice</option>
                                <option value="monthly">Monthly Practice</option>
                                <option value="quarterly">Quarterly Practice</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-2">Practice Title</label>
                            <input
                                required
                                placeholder="e.g. Transparent Reporting"
                                value={newPractice.title}
                                onChange={e => setNewPractice({ ...newPractice, title: e.target.value })}
                                className="w-full border border-slate-200 bg-slate-50 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-2">Available Actions</label>
                            <p className="text-[10px] text-slate-400 mb-2 font-medium">Separate actions with a semicolon (;)</p>
                            <textarea
                                required
                                placeholder="Action 1; Action 2; Action 3"
                                rows={6}
                                value={newPractice.actionsText}
                                onChange={e => setNewPractice({ ...newPractice, actionsText: e.target.value })}
                                className="w-full border border-slate-200 bg-slate-50 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none leading-relaxed text-slate-700"
                            />
                        </div>

                        <button type="submit" className="w-full bg-slate-900 hover:bg-black text-white font-bold py-3.5 rounded-xl shadow-lg shadow-slate-900/20 transition-all hover:-translate-y-0.5 mt-4">
                            Save Practice
                        </button>
                    </form>
                </div>

            </div>
        </div>
    );
};

export default AdminPractices;
