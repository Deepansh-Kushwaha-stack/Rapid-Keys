import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { Zap, Trophy, LayoutDashboard, LogOut, Keyboard, Sun, Moon, ArrowUpRight } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: any;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
}

export default function Navbar({ activeTab, setActiveTab, user, theme, toggleTheme }: NavbarProps) {
  return (
    <nav className="max-w-6xl mx-auto px-6 py-10 flex items-center justify-between">
      <div 
        className="flex items-center gap-4 cursor-pointer group"
        onClick={() => setActiveTab('test')}
      >
        <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
          <Keyboard className="w-5 h-5 text-white" />
        </div>
        <h1 className="text-2xl font-black text-black dark:text-white tracking-tighter">RapidKeys</h1>
      </div>

      <div className="hidden md:flex items-center gap-8 bg-black/90 backdrop-blur-xl px-8 py-3 rounded-full border border-white/10">
        <NavButton 
          active={activeTab === 'test'} 
          onClick={() => setActiveTab('test')}
          label="Test"
        />
        <NavButton 
          active={activeTab === 'leaderboard'} 
          onClick={() => setActiveTab('leaderboard')}
          label="Leaderboard"
        />
        {user && (
          <NavButton 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')}
            label="Dashboard"
          />
        )}
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={toggleTheme}
          className="w-10 h-10 rounded-full flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-all active:scale-90 border border-zinc-200 dark:border-zinc-800"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        {user ? (
          <div className="flex items-center gap-4">
            <button
              onClick={() => signOut(auth)}
              className="px-6 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-full transition-all active:scale-95 flex items-center gap-2"
            >
              Sign Out
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setActiveTab('auth')}
            className="px-6 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-full transition-all active:scale-95 flex items-center gap-2"
          >
            Get Started
            <ArrowUpRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </nav>
  );
}

function NavButton({ active, onClick, label }: { active: boolean, onClick: () => void, label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "text-[11px] font-bold transition-all relative",
        active 
          ? "text-white" 
          : "text-zinc-400 hover:text-white"
      )}
    >
      {label}
      {active && (
        <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-primary rounded-full" />
      )}
    </button>
  );
}
