import React from 'react';
import { motion } from 'framer-motion';

const SplashScreen = () => {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#f8fafc] dark:bg-[#030712] overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative flex flex-col items-center">
        {/* Animated Logo / Icon */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative mb-8"
        >
          <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-primary-500 via-indigo-600 to-primary-700 p-1 shadow-2xl shadow-primary-500/20">
            <div className="w-full h-full rounded-[1.8rem] bg-white dark:bg-gray-950 flex items-center justify-center overflow-hidden">
              <motion.div
                animate={{ 
                  rotate: [0, 10, -10, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  duration: 4, 
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="text-4xl font-black bg-gradient-to-br from-primary-600 to-indigo-600 bg-clip-text text-transparent"
              >
                SM
              </motion.div>
            </div>
          </div>
          
          {/* Orbital rings */}
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            className="absolute -inset-4 border-2 border-primary-500/20 rounded-[2.5rem] border-dashed"
          />
        </motion.div>

        {/* Text and Progress */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="text-center"
        >
          <h1 className="text-2xl font-bold tracking-[0.2em] text-gray-900 dark:text-white uppercase mb-2">
            ScholarMatrix
          </h1>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-6">
            Initalizing Academic Environment
          </p>
          
          {/* Loading bar container */}
          <div className="w-48 h-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden relative">
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: "100%" }}
              transition={{ 
                duration: 1.5, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-primary-500 to-transparent"
            />
          </div>
        </motion.div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes pulse-gentle {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.8; }
        }
      `}} />
    </div>
  );
};

export default SplashScreen;
