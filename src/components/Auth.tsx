import { useState } from 'react';
import { auth, db } from '../firebase';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { motion } from 'motion/react';
import { Keyboard, LogIn, UserPlus, Github, Chrome } from 'lucide-react';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    const provider = new GoogleAuthProvider();

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if user exists in Firestore
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        const initialData = {
          uid: user.uid,
          displayName: user.displayName || 'Anonymous',
          email: user.email,
          bestWpm: 0,
          bestAccuracy: 0,
          averageWpm: 0,
          totalTests: 0,
          createdAt: serverTimestamp(),
          lastActive: serverTimestamp(),
          role: 'user'
        };
        await setDoc(userRef, initialData);

        // Also create initial leaderboard entry
        const leaderboardRef = doc(db, 'leaderboard', user.uid);
        await setDoc(leaderboardRef, {
          uid: user.uid,
          displayName: user.displayName || 'Anonymous',
          bestWpm: 0,
          bestAccuracy: 0,
          totalTests: 0,
          lastActive: serverTimestamp()
        });
      } else {
        // Update lastActive for existing users
        await setDoc(userRef, { lastActive: serverTimestamp() }, { merge: true });
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      let message = err.message;
      if (err.code === 'auth/network-request-failed') {
        message = 'Network error: Please check your internet connection and ensure your browser allows popups and third-party cookies for this site.';
      } else if (err.code === 'auth/popup-blocked') {
        message = 'Popup blocked: Please allow popups for this site to sign in with Google.';
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6 hero-gradient">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="max-w-md w-full"
      >
        <div className="glass-card p-16 text-center">
          <div className="w-24 h-24 bg-primary/10 rounded-[2rem] flex items-center justify-center mx-auto mb-10 border-2 border-primary/20">
            <Keyboard className="w-10 h-10 text-primary" />
          </div>

          <h1 className="text-5xl font-black text-black dark:text-white mb-4 tracking-tighter">Welcome</h1>
          <p className="text-zinc-500 font-bold uppercase tracking-[0.2em] text-[10px] mb-12">Sign in to track your progress</p>

          {error && (
            <div className="mb-10 p-5 bg-red-500/10 rounded-3xl text-red-500 text-xs font-bold uppercase tracking-widest border border-red-500/20">
              {error}
            </div>
          )}

          <div className="space-y-6">
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="btn-primary w-full py-5"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Chrome className="w-5 h-5" />
                  Continue with Google
                </>
              )}
            </button>
            
            <p className="text-[10px] uppercase tracking-[0.2em] font-black text-zinc-500 mt-12 opacity-50">
              By continuing, you agree to our terms.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
