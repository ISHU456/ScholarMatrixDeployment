import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Trophy, Clock, Target, Loader2, Search, CheckCircle2, RefreshCcw } from 'lucide-react';

const AdminQuizAttendees = ({ quizId, onClose, user }) => {
  const [attendees, setAttendees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchAttendees = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/gamification/quizzes/${quizId}/attendees`, config);
      setAttendees(res.data);
    } catch (err) {
      console.error("Failed to fetch attendees", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendees();
  }, [quizId, user.token]);

  const handleReset = async (userId) => {
     if (!window.confirm("Are you sure you want to allow this student to re-attempt the quiz? This will delete their current record.")) return;
     
     try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        await axios.delete(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/gamification/quizzes/${quizId}/attempts/${userId}`, config);
        alert("Attempt reset! The student can now participate again.");
        fetchAttendees(); // Refresh list
     } catch (err) {
        alert("Reset failed: " + (err.response?.data?.message || err.message));
     }
  };

  const filtered = attendees.filter(a => 
    a.user?.name?.toLowerCase().includes(search.toLowerCase()) || 
    a.user?.rollNumber?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-10">
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-5xl bg-white dark:bg-[#080c14] rounded-[3rem] border border-slate-200 dark:border-slate-800/60 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
      >
        <header className="p-8 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-white/5">
           <div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white uppercase tracking-tighter italic">Arena Participation Log</h2>
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mt-1">Real-time attendance & performance verification for selected neural node.</p>
           </div>
           <button onClick={onClose} className="p-3 hover:bg-slate-200 dark:hover:bg-white/10 rounded-2xl text-slate-500 transition-all"><X size={20}/></button>
        </header>

        <div className="p-8 space-y-6 flex-1 overflow-y-auto custom-scrollbar">
           <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="relative flex-1">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                 <input 
                   type="text"
                   placeholder="Search by name or roll number..."
                   value={search}
                   onChange={(e) => setSearch(e.target.value)}
                   className="w-full pl-12 pr-6 py-3.5 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-slate-800/40 rounded-2xl outline-none focus:ring-2 ring-indigo-500/20 transition-all font-semibold text-xs uppercase tracking-wide dark:text-white"
                 />
              </div>
              <div className="flex items-center gap-4">
                 <div className="px-6 py-3 bg-indigo-500/10 text-indigo-600 rounded-2xl border border-indigo-500/20 text-xs font-bold uppercase tracking-widest italic">
                    {attendees.length} Participants Synchronized
                 </div>
              </div>
           </div>

           {isLoading ? (
             <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 size={40} className="animate-spin text-indigo-500" />
                <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-400 italic">Decrypting participant data...</p>
             </div>
           ) : (
             <div className="grid grid-cols-1 gap-4">
                {filtered.map((attempt, idx) => (
                  <motion.div 
                    key={attempt._id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 p-6 bg-slate-50/50 dark:bg-white/5 rounded-3xl border border-slate-100 dark:border-slate-800/40 hover:border-indigo-500/20 transition-all group"
                  >
                    <div className="flex items-center gap-5 min-w-0 flex-1">
                       <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center font-bold text-lg shrink-0 border border-indigo-500/10 overflow-hidden">
                          {attempt.user?.profilePic ? (
                            <img src={attempt.user.profilePic} className="w-full h-full object-cover" alt="User"/>
                          ) : (
                            attempt.user?.name?.[0]
                          )}
                       </div>
                       <div className="min-w-0">
                          <h4 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-tight truncate">{attempt.user?.name}</h4>
                          <div className="flex flex-wrap items-center gap-3 mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                             <span className="flex items-center gap-1"><User size={10}/> {attempt.user?.rollNumber || 'N/A'}</span>
                             <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                             <span>{attempt.user?.department} | Sem {attempt.user?.semester}</span>
                          </div>
                       </div>
                    </div>

                    <div className="flex items-center gap-8 lg:gap-12 bg-white dark:bg-slate-900/40 px-8 py-3 rounded-2xl border border-slate-100 dark:border-slate-800/60 shadow-sm">
                       <div className="text-center">
                          <div className="flex items-center gap-1.5 text-indigo-500 mb-0.5 justify-center">
                             <Target size={14}/>
                             <span className="text-[10px] font-black uppercase tracking-tighter">Score</span>
                          </div>
                          <p className="text-sm font-black text-slate-900 dark:text-white italic tabular-nums">{attempt.score}/{attempt.maxScore}</p>
                       </div>
                       <div className="text-center border-x border-slate-100 dark:border-slate-800/60 px-8">
                          <div className="flex items-center gap-1.5 text-emerald-500 mb-0.5 justify-center">
                             <Clock size={14}/>
                             <span className="text-[10px] font-black uppercase tracking-tighter">Time</span>
                          </div>
                          <p className="text-sm font-black text-slate-900 dark:text-white italic tabular-nums">{Math.floor(attempt.timeTaken / 60)}:{(attempt.timeTaken % 60).toString().padStart(2, '0')}</p>
                       </div>
                       <div className="text-center">
                          <div className="flex items-center gap-1.5 text-amber-500 mb-0.5 justify-center">
                             <Trophy size={14}/>
                             <span className="text-[10px] font-black uppercase tracking-tighter">Coins</span>
                          </div>
                          <p className="text-sm font-black text-slate-900 dark:text-white italic tabular-nums">+{attempt.coinsEarned}</p>
                       </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="text-right">
                           <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Completion</p>
                           <p className="text-xs font-black text-slate-900 dark:text-white italic mt-0.5">{new Date(attempt.createdAt).toLocaleDateString()}</p>
                        </div>
                        
                        <button 
                          onClick={() => handleReset(attempt.user._id)}
                          className="flex items-center gap-2 px-4 py-2 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl border border-rose-500/20 transition-all group/reset shadow-sm hover:shadow-rose-500/20 active:scale-95"
                          title="Reset Attempt - Allow Re-participation"
                        >
                           <RefreshCcw size={14} className="group-hover/reset:rotate-180 transition-transform duration-500" />
                           <span className="text-[10px] font-bold uppercase tracking-widest">Reset</span>
                        </button>
                    </div>
                  </motion.div>
                ))}
                {filtered.length === 0 && (
                  <div className="py-20 text-center opacity-30 italic font-semibold uppercase tracking-[0.5em] text-slate-400">
                     No Matching Participant Records
                  </div>
                )}
             </div>
           )}
        </div>
        
        <footer className="p-8 border-t border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-white/5 flex justify-end shrink-0">
           <button onClick={onClose} className="px-8 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl text-xs font-bold uppercase tracking-widest hover:opacity-90 active:scale-95 transition-all shadow-xl shadow-slate-900/20">
              Close Access Log
           </button>
        </footer>
      </motion.div>
    </div>
  );
};

export default AdminQuizAttendees;
