import { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, query, where, orderBy, limit, onSnapshot, doc, updateDoc, setDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { UserProfile, TestResult } from '../types';
import { Zap, Target, History, Trophy, TrendingUp, Calendar, Edit2, Check, X } from 'lucide-react';
import { motion } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export default function Dashboard() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [history, setHistory] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [rank, setRank] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (!auth.currentUser) return;
    setNewName(auth.currentUser.displayName || '');

    const userPath = `users/${auth.currentUser.uid}`;
    const resultsPath = 'testResults';

    // Real-time Profile
    const unsubscribeProfile = onSnapshot(doc(db, 'users', auth.currentUser.uid), (doc) => {
      if (doc.exists()) {
        setProfile(doc.data() as UserProfile);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, userPath);
    });

    // Real-time History
    const q = query(
      collection(db, resultsPath),
      where('userId', '==', auth.currentUser.uid),
      limit(20)
    );

    const unsubscribeHistory = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as TestResult[];
      
      // Sort client-side to avoid composite index requirement
      const sortedData = data.sort((a, b) => {
        const parseDate = (ts: any) => {
          if (!ts) return 0;
          if (typeof ts === 'object' && ts.seconds) return ts.seconds * 1000;
          return new Date(ts).getTime();
        };
        return parseDate(b.timestamp) - parseDate(a.timestamp);
      });

      setHistory(sortedData.slice(0, 1));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, resultsPath);
    });

    // Fetch Rank
    const leaderboardQuery = query(
      collection(db, 'leaderboard'),
      orderBy('bestWpm', 'desc')
    );

    const unsubscribeRank = onSnapshot(leaderboardQuery, (snapshot) => {
      const leaderboardData = snapshot.docs.map(doc => doc.data());
      const userIndex = leaderboardData.findIndex(u => u.uid === auth.currentUser?.uid);
      if (userIndex !== -1) {
        setRank(userIndex + 1);
      }
    });

    return () => {
      unsubscribeProfile();
      unsubscribeHistory();
      unsubscribeRank();
    };
  }, []);

  const getOrdinal = (n: number) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  const handleUpdateName = async () => {
    if (!auth.currentUser || !newName.trim() || newName === profile?.displayName) {
      setIsEditing(false);
      return;
    }

    setIsUpdating(true);
    try {
      // 1. Update Firebase Auth
      await updateProfile(auth.currentUser, {
        displayName: newName.trim()
      });

      // 2. Update Firestore Users collection
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, {
        displayName: newName.trim()
      });

      // 3. Update Leaderboard collection
      const leaderboardRef = doc(db, 'leaderboard', auth.currentUser.uid);
      await setDoc(leaderboardRef, {
        displayName: newName.trim()
      }, { merge: true });

      setIsEditing(false);
    } catch (error) {
      console.error('Error updating name:', error);
    } finally {
      setIsUpdating(false);
    }
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
    <div className="max-w-6xl mx-auto px-6 py-12 hero-gradient min-h-screen">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Sidebar */}
        <div className="lg:col-span-1 space-y-8">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-card p-10 text-center"
          >
            <div className="relative inline-block mb-8">
              <div className="w-32 h-32 mx-auto rounded-full bg-primary/10 flex items-center justify-center text-5xl font-black text-primary border-4 border-primary/20">
                {profile?.displayName?.[0] || 'U'}
              </div>
              <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white shadow-lg shadow-primary/30">
                <Trophy className="w-5 h-5" />
              </div>
            </div>
            
            <div className="flex flex-col items-center">
              {isEditing ? (
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="bg-zinc-100 dark:bg-zinc-800/50 border-none rounded-xl px-4 py-2 text-xl font-black text-black dark:text-white focus:outline-none w-full max-w-[200px]"
                    autoFocus
                  />
                  <button
                    onClick={handleUpdateName}
                    disabled={isUpdating}
                    className="p-2 bg-primary/10 rounded-xl text-primary hover:scale-110 transition-transform disabled:opacity-50"
                  >
                    <Check className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setNewName(profile?.displayName || '');
                    }}
                    className="p-2 bg-red-500/10 rounded-xl text-red-500 hover:scale-110 transition-transform"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3 mb-2 group">
                  <h2 className="text-3xl font-black text-black dark:text-white tracking-tighter">
                    {profile?.displayName}
                  </h2>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-2 bg-zinc-100 dark:bg-zinc-800/50 rounded-xl text-zinc-400 opacity-0 group-hover:opacity-100 hover:text-primary transition-all"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-10">{profile?.email}</p>

            <div className="grid grid-cols-3 gap-4">
              <div className="bg-zinc-50 dark:bg-zinc-800/30 rounded-2xl p-4 border border-zinc-100 dark:border-zinc-800">
                <span className="block text-[9px] uppercase tracking-[0.2em] font-black text-zinc-400 mb-1">Tests</span>
                <span className="text-xl font-black text-black dark:text-white tracking-tighter">{profile?.totalTests || 0}</span>
              </div>
              <div className="bg-zinc-50 dark:bg-zinc-800/30 rounded-2xl p-4 border border-zinc-100 dark:border-zinc-800">
                <span className="block text-[9px] uppercase tracking-[0.2em] font-black text-zinc-400 mb-1">Best WPM</span>
                <span className="text-xl font-black text-black dark:text-white tracking-tighter">{profile?.bestWpm || 0}</span>
              </div>
              <div className="bg-zinc-50 dark:bg-zinc-800/30 rounded-2xl p-4 border border-zinc-100 dark:border-zinc-800">
                <span className="block text-[9px] uppercase tracking-[0.2em] font-black text-zinc-400 mb-1">Rank</span>
                <span className="text-xl font-black text-black dark:text-white tracking-tighter">
                  {rank ? getOrdinal(rank) : 'N/A'}
                </span>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: -0 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-10"
          >
            <h3 className="text-[11px] font-black text-zinc-400 uppercase tracking-[0.3em] mb-10 flex items-center gap-3">
              <TrendingUp className="w-4 h-4 text-primary" />
              Performance Stats
            </h3>
            <div className="space-y-8">
              <StatRow label="Average WPM" value={profile?.averageWpm || 0} icon={<Zap className="w-4 h-4" />} />
              <StatRow label="Highest Accuracy" value={`${profile?.bestAccuracy || 0}%`} icon={<Target className="w-4 h-4" />} />
              <StatRow label="Member Since" value={profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'N/A'} icon={<Calendar className="w-4 h-4" />} />
            </div>
          </motion.div>
        </div>

        {/* History Main */}
        <div className="lg:col-span-2 space-y-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-4xl font-black text-black dark:text-white tracking-tighter flex items-center gap-4">
              <History className="w-8 h-8 text-primary" />
              Recent Activity
            </h2>
          </div>

          <div className="space-y-4">
            {history.length > 0 ? (
              history.map((test, index) => (
                <motion.div
                  key={test.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="glass-card p-8 flex items-center justify-between group transition-all duration-500 hover:border-primary/30"
                >
                  <div className="flex items-center gap-8">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                      <Zap className="w-7 h-7" />
                    </div>
                    <div>
                      <div className="flex items-center gap-4 mb-1">
                        <span className="text-3xl font-black text-black dark:text-white tracking-tighter">{test.wpm} WPM</span>
                        <span className="px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                          {test.duration}s
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                        {new Date(test.timestamp).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-12">
                    <div className="flex flex-col items-end">
                      <span className="text-2xl font-black text-black dark:text-white tracking-tighter">{test.accuracy}%</span>
                      <span className="text-[10px] uppercase tracking-[0.2em] font-black text-zinc-400">Accuracy</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-2xl font-black text-black dark:text-white tracking-tighter">{test.correctChars}</span>
                      <span className="text-[10px] uppercase tracking-[0.2em] font-black text-zinc-400">Correct</span>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="glass-card p-20 text-center border-dashed">
                <Trophy className="w-16 h-16 text-zinc-200 dark:text-zinc-800 mx-auto mb-6" />
                <p className="text-zinc-400 font-bold uppercase tracking-widest text-xs">No tests completed yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatRow({ label, value, icon }: { label: string, value: string | number, icon: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between group">
      <div className="flex items-center gap-4 text-zinc-500 group-hover:text-primary transition-colors">
        <div className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800/50 rounded-full flex items-center justify-center">
          {icon}
        </div>
        <span className="text-xs font-bold uppercase tracking-widest">{label}</span>
      </div>
      <span className="text-lg font-black text-black dark:text-white tracking-tighter">{value}</span>
    </div>
  );
}
