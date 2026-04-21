import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldAlert, Loader2, LogOut, Mail, Building, Key } from 'lucide-react';
import { logout, updateProfile } from '../../features/auth/authSlice';
import axios from 'axios';

const WaitingAuthorization = () => {
    const { user } = useSelector((state) => state.auth);
    const [isRefreshing, setIsRefreshing] = React.useState(false);
    const dispatch = useDispatch();

    if (!user) return <Navigate to="/login" />;
    
    // If user is already authorized, send them to their dashboard
    if (user.isAuthorized !== false) {
        return <Navigate to="/faculty-dashboard" />;
    }

    const handleLogout = () => {
        dispatch(logout());
    };

    const handleRefreshStatus = async () => {
        try {
            setIsRefreshing(true);
            const res = await axios.get(`${import.meta.env.VITE_API_URL || 'https://scholarmatrixdeployment-api.onrender.com'}/api/auth/profile`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            // Update credentials in redux
            dispatch(updateProfile({ ...res.data }));
        } catch (err) {
            console.error("Refresh failed", err);
        } finally {
            setIsRefreshing(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-73px)] flex items-center justify-center p-6 bg-slate-50 dark:bg-[#030712] transition-colors duration-500 overflow-hidden relative">
            {/* Background Effects */}
            <div className="absolute top-1/4 -right-20 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] animate-pulse"></div>
            <div className="absolute bottom-1/4 -left-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] animate-pulse"></div>

            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-2xl bg-white dark:bg-[#080c14] rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden relative z-10"
            >
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-500 to-orange-600"></div>
                
                <div className="p-8 md:p-12 text-center">
                    <div className="w-24 h-24 bg-amber-50 dark:bg-amber-900/20 rounded-[2rem] flex items-center justify-center mx-auto mb-8 border border-amber-100 dark:border-amber-800/30 group">
                        <ShieldAlert className="w-12 h-12 text-amber-500 group-hover:scale-110 transition-transform duration-500" />
                    </div>

                    <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white uppercase tracking-tighter mb-4 italic">
                        Identity Authorization Pending
                    </h1>
                    
                    <p className="text-slate-500 dark:text-slate-400 text-lg font-medium max-w-md mx-auto mb-10 leading-relaxed">
                        Welcome to <span className="text-indigo-600 dark:text-indigo-400 font-bold">ScholorNode</span>, <span className="capitalize">{user.name}</span>. Your faculty profile is currently in the verification queue.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10 text-left">
                        <div className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-100 dark:border-slate-800 space-y-2">
                            <div className="flex items-center gap-2 text-slate-400 mb-2">
                                <Mail size={14} className="text-indigo-500" />
                                <span className="text-[10px] font-bold uppercase tracking-widest">Registered Email</span>
                            </div>
                            <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">{user.email}</p>
                        </div>
                        <div className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-100 dark:border-slate-800 space-y-2">
                            <div className="flex items-center gap-2 text-slate-400 mb-2">
                                <Key size={14} className="text-amber-500" />
                                <span className="text-[10px] font-bold uppercase tracking-widest">Registration Token</span>
                            </div>
                            <p className="font-mono text-xl font-bold text-amber-500 tracking-wider">
                                {user.registrationToken || 'SYNC-PENDING'}
                            </p>
                        </div>
                    </div>

                    <div className="bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20 rounded-[2rem] p-6 mb-10 flex flex-col items-center justify-center">
                        <div className="flex items-center gap-3 mb-3">
                            <Loader2 className="w-5 h-5 text-amber-500 animate-spin" />
                            <span className="text-xs font-bold uppercase tracking-widest text-amber-600 dark:text-amber-500">Scanning Verification Database</span>
                        </div>
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                            Our administrators are reviewing your credentials. Access will be granted automatically once approved.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button 
                            onClick={handleRefreshStatus}
                            disabled={isRefreshing}
                            className="px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-bold uppercase tracking-wide text-xs hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-slate-900/20 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isRefreshing ? <Loader2 size={16} className="animate-spin" /> : 'Check Status Again'}
                        </button>
                        <button 
                            onClick={handleLogout}
                            className="px-8 py-4 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold uppercase tracking-wide text-xs hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-2"
                        >
                            <LogOut size={16} /> Sign Out
                        </button>
                    </div>
                </div>

                <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center gap-6">
                    <div className="flex items-center gap-2">
                        <Building size={14} className="text-slate-400" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Governance Sector: Primary</span>
                    </div>
                    <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700"></div>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 italic">ScholorNode v4.0</span>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default WaitingAuthorization;
