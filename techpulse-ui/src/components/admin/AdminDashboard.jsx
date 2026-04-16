import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../services/apiService';
import { RefreshCw, Terminal, AlertCircle } from 'lucide-react';

const AdminDashboard = ({ user }) => {
    const [stats, setStats] = useState(null);
    const [recentUsers, setRecentUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    // Log Viewer State
    const [logs, setLogs] = useState('');
    const [logType, setLogType] = useState('combined');
    const [isRefreshingLogs, setIsRefreshingLogs] = useState(false);
    const logContainerRef = useRef(null);

    const fetchLogs = async (type = logType) => {
        setIsRefreshingLogs(true);
        try {
            const response = await api.fetchAdminLogs(type);
            if (response.success) {
                setLogs(response.logs);
            }
        } catch (err) {
            console.error('Failed to fetch logs:', err.message);
        } finally {
            setIsRefreshingLogs(false);
        }
    };

    useEffect(() => {
        const loadStats = async () => {
            try {
                const response = await api.fetchAdminStats();
                if (response.success) {
                    setStats(response.stats);
                    setRecentUsers(response.recentUsers);
                }
                // Also fetch logs on initial load
                await fetchLogs();
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

    // Auto-scroll to bottom of logs when they update
    useEffect(() => {
        if (logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
    }, [logs]);

    const handleLogTypeChange = (type) => {
        setLogType(type);
        fetchLogs(type);
    };

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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                    <h2 className="text-2xl font-semibold mb-4 border-b border-slate-700 pb-2">Recent Registrations</h2>
                    <div className="bg-slate-800/30 rounded-xl border border-slate-700 overflow-hidden">
                        <table className="w-full text-left text-sm">
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
                                        <td className="p-4 truncate max-w-[150px]">{u.email}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
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

                {/* Log Viewer Section */}
                <div>
                    <div className="flex items-center justify-between mb-4 border-b border-slate-700 pb-2">
                        <h2 className="text-2xl font-semibold flex items-center gap-2">
                            <Terminal size={24} className="text-green-400" />
                            System Logs
                        </h2>
                        <div className="flex items-center gap-2">
                            <div className="flex bg-slate-800 rounded-lg p-1 border border-slate-700">
                                <button 
                                    onClick={() => handleLogTypeChange('combined')}
                                    className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                                        logType === 'combined' 
                                        ? 'bg-slate-700 text-white shadow-sm' 
                                        : 'text-slate-400 hover:text-slate-200'
                                    }`}
                                >
                                    Combined
                                </button>
                                <button 
                                    onClick={() => handleLogTypeChange('error')}
                                    className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                                        logType === 'error' 
                                        ? 'bg-red-500/20 text-red-400' 
                                        : 'text-slate-400 hover:text-slate-200'
                                    }`}
                                >
                                    Errors
                                </button>
                            </div>
                            <button 
                                onClick={() => fetchLogs()}
                                disabled={isRefreshingLogs}
                                className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors disabled:opacity-50"
                                title="Refresh Logs"
                            >
                                <RefreshCw size={16} className={`${isRefreshingLogs ? 'animate-spin' : ''}`} />
                            </button>
                        </div>
                    </div>

                    <div className="bg-black/80 rounded-xl border border-slate-700 overflow-hidden shadow-2xl relative">
                        <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 border-b border-slate-800">
                            <div className="w-3 h-3 rounded-full bg-red-500"></div>
                            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                            <span className="text-[10px] text-slate-500 font-mono ml-2">techpulse-server -- {logFile}</span>
                        </div>
                        <pre 
                            ref={logContainerRef}
                            className={`p-4 h-[350px] overflow-y-auto font-mono text-xs leading-relaxed custom-scrollbar ${
                                logType === 'error' ? 'text-red-400' : 'text-green-400'
                            }`}
                        >
                            {logs || 'No log data available...'}
                        </pre>
                        {isRefreshingLogs && (
                            <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px] flex items-center justify-center">
                                <RefreshCw className="animate-spin text-white/50" size={32} />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// CSS for custom scrollbar in Tailwind (usually added to index.css, but included here for completeness)
const logFile = "logs/combined.log"; // Helper for the pre block label

export default AdminDashboard;