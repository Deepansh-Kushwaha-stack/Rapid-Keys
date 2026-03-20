import { useState, useEffect, Component, ErrorInfo, ReactNode } from 'react';
import { auth } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import Navbar from './components/Navbar';
import TypingTest from './components/TypingTest';
import Leaderboard from './components/Leaderboard';
import Dashboard from './components/Dashboard';
import Auth from './components/Auth';
import AboutOwner from './components/AboutOwner';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

// Error Boundary Component
class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean, error: any }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-soft-bg flex items-center justify-center p-6 text-center hero-gradient">
          <div className="max-w-md glass-card p-16">
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-10">
              <AlertTriangle className="w-10 h-10 text-red-500" />
            </div>
            <h1 className="text-4xl font-black text-black dark:text-white mb-4 tracking-tighter">Something went wrong</h1>
            <p className="text-zinc-500 font-bold uppercase tracking-[0.2em] text-[10px] mb-12">
              {this.state.error?.message || "An unexpected error occurred. Please try refreshing the page."}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="btn-primary flex items-center gap-3 px-10 py-4 mx-auto"
            >
              <RefreshCcw className="w-4 h-4" />
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('test');
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved === 'dark' || saved === 'light') return saved;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'dark';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    root.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
      if (user && activeTab === 'auth') {
        setActiveTab('test');
      }
    });

    return () => unsubscribe();
  }, [activeTab]);

  if (loading) {
    return (
      <div className="min-h-screen bg-soft-bg flex items-center justify-center hero-gradient">
        <div className="w-24 h-24 bg-primary/10 rounded-[2rem] flex items-center justify-center animate-spin border-2 border-primary/20">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className={`min-h-screen bg-soft-bg selection:bg-primary/20 ${theme}`}>
        <Navbar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          user={user} 
          theme={theme}
          toggleTheme={toggleTheme}
        />

        <AboutOwner />

        <main className="pb-32">
          <AnimatePresence mode="wait">
            {activeTab === 'test' && (
              <motion.div
                key="test"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              >
                <TypingTest />
              </motion.div>
            )}

            {activeTab === 'leaderboard' && (
              <motion.div
                key="leaderboard"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              >
                <Leaderboard />
              </motion.div>
            )}

            {activeTab === 'dashboard' && user && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              >
                <Dashboard />
              </motion.div>
            )}

            {activeTab === 'auth' && !user && (
              <motion.div
                key="auth"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              >
                <Auth />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Footer */}
        <footer className="fixed bottom-0 left-0 right-0 py-10 px-6 pointer-events-none z-0">
          <div className="max-w-6xl mx-auto flex justify-center gap-12 text-[10px] uppercase tracking-[0.3em] font-black text-zinc-500 opacity-30">
            <span className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              System Operational
            </span>
            <span>v1.0.0</span>
            <span>Typing Engine</span>
          </div>
        </footer>
      </div>
    </ErrorBoundary>
  );
}
