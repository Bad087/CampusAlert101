import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { auth, db, messagingPromise } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { getToken } from 'firebase/messaging';
import { LogOut, User as UserIcon, MapPin, Moon, Sun, Bell, Camera, ChevronRight, Shield, BadgeCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';

export default function Settings() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [campusName, setCampusName] = useState(profile?.campusName || '');
  const [displayName, setDisplayName] = useState(profile?.displayName || '');
  const [pushEnabled, setPushEnabled] = useState(!!profile?.fcmToken);
  const [saving, setSaving] = useState(false);
  const [showSaveToast, setShowSaveToast] = useState(false);
  
  const [showActivity, setShowActivity] = useState(profile?.showActivity ?? true);
  const [publicProfile, setPublicProfile] = useState(profile?.publicProfile ?? true);
  
  // Global state for Dark Mode
  const [darkMode, setDarkMode] = useState(() => {
     return document.documentElement.getAttribute('data-theme') !== 'light';
  });

  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  useEffect(() => {
    if (profile) {
      setCampusName(profile.campusName || '');
      setDisplayName(profile.displayName || '');
      setPushEnabled(!!profile.fcmToken);
      if (profile.showActivity !== undefined) setShowActivity(profile.showActivity);
      if (profile.publicProfile !== undefined) setPublicProfile(profile.publicProfile);
    }
  }, [profile]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        campusName,
        displayName
      });
      setShowSaveToast(true);
      setTimeout(() => setShowSaveToast(false), 3000);
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

  const toggleActivityStatus = async () => {
    if (!user) return;
    const newValue = !showActivity;
    setShowActivity(newValue);
    try {
      await updateDoc(doc(db, 'users', user.uid), { showActivity: newValue });
    } catch (e) {
      console.error(e);
      setShowActivity(!newValue); // revert on error
    }
  };

  const togglePublicProfile = async () => {
    if (!user) return;
    const newValue = !publicProfile;
    setPublicProfile(newValue);
    try {
      await updateDoc(doc(db, 'users', user.uid), { publicProfile: newValue });
    } catch (e) {
      console.error(e);
      setPublicProfile(!newValue); // revert on error
    }
  };

  const handleSignOut = async () => {
    await auth.signOut();
    localStorage.removeItem('hasOnboarded');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[var(--color-brand-bg-primary)] pt-20 px-4 pb-28 transition-colors duration-300">
      <div className="fixed top-0 inset-x-0 h-[72px] bg-[var(--color-brand-bg-primary)]/80 backdrop-blur-2xl z-40 flex items-center px-6 border-b border-[var(--color-brand-divider)] transition-all">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--color-brand-text-primary)]">
           Settings
        </h1>
      </div>

      <div className="max-w-xl mx-auto space-y-10">
        {/* Header / Avatar */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center mt-4"
        >
           <div className="relative group">
              <div className="w-32 h-32 rounded-[36px] bg-gradient-to-tr from-[#7C3AED] to-[#06B6D4] flex items-center justify-center p-[3px] shadow-[0_0_50px_rgba(124,58,237,0.2)]">
                 <div className="w-full h-full bg-[var(--color-brand-bg-card)] rounded-[33px] flex items-center justify-center text-[var(--color-brand-text-primary)] overflow-hidden relative group-hover:opacity-90 transition-opacity cursor-pointer">
                    {profile?.avatarUrl ? (
                      <img src={profile.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                      <UserIcon size={56} className="text-gray-400" />
                    )}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                       <Camera size={28} className="text-white" />
                    </div>
                 </div>
              </div>
              {!profile?.isAnonymous && (
                <div className="absolute -bottom-2 -right-2 bg-[var(--color-brand-bg-card)] p-1.5 rounded-full border border-[var(--color-brand-divider)] shadow-lg">
                   <BadgeCheck size={26} className="text-[var(--color-brand-accent-cyan)] fills-current" />
                </div>
              )}
           </div>
           
           <div className="mt-6 text-center">
             <h2 className="text-3xl font-bold text-[var(--color-brand-text-primary)] tracking-tight">{displayName || 'Anonymous User'}</h2>
             <p className="text-[var(--color-brand-text-secondary)] font-medium text-[15px] mt-1.5 mb-3">
               {profile?.isAnonymous ? 'Guest User • Unverified' : user?.email}
             </p>
             <div className="inline-flex items-center px-4 py-1.5 bg-[var(--color-brand-bg-card)] rounded-full border border-[var(--color-brand-divider)] shadow-sm">
                <MapPin size={14} className="text-[var(--color-brand-accent-purple)] mr-2" />
                <span className="text-sm font-semibold text-[var(--color-brand-text-secondary)] capitalize tracking-wide">{campusName || 'No Campus Selected'}</span>
             </div>
           </div>
        </motion.div>

        {/* Settings Form Section */}
        <motion.div 
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.1 }}
           className="space-y-4"
        >
          <h3 className="text-[13px] font-bold uppercase tracking-[0.1em] text-[var(--color-brand-text-secondary)] ml-3">Personal Details</h3>
          
          <div className="bg-[var(--color-brand-bg-card)] rounded-[28px] border border-[var(--color-brand-divider)] shadow-sm p-3 flex flex-col gap-3 transition-colors duration-300">
              <div className="relative group">
                 <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                   <UserIcon size={20} className="text-[var(--color-brand-text-secondary)] group-focus-within:text-[var(--color-brand-accent-purple)] transition-colors" />
                 </div>
                 <input 
                   type="text" 
                   value={displayName}
                   onChange={e => setDisplayName(e.target.value)}
                   placeholder="Display Name"
                   className="w-full bg-[var(--color-brand-bg-surface)] text-[var(--color-brand-text-primary)] rounded-[22px] px-14 py-4 outline-none transition-colors border border-transparent focus:border-[var(--color-brand-border-highlight)] focus:bg-transparent text-[16px] font-medium"
                 />
              </div>

              <div className="relative group">
                 <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                   <MapPin size={20} className="text-[var(--color-brand-text-secondary)] group-focus-within:text-[var(--color-brand-accent-purple)] transition-colors" />
                 </div>
                 <input 
                   type="text" 
                   value={campusName}
                   onChange={e => setCampusName(e.target.value)}
                   placeholder="Campus Name (e.g. Stanford University)"
                   className="w-full bg-[var(--color-brand-bg-surface)] text-[var(--color-brand-text-primary)] rounded-[22px] px-14 py-4 outline-none transition-colors border border-transparent focus:border-[var(--color-brand-border-highlight)] focus:bg-transparent text-[16px] font-medium"
                 />
              </div>
          </div>
          
          <motion.button 
             whileHover={{ scale: 1.01 }}
             whileTap={{ scale: 0.98 }}
             onClick={handleSave}
             disabled={saving}
             className="w-full mt-2 bg-gradient-to-r from-[#7C3AED] to-[#4F46E5] text-white rounded-[24px] py-[18px] font-bold tracking-wide shadow-[0_0_20px_rgba(124,58,237,0.3)] hover:shadow-[0_0_30px_rgba(124,58,237,0.5)] transition-all flex items-center justify-center text-[16px]"
          >
             {saving ? (
                <div className="h-6 w-6 border-[3px] border-white/30 border-t-white rounded-full animate-spin"></div>
             ) : 'Save Changes'}
          </motion.button>
        </motion.div>

        {/* Settings Groups */}
        <motion.div 
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.2 }}
           className="space-y-4 pt-4"
        >
          <h3 className="text-[13px] font-bold uppercase tracking-[0.1em] text-[var(--color-brand-text-secondary)] ml-3">App Preferences</h3>
          
          <div className="bg-[var(--color-brand-bg-card)] rounded-[28px] border border-[var(--color-brand-divider)] shadow-sm overflow-hidden divide-y divide-[var(--color-brand-divider)] transition-colors duration-300">
            <motion.div 
              whileHover={{ opacity: 0.8 }}
              whileTap={{ opacity: 0.6 }}
              className="p-5 px-6 flex items-center justify-between cursor-pointer transition-colors"
              onClick={() => setDarkMode(!darkMode)}
            >
               <div className="flex items-center text-[var(--color-brand-text-primary)]">
                  <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mr-5">
                     {darkMode ? <Moon size={22} className="text-[#8B5CF6]" /> : <Sun size={22} className="text-amber-500" />}
                  </div>
                  <div>
                     <span className="font-semibold text-[16px] block">App Theme</span>
                     <span className="text-[13px] text-[var(--color-brand-text-secondary)] font-medium mt-0.5 block">{darkMode ? 'Dark Appearance' : 'Light Appearance'}</span>
                  </div>
               </div>
               <div className={`w-14 h-8 rounded-full p-1.5 transition-colors duration-300 ${darkMode ? 'bg-gradient-to-r from-[#7C3AED] to-[#4F46E5]' : 'bg-[var(--color-brand-text-secondary)]/50'}`}>
                  <div className={`w-5 h-5 rounded-full transition-transform duration-300 shadow-sm ${darkMode ? 'translate-x-6 bg-white' : 'translate-x-0 bg-white'}`}></div>
               </div>
            </motion.div>
            
            <motion.div 
              whileHover={{ opacity: 0.8 }}
              whileTap={{ opacity: 0.6 }}
              className="p-5 px-6 flex items-center justify-between cursor-pointer transition-colors" 
              onClick={toggleNotifications}
            >
               <div className="flex items-center text-[var(--color-brand-text-primary)]">
                  <div className="w-12 h-12 rounded-full bg-[#06B6D4]/10 flex items-center justify-center mr-5">
                     <Bell size={22} className="text-[#06B6D4]" />
                  </div>
                  <div>
                     <span className="font-semibold text-[16px] block">Push Notifications</span>
                     <span className="text-[13px] text-[var(--color-brand-text-secondary)] font-medium mt-0.5 block">{pushEnabled ? 'Enabled for important updates' : 'Muted'}</span>
                  </div>
               </div>
               <div className={`w-14 h-8 rounded-full p-1.5 transition-colors duration-300 ${pushEnabled ? 'bg-gradient-to-r from-[#06B6D4] to-[#3B82F6]' : 'bg-[var(--color-brand-text-secondary)]/50'}`}>
                  <div className={`w-5 h-5 rounded-full transition-transform duration-300 shadow-sm ${pushEnabled ? 'translate-x-6 bg-white' : 'translate-x-0 bg-white'}`}></div>
               </div>
            </motion.div>

            <motion.div 
              whileHover={{ opacity: 0.8 }}
              whileTap={{ opacity: 0.6 }}
              className="p-5 px-6 flex items-center justify-between cursor-pointer transition-colors group" 
              onClick={() => setShowPrivacyModal(true)}
            >
               <div className="flex items-center text-[var(--color-brand-text-primary)]">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mr-5">
                     <Shield size={22} className="text-emerald-500" />
                  </div>
                  <div>
                     <span className="font-semibold text-[16px] block">Privacy & Security</span>
                     <span className="text-[13px] text-[var(--color-brand-text-secondary)] font-medium mt-0.5 block">Manage your data</span>
                  </div>
               </div>
               <ChevronRight size={24} className="text-[var(--color-brand-text-secondary)] group-hover:text-[var(--color-brand-text-primary)] transition-colors" />
            </motion.div>
          </div>
        </motion.div>

        {/* Danger Zone */}
        <motion.div 
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.3 }}
           className="pt-6"
        >
           <button 
             onClick={handleSignOut}
             className="w-full flex items-center justify-center bg-red-500/10 text-red-500 rounded-[24px] py-[18px] font-bold tracking-wide hover:bg-red-500/20 active:scale-[0.98] transition-all border border-red-500/20 text-[16px]"
           >
             <LogOut size={20} className="mr-3" /> Sign Out
           </button>
        </motion.div>
      </div>

      {/* Save Success Toast */}
      <AnimatePresence>
         {showSaveToast && (
            <motion.div 
              initial={{ opacity: 0, y: 100, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 100, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-[var(--color-brand-bg-card)] border border-[var(--color-brand-divider)] text-[var(--color-brand-text-primary)] px-6 py-4 rounded-full flex items-center shadow-2xl z-50 min-w-[280px] backdrop-blur-xl"
            >
               <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center mr-4">
                 <BadgeCheck size={18} className="text-emerald-500" />
               </div>
               <span className="font-semibold text-[15px]">Profile Updated Successfully</span>
            </motion.div>
         )}
      </AnimatePresence>

      <AnimatePresence>
         {showPrivacyModal && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-4"
              onClick={() => setShowPrivacyModal(false)}
            >
               <motion.div 
                 initial={{ y: "100%" }}
                 animate={{ y: 0 }}
                 exit={{ y: "100%" }}
                 transition={{ type: "spring", damping: 25, stiffness: 300 }}
                 onClick={e => e.stopPropagation()}
                 className="w-full bg-[var(--color-brand-bg-primary)] rounded-t-3xl sm:rounded-3xl p-6 sm:max-w-md shadow-[0_-20px_50px_rgba(0,0,0,0.5)] border border-[var(--color-brand-divider)]"
               >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-[var(--color-brand-text-primary)]">Privacy & Security</h3>
                    <button onClick={() => setShowPrivacyModal(false)} className="text-[var(--color-brand-text-secondary)] hover:text-[var(--color-brand-text-primary)] transition-colors">✕</button>
                  </div>
                  <p className="text-[var(--color-brand-text-secondary)] mb-6 text-sm">
                    Manage your data visibility. These settings will control who can see your campus activity.
                  </p>
                  
                  <div className="space-y-4">
                     <motion.div 
                        whileHover={{ opacity: 0.8 }}
                        whileTap={{ opacity: 0.6 }}
                        onClick={toggleActivityStatus}
                        className="flex items-center justify-between p-4 bg-[var(--color-brand-bg-card)] rounded-2xl border border-[var(--color-brand-divider)] cursor-pointer transition-colors"
                     >
                        <div>
                           <p className="font-semibold text-[var(--color-brand-text-primary)]">Show Activity Status</p>
                           <p className="text-xs text-[var(--color-brand-text-secondary)]">Let others see when you're online</p>
                        </div>
                        <div className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${showActivity ? 'bg-gradient-to-r from-[#7C3AED] to-[#4F46E5]' : 'bg-gray-400'}`}>
                           <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ${showActivity ? 'translate-x-6' : 'translate-x-0'}`}></div>
                        </div>
                     </motion.div>
                     
                     <motion.div 
                        whileHover={{ opacity: 0.8 }}
                        whileTap={{ opacity: 0.6 }}
                        onClick={togglePublicProfile}
                        className="flex items-center justify-between p-4 bg-[var(--color-brand-bg-card)] rounded-2xl border border-[var(--color-brand-divider)] cursor-pointer transition-colors"
                     >
                        <div>
                           <p className="font-semibold text-[var(--color-brand-text-primary)]">Public Profile</p>
                           <p className="text-xs text-[var(--color-brand-text-secondary)]">Allow discovery in campus search</p>
                        </div>
                        <div className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${publicProfile ? 'bg-gradient-to-r from-[#7C3AED] to-[#4F46E5]' : 'bg-gray-400'}`}>
                           <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ${publicProfile ? 'translate-x-6' : 'translate-x-0'}`}></div>
                        </div>
                     </motion.div>
                  </div>
                  
                  <button 
                    onClick={() => setShowPrivacyModal(false)}
                    className="w-full mt-6 bg-[var(--color-brand-bg-surface)] text-[var(--color-brand-text-primary)] py-3 rounded-full font-bold hover:bg-[var(--color-brand-divider)] transition-colors"
                  >
                     Done
                  </button>
               </motion.div>
            </motion.div>
         )}
      </AnimatePresence>
    </div>
  );
}

