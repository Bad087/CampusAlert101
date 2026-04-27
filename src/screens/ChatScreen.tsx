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
  const [newUnreadId, setNewUnreadId] = useState<string | null>(null);
  const location = useLocation();
  const lastMsgCountRef = useRef(0);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // If we came from "DM user" button, we might not have a chat ID yet, 
  // or id could be "new_<otherUserId>". Let's handle generic ID.
  const isNew = id?.startsWith('new_');
  const targetUserId = isNew ? id?.replace('new_', '') : null;
  const [actualChatId, setActualChatId] = useState<string | null>(isNew ? null : id!);
  
  useEffect(() => {
     if (isNew && targetUserId && user) {
        // Look up if a chat already exists between these two
        import('firebase/firestore').then(({ collection, query, where, getDocs }) => {
           const q = query(
             collection(db, 'chats'), 
             where('participants', 'array-contains', user.uid)
           );
           getDocs(q).then(snap => {
              let foundId = null;
              snap.forEach(doc => {
                 if (doc.data().participants.includes(targetUserId)) {
                    foundId = doc.id;
                 }
              });
              if (foundId) {
                 setActualChatId(foundId);
              }
           });
        });
     }
  }, [isNew, targetUserId, user]);

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
           setNewUnreadId(newestMsg.id);
           setTimeout(() => setNewUnreadId(null), 8000); // Highlight for 8 seconds
        }
      }
      lastMsgCountRef.current = msgs.length;
      
      setMessages(msgs);
      
      // Auto scroll to bottom
      setTimeout(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
      }, 50);
    });
    return () => unSub();
  }, [actualChatId, user?.uid]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !user) return;
    
    // Optimistic clear
    const currentText = text;
    setText('');
    
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
          lastMessage: currentText,
          lastUpdatedAt: serverTimestamp()
        });
        activeId = newChatRef.id;
        setActualChatId(activeId);
      } else {
        await updateDoc(doc(db, 'chats', activeId), {
          lastMessage: currentText,
          lastUpdatedAt: serverTimestamp(),
          lastMsgSenderId: user.uid
        });
      }

      await addDoc(collection(db, `chats/${activeId}/messages`), {
        text: currentText,
        senderId: user.uid,
        timestamp: serverTimestamp()
      });
    } catch(err) {
      console.error(err);
      setText(currentText); // Revert on failure
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#0B0B13] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[var(--color-brand-accent-purple)]/5 via-[#0B0B13] to-[#0B0B13]">
      <div className="sticky top-0 z-40 bg-[#12121A]/80 backdrop-blur-xl border-b border-white/5 py-3 px-4 flex items-center shadow-sm">
        <button onClick={() => navigate(-1)} className="text-white bg-white/5 hover:bg-white/10 p-2 rounded-full mr-3 transition-colors active:scale-95">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="text-white font-semibold text-[17px] tracking-tight truncate">
             {new URLSearchParams(location.search).get('name') || 'Direct Message'}
          </h2>
          <p className="text-[11px] text-[var(--color-brand-accent-cyan)] font-medium">Encrypted • Real-time</p>
        </div>
      </div>

      <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-5 pb-28 flex flex-col scroll-smooth">
         {messages.length === 0 && (
           <div className="flex-1 flex flex-col items-center justify-center text-center px-4 mt-10">
              <motion.div 
                 initial={{ scale: 0.8, opacity: 0 }}
                 animate={{ scale: 1, opacity: 1 }}
                 transition={{ duration: 0.5, type: 'spring' }}
                 className="w-24 h-24 rounded-full bg-[#1A1A2E] border border-white/5 shadow-[0_0_40px_rgba(124,58,237,0.15)] flex items-center justify-center mb-6 relative"
              >
                 <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#7C3AED]/20 to-[#06B6D4]/20 blur-xl"></div>
                 <Send size={32} className="text-[var(--color-brand-accent-cyan)] ml-2 relative z-10 opacity-80" />
              </motion.div>
              <h3 className="text-xl text-white font-bold mb-2">No messages yet</h3>
              <p className="text-sm text-gray-400 max-w-[240px] leading-relaxed">
                 Say hi and start a secure, real-time conversation.
              </p>
           </div>
         )}
         {messages.map((m, idx) => {
           const isMe = m.senderId === user?.uid;
           const isUnread = m.id === newUnreadId;
           
           return (
             <motion.div 
               key={m.id} 
               initial={{ opacity: 0, y: 15, scale: 0.95 }}
               animate={{ opacity: 1, y: 0, scale: 1 }}
               transition={{ type: "spring", stiffness: 400, damping: 25 }}
               className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}
             >
                <div className={`max-w-[85%] md:max-w-[70%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                   <div 
                     className={`px-4 py-2.5 relative group shadow-lg ${
                        isMe 
                        ? 'bg-gradient-to-br from-[#7C3AED] to-[#4F46E5] text-white rounded-[20px] rounded-br-sm border border-white/10' 
                        : 'bg-[#1E1E2E] border border-white/5 text-[#E2E8F0] rounded-[20px] rounded-bl-sm'
                     } ${isUnread ? 'ring-2 ring-[var(--color-brand-accent-cyan)] ring-offset-2 ring-offset-[#0B0B13]' : ''}`}
                   >
                     <p className="leading-relaxed whitespace-pre-wrap break-words text-[15px]">{m.text}</p>
                     
                     {/* Unread Ping Indicator */}
                     {isUnread && (
                        <span className="absolute -top-1.5 -right-1.5 flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-brand-accent-cyan)] opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-[var(--color-brand-accent-cyan)]"></span>
                        </span>
                     )}
                   </div>
                   {m.timestamp && (
                      <span className="text-[10px] text-gray-500 mt-1.5 px-1 font-medium select-none flex items-center">
                         {formatDistanceToNow(m.timestamp.toDate(), { addSuffix: true })}
                         {isMe && <span className="ml-1.5 text-[var(--color-brand-accent-purple)]">✓✓</span>}
                      </span>
                   )}
                </div>
             </motion.div>
           )
         })}
      </div>

      <div className="fixed bottom-0 inset-x-0 bg-[#12121A]/95 backdrop-blur-2xl border-t border-white/5 p-3 pb-[max(env(safe-area-inset-bottom),12px)] shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
         <AnimatePresence>
            {showEmoji && (
               <motion.div 
                 initial={{ opacity: 0, y: 20, scale: 0.95 }}
                 animate={{ opacity: 1, y: 0, scale: 1 }}
                 exit={{ opacity: 0, y: 20, scale: 0.95 }}
                 transition={{ type: "spring", stiffness: 350, damping: 25 }}
                 className="absolute bottom-full left-4 mb-2 z-50 shadow-2xl rounded-2xl overflow-hidden border border-white/10"
               >
                 <EmojiPicker 
                   theme={Theme.DARK} 
                   onEmojiClick={(emojiData) => setText(prev => prev + emojiData.emoji)} 
                   lazyLoadEmojis={true}
                 />
               </motion.div>
            )}
         </AnimatePresence>
         <form onSubmit={handleSend} className="flex gap-2 max-w-3xl mx-auto items-center w-full">
            <button
               type="button"
               onClick={() => setShowEmoji(!showEmoji)}
               className="h-[44px] w-[44px] bg-white/5 hover:bg-white/10 text-gray-400 hover:text-[#7C3AED] rounded-full flex items-center justify-center shrink-0 transition-colors"
            >
               <Smile size={22} />
            </button>
            <input 
               type="text"
               value={text}
               onChange={e => setText(e.target.value)}
               placeholder="Chat Message..."
               className="flex-1 min-w-0 bg-white/5 hover:bg-white/10 text-white rounded-full px-5 py-3 outline-none border border-white/5 focus:border-[#7C3AED] transition-all shadow-inner focus:shadow-[0_0_20px_rgba(124,58,237,0.2)] text-[15px]" 
               onFocus={() => setShowEmoji(false)}
               autoComplete="off"
            />
            <button disabled={!text.trim()} className="w-[44px] h-[44px] shrink-0 bg-gradient-to-r from-[#7C3AED] to-[#06B6D4] text-white rounded-full flex items-center justify-center disabled:opacity-30 disabled:saturate-0 hover:shadow-[0_0_15px_rgba(124,58,237,0.5)] active:scale-95 transition-all">
              <Send size={18} className="translate-x-[1px]" />
            </button>
         </form>
      </div>
    </div>
  );
}
