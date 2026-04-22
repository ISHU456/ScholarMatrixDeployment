import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Zap, Trophy, Target, ShieldCheck, Flame, 
  Brain, Crown, Calendar, ShoppingBag, 
  ChevronRight, ArrowLeft, ArrowRight, Star, Gift
} from 'lucide-react';

import QuizHall from '../../components/student/QuizHall';
import Leaderboard from '../../components/student/Leaderboard';
import PrizeProgress from '../../components/student/PrizeProgress';
import OrderHistory from '../../components/student/OrderHistory';
import { useGamification } from '../../hooks/useGamification';
import QuizArena from '../../components/student/QuizArena';
import CoinIcon from '../../components/CoinIcon';
import OrderManager from '../../components/admin/OrderManager';
import AdminQuizAttendees from '../../components/admin/AdminQuizAttendees';
import { updateProfile } from '../../features/auth/authSlice';
import { useDispatch } from 'react-redux';
import { useRef } from 'react';

const MasterArena = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { gamification, submitQuizAttempt } = useGamification(user?._id);
  const [quizzes, setQuizzes] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [prizes, setPrizes] = useState([]);
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('hall'); // 'hall' or 'governance'

  const fetchData = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const [qRes, lRes, pRes, oRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL || 'https://scholarmatrixdeployment-server.onrender.com'}/api/gamification/quizzes`, config),
        axios.get(`${import.meta.env.VITE_API_URL || 'https://scholarmatrixdeployment-server.onrender.com'}/api/gamification/leaderboard`, config),
        axios.get(`${import.meta.env.VITE_API_URL || 'https://scholarmatrixdeployment-server.onrender.com'}/api/prizes`, config),
        axios.get(`${import.meta.env.VITE_API_URL || 'https://scholarmatrixdeployment-server.onrender.com'}/api/orders/my`, config)
      ]);
      
      const sortedPrizes = pRes.data.sort((a,b) => a.rank - b.rank);
      setPrizes(sortedPrizes);
      setQuizzes(qRes.data);
      setLeaderboard(lRes.data);
      setOrders(oRes.data);
    } catch (err) {
      console.error("Failed to fetch arena data", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.token) fetchData();
  }, [user]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#050505] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
           <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
           <p className="text-xs font-bold text-indigo-500 uppercase tracking-[0.3em] animate-pulse">Syncing Neural Grid</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#050505] text-slate-900 dark:text-white selection:bg-indigo-500 selection:text-white transition-colors duration-300">
      {/* Dynamic Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/5 dark:bg-indigo-600/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-violet-600/2 dark:bg-violet-600/5 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative z-10 max-w-[1600px] mx-auto p-4 md:p-8 lg:p-12">
        {/* Header Section */}
        <header className="flex flex-col lg:flex-row items-center justify-between gap-8 mb-16">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-indigo-600/40 transform -rotate-6">
               <Brain size={40} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-5xl font-bold uppercase tracking-tight leading-none mb-2">Master Arena</h1>
              <p className="text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest">Institutional Ecosystem</p>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-white dark:bg-white/5 backdrop-blur-3xl p-2 rounded-[2rem] border border-slate-200 dark:border-white/10 shadow-xl dark:shadow-2xl">
             <div className="flex items-center gap-4 px-8 py-4 bg-slate-50 dark:bg-white/5 rounded-[1.5rem] border border-slate-100 dark:border-white/5">
                <div className="text-right">
                   <p className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest mb-1">Scholar Balance</p>
                   <div className="flex items-center gap-2 justify-end">
                      <CoinIcon size={20} />
                      <span className="text-2xl font-bold tabular-nums text-slate-900 dark:text-white">{user?.coins || 0}</span>
                   </div>
                </div>
             </div>
              <div className="flex flex-col gap-2 pr-4">
                    <button 
                      onClick={() => navigate('/reward-store')}
                      className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
                    >
                       Redeem Rewards
                    </button>
              </div>
          </div>
        </header>

        {/* Top Grid: Stats & Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
          <div className="lg:col-span-4">
            <PrizeProgress coins={user?.coins || 0} prizes={prizes} />
          </div>
          <div className="lg:col-span-8">
            <div className="bg-white dark:bg-white/5 backdrop-blur-3xl rounded-[3rem] p-10 border border-slate-200 dark:border-white/10 h-full relative overflow-hidden group shadow-sm">
               <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/5 rounded-bl-[10rem] group-hover:scale-110 transition-transform duration-1000" />
               
               <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div>
                     <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 bg-orange-500/20 text-orange-500 rounded-xl flex items-center justify-center">
                           <Flame size={20} className="fill-current" />
                        </div>
                        <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400 dark:text-gray-400">Weekly Activity</h2>
                     </div>
                     <div className="mb-6">
                        <h3 className="text-2xl font-bold uppercase tracking-tight mb-2 text-slate-900 dark:text-white">
                           {gamification?.streakDays >= 3 ? 'Cognitive Surge' : 'Baseline Momentum'}
                        </h3>
                        <p className="text-sm font-semibold text-slate-500 dark:text-gray-500 uppercase tracking-widest leading-relaxed">
                           {gamification?.streakDays >= 3 ? 'Elite scholar status active. Protocol optimized.' : 'Increase your daily streak to trigger a Cognitive Surge pulse.'}
                        </p>
                     </div>
                     <div className="flex items-center gap-1">
                        {[1,2,3,4,5,6,7].map((i) => (
                           <div key={i} className={`flex-1 h-1.5 rounded-full ${i <= (gamification?.streakDays || 0) ? 'bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]' : 'bg-slate-200 dark:bg-white/10'}`} />
                        ))}
                     </div>
                  </div>

                  <div className="flex flex-col justify-between">
                     <div className="grid grid-cols-2 gap-6">
                        <div className="p-6 bg-slate-50 dark:bg-white/5 rounded-3xl border border-slate-100 dark:border-white/5 text-center">
                           <p className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest mb-2">Reputation</p>
                           <p className="text-2xl font-bold text-indigo-500 uppercase">
                              {gamification?.xp >= 1000 ? 'Exemplary' : gamification?.xp >= 500 ? 'Proven' : 'Established'}
                           </p>
                        </div>
                        <div className="p-6 bg-slate-50 dark:bg-white/5 rounded-3xl border border-slate-100 dark:border-white/5 text-center">
                           <p className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest mb-2">Milestones</p>
                           <p className="text-2xl font-bold text-emerald-500 uppercase">
                              {(gamification?.badges?.length || 0)} <span className="text-[10px] opacity-50">Earned</span>
                           </p>
                        </div>
                     </div>
                     <button 
                       onClick={() => navigate('/profile')}
                       className="mt-8 w-full py-5 bg-slate-900 dark:bg-white text-white dark:text-black text-xs font-bold uppercase tracking-[0.3em] rounded-2xl hover:bg-indigo-600 dark:hover:bg-gray-200 transition-all shadow-xl active:scale-[0.98]"
                     >
                        View Public Profile
                     </button>
                  </div>
               </div>
            </div>
          </div>
        </div>

        {user?.role === 'admin' && (
          <div className="flex items-center gap-4 mb-12">
             <button onClick={() => setActiveTab('hall')} className={`px-8 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'hall' ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-white/5 text-slate-500 dark:text-gray-400 hover:bg-slate-300 dark:hover:bg-white/10'}`}>Master Arena Hub</button>
             <button onClick={() => setActiveTab('governance')} className={`px-8 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'governance' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-slate-200 dark:bg-white/5 text-slate-500 dark:text-gray-400 hover:bg-slate-300 dark:hover:bg-white/10'}`}>Orders Manager</button>
          </div>
        )}

        {activeTab === 'governance' ? (
          <div className="bg-white dark:bg-white/5 backdrop-blur-3xl rounded-[3rem] p-12 border border-slate-200 dark:border-white/10 shadow-sm">
            <OrderManager />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-8 space-y-12">
              <QuizHall 
                quizzes={quizzes} 
                onSelect={(id) => navigate(`/quiz-arena/${id}`)} 
                onRefresh={fetchData}
                isAdmin={user?.role === 'admin'}
              />
            </div>
            <div className="lg:col-span-4 space-y-8">
              <Leaderboard data={leaderboard} />
              <OrderHistory orders={orders} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MasterArena;
