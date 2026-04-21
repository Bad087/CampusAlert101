import React, { useState } from 'react';
import { auth } from '../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Treat any string as a valid username by appending a fake domain if missing
    const finalEmail = email.includes('@') ? email.trim() : `${email.replace(/\\s+/g, '')}@campusalert.local`;

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, finalEmail, password);
      } else {
        await createUserWithEmailAndPassword(auth, finalEmail, password);
      }
      navigate('/app');
    } catch (err: any) {
      if (err.code === 'auth/operation-not-allowed') {
         setError('Email/Password login is not enabled in your backend. \\n\\nPlease go to Firebase Console -> Authentication -> Sign-in methods -> Enable "Email/Password".');
      } else if (err.code === 'auth/invalid-email') {
         setError('Please enter a valid format for email/username.');
      } else {
         setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      navigate('/app');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-brand-bg-primary)] flex flex-col justify-end">
      {/* Background decoration */}
      <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-[var(--color-brand-accent-purple)]/20 to-transparent pointer-events-none" />

      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="bg-[var(--color-brand-bg-card)] rounded-t-3xl p-6 sm:p-8 w-full max-w-md mx-auto shadow-2xl relative z-10"
      >
        <h2 className="text-2xl font-semibold text-white mb-6">
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </h2>

        {error && (
          <div className="p-3 mb-4 text-sm text-red-200 bg-red-900/50 rounded-lg whitespace-pre-wrap">
            {error}
          </div>
        )}

        <form onSubmit={handleEmailAuth} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-brand-text-secondary)] mb-1">Username or Email</label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-[var(--color-brand-bg-surface)] text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[var(--color-brand-accent-purple)] transition-all"
              placeholder="e.g. janesmith or test@test.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-brand-text-secondary)] mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-[var(--color-brand-bg-surface)] text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[var(--color-brand-accent-purple)] transition-all"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-brand-text-secondary)] hover:text-white"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[var(--color-brand-accent-purple)] text-white font-medium rounded-xl py-3 mt-2 hover:bg-opacity-90 transition flex justify-center items-center h-12"
          >
            {loading ? <Loader2 className="animate-spin" /> : (isLogin ? 'Sign In' : 'Sign Up')}
          </button>
        </form>

        <div className="mt-6 flex items-center gap-4">
          <div className="flex-1 h-px bg-[var(--color-brand-divider)]" />
          <span className="text-sm text-[var(--color-brand-text-secondary)]">or</span>
          <div className="flex-1 h-px bg-[var(--color-brand-divider)]" />
        </div>

        <button
          onClick={handleGoogleAuth}
          disabled={loading}
          className="w-full mt-6 flex items-center justify-center bg-[var(--color-brand-bg-surface)] text-white font-medium rounded-xl py-3 border border-[var(--color-brand-divider)] hover:bg-[var(--color-brand-divider)] transition"
        >
          <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continue with Google
        </button>

        <p className="mt-6 text-center text-sm text-[var(--color-brand-text-secondary)]">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-[var(--color-brand-accent-cyan)] font-medium hover:underline"
          >
            {isLogin ? 'Sign up' : 'Log in'}
          </button>
        </p>
      </motion.div>
    </div>
  );
}
