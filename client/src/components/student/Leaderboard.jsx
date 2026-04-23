import React, { useState } from 'react';
import { Trophy, Medal, Crown, ChevronLeft, ChevronRight, Users } from 'lucide-react';
import CoinIcon from '../CoinIcon';

const Leaderboard = ({ data = [] }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(data.length / itemsPerPage);
  
  const currentData = data.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] p-8 border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden relative flex flex-col h-fit">
      <div className="flex items-center justify-between mb-8 shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white uppercase tracking-tight">Institutional Registry</h2>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mt-1">Verified Scholar Nodes</p>
        </div>
        <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-500">
          <Users size={24} />
        </div>
      </div>

      <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {currentData.map((user, index) => {
          const globalIndex = (currentPage - 1) * itemsPerPage + index;
          return (
            <div key={user._id} className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${globalIndex === 0 ? 'bg-amber-500/5 border border-amber-500/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
              <div className="w-10 h-10 flex items-center justify-center shrink-0">
                {globalIndex === 0 ? <Crown className="text-amber-500" size={24} /> : 
                 globalIndex === 1 ? <Medal className="text-slate-400" size={24} /> :
                 globalIndex === 2 ? <Medal className="text-amber-700" size={24} /> :
                 <span className="text-lg font-bold text-gray-300">#{globalIndex + 1}</span>}
              </div>
              
              <div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-white dark:border-gray-800 shadow-sm shrink-0">
                {user.profilePic ? (
                  <img src={user.profilePic} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-400 font-bold">
                    {user.name.charAt(0)}
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase truncate">{user.name}</h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{user.department}</p>
              </div>

              <div className="text-right">
                <div className="flex items-center gap-1.5 justify-end">
                  <CoinIcon size={14} />
                  <span className="text-sm font-black text-gray-900 dark:text-white tabular-nums">{user.coins || 0}</span>
                </div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Scholarly Balance</p>
              </div>
            </div>
          );
        })}
        {data.length === 0 && (
          <div className="text-center py-20">
             <Users size={40} className="mx-auto text-gray-200 mb-4 opacity-40"/>
             <p className="text-xs font-semibold text-gray-300 uppercase tracking-widest">No scholars verified</p>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-8 pt-8 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-4 shrink-0">
          <button 
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(p => p - 1)}
            className="flex-1 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl text-[10px] font-bold uppercase tracking-widest text-gray-500 disabled:opacity-30 transition-all flex items-center justify-center gap-2"
          >
            <ChevronLeft size={14}/> Prev
          </button>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{currentPage} / {totalPages}</span>
          <button 
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(p => p + 1)}
            className="flex-1 py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-indigo-600/20 disabled:opacity-30 transition-all flex items-center justify-center gap-2"
          >
            Next <ChevronRight size={14}/>
          </button>
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
