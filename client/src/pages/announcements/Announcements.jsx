import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, Trophy, Bell, Settings, Search, Megaphone, 
  Newspaper, LayoutGrid, TrendingUp, Users, Calendar, 
  Star, Briefcase, GraduationCap, ArrowRight, ShieldCheck, Heart, MessageSquare
} from 'lucide-react';
import axios from 'axios';

import CreatePost from '../../components/announcements/CreatePost';
import AnnouncementFeed from '../../components/announcements/AnnouncementFeed';

const Announcements = () => {
  const { user } = useSelector((state) => state.auth);
  const [feedVersion, setFeedVersion] = useState(0);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);


  const handlePostCreated = (newPost) => {
    // Socket.io handles feed injection automatically now via HandleNewAnnouncement
  };

  return (
    <div className="h-[calc(100vh-5rem)] overflow-hidden bg-[#f8fafc] dark:bg-[#0b0f19] transition-colors duration-500">
      <div className="h-full max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="h-full flex flex-col lg:flex-row gap-8">
          
          {/* LEFT SIDEBAR - User Profile & Navigation */}
          <aside className="hidden lg:block w-[320px] shrink-0 h-full overflow-y-auto overflow-x-hidden custom-scrollbar pr-2">
            <div className="flex flex-col gap-6 pt-8 pb-24">
              {/* Profile Card */}
              <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 p-8 shadow-2xl shadow-gray-200/50 dark:shadow-none overflow-hidden relative group">
                <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-primary-600 via-indigo-600 to-purple-600 z-0" />
                <div className="relative z-10 pt-4 flex flex-col items-center">
                  <div className="w-24 h-24 rounded-3xl bg-white dark:bg-gray-800 p-1.5 shadow-2xl mb-4 transform group-hover:scale-105 transition-all duration-500 border border-gray-100 dark:border-gray-700">
                    {user?.profilePic ? (
                      <img src={user.profilePic} alt={user.name} className="w-full h-full object-cover rounded-[1.2rem]" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary-50 to-indigo-50 dark:from-primary-900/20 dark:to-indigo-900/20 flex items-center justify-center text-primary-600 dark:text-primary-400 font-semibold text-3xl rounded-[1.2rem]">
                        {user?.name?.charAt(0) || 'U'}
                      </div>
                    )}
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white text-center leading-tight">{user?.name}</h2>
                  <div className="mt-2 px-4 py-1.5 rounded-full bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700">
                    <span className="text-xs font-semibold uppercase text-gray-500 tracking-wide">{user?.role} • {user?.department || 'CS Dept'}</span>
                  </div>
                </div>
                
                <div className="mt-8 pt-8 border-t border-gray-100 dark:border-gray-800 space-y-4">
                  <div className="flex justify-between items-center px-2">
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Posts Contribution</span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">Active Publisher</span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center text-primary-600">
                      <TrendingUp size={18} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Navigation Shortcuts */}
              <div className="bg-white/40 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-6 [content-visibility:auto]">
                <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400 mb-6 px-2">Navigation</h3>
                <nav className="space-y-1">
                  {[
                    { label: 'My Department', icon: <Users size={18} />, active: false },
                    { label: 'Saved Posts', icon: <Star size={18} />, active: false },
                    { label: 'Events Calendar', icon: <Calendar size={18} />, active: false },
                    { label: 'Notifications', icon: <Bell size={18} />, badge: '12', active: false },
                    { label: 'Settings', icon: <Settings size={18} />, active: false },
                  ].map((item, i) => (
                    <button key={i} className="w-full flex items-center justify-between p-3.5 rounded-2xl hover:bg-white dark:hover:bg-gray-800 transition-all group font-bold text-gray-600 dark:text-gray-400 hover:text-primary-600">
                      <div className="flex items-center gap-3">
                        <span className="group-hover:scale-110 transition-transform">{item.icon}</span>
                        <span className="text-sm">{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className="bg-primary-600 text-white text-xs px-2 py-0.5 rounded-lg font-semibold">{item.badge}</span>
                      )}
                    </button>
                  ))}
                </nav>
              </div>
            </div>
          </aside>

          {/* MAIN CENTER FEED */}
          <main className="flex-1 h-full max-w-[800px] min-w-0 w-full flex flex-col gap-8 mx-auto lg:mx-0 overflow-y-auto overflow-x-hidden custom-scrollbar px-6 pt-8 pb-32">
            {/* Announcement Banner */}
            <div className="relative h-64 rounded-[3rem] overflow-hidden shadow-2xl shadow-indigo-500/20 group">
              <img src="/banner.png" alt="Academic Feed" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-0" />
              <div className="absolute top-0 right-0 p-12 opacity-30 z-10">
                <Sparkles size={120} className="text-white" />
              </div>
              <div className="relative z-10 p-10 h-full flex flex-col justify-end">
                <span className="px-3 py-1 w-fit rounded-full bg-primary-600/50 backdrop-blur-md text-white text-xs font-semibold uppercase tracking-wide">Live Campus</span>
                <h1 className="text-4xl font-semibold text-white mt-3 leading-none uppercase tracking-tighter">Smart Academic Feed</h1>
                <p className="text-white/80 text-sm font-medium mt-2">Connecting students and faculty through real-time updates.</p>
              </div>
            </div>

            <CreatePost user={user} onPostCreated={handlePostCreated} />
            <AnnouncementFeed key={feedVersion} user={user} />
          </main>

          {/* RIGHT SIDEBAR - Trending & Highlights */}
          <aside className="hidden xl:block w-[350px] shrink-0 h-full overflow-y-auto overflow-x-hidden custom-scrollbar pl-2">
            <div className="flex flex-col gap-6 pt-8 pb-24">
              {/* PREMIUM PLACEHOLDERS */}
              <div className="space-y-6">
                {/* SIDEBAR CONTENT REMOVED AS REQUESTED */}
              </div>

            </div>
          </aside>

        </div>
      </div>
      <style>
        {`
          .custom-scrollbar::-webkit-scrollbar {
            width: 4px;
            height: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(0, 0, 0, 0.05);
            border-radius: 10px;
          }
          .dark .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.05);
          }
          .custom-scrollbar:hover::-webkit-scrollbar-thumb {
            background: rgba(67, 97, 238, 0.2);
          }
           /* Hide main page scrollbar to enforce 3-column independent scrolling */
          html, body {
            overflow: hidden !important;
            contain: layout style;
          }
        `}
      </style>
    </div>
  );
};

export default Announcements;
