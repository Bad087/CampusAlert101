import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Users, Zap } from 'lucide-react';

const PAGES = [
  {
    title: "Stay Informed",
    description: "Get real-time alerts about everything happening on your campus.",
    icon: Zap,
    color: "text-[var(--color-brand-accent-cyan)]",
  },
  {
    title: "Total Anonymity",
    description: "Post class cancellations, rants, or events without revealing your identity.",
    icon: Users,
    color: "text-[var(--color-brand-accent-purple)]",
  },
  {
    title: "Hyperlocal Notices",
    description: "Lost & Found, emergencies, and free food alerts when you need them.",
    icon: ShieldAlert,
    color: "text-red-500",
  }
];

export default function Onboarding() {
  const [page, setPage] = useState(0);
  const navigate = useNavigate();

  const handleNext = () => {
    if (page < PAGES.length - 1) {
      setPage(page + 1);
    } else {
      localStorage.setItem('hasOnboarded', 'true');
      navigate('/auth');
    }
  };

  const CurrentIcon = PAGES[page].icon;

  return (
    <div className="flex flex-col min-h-screen bg-[var(--color-brand-bg-primary)] p-6">
      <div className="flex-1 flex flex-col items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={page}
            initial="initial"
            animate="animate"
            exit="exit"
            variants={{
              initial: { opacity: 0, x: 50 },
              animate: { opacity: 1, x: 0, transition: { staggerChildren: 0.1, type: "spring", stiffness: 300, damping: 30 } },
              exit: { opacity: 0, x: -50, transition: { duration: 0.2 } }
            }}
            className="flex flex-col items-center text-center w-full max-w-sm"
          >
            <motion.div 
               variants={{
                 initial: { scale: 0.5, opacity: 0, rotate: -20 },
                 animate: { scale: 1, opacity: 1, rotate: 0 }
               }}
               transition={{ type: "spring", stiffness: 200, damping: 20 }}
               className={`w-40 h-40 rounded-[40px] bg-[var(--color-brand-bg-surface)] flex items-center justify-center mb-8 shadow-2xl border border-white/5 relative overflow-hidden`}
             >
              <div className={`absolute inset-0 opacity-20 blur-2xl bg-current ${PAGES[page].color}`} />
              <CurrentIcon className={`w-20 h-20 relative z-10 ${PAGES[page].color}`} strokeWidth={1.5} />
            </motion.div>
            
            <motion.h2 
               variants={{
                 initial: { y: 20, opacity: 0 },
                 animate: { y: 0, opacity: 1 }
               }}
               className="text-3xl font-bold text-white mb-4 tracking-tight"
            >
               {PAGES[page].title}
            </motion.h2>
            
            <motion.p 
               variants={{
                 initial: { y: 20, opacity: 0 },
                 animate: { y: 0, opacity: 1 }
               }}
               className="text-[17px] text-[var(--color-brand-text-secondary)] leading-relaxed font-medium"
            >
              {PAGES[page].description}
            </motion.p>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex items-center justify-between pb-8 pt-4 px-2">
        <div className="flex space-x-2">
          {PAGES.map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === page ? 'w-8 bg-[var(--color-brand-accent-purple)]' : 'w-2 bg-[var(--color-brand-divider)]'
              }`}
            />
          ))}
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleNext}
          className="px-8 py-3.5 bg-gradient-to-r from-[var(--color-brand-accent-purple)] to-[var(--color-brand-accent-cyan)] text-white font-bold rounded-full shadow-[0_8px_20px_rgba(124,58,237,0.3)] transition-all"
        >
          {page === PAGES.length - 1 ? "Get In" : "Next"}
        </motion.button>
      </div>
    </div>
  );
}
