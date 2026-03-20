import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Instagram, Linkedin, X, ExternalLink } from 'lucide-react';

export default function AboutOwner() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Button */}
      <div className="fixed bottom-8 left-8 z-50 pointer-events-auto">
        <button
          onClick={() => setIsOpen(true)}
          className="w-12 h-12 bg-black/90 dark:bg-white/10 backdrop-blur-xl border border-white/10 rounded-full flex items-center justify-center text-white hover:scale-110 transition-all active:scale-90 shadow-2xl group"
          title="About Owner"
        >
          <User className="w-5 h-5 group-hover:text-primary transition-colors" />
        </button>
      </div>

      {/* Modal Overlay */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md glass-card p-10 overflow-hidden"
            >
              {/* Decorative Background */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -mr-16 -mt-16 blur-3xl" />
              
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-6 right-6 p-2 text-zinc-500 hover:text-black dark:hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="relative z-10">
                <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mb-8 border border-primary/20">
                  <User className="w-10 h-10 text-primary" />
                </div>

                <h2 className="text-4xl font-black text-black dark:text-white tracking-tighter mb-2">
                  Deepansh kushwaha
                </h2>
                <p className="text-zinc-500 font-bold uppercase tracking-[0.2em] text-[10px] mb-8">
                  Founder & Lead Developer
                </p>

                <div className="space-y-6 mb-10">
                  <p className="text-zinc-400 text-sm leading-relaxed">
                    Passionate about building high-performance digital experiences and mastering the art of speed. RapidKeys is a project born out of the desire to create the ultimate typing environment for enthusiasts and professionals alike.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <a
                    href="https://www.instagram.com/__deppanshh__/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-3 p-4 bg-zinc-100 dark:bg-zinc-800/50 rounded-2xl text-zinc-600 dark:text-zinc-400 hover:text-primary dark:hover:text-primary transition-all group"
                  >
                    <Instagram className="w-5 h-5" />
                    <span className="text-xs font-black uppercase tracking-widest">Instagram</span>
                    <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                  <a
                    href="https://www.linkedin.com/in/deepansh-kushwaha-667b073a6/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-3 p-4 bg-zinc-100 dark:bg-zinc-800/50 rounded-2xl text-zinc-600 dark:text-zinc-400 hover:text-primary dark:hover:text-primary transition-all group"
                  >
                    <Linkedin className="w-5 h-5" />
                    <span className="text-xs font-black uppercase tracking-widest">LinkedIn</span>
                    <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
