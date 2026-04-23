import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, X, Info, AlertTriangle, ChevronRight, Zap } from 'lucide-react';
import axios from 'axios';
import { useSelector } from 'react-redux';

const InstitutionalAlert = () => {
  const { user } = useSelector(state => state.auth);
  const [alerts, setAlerts] = useState([]);
  const [activePopup, setActivePopup] = useState(null);

  useEffect(() => {
    if (!user?.token) return;
    const fetchAlerts = async () => {
      try {
        const { data } = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/notifications`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        
        // Filter for unread or popup-active warnings/errors
        const unreadAlerts = data.filter(n => !n.read || n.popupActive);
        setAlerts(unreadAlerts);

        // Find first active popup
        const firstPopup = unreadAlerts.find(n => n.popupActive);
        if (firstPopup) setActivePopup(firstPopup);
      } catch (err) { console.error('Alert fetch failure'); }
    };

    fetchAlerts();
    const interval = setInterval(fetchAlerts, 30000); // 30s refresh
    return () => clearInterval(interval);
  }, [user]);

  const dismissPopup = async (id) => {
    try {
      await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/notifications/${id}/dismiss-popup`, {}, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setActivePopup(null);
      setAlerts(prev => prev.map(a => a._id === id ? { ...a, popupActive: false } : a));
    } catch (err) { console.error('Dismiss failed'); }
  };

  if (alerts.length === 0) return null;

  return (
    <>
      {/* Marquee Container */}
      <div className="w-full bg-indigo-600/10 border-b border-indigo-500/20 backdrop-blur-md overflow-hidden h-10 flex items-center shrink-0 z-40">
        <div className="flex items-center px-4 gap-3 bg-indigo-600 h-full z-10 shadow-lg whitespace-nowrap">
          <AlertCircle size={14} className="text-white" />
          <span className="text-xs font-semibold text-white uppercase tracking-wide">Campus Alert System</span>
        </div>

        
        <div className="relative flex-1 overflow-hidden h-full flex items-center">
          <div className="flex animate-marquee whitespace-nowrap py-2">
            {alerts.map((alert, idx) => (
              <span key={alert._id} className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide px-10 flex items-center gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                {alert.message}
                <span className="text-xs text-indigo-400/60 font-medium">[{new Date(alert.createdAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}]</span>
              </span>
            ))}

            {/* Duplicate for seamless loop */}
            {alerts.map((alert, idx) => (
              <span key={alert._id + '_dup'} className="text-xs font-semibold text-rose-500 uppercase tracking-wide px-10 flex items-center gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                {alert.message}
                <span className="text-xs text-rose-400/60 font-semibold italic">[{new Date(alert.createdAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}]</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Modal Popup */}
      <AnimatePresence>
        {activePopup && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              className="w-full max-w-lg bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-[2.5rem] shadow-2xl overflow-hidden relative"
            >

              {/* Alert Header */}
              <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 p-8 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md">
                    <Info size={28} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white uppercase tracking-tight leading-none">Official Notice</h3>
                    <p className="text-xs font-medium text-white/70 uppercase tracking-wide mt-1.5 flex items-center gap-2">
                       <Zap size={10} /> Priority Broadcast
                    </p>
                  </div>
                </div>
                <button onClick={() => dismissPopup(activePopup._id)} className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl text-white transition-all">
                  <X size={20} />
                </button>
              </div>


              {/* Msg Content */}
              <div className="p-10 space-y-8">
                <div className="space-y-4">
                  <span className="text-xs font-semibold text-rose-500 uppercase tracking-[0.3em] flex items-center gap-2">
                    <span className="w-4 h-[1px] bg-rose-500" /> Secure Transmission
                  </span>
                  <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8">
                    <p className="text-lg font-semibold text-white italic leading-relaxed tracking-tight">
                      "{activePopup.message}"
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <button 
                    onClick={() => {
                      if (activePopup.link) window.location.href = activePopup.link;
                      dismissPopup(activePopup._id);
                    }}
                    className="w-full py-5 bg-indigo-600 text-white rounded-2xl text-xs font-bold uppercase tracking-wide shadow-xl shadow-indigo-600/20 transition-all hover:bg-indigo-700 flex items-center justify-center gap-3"
                  >
                    View Details <ChevronRight size={14} />
                  </button>
                  <button 
                    onClick={() => dismissPopup(activePopup._id)}
                    className="w-full py-5 bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 rounded-2xl text-xs font-semibold uppercase tracking-wide transition-all hover:bg-gray-200 dark:hover:bg-slate-700"
                  >
                    Dismiss Notice
                  </button>
                </div>

                
                <p className="text-center text-xs font-semibold text-slate-600 uppercase tracking-wide tabular-nums">
                  Directive Issued: {new Date(activePopup.createdAt).toLocaleString()} Node ID: {activePopup._id.slice(-8)}
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </>
  );
};

export default InstitutionalAlert;
