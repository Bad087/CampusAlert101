import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, orderBy, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { MessageCircle, Search, Trash2, Edit } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Inbox() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'chats'), where('participants', 'array-contains', user.uid), orderBy('lastUpdatedAt', 'desc'));
    const unSub = onSnapshot(q, (snap) => {
      const data: any[] = [];
      snap.forEach(doc => data.push({ id: doc.id, ...doc.data() }));
      setChats(data);
      setLoading(false);
    }, (error) => {
      console.error("Inbox listener error:", error);
      setLoading(false);
    });
    return () => unSub();
  }, [user]);

  const handleDeleteChat = async (e: React.MouseEvent, chatId: string) => {
     e.stopPropagation();
     if(window.confirm('Are you sure you want to delete this chat?')) {
        try {
           await deleteDoc(doc(db, 'chats', chatId));
        } catch(err) {
           console.error('Error deleting chat:', err);
        }
     }
  };

  return (
    <div className="min-h-full bg-[var(--color-brand-bg-primary)] pt-16 px-4">
      <div className="fixed top-0 inset-x-0 h-16 bg-[var(--color-brand-bg-card)]/80 backdrop-blur-md z-40 flex items-center justify-between px-4 border-b border-[var(--color-brand-divider)]">
        <h1 className="text-xl font-semibold text-white">Inbox</h1>
        <motion.button 
           whileTap={{ scale: 0.9 }}
           onClick={() => navigate('/search')}
           className="w-10 h-10 rounded-full bg-[var(--color-brand-bg-surface)] text-[var(--color-brand-accent-cyan)] flex items-center justify-center hover:bg-white/10 transition-colors border border-white/5 shadow-sm"
        >
           <Search size={18} />
        </motion.button>
      </div>

      <div className="pt-4 space-y-4 pb-24 relative">
        {loading ? (
           <div className="text-center text-[var(--color-brand-text-secondary)] mt-10 animate-pulse">Loading messages...</div>
        ) : chats.length === 0 ? (
          <div className="flex flex-col items-center justify-center mt-20 text-center px-4">
             <div className="w-20 h-20 bg-[var(--color-brand-accent-purple)]/10 rounded-full flex items-center justify-center mb-6">
                <MessageCircle size={32} className="text-[var(--color-brand-accent-purple)] opacity-80" />
             </div>
             <h3 className="text-white font-semibold text-lg mb-2">No messages yet</h3>
             <p className="text-[var(--color-brand-text-secondary)] text-sm mb-6 max-w-[200px]">Connect with other space members to start chatting.</p>
             <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/search')} 
                className="bg-gradient-to-r from-[var(--color-brand-accent-purple)] to-[var(--color-brand-accent-cyan)] px-6 py-2.5 rounded-full text-white font-bold tracking-wide shadow-[0_0_20px_rgba(124,58,237,0.3)] flex items-center"
             >
                <Edit size={16} className="mr-2" /> Start Chat
             </motion.button>
          </div>
        ) : (
          <AnimatePresence>
            {chats.map(chat => {
              const names = chat.participantNames || {};
              const otherUser = Object.values(names).find((name: any) => name !== names[user!.uid]) || 'Unknown User';
              
              return (
                <motion.div 
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  key={chat.id} 
                  onClick={() => navigate(`/chat/${chat.id}`)}
                  className="bg-[var(--color-brand-bg-card)] p-4 rounded-3xl flex items-center shadow-lg border border-white/5 cursor-pointer hover:bg-[var(--color-brand-bg-surface)] transition-all group"
                >
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[var(--color-brand-accent-purple)] to-[var(--color-brand-accent-cyan)] text-white flex items-center justify-center mr-4 text-xl font-bold shadow-inner">
                     {String(otherUser).substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <div className="flex justify-between items-center mb-1">
                      <h4 className="text-white font-bold truncate text-[16px]">{otherUser as string}</h4>
                      <span className="text-xs text-[var(--color-brand-text-secondary)] shrink-0 ml-2 font-medium">
                        {chat.lastUpdatedAt ? formatDistanceToNow(chat.lastUpdatedAt.toDate(), { addSuffix: true }) : ''}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                       <p className="text-[var(--color-brand-text-secondary)] text-[14px] truncate flex-1">{chat.lastMessage}</p>
                       <button 
                         onClick={(e) => handleDeleteChat(e, chat.id)}
                         className="opacity-0 group-hover:opacity-100 p-2 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-full transition-all shrink-0 ml-2"
                         title="Delete Chat"
                       >
                         <Trash2 size={16} />
                       </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      <motion.button 
         whileHover={{ scale: 1.05, rotate: 15 }}
         whileTap={{ scale: 0.9 }}
         onClick={() => navigate('/search')}
         className="fixed bottom-24 right-4 w-14 h-14 bg-gradient-to-tr from-[var(--color-brand-accent-purple)] to-[var(--color-brand-accent-cyan)] shadow-[0_4px_20px_rgba(124,58,237,0.4)] rounded-full text-white flex items-center justify-center z-50 transition-all border border-white/10"
      >
         <Edit size={24} className="ml-1" />
      </motion.button>
    </div>
  );
}
