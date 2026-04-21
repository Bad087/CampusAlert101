import React from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { Home, User, PlusCircle, MessageCircle, Library } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function MainLayout() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-[var(--color-brand-bg-primary)] flex flex-col relative overflow-hidden">
      {/* Immersive Cool Gradient Background */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
         <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-[var(--color-brand-accent-purple)]/20 blur-[100px]" />
         <div className="absolute top-[30%] right-[-10%] w-[30%] h-[50%] rounded-full bg-[var(--color-brand-accent-cyan)]/20 blur-[120px]" />
      </div>

      <div className="flex-1 overflow-y-auto pb-24 z-10 relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="min-h-full"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </div>

      <nav className="fixed bottom-0 inset-x-0 bg-[#0F0F0F]/80 backdrop-blur-3xl border-t border-white/5 flex items-center justify-around px-4 pb-[max(env(safe-area-inset-bottom),12px)] pt-2 z-50">
        <NavLink to="/app" end className={({ isActive }) => `flex flex-col items-center justify-center w-14 h-12 transition-colors ${isActive ? 'text-[var(--color-brand-accent-purple)]' : 'text-gray-400 hover:text-white'}`}>
          {({ isActive }) => (
            <>
              <Home size={22} className="mb-1" strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-medium leading-none">Home</span>
            </>
          )}
        </NavLink>
        
        <NavLink to="/app/classrooms" className={({ isActive }) => `flex flex-col items-center justify-center w-14 h-12 transition-colors ${isActive ? 'text-[var(--color-brand-accent-purple)]' : 'text-gray-400 hover:text-white'}`}>
          {({ isActive }) => (
            <>
              <Library size={22} className="mb-1" strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-medium leading-none">Classes</span>
            </>
          )}
        </NavLink>

        <NavLink to="/post" className="relative group shrink-0 mx-2 -translate-y-4">
          <div className="flex items-center justify-center w-14 h-14 bg-gradient-to-br from-[var(--color-brand-accent-purple)] to-[var(--color-brand-accent-cyan)] text-white rounded-full shadow-[0_8px_20px_rgba(124,58,237,0.3)] group-hover:scale-105 transition-transform border-[4px] border-[var(--color-brand-bg-primary)]">
            <PlusCircle size={28} strokeWidth={2.5} />
          </div>
        </NavLink>

        <NavLink to="/app/inbox" className={({ isActive }) => `flex flex-col items-center justify-center w-14 h-12 transition-colors ${isActive ? 'text-[var(--color-brand-accent-purple)]' : 'text-gray-400 hover:text-white'}`}>
          {({ isActive }) => (
            <>
              <MessageCircle size={22} className="mb-1" strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-medium leading-none">Inbox</span>
            </>
          )}
        </NavLink>

        <NavLink to="/app/settings" className={({ isActive }) => `flex flex-col items-center justify-center w-14 h-12 transition-colors ${isActive ? 'text-[var(--color-brand-accent-purple)]' : 'text-gray-400 hover:text-white'}`}>
          {({ isActive }) => (
            <>
              <User size={22} className="mb-1" strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-medium leading-none">Profile</span>
            </>
          )}
        </NavLink>
      </nav>
    </div>
  );
}
