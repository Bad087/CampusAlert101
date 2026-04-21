import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { db } from '../firebase';
import AlertCard, { Alert } from '../components/AlertCard';
import { Ghost, Search, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Board() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth(); // Assume we have campusName filter eventually
  const navigate = useNavigate();

  useEffect(() => {
    // Only fetching non-expired or all for now
    const q = query(
      collection(db, 'alerts'),
      orderBy('timestamp', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newAlerts: Alert[] = [];
      snapshot.forEach((doc) => {
        newAlerts.push({ id: doc.id, ...doc.data() } as Alert);
      });
      setAlerts(newAlerts);
      setLoading(false);
    }, (error) => {
      console.error("Firestore error: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="min-h-full bg-[var(--color-brand-bg-primary)] pt-16 px-4 pb-12">
      {/* Header */}
      <div className="fixed top-0 inset-x-0 h-16 bg-[var(--color-brand-bg-primary)]/70 backdrop-blur-3xl z-40 flex items-center justify-between px-6 border-b border-white/5 shadow-sm">
        <h1 className="text-xl font-bold bg-gradient-to-r from-[var(--color-brand-accent-purple)] to-[var(--color-brand-accent-cyan)] text-transparent bg-clip-text tracking-tight">
          {profile?.campusName || "CampusAlert"}
        </h1>
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/app/search')} className="text-gray-300 hover:text-white transition-colors">
            <Search size={20} strokeWidth={2.5} />
          </button>
          <button onClick={() => navigate('/app/my-alerts')} className="relative text-gray-300 hover:text-white transition-colors">
            <Bell size={20} strokeWidth={2.5} />
            <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border border-[var(--color-brand-bg-primary)]"></span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4 pt-4">
          {[1,2,3].map(i => (
            <div key={i} className="animate-pulse flex flex-col bg-[var(--color-brand-bg-card)] h-40 rounded-2xl p-4">
              <div className="h-4 bg-[var(--color-brand-bg-surface)] rounded w-1/4 mb-4" />
              <div className="h-6 bg-[var(--color-brand-bg-surface)] rounded w-3/4 mb-2" />
              <div className="h-4 bg-[var(--color-brand-bg-surface)] rounded w-full mb-4" />
              <div className="mt-auto h-4 bg-[var(--color-brand-bg-surface)] rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : alerts.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[70vh]">
          <motion.div 
            animate={{ y: [0, -10, 0] }} 
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            className="bg-[var(--color-brand-bg-surface)] p-6 rounded-full text-[var(--color-brand-text-secondary)] mb-4"
          >
            <Ghost size={64} />
          </motion.div>
          <p className="text-[var(--color-brand-text-secondary)] font-medium text-lg">No alerts yet. Be the first!</p>
        </div>
      ) : (
        <div className="pt-4 pb-4">
          <AnimatePresence>
            {alerts.map((alert, idx) => (
              <AlertCard key={alert.id} alert={alert} index={idx} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
