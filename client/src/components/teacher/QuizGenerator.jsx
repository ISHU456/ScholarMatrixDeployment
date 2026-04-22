import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Trash2, Save, X, Brain, Clock, 
  Target, Zap, Shield, HelpCircle, Loader2 
} from 'lucide-react';
import axios from 'axios';
import { useSelector } from 'react-redux';

const QuizGenerator = ({ onClose, onSave, quizId }) => {
  const { user } = useSelector(state => state.auth);
  const [quizForm, setQuizForm] = useState({
    title: '',
    description: '',
    category: 'General',
    timeLimit: 15,
    idealTime: 10,
    totalPoints: 100,
    coinsReward: {
      base: 10,
      fullMarksBonus: 20,
      speedBonusMultiplier: 1.5
    },
    questions: [
      { question: '', options: ['', '', '', ''], correctAnswer: 0, explanation: '' }
    ]
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');

  useEffect(() => {
    if (quizId) {
      const fetchQuiz = async () => {
        setIsLoading(true);
        try {
          const config = { headers: { Authorization: `Bearer ${user.token}` } };
          const res = await axios.get(`${import.meta.env.VITE_API_URL || 'https://scholarmatrixdeployment-server.onrender.com'}/api/gamification/quizzes/${quizId}`, config);
          
          if (res.data && res.data.questions && Array.isArray(res.data.questions)) {
            res.data.questions = res.data.questions.map(q => {
              const definitiveText = q.question || q.text || q.statement || q.questionText || q.q || '';
              const normalizedQ = { ...q, question: definitiveText };
              delete normalizedQ.text;
              delete normalizedQ.statement;
              delete normalizedQ.questionText;
              delete normalizedQ.q;
              return normalizedQ;
            });
            setQuizForm(res.data);
          } else {
            setQuizForm(res.data);
          }
        } catch (err) {
          console.error("Failed to fetch quiz data:", err);
        } finally {
          setIsLoading(false);
        }
      };
      fetchQuiz();
    }
  }, [quizId, user.token]);

  const addQuestion = () => {
    setQuizForm({
      ...quizForm,
      questions: [...quizForm.questions, { question: '', options: ['', '', '', ''], correctAnswer: 0, explanation: '' }]
    });
  };

  const removeQuestion = (index) => {
    const newQuestions = quizForm.questions.filter((_, i) => i !== index);
    setQuizForm({ ...quizForm, questions: newQuestions });
  };

  const handleQuestionChange = (index, field, value) => {
    const newQuestions = [...quizForm.questions];
    newQuestions[index][field] = value;
    setQuizForm({ ...quizForm, questions: newQuestions });
  };

  const handleOptionChange = (qIndex, oIndex, value) => {
    const newQuestions = [...quizForm.questions];
    newQuestions[qIndex].options[oIndex] = value;
    setQuizForm({ ...quizForm, questions: newQuestions });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      if (quizId) {
        await axios.put(`${import.meta.env.VITE_API_URL || 'https://scholarmatrixdeployment-server.onrender.com'}/api/gamification/quizzes/${quizId}`, quizForm, config);
        alert("Quiz updated successfully!");
      } else {
        await axios.post(`${import.meta.env.VITE_API_URL || 'https://scholarmatrixdeployment-server.onrender.com'}/api/gamification/quizzes`, quizForm, config);
        alert("Quiz created successfully!");
      }
      if (onSave) onSave();
      if (onClose) onClose();
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAiGenerate = async () => {
    if (!aiPrompt) return alert("Please enter a topic for AI generation.");
    setIsGenerating(true);
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const res = await axios.post(`${import.meta.env.VITE_API_URL || 'https://scholarmatrixdeployment-server.onrender.com'}/api/chatbot/generate-quiz`, { 
        topic: aiPrompt,
        count: 5 
      }, config);
      
      if (Array.isArray(res.data)) {
        setQuizForm({
          ...quizForm,
          title: aiPrompt + " Quiz",
          questions: res.data.map(q => ({
            question: q.question,
            options: q.options,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation || `Explanation for ${aiPrompt} question.`
          }))
        });
        alert("5 AI questions generated!");
      }
    } catch (err) {
      alert("AI Generation failed: " + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[6000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-[#0b0f1a] border border-white/10 rounded-[2.5rem] w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
      >
        {/* Header */}
        <div className="px-8 py-6 border-b border-white/5 bg-white/5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-[0_0_20px_rgba(79,70,229,0.4)]">
              <Brain size={24} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white uppercase tracking-tighter">{quizId ? 'Edit Quiz' : 'Create New Quiz'}</h2>
              <p className="text-xs text-indigo-400 font-bold uppercase tracking-wide mt-1">{quizId ? 'Modify quiz settings' : 'Configure questions and rewards'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-white/5 rounded-2xl text-gray-500 transition-all">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-6">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Quiz Title</label>
                <input 
                  type="text" 
                  required
                  value={quizForm.title}
                  onChange={e => setQuizForm({...quizForm, title: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold text-white outline-none focus:border-indigo-500 transition-all"
                  placeholder="e.g. Basic Mathematics"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Description</label>
                <textarea 
                  value={quizForm.description || ''}
                  onChange={e => setQuizForm({...quizForm, description: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold text-white outline-none focus:border-indigo-500 transition-all h-24 resize-none"
                  placeholder="What is this quiz about?"
                />
              </div>
              <div className="p-6 rounded-3xl bg-indigo-600/5 border border-indigo-500/20 flex flex-col md:flex-row items-center gap-4">
                 <div className="flex-1">
                    <label className="block text-xs font-semibold text-indigo-400 uppercase tracking-wide mb-2">AI Quiz Generator</label>
                    <input 
                      type="text" 
                      value={aiPrompt}
                      onChange={e => setAiPrompt(e.target.value)}
                      placeholder="Enter a topic (e.g. JavaScript)..."
                      className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-2.5 text-xs font-bold text-white outline-none focus:border-indigo-500 transition-all"
                    />
                 </div>
                 <button 
                   type="button"
                   onClick={handleAiGenerate}
                   disabled={isGenerating}
                   className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold uppercase tracking-wide hover:bg-indigo-500 disabled:opacity-50 transition-all flex items-center gap-2 whitespace-nowrap self-end md:self-auto"
                 >
                   {isGenerating ? <Loader2 className="animate-spin" size={14} /> : <Zap size={14} />} 
                   {isGenerating ? 'Generating...' : 'AI Generate'}
                 </button>
              </div>
            </div>
            <div className="bg-white/5 rounded-3xl p-6 border border-white/5 space-y-6">
                <h3 className="text-xs font-semibold text-indigo-400 uppercase tracking-wide flex items-center gap-2"><Zap size={14}/> Reward Settings</h3>
                <div className="space-y-4">
                   <div>
                      <label className="text-xs font-semibold text-gray-400 uppercase mb-2 block">Reward Coins</label>
                      <input 
                        type="number" 
                        value={quizForm.totalPoints} 
                        onChange={e => setQuizForm({...quizForm, totalPoints: parseInt(e.target.value)})} 
                        className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-2.5 text-xs font-bold text-white outline-none" 
                      />
                   </div>
                   <div>
                     <label className="text-xs font-semibold text-gray-400 uppercase mb-2 block">Ideal Time (Min)</label>
                     <input type="number" value={quizForm.idealTime} onChange={e => setQuizForm({...quizForm, idealTime: parseInt(e.target.value)})} className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-2.5 text-xs font-bold text-white outline-none" />
                   </div>
                   <div>
                     <label className="text-xs font-semibold text-gray-400 uppercase mb-2 block">Time Limit (Min)</label>
                     <input type="number" value={quizForm.timeLimit} onChange={e => setQuizForm({...quizForm, timeLimit: parseInt(e.target.value)})} className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-2.5 text-xs font-bold text-white outline-none" />
                   </div>
                </div>
            </div>
          </div>

          <div className="h-px bg-white/5" />

          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wide flex items-center gap-3">
                <HelpCircle size={18} className="text-indigo-500" /> Questions
              </h3>
              <button 
                type="button"
                onClick={addQuestion}
                className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-semibold uppercase tracking-wide shadow-lg hover:bg-indigo-500 transition-all flex items-center gap-2"
              >
                <Plus size={14} /> Add Question
              </button>
            </div>

            {quizForm.questions.map((q, qIdx) => (
              <motion.div 
                key={qIdx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white/5 border border-white/10 rounded-3xl p-8 relative group"
              >
                <button 
                  type="button"
                  onClick={() => removeQuestion(qIdx)}
                  className="absolute top-6 right-6 p-2 bg-rose-600/20 text-rose-500 rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-600 hover:text-white"
                >
                  <Trash2 size={16} />
                </button>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="space-y-6">
                       <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 block">Question {qIdx + 1}</label>
                        <textarea 
                          required
                          value={q.question || ''}
                          onChange={e => handleQuestionChange(qIdx, 'question', e.target.value)}
                          className="w-full bg-black/40 border border-white/5 rounded-xl px-5 py-3.5 text-sm font-bold text-white outline-none focus:border-indigo-500 transition-all h-24 resize-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 block">Explanation (Optional)</label>
                        <textarea 
                          value={q.explanation || ''}
                          onChange={e => handleQuestionChange(qIdx, 'explanation', e.target.value)}
                          className="w-full bg-black/40 border border-white/5 rounded-xl px-5 py-3 text-xs font-bold text-white outline-none focus:border-indigo-500 transition-all h-20 resize-none"
                          placeholder="Why is this answer correct?"
                        />
                      </div>
                   </div>

                   <div className="space-y-4">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Options (Select the correct one)</label>
                      {q.options.map((opt, oIdx) => (
                        <div key={oIdx} className="flex items-center gap-3">
                          <button 
                            type="button"
                            onClick={() => handleQuestionChange(qIdx, 'correctAnswer', oIdx)}
                            className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${q.correctAnswer === oIdx ? 'bg-emerald-500 border-emerald-400 text-white' : 'border-white/10 hover:border-white/30'}`}
                          >
                            {q.correctAnswer === oIdx && <Save size={10} />}
                          </button>
                          <input 
                            type="text" 
                            required
                            value={opt}
                            onChange={e => handleOptionChange(qIdx, oIdx, e.target.value)}
                            className="flex-1 bg-black/40 border border-white/5 rounded-xl px-4 py-2.5 text-xs font-bold text-white outline-none focus:border-indigo-500 transition-all"
                            placeholder={`Option ${oIdx + 1}`}
                          />
                        </div>
                      ))}
                   </div>
                </div>
              </motion.div>
            ))}
          </div>
        </form>

        <div className="px-8 py-6 border-t border-white/5 bg-white/5 flex items-center justify-between">
           <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                 <Target size={18} className="text-indigo-400" />
                 <span className="text-xs font-extrabold text-gray-500 uppercase tracking-wide">{quizForm.questions.length} Questions</span>
              </div>
              <div className="flex items-center gap-3">
                 <Clock size={18} className="text-orange-400" />
                 <span className="text-xs font-extrabold text-gray-500 uppercase tracking-wide">{quizForm.timeLimit} Min</span>
              </div>
           </div>
           <div className="flex items-center gap-4">
              <button onClick={onClose} className="px-8 py-4 rounded-2xl text-gray-400 text-xs font-semibold uppercase tracking-wide hover:text-white transition-all">Cancel</button>
              <button 
                onClick={handleSubmit}
                disabled={isLoading}
                className="px-10 py-4 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-2xl text-xs font-semibold uppercase tracking-wide shadow-xl shadow-indigo-600/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} {quizId ? 'Save Changes' : 'Create Quiz'}
              </button>
           </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default QuizGenerator;
