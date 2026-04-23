import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingBag, Search, Package, CheckCircle, Clock, XCircle, 
  ChevronRight, Filter, ExternalLink, Loader2, User, Mail,
  Calendar, CreditCard, RefreshCcw
} from 'lucide-react';

const AdminRewardFulfillment = ({ user }) => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchOrders();
  }, [user]);

  const fetchOrders = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/orders`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setOrders(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await axios.patch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/orders/${orderId}`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setOrders(orders.map(o => o._id === orderId ? { ...o, status: newStatus } : o));
    } catch (err) {
      alert("Failed to update status: " + err.message);
    }
  };

  const filtered = orders.filter(o => 
    ((o.userName?.toLowerCase() || '').includes(search.toLowerCase()) || 
     (o.prizeTitle?.toLowerCase() || '').includes(search.toLowerCase())) &&
    (filterStatus === 'all' || o.status === filterStatus)
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
      case 'approved': return 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20';
      case 'in progress': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      case 'rejected': return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
      default: return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white uppercase tracking-tighter flex items-center gap-3 italic">
            <ShoppingBag className="text-indigo-600" size={24} /> Transaction Log
          </h2>
          <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mt-1 italic">Redemption History: Monitoring institutional asset distribution protocols.</p>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text"
              placeholder="Search Student or Prize..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-12 pr-6 py-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-slate-800/60 rounded-2xl w-full md:w-64 outline-none focus:ring-2 ring-indigo-500/20 transition-all font-semibold text-xs uppercase tracking-wide text-slate-900 dark:text-white"
            />
          </div>
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-6 py-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-slate-800/60 rounded-2xl outline-none focus:ring-2 ring-indigo-500/20 transition-all font-semibold text-xs uppercase tracking-wide text-slate-900 dark:text-white cursor-pointer"
          >
            <option value="all">All Transmissions</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="in progress">In Progress</option>
            <option value="delivered">Delivered</option>
            <option value="rejected">Rejected</option>
          </select>
          <button 
            onClick={fetchOrders}
            className="p-3 bg-indigo-600/10 text-indigo-600 rounded-2xl border border-indigo-500/20 hover:bg-indigo-600 hover:text-white transition-all"
          >
            <RefreshCcw size={18} />
          </button>
        </div>
      </header>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-6 bg-white dark:bg-[#080c14] rounded-[3rem] border border-slate-100 dark:border-slate-800/60 shadow-xl">
          <div className="relative">
             <Loader2 size={48} className="animate-spin text-indigo-600" />
             <ShoppingBag size={20} className="absolute inset-0 m-auto text-indigo-400 animate-pulse" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-400 italic">Syncing asset ledger...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          <div className="bg-white dark:bg-[#080c14] rounded-[2.5rem] border border-slate-200 dark:border-slate-800/60 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-white/5">
                    <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Identity Node</th>
                    <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Prize Asset</th>
                    <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Sync Date</th>
                    <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Neural Cost</th>
                    <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-center">Protocol Status</th>
                    <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                  {filtered.map((order) => (
                    <tr key={order._id} className="hover:bg-slate-50/30 dark:hover:bg-white/[0.02] transition-colors group">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center font-bold text-xs shrink-0 border border-indigo-500/10">
                            {order.userName?.[0]}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-tight">{order.userName}</p>
                            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">{order.userEmail}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          {order.prizeImage ? (
                            <img src={order.prizeImage} className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-800" alt="Prize" />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                               <Package size={16} />
                            </div>
                          )}
                          <p className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-tight">{order.prizeTitle}</p>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                          <Calendar size={14} />
                          <span className="text-xs font-semibold tabular-nums">{new Date(order.createdAt).toLocaleDateString()}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2">
                           <div className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                              <CreditCard size={12} />
                           </div>
                           <span className="text-sm font-bold text-slate-900 dark:text-white tabular-nums italic">{order.cost} SC</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-center">
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <select 
                          value={order.status}
                          onChange={(e) => updateOrderStatus(order._id, e.target.value)}
                          className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-slate-800/60 rounded-xl px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 outline-none focus:ring-1 ring-indigo-500/30 transition-all cursor-pointer"
                        >
                          <option value="pending">Pending</option>
                          <option value="approved">Approved</option>
                          <option value="in progress">In Progress</option>
                          <option value="delivered">Delivered</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filtered.length === 0 && (
              <div className="py-32 flex flex-col items-center justify-center opacity-40">
                <ShoppingBag size={48} className="text-slate-300 dark:text-slate-700 mb-6 animate-pulse"/>
                <p className="text-xs font-semibold uppercase tracking-[0.5em] text-slate-400 dark:text-slate-600 italic">No asset transmissions found in ledger</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRewardFulfillment;
