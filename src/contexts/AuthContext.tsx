import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface UserProfile {
  uid: string;
  isAnonymous: boolean;
  displayName?: string;
  campusName?: string;
  avatarUrl?: string;
  fcmToken?: string | null;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, profile: null, loading: true });

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Fetch or create profile
        const profileRef = doc(db, 'users', currentUser.uid);
        const profileSnap = await getDoc(profileRef);
        
        let currentProfile: UserProfile;
        if (profileSnap.exists()) {
          currentProfile = profileSnap.data() as UserProfile;
        } else {
          // Initialize logic
          currentProfile = {
            uid: currentUser.uid,
            isAnonymous: currentUser.isAnonymous,
            displayName: currentUser.displayName || `User_${Math.floor(Math.random() * 10000)}`,
          };
          if (currentUser.photoURL) {
            currentProfile.avatarUrl = currentUser.photoURL;
          }
          await setDoc(profileRef, currentProfile, { merge: true });
        }
        setProfile(currentProfile);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return <AuthContext.Provider value={{ user, profile, loading }}>{children}</AuthContext.Provider>;
};
