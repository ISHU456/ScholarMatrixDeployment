import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, Clock, Zap, CheckCircle2, XCircle, 
  ChevronRight, AlertCircle, Trophy, Star, ShieldAlert
} from 'lucide-react';
import axios from 'axios';
import { useSelector, useDispatch } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { updateProfile } from '../../features/auth/authSlice';

const QuizArena = ({ quizId: propQuizId, onClose: propOnClose }) => {
  const { quizId: paramQuizId } = useParams();
  const navigate = useNavigate();
  const quizId = propQuizId || paramQuizId;
  const onClose = propOnClose || (() => navigate('/master-arena'));
  
  const { user } = useSelector(state => state.auth);
  const dispatch = useDispatch();
  
  const [quiz, setQuiz] = useState(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [results, setResults] = useState(null);
  const [tabSwitches, setTabSwitches] = useState(0);
  const [startTime] = useState(Date.now());
  const [isLoading, setIsLoading] = useState(true);
  const [showReview, setShowReview] = useState(false);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/gamification/quizzes/${quizId}`, config);
        setQuiz(res.data);
        setTimeLeft(res.data.timeLimit * 60);
        setIsLoading(false);
      } catch (err) {
        alert("Failed to initialize arena.");
        onClose();
      }
    };
    fetchQuiz();
  }, [quizId, user.token]);

  useEffect(() => {
    if (timeLeft > 0 && !isFinished) {
      const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0 && !isFinished && quiz) {
      handleFinish();
    }
  }, [timeLeft, isFinished, quiz]);

  useEffect(() => {
    const handleBlur = () => setTabSwitches(prev => prev + 1);
    window.addEventListener('blur', handleBlur);
    return () => window.removeEventListener('blur', handleBlur);
  }, []);

  const handleAnswer = (optionIdx) => {
    setAnswers({ ...answers, [currentQ]: optionIdx });
  };

  const handleFinish = async () => {
    if (isFinished) return;
    setIsFinished(true);
    
    const timeTaken = Math.round((Date.now() - startTime) / 1000);
    let score = 0;
    const finalAnswers = quiz.questions.map((q, idx) => {
      const selectedOptionIndex = answers[idx];
      const selectedOptionValue = q.options[selectedOptionIndex];
      
      let isCorrect = false;
      if (typeof q.correctAnswer === 'number') {
        isCorrect = selectedOptionIndex === q.correctAnswer;
      } else if (typeof q.correctAnswer === 'string') {
        isCorrect = selectedOptionValue === q.correctAnswer;
      }

      if (isCorrect) score += (quiz.totalPoints / quiz.questions.length);
      return { questionId: q._id, selectedOption: selectedOptionIndex, isCorrect };
    });

    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const res = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/gamification/quizzes/submit`, {
        quizId,
        score: Math.round(score),
        timeTaken,
        answers: finalAnswers,
        tabSwitches
      }, config);
      
      setResults(res.data);
      dispatch(updateProfile({ coins: res.data.totalCoins }));
    } catch (err) {
      alert("Sync failure: " + err.message);
    }
  };

  if (isLoading) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="fixed inset-0 z-[7000] bg-slate-50 dark:bg-[#030712] flex flex-col font-sans transition-colors duration-300"
    >
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
         <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 dark:bg-indigo-600/20 rounded-full blur-[120px] animate-pulse" />
         <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-rose-600/5 dark:bg-rose-600/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(67,97,238,0.05),transparent_70%)]" />
      </div>

      {/* Header */}
      <header className="relative z-10 px-8 py-6 border-b border-slate-200 dark:border-white/5 bg-white/80 dark:bg-gray-950/50 backdrop-blur-2xl flex items-center justify-between">
        <div className="flex items-center gap-6">
           <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-[0_0_30px_rgba(79,70,229,0.3)]">
              <Zap size={22} className="fill-current" />
           </div>
           <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white uppercase tracking-tight leading-none">{quiz.title}</h2>
              <div className="flex items-center gap-4 mt-1">
                 <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 uppercase tracking-wide">
                    <Clock size={12} /> {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')} REAMAINING
                 </div>
                 {tabSwitches > 0 && (
                   <div className="flex items-center gap-2 text-xs font-bold text-rose-500 uppercase tracking-wide bg-rose-500/10 px-2 py-0.5 rounded-lg border border-rose-500/20">
                      <ShieldAlert size={12} /> {tabSwitches} UNAUTHORIZED EXITS
                   </div>
                 )}
              </div>
           </div>
        </div>
         {!isFinished && (
            <button 
              onClick={() => navigate('/master-arena')} 
              className="px-8 py-3 bg-rose-600/20 text-rose-500 border border-rose-500/20 rounded-xl text-xs font-semibold uppercase tracking-wide hover:bg-rose-600 hover:text-white transition-all"
            >
              Abort
            </button>
         )}
      </header>

      <main className="flex-1 relative z-10 flex flex-col items-center justify-center p-8">
        <AnimatePresence mode="wait">
          {!isFinished ? (
            <motion.div 
              key="quiz-body"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="max-w-3xl w-full"
            >
              <div className="mb-12">
                 <div className="flex justify-between text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest mb-6">
                    <span className="flex items-center gap-2"><Brain size={12} /> Inquiry {currentQ + 1} of {quiz.questions.length}</span>
                    <span>{Math.round((currentQ + 1) / quiz.questions.length * 100)}% Momentum</span>
                 </div>
                 <div className="h-1.5 bg-slate-200 dark:bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-indigo-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${((currentQ + 1) / quiz.questions.length) * 100}%` }}
                    />
                 </div>
              </div>

              <h3 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-12 leading-[1.1] tracking-tighter">
                {quiz.questions[currentQ].question || quiz.questions[currentQ].text || quiz.questions[currentQ].statement || quiz.questions[currentQ].questionText || quiz.questions[currentQ].q || 'Unidentified Inquiry Node'}
              </h3>

              <div className="grid grid-cols-1 gap-4">
                {quiz.questions[currentQ].options.map((opt, idx) => (
                  <button 
                    key={idx}
                    onClick={() => handleAnswer(idx)}
                    className={`group relative p-6 rounded-3xl border text-left transition-all duration-300 ${
                      answers[currentQ] === idx 
                        ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-600/20' 
                        : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-white/[0.08] hover:border-indigo-300 dark:hover:border-white/20 shadow-sm'
                    }`}
                  >
                    <div className="flex items-center gap-6">
                       <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-semibold text-sm border-2 transition-all ${
                         answers[currentQ] === idx ? 'bg-white text-indigo-600 border-white' : 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/5 group-hover:border-indigo-400 dark:group-hover:border-white/20 text-slate-500 dark:text-gray-400'
                       }`}>
                          {String.fromCharCode(65 + idx)}
                       </div>
                       <span className="text-lg font-semibold tracking-tight">{opt}</span>
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-12 flex justify-between">
                 <button 
                   disabled={currentQ === 0}
                   onClick={() => setCurrentQ(prev => prev - 1)}
                   className="px-6 py-3 text-slate-400 dark:text-gray-500 hover:text-slate-900 dark:hover:text-white disabled:opacity-20 transition-all font-bold uppercase text-xs tracking-wide"
                 >
                   Previous Phase
                 </button>
                 {currentQ === quiz.questions.length - 1 ? (
                   <button 
                     onClick={handleFinish}
                     className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-semibold uppercase text-xs tracking-wide shadow-2xl hover:scale-105 active:scale-95 transition-all"
                   >
                     Initialize Extraction
                   </button>
                 ) : (
                   <button 
                     onClick={() => setCurrentQ(prev => prev + 1)}
                     className="px-10 py-4 bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-white border border-slate-300 dark:border-white/10 rounded-2xl font-semibold uppercase text-xs tracking-wide hover:bg-slate-300 dark:hover:bg-white/20 transition-all flex items-center gap-3"
                   >
                     Next Sequence <ChevronRight size={16} />
                   </button>
                 )}
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="results-body"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-4xl w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[3.5rem] p-12 text-center relative overflow-hidden shadow-2xl shadow-indigo-500/10"
            >
               <div className="absolute inset-0 bg-gradient-to-b from-indigo-600/10 to-transparent pointer-events-none" />
               
               {results ? (
                 <>
                   <div className="w-24 h-24 rounded-[2rem] bg-indigo-600 text-white flex items-center justify-center mx-auto mb-8 shadow-[0_0_50px_rgba(79,70,229,0.4)]">
                     <Trophy size={48} />
                   </div>
                   <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white uppercase tracking-tight leading-none mb-4">Sync Complete</h2>
                   <p className="text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-[0.5em] mb-12">Performance Data Verified in ScholarMatrix</p>
                   
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                      <div className="bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-[2.5rem] p-8 shadow-sm">
                         <div className="text-[10px] font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-widest mb-3">Neural Reward</div>
                         <div className="text-4xl font-bold text-slate-900 dark:text-white flex items-center justify-center gap-3">
                           <Star size={24} className="text-yellow-500 fill-current" /> {results.coinsEarned}
                         </div>
                         <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Scholar Coins</div>
                      </div>
                      <div className="bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-[2.5rem] p-8 shadow-sm">
                         <div className="text-[10px] font-bold text-amber-500 dark:text-amber-400 uppercase tracking-widest mb-3">Neural Sync</div>
                         <div className="text-4xl font-bold text-slate-900 dark:text-white">{results.score}<span className="text-lg opacity-30 mx-1">/</span>{results.maxScore}</div>
                         <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Corrective Match</div>
                      </div>
                      <div className="bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-[2.5rem] p-8 shadow-sm">
                         <div className="text-[10px] font-bold text-emerald-500 dark:text-emerald-400 uppercase tracking-widest mb-3">Global Rank</div>
                         <div className="text-4xl font-bold text-slate-900 dark:text-white">#{results.rank}</div>
                         <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Institutional Tier</div>
                      </div>
                   </div>

                   {results.newBadges?.length > 0 && (
                     <div className="mb-10">
                        <p className="text-xs font-semibold text-yellow-500 uppercase tracking-wide mb-4">New Achievements Unlocked</p>
                        <div className="flex justify-center gap-4">
                           {results.newBadges.map(b => (
                             <div key={b._id} className="group relative">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-yellow-600 to-amber-300 p-0.5 shadow-xl">
                                   <div className="w-full h-full bg-slate-900 rounded-2xl flex items-center justify-center">
                                      <img src={b.icon} alt={b.name} className="w-10 h-10 object-contain" />
                                   </div>
                                </div>
                                <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wide opacity-0 group-hover:opacity-100 transition-all">{b.name}</div>
                             </div>
                           ))}
                        </div>
                     </div>
                   )}

                    <div className="flex flex-col sm:flex-row gap-4">
                       <button 
                         onClick={() => setShowReview(!showReview)}
                         className="flex-1 py-5 bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 rounded-3xl font-semibold uppercase text-xs tracking-wide hover:bg-indigo-600 hover:text-white transition-all shadow-xl"
                       >
                         {showReview ? 'Hide Analysis' : 'Review Detailed Analysis'}
                       </button>
                       <button 
                         onClick={() => navigate('/master-arena')}
                         className="flex-1 py-5 bg-slate-900 dark:bg-white text-white dark:text-black rounded-3xl font-semibold uppercase text-xs tracking-wide hover:bg-indigo-600 dark:hover:bg-indigo-500 hover:text-white transition-all shadow-xl"
                       >
                         Return to Hub
                       </button>
                    </div>

                    <AnimatePresence>
                       {showReview && (
                         <motion.div 
                           initial={{ opacity: 0, height: 0 }}
                           animate={{ opacity: 1, height: 'auto' }}
                           exit={{ opacity: 0, height: 0 }}
                           className="mt-12 space-y-6 text-left overflow-hidden"
                         >
                            <div className="h-px bg-slate-200 dark:bg-white/5 mb-8" />
                            {quiz.questions.map((q, idx) => {
                              const userAns = answers[idx];
                              const isCorrect = typeof q.correctAnswer === 'number' 
                                ? userAns === q.correctAnswer 
                                : q.options[userAns] === q.correctAnswer;
                              
                              return (
                                <div key={idx} className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-3xl p-8 space-y-4 shadow-sm">
                                   <div className="flex items-start justify-between gap-4">
                                      <h4 className="text-lg font-semibold text-slate-900 dark:text-white leading-tight">
                                         <span className="text-indigo-500 mr-2">#{idx + 1}</span> {q.question || q.text}
                                      </h4>
                                      {isCorrect ? (
                                        <div className="flex items-center gap-1 text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-emerald-500/20">
                                           <CheckCircle2 size={12} /> Correct
                                        </div>
                                      ) : (
                                        <div className="flex items-center gap-1 text-rose-500 bg-rose-500/10 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-rose-500/20">
                                           <XCircle size={12} /> Incorrect
                                        </div>
                                      )}
                                   </div>
                                   
                                   <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                      {q.options.map((opt, oIdx) => {
                                        const isUserSelection = userAns === oIdx;
                                        const isCorrectAns = typeof q.correctAnswer === 'number' 
                                           ? oIdx === q.correctAnswer 
                                           : opt === q.correctAnswer;
                                        
                                        let borderColor = "border-slate-200 dark:border-white/5";
                                        let bgColor = "bg-white dark:bg-white/5";
                                        let textColor = "text-slate-500 dark:text-gray-400";

                                        if (isCorrectAns) {
                                          borderColor = "border-emerald-500/50";
                                          bgColor = "bg-emerald-500/10";
                                          textColor = "text-emerald-600 dark:text-emerald-400";
                                        } else if (isUserSelection && !isCorrect) {
                                          borderColor = "border-rose-500/50";
                                          bgColor = "bg-rose-500/10";
                                          textColor = "text-rose-600 dark:text-rose-400";
                                        }

                                        return (
                                          <div key={oIdx} className={`p-4 rounded-2xl border ${borderColor} ${bgColor} ${textColor} text-xs font-semibold flex items-center gap-3`}>
                                             <div className={`w-6 h-6 rounded-lg flex items-center justify-center border ${isCorrectAns ? 'bg-emerald-500 border-emerald-400 text-white' : 'border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-black/20'}`}>
                                                {String.fromCharCode(65 + oIdx)}
                                             </div>
                                             {opt}
                                          </div>
                                        );
                                      })}
                                   </div>

                                   {q.explanation && (
                                     <div className="mt-4 p-5 bg-indigo-50 dark:bg-indigo-500/5 border border-indigo-100 dark:border-indigo-500/10 rounded-2xl">
                                        <div className="flex items-center gap-2 text-indigo-500 dark:text-indigo-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-2">
                                           <AlertCircle size={12} /> Neural Rationale
                                        </div>
                                        <p className="text-xs text-slate-600 dark:text-gray-400 leading-relaxed">
                                           {q.explanation}
                                        </p>
                                     </div>
                                   )}
                                </div>
                              );
                            })}
                         </motion.div>
                       )}
                    </AnimatePresence>
                 </>
               ) : (
                 <div className="py-20 flex flex-col items-center">
                    <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-6" />
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Validating Neural Link...</p>
                 </div>
               )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </motion.div>
  );
};

export default QuizArena;
