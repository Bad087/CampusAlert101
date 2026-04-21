import React, { useEffect, useState, useRef } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Send, Smile } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import EmojiPicker, { Theme } from 'emoji-picker-react';
import { playNotificationSound } from '../App';

export default function ChatScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const location = useLocation();
  const lastMsgCountRef = useRef(0);

  // If we came from "DM user" button, we might not have a chat ID yet, 
  // or id could be "new_<otherUserId>". Let's handle generic ID.
  const isNew = id?.startsWith('new_');
  const targetUserId = isNew ? id?.replace('new_', '') : null;
  const [actualChatId, setActualChatId] = useState<string | null>(isNew ? null : id!);
  
  useEffect(() => {
    if (!actualChatId) return;
    const q = query(collection(db, `chats/${actualChatId}/messages`), orderBy('timestamp', 'asc'));
    const unSub = onSnapshot(q, snap => {
      const msgs: any[] = [];
      snap.forEach(d => msgs.push({ id: d.id, ...d.data() }));
      
      // Check if new incoming message
      if (lastMsgCountRef.current > 0 && msgs.length > lastMsgCountRef.current) {
        const newestMsg = msgs[msgs.length - 1];
        if (newestMsg.senderId !== user?.uid) {
           playNotificationSound();
        }
      }
      lastMsgCountRef.current = msgs.length;
      
      setMessages(msgs);
    });
    return () => unSub();
  }, [actualChatId, user?.uid]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !user) return;
    
    try {
      let activeId = actualChatId;
      // If new, create chat document first
      if (!activeId) {
        // Query to check if chat exists could go here, for now we just create
        const newChatRef = await addDoc(collection(db, 'chats'), {
          participants: [user.uid, targetUserId],
          participantNames: {
             [user.uid]: profile?.displayName || 'Anonymous',
             [targetUserId!]: new URLSearchParams(location.search).get('name') || 'User'
          },
          lastMessage: text,
          lastUpdatedAt: serverTimestamp()
        });
        activeId = newChatRef.id;
        setActualChatId(activeId);
      } else {
        await updateDoc(doc(db, 'chats', activeId), {
          lastMessage: text,
          lastUpdatedAt: serverTimestamp()
        });
      }

      await addDoc(collection(db, `chats/${activeId}/messages`), {
        text,
        senderId: user.uid,
        timestamp: serverTimestamp()
      });
      setText('');
    } catch(err) {
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[var(--color-brand-bg-primary)]">
      <div className="sticky top-0 z-40 bg-[var(--color-brand-bg-card)]/80 backdrop-blur-md border-b border-[var(--color-brand-divider)] py-4 px-4 flex items-center">
        <button onClick={() => navigate(-1)} className="text-white mr-4 transition-transform hover:scale-110 active:scale-95">
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-white font-semibold text-lg">Direct Message</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24 flex flex-col">
         {messages.map((m, idx) => {
           const isMe = m.senderId === user?.uid;
           return (
             <motion.div 
               key={m.id} 
               initial={{ opacity: 0, y: 10, scale: 0.95 }}
               animate={{ opacity: 1, y: 0, scale: 1 }}
               transition={{ type: "spring", stiffness: 400, damping: 25 }}
               className={`max-w-[75%] rounded-2xl p-3 shadow-sm ${isMe ? 'bg-[var(--color-brand-accent-purple)] text-white self-end rounded-br-none' : 'bg-[#1A1A2E] border border-white/5 text-[var(--color-brand-text-primary)] self-start rounded-bl-none'}`}
             >
                <p className="leading-relaxed">{m.text}</p>
                {m.timestamp && <span className="text-[10px] opacity-70 mt-1.5 block text-right font-medium">{formatDistanceToNow(m.timestamp.toDate(), { addSuffix: true })}</span>}
             </motion.div>
           )
         })}
      </div>

      <div className="fixed bottom-0 inset-x-0 bg-[#0F0F0F]/90 backdrop-blur-xl border-t border-[var(--color-brand-divider)] p-3 pb-[max(env(safe-area-inset-bottom),12px)]">
         <AnimatePresence>
            {showEmoji && (
               <motion.div 
                 initial={{ opacity: 0, y: 20, scale: 0.95 }}
                 animate={{ opacity: 1, y: 0, scale: 1 }}
                 exit={{ opacity: 0, y: 20, scale: 0.95 }}
                 transition={{ type: "spring", stiffness: 350, damping: 25 }}
                 className="absolute bottom-full right-4 mb-2 z-50 shadow-2xl rounded-2xl overflow-hidden border border-[var(--color-brand-divider)]"
               >
                 <EmojiPicker 
                   theme={Theme.DARK} 
                   onEmojiClick={(emojiData) => setText(prev => prev + emojiData.emoji)} 
                   lazyLoadEmojis={true}
                 />
               </motion.div>
            )}
         </AnimatePresence>
         <form onSubmit={handleSend} className="flex gap-2 max-w-3xl mx-auto items-center">
            <button
               type="button"
               onClick={() => setShowEmoji(!showEmoji)}
               className="h-[44px] w-[44px] bg-[var(--color-brand-bg-surface)] text-[var(--color-brand-text-secondary)] hover:text-[var(--color-brand-accent-purple)] hover:bg-[var(--color-brand-accent-purple)]/10 rounded-xl flex items-center justify-center shrink-0 transition-colors"
            >
               <Smile size={24} />
            </button>
            <input 
               type="text"
               value={text}
               onChange={e => setText(e.target.value)}
               placeholder="Chat Message..."
               className="flex-1 bg-[#1A1A2E] text-white rounded-xl px-4 py-3 outline-none border border-white/5 focus:border-[var(--color-brand-accent-purple)] transition-colors shadow-inner" 
               onFocus={() => setShowEmoji(false)}
            />
            <button disabled={!text.trim()} className="w-[44px] h-[44px] bg-gradient-to-r from-[var(--color-brand-accent-purple)] to-[var(--color-brand-accent-cyan)] text-white rounded-xl flex items-center justify-center disabled:opacity-50 hover:shadow-[0_0_15px_rgba(124,58,237,0.5)] active:scale-95 transition-all">
              <Send size={18} className="translate-x-[1px]" />
            </button>
         </form>
      </div>
    </div>
  );
}
