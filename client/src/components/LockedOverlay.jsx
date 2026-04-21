import { motion } from 'framer-motion';
import { Lock, UserPlus, LogIn } from 'lucide-react';
import { Link } from 'react-router-dom';

const LockedOverlay = ({ title = "Secure Content", message = "Please sign in to access this educational resource." }) => {

  return (
    <div className="absolute inset-0 z-[100] flex items-center justify-center p-6 pb-20 overflow-hidden">
      {/* Blur Background */}
      <div className="absolute inset-0 bg-white/40 dark:bg-black/40 backdrop-blur-2xl" />
      
      {/* Animated Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary-500/5 rounded-full blur-[100px]" />

      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative z-10 w-full max-w-xs bg-white dark:bg-[#0f172a] p-8 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-[0_24px_80px_-12px_rgba(0,0,0,0.12)] text-center flex flex-col items-center"
      >
        <div className="w-16 h-16 bg-primary-500/10 text-primary-600 rounded-2xl flex items-center justify-center mb-6 ring-1 ring-primary-500/20">
          <Lock size={32} />
        </div>


        <h2 className="text-xl font-bold text-gray-900 dark:text-white uppercase tracking-tight mb-3 leading-none">
          {title}
        </h2>

        
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-8 leading-relaxed uppercase tracking-wide max-w-[220px]">
          {message}
        </p>


        <div className="w-full flex flex-col gap-2">
          <Link 
            to="/login"
            className="w-full py-4 bg-primary-600 text-white rounded-xl font-bold text-xs uppercase tracking-wide shadow-xl shadow-primary-500/20 hover:bg-primary-700 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <LogIn size={14} /> Login
          </Link>

          
          <Link 
            to="/register"
            className="w-full py-2 text-gray-500 hover:text-primary-600 dark:hover:text-primary-400 font-bold text-xs uppercase tracking-wide transition-all flex items-center justify-center gap-2"
          >
            Create Account
          </Link>

        </div>

        <div className="mt-6 pt-6 border-t border-gray-50 dark:border-gray-800/50 w-full flex items-center justify-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Identity Verified</span>
        </div>

      </motion.div>
    </div>
  );
};

export default LockedOverlay;
