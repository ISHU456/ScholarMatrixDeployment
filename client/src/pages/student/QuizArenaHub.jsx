import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Target, Clock, ChevronRight, Sparkles } from 'lucide-react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import QuizCenter from '../../components/student/QuizCenter';
import { useGamification } from '../../hooks/useGamification';

const QuizArenaHub = () => {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const studentId = user?._id;
  const { gamification, submitQuizAttempt } = useGamification(studentId);
  const [availableQuizzes, setAvailableQuizzes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        const res = await axios.get(`${import.meta.env.VITE_API_URL || 'https://scholarmatrixdeployment-server.onrender.com'}/api/quizzes`, config);
        setAvailableQuizzes(res.data || []);
      } catch (err) {
        console.error("Failed to fetch quizzes", err);
      } finally {
        setIsLoading(false);
      }
    };
    if (user?.token) fetchQuizzes();
  }, [user?.token]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#030712] pt-28 pb-20 px-6 lg:px-24">
      <div className="max-w-7xl mx-auto">
        <header className="mb-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-3xl bg-primary-600 text-white flex items-center justify-center shadow-xl shadow-primary-500/20">
                  <Brain size={24} />
                </div>
                <h1 className="text-4xl font-semibold text-gray-900 dark:text-white uppercase tracking-tighter italic">Quiz Arena Hub</h1>
              </div>
              <p className="text-gray-500 dark:text-gray-400 font-medium max-w-2xl">
                Challenge your cognitive limits and earn <span className="text-primary-600 dark:text-primary-400 font-bold">Neural Credits</span>. 
                Complete quizzes to level up and dominate the leaderboard.
              </p>
            </div>
            <div className="px-6 py-3 bg-emerald-500/10 text-emerald-600 rounded-2xl border border-emerald-500/10 text-sm font-bold uppercase tracking-widest flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {availableQuizzes.length} Cognitive Nodes Active
            </div>
          </div>
        </header>

        <div className="space-y-12">
          {availableQuizzes.length === 0 ? (
            <div className="p-20 text-center glass rounded-[4rem] border border-gray-100 dark:border-gray-800">
               <Brain size={64} className="mx-auto text-gray-200 dark:text-gray-700 mb-8 opacity-20" />
               <h3 className="text-xl font-semibold text-gray-400 uppercase tracking-widest italic">No cognitive challenges currently deployed for your sector.</h3>
               <p className="text-sm text-gray-500 mt-4">Check back later for new academic assignments.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
               {availableQuizzes.map(q => (
                 <motion.div 
                   key={q._id} 
                   whileHover={{ y: -8 }}
                   className="group relative bg-white dark:bg-gray-900 p-10 rounded-[3rem] border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-2xl transition-all overflow-hidden cursor-pointer" 
                   onClick={() => navigate(`/quiz-arena/${q._id}`)}
                 >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary-600/5 rounded-bl-[5rem] group-hover:scale-110 transition-transform" />
                    <div className="w-16 h-16 rounded-2xl bg-primary-600/10 text-primary-600 flex items-center justify-center mb-8 shadow-inner group-hover:bg-primary-600 group-hover:text-white transition-all">
                      <Brain size={32}/>
                    </div>
                    <h3 className="text-2xl font-semibold text-gray-900 dark:text-white uppercase tracking-tight mb-3 leading-none">{q.title}</h3>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-10 line-clamp-2 uppercase tracking-wide leading-relaxed">
                      {q.description || 'Test your cognitive logic across institutional parameters.'}
                    </p>
                    <div className="flex items-center justify-between pt-8 border-t border-gray-50 dark:border-gray-800">
                       <div className="flex items-center gap-6">
                          <div className="flex items-center gap-2">
                            <Target size={16} className="text-gray-400"/>
                            <span className="text-xs font-bold text-gray-500">{q.totalPoints} PTS</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock size={16} className="text-gray-400"/>
                            <span className="text-xs font-bold text-gray-500">{q.timeLimit} MIN</span>
                          </div>
                       </div>
                       <div className="w-12 h-12 rounded-2xl bg-gray-900 text-white flex items-center justify-center group-hover:bg-primary-600 transition-all shadow-xl group-hover:scale-110">
                         <ChevronRight size={24}/>
                       </div>
                    </div>
                 </motion.div>
               ))}
            </div>
          )}

          {/* Institutional Offline Modules */}
          <div className="mt-20 pt-20 border-t border-gray-100 dark:border-gray-800">
             <div className="flex items-center gap-4 mb-10 px-2">
               <h4 className="text-xs font-bold uppercase tracking-[0.4em] text-gray-400">Institutional Offline Modules</h4>
               <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800 opacity-50" />
             </div>
             <div className="glass p-10 rounded-[4rem] border border-gray-100 dark:border-gray-800">
                <QuizCenter
                  studentId={studentId}
                  gamification={gamification}
                  submitQuizAttempt={submitQuizAttempt}
                  studentName={user?.name}
                />
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizArenaHub;
