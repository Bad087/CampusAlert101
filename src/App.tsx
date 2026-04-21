import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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
import { AnimatePresence } from 'motion/react';
import { messagingPromise } from './firebase';
import { onMessage } from 'firebase/messaging';

export const playNotificationSound = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const audioCtx = new AudioContextClass();
    
    // Create oscillator for the main ping
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    // Quick, high-pitched "ping" sound (bell-like)
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
    oscillator.frequency.exponentialRampToValueAtTime(1760, audioCtx.currentTime + 0.05); // Rapid sweep up
    
    // Volume envelope
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 0.02); // Quick attack
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5); // Smooth decay
    
    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + 0.5);
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
  const { loading } = useAuth();

  useEffect(() => {
    // Setup foreground notification handler
    messagingPromise.then(messaging => {
      if (messaging) {
        const unsubscribe = onMessage(messaging, (payload) => {
          // Play the subtle hardware audio ping when a remote push is received!
          playNotificationSound();
          
          if (payload.notification) {
             alert(`Notification: ${payload.notification.title}\n${payload.notification.body}`);
          }
        });
        return () => unsubscribe();
      }
    });
  }, []);

  if (loading) {
    return <Splash />;
  }

  return (
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
