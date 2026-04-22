import React from 'react';
import { motion } from 'framer-motion';
import { LayoutGrid } from 'lucide-react';

const PageLoader = ({ message = "Loading System" }) => {
  return (
    <div className="flex h-[60vh] min-h-[400px] w-full flex-col items-center justify-center bg-transparent relative overflow-hidden">
      {/* Decorative background pulses */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-50">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] animate-pulse" />
      </div>

      <div className="relative flex flex-col items-center">
        {/* Main Logo Animation */}
        <div className="relative mb-8 group">
          {/* Outer rotating ring */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="w-20 h-20 rounded-[1.5rem] border-2 border-indigo-500/20 border-t-indigo-500 border-r-indigo-500/40 relative z-10"
          />
          
          {/* Center Logo */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 flex items-center justify-center z-20"
          >
            <div className="bg-indigo-600 text-white p-2.5 rounded-xl shadow-lg shadow-indigo-600/20">
              <LayoutGrid size={20} />
            </div>
          </motion.div>

          {/* Pulse rings */}
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0, 0.3] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -inset-2 border border-indigo-500/20 rounded-[2rem]"
          />
        </div>

        {/* Snappy Loading Text */}
        <div className="text-center space-y-2">
          <motion.h2 
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="text-[10px] font-bold uppercase tracking-[0.4em] text-slate-400 dark:text-slate-500"
          >
            {message}
          </motion.h2>
          <div className="flex justify-center gap-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                className="w-1 h-1 rounded-full bg-indigo-500"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PageLoader;
