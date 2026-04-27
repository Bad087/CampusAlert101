import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Splash from './screens/Splash';
import Onboarding from './screens/Onboarding';
import AuthScreen from './screens/AuthScreen';
import MainLayout from './layouts/MainLayout';
import Board from './screens/Board';
import AlertDetail from './screens/AlertDetail';
import PostAlert from './screens/PostAlert';
import SearchScreen from './screens/SearchScreen';
import MyAlerts from './screens/MyAlerts';
import Settings from './screens/Settings';
import Inbox from './screens/Inbox';
import ChatScreen from './screens/ChatScreen';
import Classrooms from './screens/Classrooms';
import ClassroomDetail from './screens/ClassroomDetail';
import { AnimatePresence, motion } from 'motion/react';
import { messagingPromise } from './firebase';
import { collection, query, orderBy, limit, onSnapshot, where } from 'firebase/firestore';
import { db } from './firebase';

export const playNotificationSound = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const audioCtx = new AudioContextClass();
    
    // Subtle, modern two-tone notification sound
    const playTone = (freq: number, startTime: number, duration: number, volume: number) => {
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(freq, startTime);
      
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.02); // Quick attack
      gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration); // Smooth decay
      
      oscillator.start(startTime);
      oscillator.stop(startTime + duration + 0.1);
    };

    const now = audioCtx.currentTime;
    // Pleasant major third interval indicating new information
    playTone(523.25, now, 0.3, 0.15);       // C5
    playTone(659.25, now + 0.12, 0.5, 0.2); // E5

  } catch (e) {
    console.error('Audio play failed', e);
  }
};

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) return null; // or loading spinner
  
  if (!user) {
    return <Navigate to="/auth" />;
  }
  
  return <>{children}</>;
};

function AppRoutes() {
  const { user, loading } = useAuth();
  const [newAlert, setNewAlert] = React.useState<any>(null);
  const initTimeRef = React.useRef(Date.now());
  const nav = useNavigate();

  useEffect(() => {
    // Setup foreground notification handler
    messagingPromise.then(messaging => {
      if (messaging) {
        const unsubscribe = import('firebase/messaging').then(({ onMessage }) => {
          return onMessage(messaging, (payload) => {
            // Play the subtle hardware audio ping when a remote push is received!
            playNotificationSound();
            
            if (payload.notification) {
               alert(`Notification: ${payload.notification.title}\n${payload.notification.body}`);
            }
          });
        });
      }
    });
  }, []);

  useEffect(() => {
    if (!user) return; // only listen if logged in
    
    // 1. Alerts Listener
    const qAlerts = query(collection(db, 'alerts'), orderBy('timestamp', 'desc'), limit(1));
    const unSubAlerts = onSnapshot(qAlerts, snap => {
      snap.docChanges().forEach(change => {
        if (change.type === 'added') {
          const data = change.doc.data();
          if (data.timestamp && data.timestamp.toMillis() > initTimeRef.current) {
             if (data.postedBy !== user.uid) {
                playNotificationSound();
                setNewAlert({ id: change.doc.id, ...data, isChat: false });
                
                if ('Notification' in window && Notification.permission === 'granted') {
                   new Notification(`🚨 New Campus Alert`, { body: data.title });
                }

                setTimeout(() => setNewAlert(null), 3000);
             }
          }
        }
      });
    });

    // 2. Chats Listener
    const qChats = query(collection(db, 'chats'), where('participants', 'array-contains', user.uid));
    const unSubChats = onSnapshot(qChats, snap => {
      snap.docChanges().forEach(change => {
        if (change.type === 'modified' || change.type === 'added') {
           const data = change.doc.data();
           // Did they receive a new message recently?
           if (data.lastUpdatedAt && data.lastUpdatedAt.toMillis() > initTimeRef.current) {
              const names = data.participantNames || {};
              const senderIds = data.participants.filter((p: string) => p !== user.uid);
              const otherUser = senderIds.length > 0 ? names[senderIds[0]] : 'Someone';
              
              const isLookingAtChat = window.location.pathname.includes(change.doc.id);
              // Only trigger if we aren't actively in that chat room
              if (!isLookingAtChat) {
                 playNotificationSound();
                 setNewAlert({ 
                    id: change.doc.id, 
                    title: data.lastMessage, 
                    postedByName: otherUser, 
                    isChat: true 
                 });

                 if ('Notification' in window && Notification.permission === 'granted') {
                   new Notification(`💬 New Message from ${otherUser}`, { body: data.lastMessage });
                 }
                 setTimeout(() => setNewAlert(null), 3000);
              }
           }
        }
      });
    });

    return () => {
      unSubAlerts();
      unSubChats();
    };
  }, [user]);

  if (loading) {
    return <Splash />;
  }

  return (
    <>
      {newAlert && (
         <AnimatePresence>
           <motion.div 
             initial={{ y: -100, opacity: 0 }}
             animate={{ y: 20, opacity: 1 }}
             exit={{ y: -100, opacity: 0 }}
             className="fixed top-0 inset-x-0 z-[100] px-4 flex justify-center pointer-events-none"
           >
              <div 
                 onClick={() => nav(newAlert.isChat ? `/chat/${newAlert.id}` : `/alert/${newAlert.id}`)}
                 className="bg-[var(--color-brand-bg-card)] border-2 border-[var(--color-brand-accent-purple)] shadow-[0_10px_40px_rgba(124,58,237,0.4)] rounded-2xl p-4 flex items-center max-w-sm w-full cursor-pointer pointer-events-auto"
              >
                 <div className="flex-1">
                    <h4 className="text-white font-bold mb-1 tracking-tight text-sm uppercase text-[var(--color-brand-accent-purple)]">
                       {newAlert.isChat ? `💬 Message from ${newAlert.postedByName}` : '🚨 New Campus Alert'}
                    </h4>
                    <p className="text-white font-medium line-clamp-2">{newAlert.title}</p>
                 </div>
              </div>
           </motion.div>
         </AnimatePresence>
      )}
      <AnimatePresence mode="wait">
      <Routes>
        <Route path="/" element={<Splash isInitial={false} />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/auth" element={<AuthScreen />} />
        
        <Route path="/app" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
          <Route index element={<Board />} />
          <Route path="search" element={<SearchScreen />} />
          <Route path="my-alerts" element={<MyAlerts />} />
          <Route path="inbox" element={<Inbox />} />
          <Route path="classrooms" element={<Classrooms />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        
        <Route path="/post" element={<ProtectedRoute><PostAlert /></ProtectedRoute>} />
        <Route path="/alert/:id" element={<ProtectedRoute><AlertDetail /></ProtectedRoute>} />
        <Route path="/chat/:id" element={<ProtectedRoute><ChatScreen /></ProtectedRoute>} />
        <Route path="/classroom/:id" element={<ProtectedRoute><ClassroomDetail /></ProtectedRoute>} />
      </Routes>
      </AnimatePresence>
    </>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}
