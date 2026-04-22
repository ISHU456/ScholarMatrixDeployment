import { Brain, Target, Clock, ArrowRight, ChevronRight, Zap, Trophy, ShieldCheck, Star, ShieldOff, Users, X, RotateCcw } from 'lucide-react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

const QuizHall = ({ quizzes = [], onSelect, isAdmin, onRefresh }) => {
  const [viewingId, setViewingId] = useState(null);
  const [localAttendees, setLocalAttendees] = useState({});
  const [isAttendeesLoading, setIsAttendeesLoading] = useState(false);

  const handleViewAttendees = async (quizId) => {
    setViewingId(quizId);
    if (localAttendees[quizId]) return;
    
    setIsAttendeesLoading(true);
    try {
      const token = JSON.parse(localStorage.getItem('userInfo'))?.token;
      const res = await axios.get(`${import.meta.env.VITE_API_URL || 'https://scholarmatrixdeployment-server.onrender.com'}/api/gamification/quizzes/${quizId}/attendees`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLocalAttendees(prev => ({ ...prev, [quizId]: res.data }));
    } catch (err) {
      console.error(err);
    } finally {
      setIsAttendeesLoading(false);
    }
  };
  if (quizzes.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-[3rem] p-16 text-center border-2 border-dashed border-gray-100 dark:border-gray-800">
        <div className="w-24 h-24 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-8 text-gray-300">
          <Brain size={48} />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white uppercase tracking-tight mb-2">Neural Link Idle</h3>
        <p className="text-sm font-semibold text-gray-400 uppercase tracking-widest">No active assessments in your sector. Standby for deployment.</p>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-indigo-600 rounded-[1.25rem] flex items-center justify-center text-white shadow-xl shadow-indigo-600/30">
            <Zap className="fill-current" size={24} />
          </div>
          <div>
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white uppercase tracking-tighter leading-none">Active Deployment</h2>
            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.4em] mt-2">Institutional Cognitive Protocols</p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-6">
           <div className="flex flex-col items-end">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Sector Integrity</span>
              <span className="text-sm font-bold text-emerald-500 uppercase">Verified</span>
           </div>
           <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20">
              <ShieldCheck size={24} />
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {quizzes.map((quiz, index) => (
          <motion.div
            key={quiz._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => {
              if (viewingId === quiz._id) return;
              if (isAdmin || !quiz.isAttempted) onSelect(quiz._id);
            }}
            className={`group relative bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all cursor-pointer overflow-hidden ${(quiz.isAttempted && !isAdmin) ? 'opacity-70 grayscale' : ''}`}
          >
            <AnimatePresence>
              {isAdmin && quiz._id === viewingId && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute inset-0 z-50 bg-white dark:bg-[#080c14] overflow-y-auto custom-scrollbar p-6"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Participation Log</h4>
                    <button onClick={() => setViewingId(null)} className="p-1 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg"><X size={14}/></button>
                  </div>
                  {/* We can use a smaller version of attendees list here */}
                  <div className="space-y-4">
                    {isAttendeesLoading ? (
                      <p className="text-[10px] text-center text-indigo-500 py-10 uppercase font-bold tracking-widest animate-pulse">Synchronizing Ledger...</p>
                    ) : localAttendees[quiz._id]?.length > 0 ? (
                      localAttendees[quiz._id].map(a => (
                        <div key={a._id} className="flex items-center justify-between gap-2 p-2 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/5 group/attendee">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-6 h-6 rounded-lg bg-indigo-500/10 flex items-center justify-center text-[10px] font-bold text-indigo-600 shrink-0">
                              {a.user?.name?.[0]}
                            </div>
                            <span className="text-[10px] font-bold truncate text-slate-700 dark:text-slate-300 uppercase">{a.user?.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                             <span className="text-[10px] font-black text-indigo-500 tabular-nums shrink-0">{a.score}/{a.maxScore}</span>
                             <button 
                               onClick={async (e) => {
                                 e.stopPropagation();
                                 if (!window.confirm(`Reset attempt for ${a.user?.name}?`)) return;
                                 try {
                                   const token = JSON.parse(localStorage.getItem('userInfo'))?.token;
                                   await axios.delete(`${import.meta.env.VITE_API_URL || 'https://scholarmatrixdeployment-server.onrender.com'}/api/gamification/quizzes/${quiz._id}/attempts/${a.user?._id}`, {
                                     headers: { Authorization: `Bearer ${token}` }
                                   });
                                   // Refresh local list
                                   const res = await axios.get(`${import.meta.env.VITE_API_URL || 'https://scholarmatrixdeployment-server.onrender.com'}/api/gamification/quizzes/${quiz._id}/attendees`, {
                                     headers: { Authorization: `Bearer ${token}` }
                                   });
                                   setLocalAttendees(prev => ({ ...prev, [quiz._id]: res.data }));
                                 } catch (err) {
                                   alert("Reset failed: " + err.message);
                                 }
                               }}
                               className="p-1.5 bg-rose-500/10 text-rose-500 rounded-md opacity-0 group-hover/attendee:opacity-100 transition-all hover:bg-rose-500 hover:text-white"
                               title="Reset Individual Attempt"
                             >
                                <RotateCcw size={10} />
                             </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-[10px] text-center text-slate-400 py-10 uppercase font-bold tracking-widest italic">No Participants Found</p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Glossy Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-indigo-600/5 rounded-full group-hover:scale-150 transition-transform duration-1000" />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-8">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-inner ${quiz.isAttempted ? 'bg-emerald-500/10 text-emerald-500' : 'bg-gray-50 dark:bg-gray-800 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white'}`}>
                  {quiz.isAttempted ? <ShieldCheck size={28} /> : <Brain size={28} />}
                </div>
                <div className="flex flex-col items-end">
                   <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{quiz.isAttempted ? 'Earned' : 'Neural Reward'}</span>
                   <span className={`text-lg font-bold tabular-nums ${quiz.isAttempted ? 'text-emerald-500' : 'text-gray-900 dark:text-white'}`}>{quiz.totalPoints} <span className="text-[10px]">COINS</span></span>
                </div>
              </div>

              <h3 className="text-2xl font-bold text-gray-900 dark:text-white uppercase tracking-tighter mb-4 group-hover:text-indigo-600 transition-colors leading-[0.9]">
                {quiz.title}
              </h3>
              
              <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-10 line-clamp-2 leading-relaxed opacity-70">
                {quiz.description || "Core institutional assessment for performance validation."}
              </p>

              {quiz.isAttempted ? (
                <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-4 mb-8 flex items-center justify-between">
                   <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Sync Complete</span>
                   <div className="flex items-center gap-1">
                      <Star size={12} className="text-amber-500 fill-current" />
                      <Star size={12} className="text-amber-500 fill-current" />
                      <Star size={12} className="text-amber-500 fill-current" />
                   </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 mb-8 pt-6 border-t border-gray-50 dark:border-gray-800">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                      <Target size={14} />
                    </div>
                    <div>
                      <p className="text-[8px] font-bold text-gray-400 uppercase">Target</p>
                      <p className="text-xs font-bold text-gray-700 dark:text-gray-300">70%</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center">
                      <Clock size={14} />
                    </div>
                    <div>
                      <p className="text-[8px] font-bold text-gray-400 uppercase">Time Protocol</p>
                      <p className="text-xs font-bold text-gray-700 dark:text-gray-300">{quiz.timeLimit} MIN</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex -space-x-2">
                   {[1,2,3].map(i => (
                      <div key={i} className="w-7 h-7 rounded-full border-2 border-white dark:border-gray-900 bg-gray-200 overflow-hidden">
                         <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="Sch" className="w-full h-full object-cover grayscale" />
                      </div>
                   ))}
                   <div className="w-7 h-7 rounded-full border-2 border-white dark:border-gray-900 bg-indigo-600 flex items-center justify-center text-[8px] font-bold text-white">
                      +12
                   </div>
                </div>

                {isAdmin && (
                   <div className="flex items-center gap-2">
                     <button 
                       onClick={(e) => {
                         e.stopPropagation();
                         handleViewAttendees(quiz._id);
                       }}
                       className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-2"
                     >
                       <Users size={12} />
                       Attendees {localAttendees[quiz._id]?.length > 0 && `(${localAttendees[quiz._id].length})`}
                     </button>
                   </div>
                 )}
                
                <div className="flex items-center gap-3 group/btn">
                  <span className={`text-[10px] font-bold uppercase tracking-[0.2em] transition-all opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 ${(quiz.isAttempted && !isAdmin) ? 'text-emerald-600' : 'text-indigo-600'}`}>
                    {(quiz.isAttempted && !isAdmin) ? 'Locked' : 'Enter Arena'}
                  </span>
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-lg shadow-black/10 ${(quiz.isAttempted && !isAdmin) ? 'bg-emerald-500 text-white' : 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 group-hover:bg-indigo-600 group-hover:text-white'}`}>
                    {(quiz.isAttempted && !isAdmin) ? <ShieldCheck size={24} /> : <ChevronRight size={24} />}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default QuizHall;
