import React, { useState, useEffect } from 'react';
import { api } from '../../services/apiService';

const AdminDashboard = ({ user }) => {
    const [stats, setStats] = useState(null);
    const [recentUsers, setRecentUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const loadStats = async () => {
            try {
                const response = await api.fetchAdminStats();
                if (response.success) {
                    setStats(response.stats);
                    setRecentUsers(response.recentUsers);
                }
            } catch (err) {
                setError('Access Denied. You do not have Admin privileges.');
            } finally {
                setLoading(false);
            }
        };
        
        // Extra safety check on the frontend
        if (user?.role === 'ADMIN') {
            loadStats();
        } else {
            setError('Access Denied. You do not have Admin privileges.');
            setLoading(false);
        }
    }, [user]);

    if (loading) return <div className="p-8 text-center text-gray-400">Loading admin data...</div>;
    
    // If they aren't an admin or the API rejected them, show this screen
    if (error) return (
        <div className="flex items-center justify-center h-full min-h-[600px]">
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-8 rounded-xl max-w-md text-center">
                <h2 className="text-2xl font-bold mb-2">Restricted Area</h2>
                <p>{error}</p>
            </div>
        </div>
    );

    return (
        <div className="p-8 max-w-6xl mx-auto text-white animate-fade-in">
            <h1 className="text-3xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
                Super User Dashboard
            </h1>
            
            {/* Top Level Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
                    <h3 className="text-slate-400 text-sm font-semibold mb-2 tracking-wider uppercase">Total Users</h3>
                    <p className="text-5xl font-bold text-white">{stats?.totalUsers || 0}</p>
                </div>
                <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
                    <h3 className="text-slate-400 text-sm font-semibold mb-2 tracking-wider uppercase">Analyses Run</h3>
                    <p className="text-5xl font-bold text-blue-400">{stats?.totalAnalyses || 0}</p>
                </div>
                <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
                    <h3 className="text-slate-400 text-sm font-semibold mb-2 tracking-wider uppercase">Saved Articles</h3>
                    <p className="text-5xl font-bold text-purple-400">{stats?.totalSavedArticles || 0}</p>
                </div>
            </div>

            {/* Recent Users Table */}
            <h2 className="text-2xl font-semibold mb-4 border-b border-slate-700 pb-2">Recent Registrations</h2>
            <div className="bg-slate-800/30 rounded-xl border border-slate-700 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-800">
                        <tr>
                            <th className="p-4 text-slate-300 font-medium">Email</th>
                            <th className="p-4 text-slate-300 font-medium">Role</th>
                            <th className="p-4 text-slate-300 font-medium">Joined</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                        {recentUsers.map(u => (
                            <tr key={u.id} className="hover:bg-slate-800/50 transition-colors">
                                <td className="p-4">{u.email}</td>
                                <td className="p-4">
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                        u.role === 'ADMIN' 
                                        ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' 
                                        : 'bg-slate-700 text-slate-300'
                                    }`}>
                                        {u.role}
                                    </span>
                                </td>
                                <td className="p-4 text-slate-400">
                                    {new Date(u.createdAt).toLocaleDateString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminDashboard;