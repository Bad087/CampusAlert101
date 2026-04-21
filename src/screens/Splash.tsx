import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Zap } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Splash({ isInitial = true }: { isInitial?: boolean }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  useEffect(() => {
    if (!isInitial) {
      const timer = setTimeout(() => {
        const hasOnboarded = localStorage.getItem('hasOnboarded');
        if (!hasOnboarded) {
          navigate('/onboarding');
        } else if (user) {
          navigate('/app');
        } else {
          navigate('/auth');
        }
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [navigate, isInitial, user]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[var(--color-brand-bg-primary)]">
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className="w-24 h-24 bg-[var(--color-brand-accent-purple)] rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(124,58,237,0.5)]"
      >
        <Zap className="text-white w-12 h-12" />
      </motion.div>
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-6 text-3xl font-semibold tracking-tight text-white font-sans"
      >
        CampusAlert
      </motion.h1>
    </div>
  );
}
