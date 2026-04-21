import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { X, Image as ImageIcon, MapPin, Loader2, Check } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, doc, getDoc, updateDoc } from 'firebase/firestore';
import { ALERT_CATEGORIES, CategoryKey } from '../constants/categories';
import { cn } from '../lib/utils';
import Lottie from 'lottie-react'; // If we had the JSON, we could use it for confetti

export default function PostAlert() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const { user, profile } = useAuth();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<CategoryKey>('GENERAL');
  const [severity, setSeverity] = useState('FYI');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [mediaAdded, setMediaAdded] = useState(false);
  const [locationAdded, setLocationAdded] = useState(false);

  useEffect(() => {
    if (!editId) return;
    const fetchAlert = async () => {
      const docRef = doc(db, 'alerts', editId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        setTitle(data.title || '');
        setDescription(data.description || '');
        setCategory((data.category as CategoryKey) || 'GENERAL');
        setSeverity(data.severity || 'FYI');
        setIsAnonymous(data.postedByName?.startsWith('Anonymous') || false);
      }
    };
    fetchAlert();
  }, [editId]);

  const activeCategory = ALERT_CATEGORIES[category] || ALERT_CATEGORIES.GENERAL;

  const handleSubmit = async () => {
    if (!title || !description || !user) return;
    setLoading(true);

    try {
      if (editId) {
        await updateDoc(doc(db, 'alerts', editId), {
          title,
          description,
          category,
          severity,
          postedByName: isAnonymous ? `Anonymous_${user.uid.substring(0, 4)}` : (profile?.displayName || 'Unknown'),
        });
      } else {
        await addDoc(collection(db, 'alerts'), {
          title,
          description,
          category,
          severity,
          postedBy: user.uid,
          postedByName: isAnonymous ? `Anonymous_${user.uid.substring(0, 4)}` : (profile?.displayName || 'Unknown'),
          avatarUrl: isAnonymous ? null : (profile?.avatarUrl || null),
          campusId: profile?.campusName || 'All',
          timestamp: serverTimestamp(),
          expiresAt: null, 
          upvoteCount: 0,
          replyCount: 0,
          isExpired: false,
          mediaUrls: [],
          mediaTypes: [],
        });
      }
      setSuccess(true);
      setTimeout(() => navigate('/app'), 2000);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[var(--color-brand-bg-primary)] flex flex-col items-center justify-center p-4">
        <motion.div
           initial={{ scale: 0 }}
           animate={{ scale: 1 }}
           className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mb-4"
        >
          <Check size={48} className="text-white" />
        </motion.div>
        <h2 className="text-2xl text-white font-semibold">Posted Successfully!</h2>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-50 bg-[var(--color-brand-bg-primary)] flex flex-col overflow-hidden"
    >
      <div className={cn("flex items-center justify-between p-4 border-b border-[var(--color-brand-divider)] transition-colors duration-500", activeCategory.colorClass.replace('bg-', 'bg-').concat('/20'))}>
        <button onClick={() => navigate(-1)} className="text-white p-2 bg-[var(--color-brand-bg-surface)] rounded-full">
          <X size={20} />
        </button>
        <h2 className="text-lg font-semibold text-white">{editId ? 'Edit Alert' : 'New Alert'}</h2>
        <button 
          onClick={handleSubmit} 
          disabled={!title || !description || loading}
          className="text-white px-4 py-1.5 rounded-full bg-[var(--color-brand-accent-purple)] font-medium disabled:opacity-50"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : 'Post'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-24">
        <div className="mb-6">
          <div className="flex overflow-x-auto space-x-2 pb-2 no-scrollbar">
            {Object.entries(ALERT_CATEGORIES).map(([key, cat]) => {
              const isSelected = category === key;
              const Icon = cat.icon;
              return (
                <button
                  key={key}
                  onClick={() => setCategory(key as CategoryKey)}
                  className={cn(
                    "flex flex-col items-center min-w-[72px] p-2 rounded-xl border transition-all shrink-0",
                    isSelected 
                      ? `${cat.colorClass} border-transparent text-white` 
                      : `bg-[var(--color-brand-bg-surface)] border-[var(--color-brand-divider)] text-[var(--color-brand-text-secondary)]`
                  )}
                >
                  <Icon size={24} className="mb-1" />
                  <span className="text-[10px] font-medium text-center">{cat.displayName}</span>
                </button>
              );
            })}
          </div>
        </div>

        <input
          type="text"
          placeholder="What's happening?"
          maxLength={80}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full bg-transparent text-white text-2xl font-semibold outline-none placeholder:text-[var(--color-brand-text-secondary)]/50 mb-2"
        />
        <div className="text-right text-xs text-[var(--color-brand-text-secondary)] mb-4">{title.length}/80</div>

        <textarea
          placeholder="Add details..."
          maxLength={500}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full h-32 bg-transparent text-[var(--color-brand-text-primary)] text-base outline-none resize-none placeholder:text-[var(--color-brand-text-secondary)]/50"
        />
        <div className="text-right text-xs text-[var(--color-brand-text-secondary)] mb-6">{description.length}/500</div>

        <div className="bg-[var(--color-brand-bg-surface)] rounded-2xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-white">Severity</span>
            <div className="flex bg-[var(--color-brand-bg-primary)] rounded-lg p-1">
              {['FYI', 'INFORMATIONAL', 'URGENT'].map(sev => (
                <button
                  key={sev}
                  onClick={() => setSeverity(sev)}
                  className={cn(
                    "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                    severity === sev ? (sev === 'URGENT' ? 'bg-red-500 text-white' : 'bg-[var(--color-brand-accent-purple)] text-white') : 'text-[var(--color-brand-text-secondary)] hover:text-white'
                  )}
                >
                  {sev}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
             <span className="text-sm font-medium text-white">Post Anonymously</span>
             <button 
                onClick={() => setIsAnonymous(!isAnonymous)}
                className={cn("w-12 h-6 rounded-full p-1 transition-colors", isAnonymous ? "bg-[var(--color-brand-accent-purple)]" : "bg-[var(--color-brand-divider)]")}
             >
                <div className={cn("w-4 h-4 bg-white rounded-full transition-transform", isAnonymous ? "translate-x-6" : "")} />
             </button>
          </div>
        </div>
      </div>
      
      {/* Bottom Actions */}
      <div className="absolute bottom-0 inset-x-0 p-4 bg-[var(--color-brand-bg-card)] border-t border-[var(--color-brand-divider)] flex gap-4">
         <button 
           onClick={() => setMediaAdded(!mediaAdded)}
           className={cn("flex items-center justify-center p-3 rounded-xl flex-1 transition-colors font-medium border border-transparent", mediaAdded ? "bg-[var(--color-brand-accent-purple)]/20 border-[var(--color-brand-accent-purple)] text-[var(--color-brand-accent-purple)]" : "bg-[var(--color-brand-bg-surface)] text-white hover:bg-[var(--color-brand-accent-purple)]")}
         >
            <ImageIcon size={20} className="mr-2"/> {mediaAdded ? 'Image Added' : 'Add Photo'}
         </button>
         <button 
           onClick={() => setLocationAdded(!locationAdded)}
           className={cn("flex items-center justify-center p-3 rounded-xl flex-1 transition-colors font-medium border border-transparent", locationAdded ? "bg-[var(--color-brand-accent-cyan)]/20 border-[var(--color-brand-accent-cyan)] text-[var(--color-brand-accent-cyan)]" : "bg-[var(--color-brand-bg-surface)] text-white hover:bg-[var(--color-brand-accent-cyan)]")}
         >
            <MapPin size={20} className="mr-2"/> {locationAdded ? 'Location Pinned' : 'Location'}
         </button>
      </div>
    </motion.div>
  );
}
