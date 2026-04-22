import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector } from 'react-redux';
import { 
  Package, Clock, CheckCircle, XCircle, 
  Search, Filter, ExternalLink, RefreshCw 
} from 'lucide-react';

const OrderManager = () => {
  const { user } = useSelector((state) => state.auth);
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('pending'); // 'all', 'pending', 'delivered', 'cancelled'

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const res = await axios.get(`${import.meta.env.VITE_API_URL || 'https://scholarmatrixdeployment-server.onrender.com'}/api/orders`, config);
      setOrders(res.data);
    } catch (err) {
      console.error("Failed to fetch all orders", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const updateOrderStatus = async (orderId, status) => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.patch(`${import.meta.env.VITE_API_URL || 'https://scholarmatrixdeployment-server.onrender.com'}/api/orders/${orderId}`, { status }, config);
      fetchOrders(); // Refresh
    } catch (err) {
      alert("Failed to update order status");
      console.error(err);
    }
  };

  const filteredOrders = orders.filter(o => filter === 'all' || o.status === filter);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-bold uppercase tracking-tight mb-2 italic">ordersList</h2>
          <p className="text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-[0.2em]">Institutional Asset Governance Node</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchOrders}
            className="p-3 bg-slate-100 dark:bg-white/5 text-slate-400 hover:text-indigo-500 transition-all rounded-xl border border-slate-200 dark:border-white/10"
          >
            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <AnimatePresence mode='popLayout'>
          {isLoading ? (
            <div className="py-20 text-center col-span-full">
              <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Querying Neural Ledger...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="py-20 text-center col-span-full bg-slate-50 dark:bg-white/5 rounded-[3rem] border border-dashed border-slate-200 dark:border-white/10">
              <Package size={48} className="mx-auto mb-4 text-slate-300 dark:text-gray-600" />
              <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">No matching orders found</p>
            </div>
          ) : (
            filteredOrders.map((order, idx) => (
              <motion.div
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                key={order._id}
                className="group bg-slate-50 dark:bg-white/5 rounded-[2rem] p-6 border border-slate-200 dark:border-white/5 hover:border-indigo-500/30 transition-all flex flex-col md:flex-row items-center justify-between gap-6"
              >
                <div className="flex items-center gap-6 flex-1">
                  <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-3xl flex items-center justify-center border border-slate-200 dark:border-white/10 overflow-hidden shadow-sm">
                     <img 
                       src={order.prizeImage || order.prize?.image} 
                       className="w-full h-full object-cover" 
                       alt="Prize" 
                       onError={(e) => { e.target.src = 'https://via.placeholder.com/100'; }}
                     />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                       <h3 className="text-lg font-bold text-slate-900 dark:text-white uppercase tracking-tight">
                         {order.prizeTitle || order.prize?.title}
                       </h3>
                       <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-500/10 text-indigo-500 rounded-md border border-indigo-500/20 uppercase tracking-widest">
                         {order.cost || order.prize?.coinsRequired} SC
                       </span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1">
                       <p className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-widest">
                         User: <span className="text-indigo-500">{order.userName || order.user?.name || 'Unknown'}</span>
                       </p>
                       <p className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-widest">
                         Email: <span className="text-slate-900 dark:text-slate-300">{order.userEmail || order.user?.email || 'N/A'}</span>
                       </p>
                       <p className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest flex items-center gap-1">
                         <Clock size={10} /> {new Date(order.createdAt).toLocaleString()}
                       </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right hidden lg:block">
                     <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Current Protocol</p>
                     <p className={`text-[10px] font-black uppercase tracking-tighter italic ${
                       order.status === 'delivered' ? 'text-emerald-500' : 
                       order.status === 'rejected' ? 'text-rose-500' : 
                       'text-amber-500'
                     }`}>
                       {order.status}
                     </p>
                  </div>
                  <select 
                    value={order.status}
                    onChange={(e) => updateOrderStatus(order._id, e.target.value)}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-700 dark:text-white outline-none focus:ring-2 ring-indigo-500/20 transition-all cursor-pointer shadow-sm"
                  >
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="in progress">In Progress</option>
                    <option value="delivered">Delivered</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default OrderManager;
