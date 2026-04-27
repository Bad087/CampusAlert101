import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { db } from '../firebase';
import AlertCard, { Alert } from '../components/AlertCard';
import { Ghost, Search, Bell, SlidersHorizontal, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ALERT_CATEGORIES } from '../constants/categories';
import { cn } from '../lib/utils';

export default function Board() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();
  const navigate = useNavigate();

  // Filter & Sort States
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'recent' | 'oldest' | 'upvoted'>('recent');

  useEffect(() => {
    // Only fetching non-expired or all for now
    // We fetch a bunch of recent ones and then client-side filter
    const q = query(
      collection(db, 'alerts'),
      orderBy('timestamp', 'desc'),
      limit(100)
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

  // Compute filtered & sorted alerts
  const filteredAlerts = alerts
    .filter(a => selectedCategory === 'ALL' || a.category === selectedCategory)
    .filter(a => selectedSeverity === 'ALL' || a.severity === selectedSeverity)
    .sort((a, b) => {
      if (sortBy === 'recent') {
        return (b.timestamp?.toMillis?.() || 0) - (a.timestamp?.toMillis?.() || 0);
      }
      if (sortBy === 'oldest') {
        return (a.timestamp?.toMillis?.() || 0) - (b.timestamp?.toMillis?.() || 0);
      }
      if (sortBy === 'upvoted') {
        return (b.upvoteCount || 0) - (a.upvoteCount || 0);
      }
      return 0;
    });

  const hasActiveFilters = selectedCategory !== 'ALL' || selectedSeverity !== 'ALL' || sortBy !== 'recent';

  const resetFilters = () => {
    setSelectedCategory('ALL');
    setSelectedSeverity('ALL');
    setSortBy('recent');
  };

  return (
    <div className="min-h-full bg-[var(--color-brand-bg-primary)] pt-16 px-4 pb-12">
      {/* Header */}
      <div className="fixed top-0 inset-x-0 h-16 bg-[var(--color-brand-bg-primary)]/70 backdrop-blur-3xl z-40 flex items-center justify-between px-6 border-b border-white/5 shadow-sm">
        <h1 className="text-xl font-bold bg-gradient-to-r from-[var(--color-brand-accent-purple)] to-[var(--color-brand-accent-cyan)] text-transparent bg-clip-text tracking-tight">
          {profile?.campusName || "CampusAlert"}
        </h1>
        <div className="flex items-center gap-4">
          <button onClick={() => setIsFilterOpen(!isFilterOpen)} className="relative text-gray-300 hover:text-white transition-colors">
            <SlidersHorizontal size={20} strokeWidth={2.5} />
            {hasActiveFilters && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[var(--color-brand-accent-cyan)] rounded-full border-2 border-[var(--color-brand-bg-primary)]"></span>
            )}
          </button>
          <button onClick={() => navigate('/app/search')} className="text-gray-300 hover:text-white transition-colors">
            <Search size={20} strokeWidth={2.5} />
          </button>
          <button onClick={() => navigate('/app/my-alerts')} className="relative text-gray-300 hover:text-white transition-colors">
            <Bell size={20} strokeWidth={2.5} />
            <span className="absolute top-0 right-0 w-2 h-2 bg-[var(--color-brand-accent-purple)] rounded-full border border-[var(--color-brand-bg-primary)]"></span>
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      <AnimatePresence>
        {isFilterOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0, marginBottom: 0 }}
            animate={{ height: 'auto', opacity: 1, marginBottom: 16 }}
            exit={{ height: 0, opacity: 0, marginBottom: 0 }}
            className="overflow-hidden mt-4"
          >
            <div className="bg-[var(--color-brand-bg-card)] border border-white/10 rounded-2xl p-4 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold flex items-center gap-2">
                  <SlidersHorizontal size={16} className="text-[var(--color-brand-accent-purple)]" />
                  Filter & Sort
                </h3>
                {hasActiveFilters && (
                  <button onClick={resetFilters} className="text-xs text-[var(--color-brand-accent-cyan)] font-medium bg-[var(--color-brand-accent-cyan)]/10 px-2.5 py-1 rounded-full hover:bg-[var(--color-brand-accent-cyan)]/20 transition-colors">
                    Reset
                  </button>
                )}
              </div>

              {/* Sort By */}
              <div className="mb-4">
                <label className="text-xs font-medium text-[var(--color-brand-text-secondary)] uppercase tracking-wider mb-2 block">Sort By</label>
                <div className="flex gap-2 bg-[var(--color-brand-bg-surface)] p-1 rounded-xl">
                  {[
                    { id: 'recent', label: 'Recent' },
                    { id: 'oldest', label: 'Oldest' },
                    { id: 'upvoted', label: 'Upvoted' }
                  ].map(option => (
                    <button
                      key={option.id}
                      onClick={() => setSortBy(option.id as any)}
                      className={cn(
                        "flex-1 text-xs font-medium py-1.5 rounded-lg transition-all",
                        sortBy === option.id 
                          ? "bg-[var(--color-brand-bg-card)] text-white shadow-sm border border-white/5" 
                          : "text-gray-400 hover:text-white"
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Severity */}
              <div className="mb-4">
                <label className="text-xs font-medium text-[var(--color-brand-text-secondary)] uppercase tracking-wider mb-2 block">Severity</label>
                <div className="flex flex-wrap gap-2">
                  {['ALL', 'URGENT', 'INFORMATIONAL', 'FYI'].map(sev => (
                    <button
                      key={sev}
                      onClick={() => setSelectedSeverity(sev)}
                      className={cn(
                        "text-xs px-3 py-1.5 rounded-full font-medium transition-colors border",
                        selectedSeverity === sev
                          ? (sev === 'URGENT' ? 'bg-red-500/20 text-red-400 border-red-500/30' : sev === 'ALL' ? 'bg-white/10 text-white border-white/20' : 'bg-[var(--color-brand-accent-purple)]/20 text-[var(--color-brand-accent-purple)] border-[var(--color-brand-accent-purple)]/30')
                          : "bg-[var(--color-brand-bg-surface)] text-gray-400 border-transparent hover:bg-white/5 hover:text-gray-300"
                      )}
                    >
                      {sev === 'ALL' ? 'Any Severity' : sev}
                    </button>
                  ))}
                </div>
              </div>

              {/* Categories */}
              <div>
                <label className="text-xs font-medium text-[var(--color-brand-text-secondary)] uppercase tracking-wider mb-2 block">Category</label>
                <div className="flex overflow-x-auto pb-2 -mx-4 px-4 space-x-2 no-scrollbar">
                  <button
                    onClick={() => setSelectedCategory('ALL')}
                    className={cn(
                      "shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border",
                      selectedCategory === 'ALL'
                        ? "bg-white/10 text-white border-white/20"
                        : "bg-[var(--color-brand-bg-surface)] text-gray-400 border-transparent hover:bg-white/5"
                    )}
                  >
                    All Categories
                  </button>
                  {Object.entries(ALERT_CATEGORIES).map(([key, cat]) => {
                    const Icon = cat.icon;
                    const isSelected = selectedCategory === key;
                    return (
                      <button
                        key={key}
                        onClick={() => setSelectedCategory(key)}
                        className={cn(
                          "shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border",
                          isSelected
                            ? `${cat.colorClass}/20 ${cat.textClass} border-current`
                            : "bg-[var(--color-brand-bg-surface)] text-gray-400 border-transparent hover:bg-white/5 hover:text-gray-300"
                        )}
                      >
                        <Icon size={12} />
                        {cat.displayName}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="space-y-4 pt-4">
          {[1,2,3].map(i => (
            <div key={i} className="animate-pulse bg-[var(--color-brand-bg-card)] rounded-[24px] p-5 border border-[var(--color-brand-divider)] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-white/5 to-transparent rounded-bl-full pointer-events-none"></div>
                
                <div className="flex items-center justify-between mb-4">
                   <div className="h-6 w-24 bg-[var(--color-brand-bg-surface)] rounded-full"></div>
                   <div className="h-5 w-16 bg-[var(--color-brand-bg-surface)] rounded-full"></div>
                </div>

                <div className="space-y-3 mb-5">
                   <div className="h-6 bg-[var(--color-brand-bg-surface)] rounded-xl w-3/4"></div>
                   <div className="h-4 bg-[var(--color-brand-bg-surface)] rounded-lg w-full"></div>
                   <div className="h-4 bg-[var(--color-brand-bg-surface)] rounded-lg w-5/6"></div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-[var(--color-brand-divider)]">
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[var(--color-brand-bg-surface)]"></div>
                      <div className="h-4 w-20 bg-[var(--color-brand-bg-surface)] rounded-lg"></div>
                   </div>
                   <div className="h-4 w-12 bg-[var(--color-brand-bg-surface)] rounded-lg"></div>
                </div>
            </div>
          ))}
        </div>
      ) : filteredAlerts.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <motion.div 
            animate={{ y: [0, -10, 0] }} 
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            className="bg-[var(--color-brand-bg-surface)] p-6 rounded-full text-[var(--color-brand-text-secondary)] mb-4 shadow-inner"
          >
            <Ghost size={48} />
          </motion.div>
          <p className="text-white font-semibold text-lg mb-2">No alerts found</p>
          {hasActiveFilters && (
            <p className="text-[var(--color-brand-text-secondary)] text-sm mb-6 text-center max-w-[250px]">
              We couldn't find any alerts matching your current filters.
            </p>
          )}
          {hasActiveFilters ? (
            <button 
              onClick={resetFilters}
              className="bg-[var(--color-brand-bg-surface)] hover:bg-white/10 border border-white/10 text-white px-5 py-2 rounded-full font-medium transition-colors"
            >
              Clear Filters
            </button>
          ) : (
            <button 
              onClick={() => navigate('/post')}
              className="bg-[var(--color-brand-bg-surface)] hover:bg-white/10 border border-white/10 text-white px-5 py-2 rounded-full font-medium transition-colors"
            >
              Post an Alert
            </button>
          )}
        </div>
      ) : (
        <div className={cn("pb-4", !isFilterOpen && "pt-4")}>
          <AnimatePresence>
            {filteredAlerts.map((alert, idx) => (
              <AlertCard key={alert.id} alert={alert} index={idx} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
