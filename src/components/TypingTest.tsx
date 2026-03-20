import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCcw, Timer, Zap, Target, AlertCircle, Trophy, ArrowRight, X } from 'lucide-react';
import { getRandomText } from '../constants';
import { TestDuration, TestState, TestResult } from '../types';
import { db, auth } from '../firebase';
import { collection, addDoc, serverTimestamp, doc, getDoc, updateDoc, increment, setDoc } from 'firebase/firestore';
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

interface TypingTestProps {
  onComplete?: (result: TestResult) => void;
}

export default function TypingTest({ onComplete }: TypingTestProps) {
  const [text, setText] = useState(getRandomText());
  const [userInput, setUserInput] = useState('');
  const [duration, setDuration] = useState<TestDuration>(30);
  const [letterMode, setLetterMode] = useState<'small' | 'mixed'>('small');
  const [timeLeft, setTimeLeft] = useState<number>(duration);
  const [testState, setTestState] = useState<TestState>('idle');
  const [stats, setStats] = useState({
    wpm: 0,
    accuracy: 0,
    correct: 0,
    incorrect: 0,
    total: 0,
  });

  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const resetTest = useCallback(() => {
    const rawText = getRandomText();
    let processedText = rawText;
    
    if (letterMode === 'small') {
      processedText = rawText.toLowerCase().replace(/[^a-z\s]/g, '').replace(/\s+/g, ' ').trim();
    }
    
    setText(processedText);
    setUserInput('');
    setTimeLeft(duration);
    setTestState('idle');
    setStats({ wpm: 0, accuracy: 0, correct: 0, incorrect: 0, total: 0 });
    if (timerRef.current) clearInterval(timerRef.current);
    inputRef.current?.focus();
  }, [duration, letterMode]);

  useEffect(() => {
    resetTest();
  }, [duration, letterMode, resetTest]);

  const startTest = () => {
    if (testState !== 'idle') return;
    setTestState('running');
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0) return 0;
        return prev - 1;
      });
    }, 1000);
  };

  const finishTest = useCallback(async () => {
    setTestState('finished');
    if (timerRef.current) clearInterval(timerRef.current);

    const timeSpent = duration - timeLeft;
    const wordsTyped = stats.correct / 5;
    const wpm = Math.round((wordsTyped / (timeSpent || 1)) * 60);
    const accuracy = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;

    const result: TestResult = {
      userId: auth.currentUser?.uid || 'anonymous',
      displayName: auth.currentUser?.displayName || 'Anonymous',
      wpm,
      accuracy,
      correctChars: stats.correct,
      incorrectChars: stats.incorrect,
      totalChars: stats.total,
      duration,
      timestamp: new Date().toISOString(),
    };

    if (auth.currentUser) {
      const resultsPath = 'testResults';
      try {
        // 1. Add to test results (Overwrite latest)
        await setDoc(doc(db, resultsPath, `latest_${auth.currentUser.uid}`), {
          ...result,
          timestamp: serverTimestamp(),
        });

        // 2. Update User Profile and Leaderboard
        const userRef = doc(db, 'users', auth.currentUser.uid);
        const leaderboardRef = doc(db, 'leaderboard', auth.currentUser.uid);
        
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          const userData = userSnap.data();
          const currentTotalTests = userData.totalTests || 0;
          const currentAverageWpm = userData.averageWpm || 0;
          
          const newTotalTests = currentTotalTests + 1;
          const newAverageWpm = Math.round((currentAverageWpm * currentTotalTests + wpm) / newTotalTests);
          const newBestWpm = Math.max(userData.bestWpm || 0, wpm);
          const newBestAccuracy = Math.max(userData.bestAccuracy || 0, accuracy);

          const updateData = {
            bestWpm: newBestWpm,
            bestAccuracy: newBestAccuracy,
            totalTests: newTotalTests,
            averageWpm: newAverageWpm,
            lastActive: serverTimestamp()
          };

          await updateDoc(userRef, updateData);

          // Update Leaderboard with the same data
          await setDoc(leaderboardRef, {
            uid: auth.currentUser.uid,
            displayName: userData.displayName || auth.currentUser.displayName || 'Anonymous',
            bestWpm: newBestWpm,
            bestAccuracy: newBestAccuracy,
            totalTests: newTotalTests,
            lastActive: serverTimestamp()
          }, { merge: true });
        } else {
          // If user doc doesn't exist, create it
          const initialData = {
            uid: auth.currentUser.uid,
            displayName: auth.currentUser.displayName || 'Anonymous',
            email: auth.currentUser.email || '',
            bestWpm: wpm,
            bestAccuracy: accuracy,
            totalTests: 1,
            averageWpm: wpm,
            createdAt: serverTimestamp(),
            lastActive: serverTimestamp(),
            role: 'user'
          };
          await setDoc(userRef, initialData);
          
          // Initial Leaderboard entry
          await setDoc(leaderboardRef, {
            uid: auth.currentUser.uid,
            displayName: auth.currentUser.displayName || 'Anonymous',
            bestWpm: wpm,
            bestAccuracy: accuracy,
            totalTests: 1,
            lastActive: serverTimestamp()
          });
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, resultsPath);
      }
    }

    onComplete?.(result);
  }, [duration, timeLeft, stats, onComplete]);

  useEffect(() => {
    if (timeLeft === 0 && testState === 'running') {
      finishTest();
    }
  }, [timeLeft, testState, finishTest]);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (testState === 'finished') return;
    if (testState === 'idle') startTest();

    setUserInput(value);

    // Calculate stats
    let correct = 0;
    let incorrect = 0;
    const currentText = text.split('');
    const currentInput = value.split('');

    currentInput.forEach((char, i) => {
      if (char === currentText[i]) {
        correct++;
      } else {
        incorrect++;
      }
    });

    setStats({
      correct,
      incorrect,
      total: value.length,
      wpm: Math.round(((correct / 5) / ((duration - timeLeft) || 1)) * 60),
      accuracy: value.length > 0 ? Math.round((correct / value.length) * 100) : 0,
    });

    if (value.length === text.length) {
      const rawNextText = getRandomText();
      let processedNextText = rawNextText;
      
      if (letterMode === 'small') {
        processedNextText = rawNextText.toLowerCase().replace(/[^a-z\s]/g, '').replace(/\s+/g, ' ').trim();
      }
      
      setText(prev => prev + " " + processedNextText);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 hero-gradient min-h-screen">
      {/* Header / Controls */}
      <div className="dark-hero-card p-12 md:p-20 mb-12 flex flex-col items-start justify-center min-h-[400px]">
        <div className="absolute inset-0 opacity-40">
          <img 
            src="https://picsum.photos/seed/keyboard/1920/1080" 
            alt="Hero Background" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />
        </div>

        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/20 rounded-full border border-primary/30 mb-6">
            <span className="text-[10px] uppercase tracking-[0.2em] font-black text-primary">Master the Art of Speed</span>
          </div>
          <h2 className="text-6xl md:text-8xl font-black text-white mb-8 tracking-tighter leading-[0.9]">
            Type. Race.<br />Conquer.
          </h2>
          <p className="text-zinc-400 text-lg mb-10 max-w-md leading-relaxed">
            Push your limits, improve your accuracy, and join the elite ranks of the world's fastest typists.
          </p>
          
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md p-1.5 rounded-full border border-white/10">
              {[30, 60].map((d) => (
                <button
                  key={d}
                  onClick={() => setDuration(d as TestDuration)}
                  className={cn(
                    "px-8 py-2.5 rounded-full text-[11px] font-bold transition-all duration-300 whitespace-nowrap",
                    duration === d 
                      ? "bg-primary text-white shadow-lg shadow-primary/20" 
                      : "text-zinc-400 hover:text-white"
                  )}
                >
                  {d} Seconds
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md p-1.5 rounded-full border border-white/10">
              <button
                onClick={() => setLetterMode('small')}
                className={cn(
                  "px-8 py-2.5 rounded-full text-[11px] font-bold transition-all duration-300 whitespace-nowrap",
                  letterMode === 'small'
                    ? "bg-primary text-white shadow-lg shadow-primary/20"
                    : "text-zinc-400 hover:text-white"
                )}
              >
                Small Letters
              </button>
              <button
                onClick={() => setLetterMode('mixed')}
                className={cn(
                  "px-8 py-2.5 rounded-full text-[11px] font-bold transition-all duration-300 whitespace-nowrap",
                  letterMode === 'mixed'
                    ? "bg-primary text-white shadow-lg shadow-primary/20"
                    : "text-zinc-400 hover:text-white"
                )}
              >
                Mixed Letters
              </button>
            </div>

            <button 
              onClick={resetTest}
              className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all shrink-0"
            >
              <RefreshCcw className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <StatItem label="Time Left" value={`${timeLeft}s`} icon={<Timer className="w-5 h-5" />} />
        <StatItem label="Current WPM" value={stats.wpm} icon={<Zap className="w-5 h-5" />} />
        <StatItem label="Accuracy" value={`${stats.accuracy}%`} icon={<Target className="w-5 h-5" />} />
      </div>

      {/* Typing Area */}
      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative"
      >
        <div 
          className="glass-card p-12 md:p-20 min-h-[350px] cursor-text transition-all duration-700"
          onClick={() => inputRef.current?.focus()}
        >
          <div className="text-3xl md:text-4xl leading-[1.6] font-medium tracking-tight select-none text-left max-w-4xl mx-auto">
            {text.split('').map((char, i) => {
              let color = "text-zinc-300 dark:text-zinc-600";
              let decoration = "";

              if (i < userInput.length) {
                color = userInput[i] === char ? "text-black dark:text-white font-bold" : "text-red-500 dark:text-red-400 underline decoration-2 underline-offset-8";
              } else if (i === userInput.length) {
                color = "text-primary";
                decoration = "border-b-4 border-primary animate-pulse";
              }

              return (
                <span key={i} className={cn(color, decoration, "transition-all duration-200")}>
                  {char}
                </span>
              );
            })}
          </div>
        </div>

        <input
          ref={inputRef}
          type="text"
          value={userInput}
          onChange={handleInput}
          onPaste={(e) => e.preventDefault()}
          className="absolute inset-0 opacity-0 cursor-default"
          autoFocus
          disabled={testState === 'finished'}
        />

        <AnimatePresence>
          {testState === 'idle' && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
              <div className="flex items-center gap-4 px-8 py-4 bg-primary/90 backdrop-blur-xl rounded-full text-white font-bold uppercase tracking-[0.2em] text-[11px] shadow-xl shadow-primary/20">
                <Zap className="w-4 h-4 animate-bounce" />
                Start typing to begin
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Results Modal */}
      <AnimatePresence>
        {testState === 'finished' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="glass-card p-12 max-w-2xl w-full text-center relative"
            >
              <button 
                onClick={resetTest}
                className="absolute top-8 right-8 p-2 text-zinc-400 hover:text-black dark:hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-8">
                <Trophy className="w-10 h-10 text-primary" />
              </div>
              
              <h3 className="text-4xl font-black text-black dark:text-white mb-2 tracking-tighter">Test Complete!</h3>
              <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs mb-12">You've leveled up your typing mastery</p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
                <ResultCard label="WPM" value={stats.wpm} />
                <ResultCard label="Accuracy" value={`${stats.accuracy}%`} />
                <ResultCard label="Mistakes" value={stats.incorrect} />
                <ResultCard label="Correct" value={stats.correct} />
              </div>

              <div className="flex gap-4">
                <button
                  onClick={resetTest}
                  className="btn-primary flex-1"
                >
                  Try Again
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatItem({ label, value, icon }: { label: string, value: string | number, icon: React.ReactNode }) {
  return (
    <div className="stat-card flex flex-col items-start gap-4">
      <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
        {icon}
      </div>
      <div>
        <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-1 block">{label}</span>
        <span className="text-4xl font-black text-black dark:text-white tracking-tighter">{value}</span>
      </div>
    </div>
  );
}

function ResultCard({ label, value }: { label: string, value: string | number }) {
  return (
    <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-3xl p-6 flex flex-col items-center gap-1 border border-zinc-100 dark:border-zinc-800">
      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{label}</span>
      <span className="text-3xl font-black text-black dark:text-white tracking-tighter">{value}</span>
    </div>
  );
}
