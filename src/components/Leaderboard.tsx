import { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, query, orderBy, limit, onSnapshot, where, getCountFromServer, doc } from 'firebase/firestore';
import { Trophy, Medal, Zap, Target, User as UserIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile } from '../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Leaderboard() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [userBestWpm, setUserBestWpm] = useState<number | null>(null);

  useEffect(() => {
    const q = query(
      collection(db, 'leaderboard'),
      orderBy('bestWpm', 'desc'),
      limit(10)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => {
        const docData = doc.data();
        return {
          uid: doc.id,
          ...docData
        };
      }) as any[];
      setUsers(data);
      setLoading(false);
    }, (error) => {
      console.error('Leaderboard error:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!auth.currentUser) return;

    const unsubscribe = onSnapshot(doc(db, 'leaderboard', auth.currentUser.uid), async (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        const wpm = data.bestWpm || 0;
        setUserBestWpm(wpm);

        // Count users with higher WPM
        const rankQuery = query(
          collection(db, 'leaderboard'),
          where('bestWpm', '>', wpm)
        );
        try {
          const countSnapshot = await getCountFromServer(rankQuery);
          setUserRank(countSnapshot.data().count + 1);
        } catch (error) {
          console.error('Error fetching user rank:', error);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const currentUser = auth.currentUser;
  const isUserInTop10 = users.some(u => u.uid === currentUser?.uid);

  const getOrdinal = (n: number) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 neumorphic rounded-full flex items-center justify-center animate-spin">
          <div className="w-6 h-6 border-2 border-black dark:border-white border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 hero-gradient min-h-screen">
      <div className="flex flex-col items-center mb-16 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/20 rounded-full border border-primary/30 mb-6">
          <Trophy className="w-3 h-3 text-primary" />
          <span className="text-[10px] uppercase tracking-[0.2em] font-black text-primary">Global Ranking</span>
        </div>
        <h2 className="text-6xl md:text-8xl font-black text-black dark:text-white mb-4 tracking-tighter leading-none">Top Performers</h2>
        <p className="text-zinc-500 font-bold uppercase tracking-[0.2em] text-xs">The fastest typists in the world</p>
      </div>

      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {users.map((user, index) => (
            <motion.div
              key={user.uid}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={cn(
                "glass-card p-8 flex items-center justify-between group transition-all duration-500 hover:border-primary/30",
                index === 0 && "border-primary/40 bg-primary/5",
                user.uid === currentUser?.uid && "border-primary/60 bg-primary/10 shadow-lg shadow-primary/5"
              )}
            >
              <div className="flex items-center gap-8">
                <div className="w-20 h-20 rounded-2xl bg-zinc-100 dark:bg-zinc-800/50 flex flex-col items-center justify-center font-black text-black dark:text-white">
                  {index < 3 ? (
                    <div className="flex flex-col items-center">
                      <Medal className={cn(
                        "w-8 h-8 mb-1",
                        index === 0 ? "text-yellow-500" : index === 1 ? "text-zinc-400" : "text-amber-600"
                      )} />
                      <span className="text-[10px] uppercase tracking-widest opacity-50">{getOrdinal(index + 1)}</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <span className="text-2xl tracking-tighter">#{index + 1}</span>
                      <span className="text-[8px] uppercase tracking-widest opacity-50">{getOrdinal(index + 1)}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-xl border-2 border-primary/20">
                    {user.displayName?.[0] || 'U'}
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-black dark:text-white tracking-tighter mb-1">
                      {user.displayName || 'Anonymous User'}
                      {user.uid === currentUser?.uid && (
                        <span className="ml-3 text-[9px] bg-primary text-white px-2 py-0.5 rounded-full uppercase tracking-widest">You</span>
                      )}
                    </h3>
                    <span className="text-[10px] uppercase tracking-[0.2em] font-black text-zinc-500">
                      {user.totalTests || 0} tests completed
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-12">
                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-2 text-black dark:text-white">
                    <Zap className="w-5 h-5 text-primary" />
                    <span className="text-3xl font-black tracking-tighter">{user.bestWpm || 0}</span>
                  </div>
                  <span className="text-[10px] uppercase tracking-[0.2em] font-black text-zinc-400">Best WPM</span>
                </div>

                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-2 text-black dark:text-white">
                    <Target className="w-5 h-5 text-primary" />
                    <span className="text-3xl font-black tracking-tighter">{user.bestAccuracy || 0}%</span>
                  </div>
                  <span className="text-[10px] uppercase tracking-[0.2em] font-black text-zinc-400">Accuracy</span>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {currentUser && !isUserInTop10 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-12 pt-12 border-t border-zinc-200 dark:border-zinc-800"
          >
            <div className="text-center mb-8">
              <span className="text-[10px] uppercase tracking-[0.3em] font-black text-zinc-400">Your Current Standing</span>
            </div>
            <div className="glass-card p-8 flex items-center justify-between border-primary/40 bg-primary/5">
              <div className="flex items-center gap-8">
                <div className="w-20 h-20 rounded-2xl bg-primary/10 flex flex-col items-center justify-center font-black text-primary">
                  <span className="text-2xl tracking-tighter">#{userRank || '?'}</span>
                  <span className="text-[10px] uppercase tracking-widest opacity-70">Global</span>
                </div>

                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center text-primary font-black text-xl border-2 border-primary/30">
                    {currentUser.displayName?.[0] || 'U'}
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-black dark:text-white tracking-tighter mb-1">
                      {currentUser.displayName || 'Anonymous User'}
                      <span className="ml-3 text-[9px] bg-primary text-white px-2 py-0.5 rounded-full uppercase tracking-widest">You</span>
                    </h3>
                    <p className="text-[10px] uppercase tracking-[0.2em] font-black text-zinc-500">
                      Keep typing to climb the ranks!
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-12">
                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-2 text-black dark:text-white">
                    <Zap className="w-5 h-5 text-primary" />
                    <span className="text-3xl font-black tracking-tighter">{userBestWpm || 0}</span>
                  </div>
                  <span className="text-[10px] uppercase tracking-[0.2em] font-black text-zinc-400">Your Best</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
