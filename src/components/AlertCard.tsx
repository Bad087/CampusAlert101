import React, { useState, useEffect } from 'react';
import { motion, useAnimation, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { MessageSquare, ArrowUp, MapPin, MoreVertical, Edit2, Share, Flag, Trash2, User } from 'lucide-react';
import { ALERT_CATEGORIES, CategoryKey } from '../constants/categories';
import { cn } from '../lib/utils';
import { doc, updateDoc, increment, collection, setDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

export interface Alert {
  id: string;
  title: string;
  description: string;
  category: CategoryKey;
  severity: string;
  postedBy: string;
  postedByName: string;
  campusId: string;
  timestamp: any;
  expiresAt?: any;
  latitude?: number;
  longitude?: number;
  locationAddress?: string;
  avatarUrl?: string | null;
  mediaUrls: string[];
  mediaTypes: string[];
  upvoteCount: number;
  replyCount: number;
  isExpired: boolean;
}

export default function AlertCard({ alert: alertData, index = 0 }: { alert: Alert, index?: number }) {
  const navigate = useNavigate();
  const cat = ALERT_CATEGORIES[alertData.category] || ALERT_CATEGORIES.GENERAL;
  const CategoryIcon = cat.icon;
  const { user } = useAuth();
  const controls = useAnimation();

  const [localUpvotes, setLocalUpvotes] = useState(alertData.upvoteCount || 0);
  const [hasUpvoted, setHasUpvoted] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    setLocalUpvotes(alertData.upvoteCount || 0);
  }, [alertData.upvoteCount]);

  const handleUpvote = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || hasUpvoted) return;
    
    setHasUpvoted(true);
    setLocalUpvotes(prev => prev + 1);

    // Optimistic animation
    controls.start({
      scale: [1, 1.4, 1],
      transition: { duration: 0.3 }
    });

    try {
      const upvoteRef = doc(db, `alerts/${alertData.id}/upvotes`, user.uid);
      await setDoc(upvoteRef, { timestamp: serverTimestamp() });
      await updateDoc(doc(db, 'alerts', alertData.id), {
        upvoteCount: increment(1)
      });
    } catch (err) {
      console.error(err);
      // Revert optimism on silent error
      setHasUpvoted(false);
      setLocalUpvotes(prev => prev - 1);
    }
  };

  const getExpiryText = () => {
    if (!alertData.expiresAt) return null;
    const date = alertData.expiresAt.toDate();
    if (date < new Date()) return 'Expired';
    return `Exp. ${formatDistanceToNow(date, { addSuffix: true })}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 25, delay: index * 0.05 }}
      onClick={() => navigate(`/alert/${alertData.id}`)}
      className="relative bg-[var(--color-brand-bg-card)] rounded-2xl p-4 mb-4 shadow-lg overflow-hidden cursor-pointer"
    >
      {/* Color Strip */}
      <div className={cn("absolute left-0 top-0 bottom-0 w-1.5", cat.colorClass)} />

      <div className="pl-2">
        <div className="flex justify-between items-start mb-2">
          <div className={cn("inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-opacity-10", cat.textClass, cat.colorClass.replace('bg-', 'bg-').concat('/10'))}>
            <CategoryIcon size={12} />
            <span>{cat.displayName}</span>
          </div>
          <div className="flex items-center space-x-1">
            {user?.uid !== alertData.postedBy && (
              <button 
                onClick={(e) => { e.stopPropagation(); navigate(`/chat/new_${alertData.postedBy}?name=${encodeURIComponent(alertData.postedByName)}`); }} 
                className="text-[var(--color-brand-text-secondary)] hover:text-[var(--color-brand-accent-purple)] p-1.5 bg-[var(--color-brand-bg-surface)] rounded-full transition-colors"
                title="Direct Message"
              >
                <MessageSquare size={14} />
              </button>
            )}
            <div className="relative">
              <button onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }} className="text-[var(--color-brand-text-secondary)] hover:text-white p-1 rounded-full bg-[var(--color-brand-bg-surface)] transition-colors">
                <MoreVertical size={16} />
              </button>
              <AnimatePresence>
                {showMenu && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95, transformOrigin: 'top right' }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-40 bg-[var(--color-brand-bg-surface)] rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.5)] border border-[var(--color-brand-divider)] overflow-hidden z-50 text-sm"
                  >
                    <button onClick={(e) => { e.stopPropagation(); setShowMenu(false); navigator.share?.({ title: alertData.title, text: alertData.description }) }} className="w-full text-left px-4 py-2.5 hover:bg-[var(--color-brand-bg-primary)] transition-colors text-white flex items-center">
                      <Share size={14} className="mr-2 opacity-70" /> Share
                    </button>
                    {user?.uid === alertData.postedBy && (
                      <>
                        <button onClick={(e) => { e.stopPropagation(); setShowMenu(false); navigate(`/post?edit=${alertData.id}`); }} className="w-full text-left px-4 py-2.5 hover:bg-[var(--color-brand-bg-primary)] transition-colors text-white flex items-center">
                          <Edit2 size={14} className="mr-2 opacity-70" /> Edit
                        </button>
                        <button onClick={async (e) => { e.stopPropagation(); setShowMenu(false); if(window.confirm('Delete alert?')) await deleteDoc(doc(db, 'alerts', alertData.id)); }} className="w-full text-left px-4 py-2.5 hover:bg-[var(--color-brand-bg-primary)] transition-colors text-red-500 flex items-center">
                          <Trash2 size={14} className="mr-2 opacity-70" /> Delete
                        </button>
                      </>
                    )}
                    {user?.uid !== alertData.postedBy && (
                      <button onClick={(e) => { e.stopPropagation(); setShowMenu(false); window.alert("Reported to moderators."); }} className="w-full text-left px-4 py-2.5 hover:bg-[var(--color-brand-bg-primary)] transition-colors text-red-500 flex items-center">
                        <Flag size={14} className="mr-2 opacity-70" /> Report
                      </button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <h3 className="text-[var(--color-brand-text-primary)] font-semibold text-base mb-1 leading-tight">
          {alertData.title}
        </h3>
        <p className="text-[var(--color-brand-text-secondary)] text-sm line-clamp-2 mb-3">
          {alertData.description}
        </p>

        {alertData.mediaUrls?.length > 0 && (
          <div className="flex space-x-2 mb-3 overflow-x-auto no-scrollbar">
            {alertData.mediaUrls.map((url, i) => (
              <div key={i} className="w-20 h-20 shrink-0 rounded-lg bg-[var(--color-brand-bg-surface)] overflow-hidden">
                {alertData.mediaTypes[i] === 'video' ? (
                  <div className="w-full h-full flex items-center justify-center text-xs text-white bg-black/50">Video</div>
                ) : (
                  <img src={url} alt="media" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                )}
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center text-xs text-[var(--color-brand-text-secondary)] gap-x-2 gap-y-2 mb-3">
          <div className="w-5 h-5 rounded-full overflow-hidden bg-gradient-to-tr from-[var(--color-brand-accent-purple)] to-[var(--color-brand-accent-cyan)] shrink-0 shadow-inner flex items-center justify-center">
             {alertData.avatarUrl ? (
               <img src={alertData.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
             ) : (
               <User size={12} className="text-white" />
             )}
          </div>
          <span className="font-medium text-[var(--color-brand-text-primary)]">{alertData.postedByName}</span>
          <span>•</span>
          <span>{alertData.timestamp ? formatDistanceToNow(alertData.timestamp.toDate(), { addSuffix: true }) : 'Just now'}</span>
          {alertData.locationAddress && (
            <>
              <span>•</span>
              <span className="flex items-center truncate max-w-[120px]"><MapPin size={10} className="mr-1 shrink-0"/> <span className="truncate">{alertData.locationAddress}</span></span>
            </>
          )}
        </div>

        {alertData.expiresAt && (
          <div className="mb-3">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-[var(--color-brand-text-secondary)]">{getExpiryText()}</span>
            </div>
            <div className="w-full h-1 bg-[var(--color-brand-bg-surface)] rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-[var(--color-brand-accent-purple)]"
                initial={{ width: '100%' }}
                // Logic for real width would calculate ratio
              />
            </div>
          </div>
        )}

        <div className="flex items-center gap-4 pt-2 border-t border-[var(--color-brand-divider)]">
          <button 
            onClick={handleUpvote}
            className={cn("flex items-center transition-colors", hasUpvoted ? "text-[var(--color-brand-accent-purple)]" : "text-[var(--color-brand-text-secondary)] hover:text-[var(--color-brand-accent-purple)]")}
          >
            <motion.div animate={controls} className="flex items-center">
              <ArrowUp size={16} className="mr-1" />
              <span className="text-sm font-medium">{localUpvotes}</span>
            </motion.div>
          </button>
          
          <div className="flex items-center text-[var(--color-brand-text-secondary)] cursor-pointer hover:text-white transition-colors">
            <MessageSquare size={16} className="mr-1" />
            <span className="text-sm font-medium">{alertData.replyCount}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
