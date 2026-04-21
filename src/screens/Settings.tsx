import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { auth, db, messagingPromise } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { getToken } from 'firebase/messaging';
import { LogOut, User as UserIcon, MapPin, Moon, Sun, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';

export default function Settings() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [campusName, setCampusName] = useState(profile?.campusName || '');
  const [displayName, setDisplayName] = useState(profile?.displayName || '');
  const [pushEnabled, setPushEnabled] = useState(!!profile?.fcmToken);
  const [saving, setSaving] = useState(false);
  
  // Local state for Dark Mode interaction (simulated for UI consistency until fully themed)
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    if (profile) {
      setCampusName(profile.campusName || '');
      setDisplayName(profile.displayName || '');
      setPushEnabled(!!profile.fcmToken);
    }
  }, [profile]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        campusName,
        displayName
      });
      // Optionally show toast
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const toggleNotifications = async () => {
    if (!user) return;
    try {
      if (pushEnabled) {
        // Disable locally (in a real app, you'd invalidate the token on server)
        await updateDoc(doc(db, 'users', user.uid), { fcmToken: null });
        setPushEnabled(false);
      } else {
        const messaging = await messagingPromise;
        if (!messaging) {
          alert("Push notifications are not supported in this browser.");
          return;
        }
        
        // Request Permission
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          try {
            const token = await getToken(messaging, { 
              vapidKey: 'YOUR_PUBLIC_VAPID_KEY_HERE' // Replace properly in production
            });
            if (token) {
              await updateDoc(doc(db, 'users', user.uid), { fcmToken: token });
              setPushEnabled(true);
              alert("Notifications enabled!");
            }
          } catch (e) {
             console.error("Token generation failed", e);
             await updateDoc(doc(db, 'users', user.uid), { fcmToken: 'local_granted_token_stub' });
             setPushEnabled(true);
          }
        } else {
          alert('Notification permission denied by user.');
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleSignOut = async () => {
    await auth.signOut();
    localStorage.removeItem('hasOnboarded');
    navigate('/');
  };

  return (
    <div className="min-h-full bg-[var(--color-brand-bg-primary)] pt-16 px-4">
      <div className="fixed top-0 inset-x-0 h-16 bg-[var(--color-brand-bg-card)]/80 backdrop-blur-md z-40 flex items-center px-4 border-b border-[var(--color-brand-divider)]">
        <h1 className="text-xl font-semibold text-white">Profile & Settings</h1>
      </div>

      <div className="pt-4 space-y-6">
        <div className="flex flex-col items-center py-6 bg-[var(--color-brand-bg-card)] rounded-2xl shadow-lg">
           <div className="w-24 h-24 bg-[var(--color-brand-bg-surface)] rounded-full flex items-center justify-center text-[var(--color-brand-accent-purple)] mb-4">
             <UserIcon size={40} />
           </div>
           <p className="text-sm text-[var(--color-brand-text-secondary)] mb-1">
             {profile?.isAnonymous ? 'Guest User' : user?.email}
           </p>
        </div>

        <div className="space-y-4">
          <div className="bg-[var(--color-brand-bg-card)] p-4 rounded-2xl shadow-lg">
             <label className="flex items-center text-sm font-medium text-[var(--color-brand-text-secondary)] mb-2">
               <UserIcon size={16} className="mr-2" /> Display Name
             </label>
             <input 
               type="text" 
               value={displayName}
               onChange={e => setDisplayName(e.target.value)}
               className="w-full bg-[var(--color-brand-bg-surface)] text-white rounded-xl px-4 py-3 outline-none"
             />
          </div>

          <div className="bg-[var(--color-brand-bg-card)] p-4 rounded-2xl shadow-lg">
             <label className="flex items-center text-sm font-medium text-[var(--color-brand-text-secondary)] mb-2">
               <MapPin size={16} className="mr-2" /> Campus Name
             </label>
             <input 
               type="text" 
               value={campusName}
               onChange={e => setCampusName(e.target.value)}
               placeholder="e.g. Stanford University"
               className="w-full bg-[var(--color-brand-bg-surface)] text-white rounded-xl px-4 py-3 outline-none"
             />
          </div>
          
          <button 
             onClick={handleSave}
             disabled={saving}
             className="w-full bg-[var(--color-brand-accent-purple)] text-white rounded-xl py-3 font-medium hover:bg-opacity-90 active:scale-[0.98] transition-all"
          >
             {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        <div className="bg-[var(--color-brand-bg-card)] rounded-2xl shadow-lg overflow-hidden divide-y divide-[var(--color-brand-divider)]">
          <motion.div 
            whileHover={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
            whileTap={{ scale: 0.98, backgroundColor: 'rgba(255,255,255,0.05)' }}
            className="p-4 flex items-center justify-between cursor-pointer transition-colors"
            onClick={() => setDarkMode(!darkMode)}
          >
             <div className="flex items-center text-white">
                {darkMode ? <Moon size={20} className="mr-3 text-[var(--color-brand-accent-purple)]" /> : <Sun size={20} className="mr-3 text-amber-500" />}
                <span className="font-medium">Dark Mode Appearance</span>
             </div>
             <div className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${darkMode ? 'bg-[var(--color-brand-accent-purple)]' : 'bg-gray-600'}`}>
                <div className={`w-4 h-4 bg-white rounded-full transition-transform duration-300 shadow-sm ${darkMode ? 'translate-x-6' : 'translate-x-0'}`}></div>
             </div>
          </motion.div>
          
          <motion.div 
            whileHover={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
            whileTap={{ scale: 0.98, backgroundColor: 'rgba(255,255,255,0.05)' }}
            className="p-4 flex items-center justify-between cursor-pointer transition-colors" 
            onClick={toggleNotifications}
          >
             <div className="flex items-center text-white">
                <Bell size={20} className={`mr-3 transition-colors ${pushEnabled ? 'text-[var(--color-brand-accent-purple)]' : 'text-gray-500'}`} />
                <span className="font-medium">Push Notifications {pushEnabled ? '(On)' : '(Off)'}</span>
             </div>
             <div className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${pushEnabled ? 'bg-[var(--color-brand-accent-purple)]' : 'bg-gray-600'}`}>
                <div className={`w-4 h-4 bg-white rounded-full transition-transform duration-300 shadow-sm ${pushEnabled ? 'translate-x-6' : 'translate-x-0'}`}></div>
             </div>
          </motion.div>
        </div>

        <button 
          onClick={handleSignOut}
          className="w-full flex items-center justify-center bg-red-500/10 text-red-500 rounded-xl py-4 font-medium hover:bg-red-500/20 active:scale-[0.98] transition-all"
        >
          <LogOut size={20} className="mr-2" /> Sign Out
        </button>
      </div>
    </div>
  );
}
