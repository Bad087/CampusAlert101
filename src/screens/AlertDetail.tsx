import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, onSnapshot, collection, query, orderBy, addDoc, serverTimestamp, updateDoc, increment, setDoc } from 'firebase/firestore';
import { Alert } from '../components/AlertCard';
import { ArrowLeft, MessageSquare, Send, ArrowUp, Smile } from 'lucide-react';
import { ALERT_CATEGORIES } from '../constants/categories';
import { cn } from '../lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import EmojiPicker, { Theme } from 'emoji-picker-react';

interface Reply {
  id: string;
  text: string;
  postedBy: string;
  postedByName: string;
  timestamp: any;
  upvotes: number;
}

export default function AlertDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  
  const [alert, setAlert] = useState<Alert | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [replyText, setReplyText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  
  const [localUpvotes, setLocalUpvotes] = useState(0);
  const [hasUpvoted, setHasUpvoted] = useState(false);

  useEffect(() => {
    if (!id) return;

    const alertRef = doc(db, 'alerts', id);
    const unSubAlert = onSnapshot(alertRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = { id: docSnap.id, ...docSnap.data() } as Alert;
        setAlert(data);
        setLocalUpvotes(data.upvoteCount || 0);
      }
    });

    const repliesRef = collection(db, `alerts/${id}/replies`);
    const q = query(repliesRef, orderBy('timestamp', 'asc'));
    const unSubReplies = onSnapshot(q, (snap) => {
      const reps: Reply[] = [];
      snap.forEach(d => reps.push({ id: d.id, ...d.data() } as Reply));
      setReplies(reps);
    });

    return () => {
      unSubAlert();
      unSubReplies();
    };
  }, [id]);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !user || !id) return;

    try {
      await addDoc(collection(db, `alerts/${id}/replies`), {
        text: replyText,
        postedBy: user.uid,
        postedByName: profile?.displayName || `Anonymous_${user.uid.substring(0, 4)}`,
        timestamp: serverTimestamp(),
        upvotes: 0
      });
      await updateDoc(doc(db, 'alerts', id), {
        replyCount: increment(1)
      });
      setReplyText('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpvote = async () => {
    if (!user || hasUpvoted || !alert) return;
    setHasUpvoted(true);
    setLocalUpvotes(prev => prev + 1);
    try {
      await setDoc(doc(db, `alerts/${id}/upvotes`, user.uid), { timestamp: serverTimestamp() });
      await updateDoc(doc(db, 'alerts', id as string), { upvoteCount: increment(1) });
    } catch(err) {
      console.error(err);
      setHasUpvoted(false);
      setLocalUpvotes(prev => prev - 1);
    }
  };

  if (!alert) {
    return <div className="min-h-screen bg-[var(--color-brand-bg-primary)]" />;
  }

  const cat = ALERT_CATEGORIES[alert.category as keyof typeof ALERT_CATEGORIES] || ALERT_CATEGORIES.GENERAL;
  const CategoryIcon = cat.icon;

  return (
    <div className="flex flex-col min-h-screen bg-[var(--color-brand-bg-primary)]">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[var(--color-brand-bg-card)]/80 backdrop-blur-md border-b border-[var(--color-brand-divider)]">
        <div className="flex items-center p-4">
          <button onClick={() => navigate(-1)} className="text-white p-2 flex-shrink-0">
            <ArrowLeft size={24} />
          </button>
          <div className="ml-2 flex-1">
             <div className={cn("inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-opacity-10", cat.textClass, cat.colorClass.replace('bg-', 'bg-').concat('/10'))}>
              <CategoryIcon size={12} />
              <span>{cat.displayName}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-24">
        {/* Main Alert Info */}
        <div className="bg-[var(--color-brand-bg-card)] p-4 sm:p-6 mb-2 shadow-lg">
          <h1 className="text-2xl font-semibold text-white mb-3">{alert.title}</h1>
          <p className="text-[var(--color-brand-text-primary)] text-base mb-6 leading-relaxed whitespace-pre-wrap">
            {alert.description}
          </p>

          {alert.mediaUrls && alert.mediaUrls.length > 0 && (
            <div className="mb-6 space-y-2">
              {alert.mediaUrls.map((url, i) => (
                <div key={i} className="w-full aspect-video rounded-xl bg-black overflow-hidden object-contain">
                   <img src={url} alt="Media" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between border-t border-[var(--color-brand-divider)] pt-4 mt-2">
             <div className="flex flex-col">
               <span className="text-sm font-medium text-white">{alert.postedByName}</span>
               <span className="text-xs text-[var(--color-brand-text-secondary)]">
                 {alert.timestamp ? formatDistanceToNow(alert.timestamp.toDate(), { addSuffix: true }) : ''}
               </span>
             </div>
             
             {/* Upvote giant button */}
             <button 
               onClick={handleUpvote}
               className={cn("flex flex-col items-center justify-center p-3 rounded-xl transition-colors", hasUpvoted ? "bg-[var(--color-brand-accent-purple)] text-white" : "bg-[var(--color-brand-bg-surface)] text-[var(--color-brand-text-secondary)] hover:bg-[var(--color-brand-accent-purple)] hover:text-white")}
             >
               <ArrowUp size={24} className="mb-1" />
               <span className="font-semibold">{localUpvotes}</span>
             </button>
          </div>
        </div>

        {/* Replies Section */}
        <div className="px-4 py-6">
          <h3 className="text-white font-medium mb-4 flex items-center">
            <MessageSquare size={18} className="mr-2" />
            Replies ({alert.replyCount})
          </h3>
          
          <div className="space-y-4">
            {replies.map(reply => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={reply.id} 
                className="bg-[var(--color-brand-bg-surface)] rounded-2xl p-4"
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm font-medium text-[var(--color-brand-accent-cyan)]">{reply.postedByName}</span>
                  <span className="text-xs text-[var(--color-brand-text-secondary)]">
                    {reply.timestamp ? formatDistanceToNow(reply.timestamp.toDate(), { addSuffix: true }) : ''}
                  </span>
                </div>
                <p className="text-[var(--color-brand-text-primary)] text-sm whitespace-pre-wrap">{reply.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Reply Input */}
      <div className="fixed bottom-0 inset-x-0 bg-[var(--color-brand-bg-card)]/90 backdrop-blur-xl border-t border-[var(--color-brand-divider)] p-3 shadow-[0_-4px_20px_rgba(0,0,0,0.5)]">
         <AnimatePresence>
            {showEmoji && (
               <motion.div 
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, y: 20 }}
                 className="absolute bottom-full right-4 mb-2 z-50 shadow-2xl rounded-2xl overflow-hidden border border-[var(--color-brand-divider)]"
               >
                 <EmojiPicker 
                   theme={Theme.DARK} 
                   onEmojiClick={(emojiData) => setReplyText(prev => prev + emojiData.emoji)} 
                   lazyLoadEmojis={true}
                 />
               </motion.div>
            )}
         </AnimatePresence>
         <form onSubmit={handleSendReply} className="flex flex-row items-end gap-2 max-w-3xl mx-auto items-center">
            <button
               type="button"
               onClick={() => setShowEmoji(!showEmoji)}
               className="h-[44px] w-[44px] bg-[var(--color-brand-bg-surface)] text-[var(--color-brand-text-secondary)] hover:text-[var(--color-brand-accent-purple)] rounded-xl flex items-center justify-center shrink-0 transition-colors"
            >
               <Smile size={24} />
            </button>
            <textarea 
               value={replyText}
               onChange={e => setReplyText(e.target.value)}
               placeholder="Add a reply..."
               className="flex-1 bg-[var(--color-brand-bg-surface)] text-white rounded-xl px-4 py-3 min-h-[44px] max-h-32 outline-none resize-none placeholder:text-[var(--color-brand-text-secondary)]" 
               rows={1}
               onFocus={() => setShowEmoji(false)}
            />
            <button 
              type="submit"
              disabled={!replyText.trim()}
              className="bg-[var(--color-brand-accent-purple)] text-white h-[44px] w-[44px] rounded-xl flex items-center justify-center shrink-0 disabled:opacity-50 hover:bg-opacity-90 active:scale-95 transition-transform"
            >
              <Send size={20} className="ml-1 -translate-y-0.5" />
            </button>
         </form>
      </div>
    </div>
  );
}
