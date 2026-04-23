import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';
import { 
  ShoppingBag, Star, Zap, Trophy, 
  ArrowLeft, CheckCircle2, AlertCircle, Loader2,
  Plus, X, Image as ImageIcon, Trash2, Settings
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CoinIcon from '../../components/CoinIcon';
import { updateProfile } from '../../features/auth/authSlice';

const RewardStore = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [prizes, setPrizes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRedeeming, setIsRedeeming] = useState(null); 
  const [message, setMessage] = useState(null);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Admin form state
  const [newPrize, setNewPrize] = useState({
    title: '',
    description: '',
    coinsRequired: '',
    category: 'OTHER',
    image: null
  });

  const fetchPrizes = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/prizes`, config);
      // Sort by rank ASC (1, 2, 3), then coinsRequired DESC
      const sorted = res.data.sort((a,b) => {
        const rankA = a.rank || 999;
        const rankB = b.rank || 999;
        if (rankA !== rankB) return rankA - rankB;
        return b.coinsRequired - a.coinsRequired;
      });
      setPrizes(sorted);
    } catch (err) {
      console.error("Failed to fetch prizes", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.token) fetchPrizes();
  }, [user.token]);

  const handleRedeem = async (prize) => {
    if (user.coins < prize.coinsRequired) {
      setMessage({ type: 'error', text: 'Insufficient Scholar Coins' });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    setIsRedeeming(prize._id);
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/orders`, { prizeId: prize._id }, config);
      
      const updatedUser = { ...user, coins: user.coins - prize.coinsRequired };
      dispatch(updateProfile(updatedUser));
      
      setMessage({ type: 'success', text: `Redeemed ${prize.title} successfully!` });
      setTimeout(() => setMessage(null), 5000);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Redemption failed' });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setIsRedeeming(null);
    }
  };

  const handleCreatePrize = async (e) => {
    e.preventDefault();
    setIsCreating(true);
    const formData = new FormData();
    formData.append('title', newPrize.title);
    formData.append('description', newPrize.description);
    formData.append('coinsRequired', newPrize.coinsRequired);
    formData.append('category', newPrize.category);
    if (newPrize.rank) formData.append('rank', newPrize.rank);
    if (newPrize.image) formData.append('image', newPrize.image);

    try {
      const config = { 
        headers: { 
          Authorization: `Bearer ${user.token}`,
          'Content-Type': 'multipart/form-data'
        } 
      };
      await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/prizes`, formData, config);
      setMessage({ type: 'success', text: 'Prize added to registry' });
      setNewPrize({ title: '', description: '', coinsRequired: '', category: 'OTHER', image: null, rank: '' });
      setShowAdminPanel(false);
      fetchPrizes();
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to create prize' });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeletePrize = async (id) => {
    if (!window.confirm("Remove this item from the reward registry?")) return;
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.delete(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/prizes/${id}`, config);
      setMessage({ type: 'success', text: 'Item removed' });
      fetchPrizes();
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to delete' });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#050505] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
           <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
           <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest animate-pulse">Syncing Reward Grid</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#050505] text-slate-900 dark:text-white p-4 md:p-8 lg:p-12 relative">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-600/5 rounded-full blur-[120px]" />

      <div className="max-w-7xl mx-auto relative z-10">
        <header className="flex flex-col md:flex-row items-center justify-between gap-8 mb-16">
          <div className="flex items-center gap-4">
             <button 
               onClick={() => navigate('/master-arena')}
               className="p-4 bg-white dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 transition-all"
             >
               <ArrowLeft size={24} />
             </button>
             <div>
                <h1 className="text-4xl font-bold uppercase tracking-tight">Reward Registry</h1>
                <p className="text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-[0.3em]">Convert cognitive effort to tangible value</p>
             </div>
          </div>

          <div className="flex items-center gap-4">
            {user?.role === 'admin' && (
              <button 
                onClick={() => setShowAdminPanel(!showAdminPanel)}
                className={`p-5 rounded-2xl border transition-all flex items-center gap-3 ${showAdminPanel ? 'bg-rose-500 border-rose-500 text-white' : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-indigo-500 hover:scale-105'}`}
              >
                {showAdminPanel ? <X size={20} /> : <Plus size={20} />}
                <span className="text-[10px] font-black uppercase tracking-widest">{showAdminPanel ? 'Cancel' : 'Add Item'}</span>
              </button>
            )}
            <div className="px-8 py-5 bg-white dark:bg-white/5 backdrop-blur-3xl rounded-3xl border border-slate-200 dark:border-white/10 shadow-xl flex items-center gap-6">
               <div className="text-right">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest mb-1">Available Credits</p>
                  <div className="flex items-center gap-2 justify-end">
                     <CoinIcon size={24} />
                     <span className="text-3xl font-black tabular-nums">{user.coins || 0}</span>
                  </div>
               </div>
            </div>
          </div>
        </header>

        <AnimatePresence>
          {showAdminPanel && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-12 overflow-hidden"
            >
              <div className="bg-white dark:bg-white/5 backdrop-blur-3xl rounded-[3rem] p-10 border border-indigo-500/20 shadow-2xl relative">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                   <Settings size={120} />
                </div>
                <h2 className="text-xl font-black uppercase tracking-tighter mb-8 text-indigo-500">Neural Registry Control</h2>
                <form onSubmit={handleCreatePrize} className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                  <div className="space-y-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Prize Identifier</label>
                       <input 
                         required
                         type="text" 
                         placeholder="e.g. Master Researcher Badge"
                         className="w-full px-6 py-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/10 outline-none focus:border-indigo-500 transition-all font-bold text-sm"
                         value={newPrize.title}
                         onChange={(e) => setNewPrize({...newPrize, title: e.target.value})}
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Asset Description</label>
                       <textarea 
                         required
                         placeholder="Describe the institutional value of this reward..."
                         className="w-full px-6 py-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/10 outline-none focus:border-indigo-500 transition-all font-bold text-sm min-h-[120px]"
                         value={newPrize.description}
                         onChange={(e) => setNewPrize({...newPrize, description: e.target.value})}
                       />
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                         <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Credit Cost</label>
                         <div className="relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2"><CoinIcon size={16} /></div>
                            <input 
                              required
                              type="number" 
                              placeholder="500"
                              className="w-full pl-12 pr-6 py-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/10 outline-none focus:border-indigo-500 transition-all font-bold text-sm"
                              value={newPrize.coinsRequired}
                              onChange={(e) => setNewPrize({...newPrize, coinsRequired: e.target.value})}
                            />
                         </div>
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Classification</label>
                         <select 
                           className="w-full px-6 py-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/10 outline-none focus:border-indigo-500 transition-all font-bold text-sm uppercase appearance-none"
                           value={newPrize.category}
                           onChange={(e) => setNewPrize({...newPrize, category: e.target.value})}
                         >
                           <option value="ACCESSORY">Accessory</option>
                           <option value="EQUIPMENT">Equipment</option>
                           <option value="BADGE">Badge</option>
                           <option value="OTHER">Other</option>
                         </select>
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Neural Priority</label>
                         <input 
                           type="number" 
                           placeholder="Rank (1, 2...)"
                           className="w-full px-6 py-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/10 outline-none focus:border-indigo-500 transition-all font-bold text-sm"
                           value={newPrize.rank}
                           onChange={(e) => setNewPrize({...newPrize, rank: e.target.value})}
                         />
                      </div>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Visual Asset</label>
                       <div className="relative group/upload">
                          <input 
                            type="file" 
                            accept="image/*"
                            className="absolute inset-0 opacity-0 cursor-pointer z-20"
                            onChange={(e) => setNewPrize({...newPrize, image: e.target.files[0]})}
                          />
                          <div className={`w-full py-8 border-2 border-dashed rounded-[2rem] flex flex-col items-center justify-center gap-3 transition-all ${newPrize.image ? 'border-emerald-500 bg-emerald-500/5' : 'border-slate-200 dark:border-white/10 group-hover/upload:border-indigo-500 group-hover/upload:bg-indigo-500/5'}`}>
                             {newPrize.image ? <CheckCircle2 className="text-emerald-500" size={32} /> : <ImageIcon className="text-slate-300 dark:text-gray-600" size={32} />}
                             <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                               {newPrize.image ? newPrize.image.name : 'Select or Drop Visual Asset'}
                             </span>
                          </div>
                       </div>
                    </div>

                    <button 
                      disabled={isCreating}
                      className="w-full py-5 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-[0.4em] shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-[0.98] flex items-center justify-center gap-4"
                    >
                      {isCreating ? <Loader2 size={18} className="animate-spin" /> : <>Deploy Reward <Zap size={18} className="fill-current" /></>}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {message && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`fixed top-8 left-1/2 -translate-x-1/2 z-[100] px-8 py-4 rounded-full border flex items-center gap-3 shadow-2xl backdrop-blur-3xl ${
                message.type === 'success' ? 'bg-emerald-500/90 border-emerald-400 text-white' : 'bg-rose-500/90 border-rose-400 text-white'
              }`}
            >
              {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
              <span className="text-sm font-bold uppercase tracking-widest">{message.text}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {prizes.length === 0 ? (
             <div className="col-span-full py-32 text-center bg-white dark:bg-white/5 rounded-[4rem] border border-dashed border-slate-200 dark:border-white/10">
                <Trophy size={80} className="mx-auto mb-8 text-slate-100 dark:text-gray-800" />
                <h3 className="text-2xl font-black uppercase mb-3 tracking-tighter">Registry Offline</h3>
                <p className="text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-[0.3em]">No prizes currently available for redemption.</p>
             </div>
          ) : (
            prizes.map((prize, idx) => (
              <motion.div 
                key={prize._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="group bg-white dark:bg-white/5 backdrop-blur-3xl rounded-[3rem] p-8 border border-slate-200 dark:border-white/10 hover:border-indigo-500/30 transition-all flex flex-col h-full shadow-sm hover:shadow-2xl relative overflow-hidden"
              >
                {user?.role === 'admin' && (
                  <button 
                    onClick={() => handleDeletePrize(prize._id)}
                    className="absolute top-6 left-6 p-3 bg-rose-500/10 text-rose-500 rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-500 hover:text-white z-20"
                  >
                    <Trash2 size={16} />
                  </button>
                )}

                <div className="relative aspect-square rounded-[2.5rem] overflow-hidden mb-8 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 group-hover:shadow-inner transition-all">
                   <img 
                     src={prize.image} 
                     className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" 
                     alt={prize.title}
                     onError={(e) => { e.target.src = 'https://via.placeholder.com/400x400?text=Registry+Asset'; }}
                   />
                   <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                   <div className="absolute top-4 right-4 px-4 py-2 bg-black/60 backdrop-blur-md rounded-full border border-white/10 flex items-center gap-2">
                      <CoinIcon size={14} />
                      <span className="text-xs font-bold text-white tabular-nums">{prize.coinsRequired}</span>
                   </div>
                </div>

                <div className="flex-grow">
                   <div className="flex items-center gap-2 mb-3">
                      <span className="px-3 py-1 bg-indigo-500/10 text-indigo-500 text-[9px] font-bold uppercase tracking-widest rounded-md border border-indigo-500/20">
                        {prize.category || 'REGISTRY'}
                      </span>
                   </div>
                   <h3 className="text-2xl font-black uppercase tracking-tighter mb-3 group-hover:text-indigo-600 transition-colors leading-[0.9]">{prize.title}</h3>
                   <p className="text-[10px] font-bold text-slate-500 dark:text-gray-500 uppercase tracking-widest leading-relaxed line-clamp-3 opacity-70">
                     {prize.description || 'Exclusive institutional reward available for top performing scholars.'}
                   </p>
                </div>

                <button 
                  onClick={() => handleRedeem(prize)}
                  disabled={isRedeeming !== null || user.coins < prize.coinsRequired}
                  className={`mt-10 w-full py-5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.4em] transition-all flex items-center justify-center gap-4 ${
                    user.coins >= prize.coinsRequired 
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-xl shadow-indigo-600/20 active:scale-[0.98]' 
                      : 'bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-gray-600 cursor-not-allowed'
                  }`}
                >
                  {isRedeeming === prize._id ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <>
                      <ShoppingBag size={16} />
                      {user.coins >= prize.coinsRequired ? 'Synchronize Asset' : 'Insufficient Credits'}
                    </>
                  )}
                </button>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default RewardStore;
