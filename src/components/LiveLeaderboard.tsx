import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Award } from 'lucide-react';
import { Participant } from '@/types/quiz';
import confetti from 'canvas-confetti';
import { cn } from '@/lib/utils';

interface LiveLeaderboardProps {
  participants: Participant[];
  showConfetti?: boolean;
}

export const LiveLeaderboard = ({
  participants,
  showConfetti = false,
}: LiveLeaderboardProps) => {
  // Sort participants by score (highest first)
  const sorted = [...participants].sort((a, b) => (b.score || 0) - (a.score || 0));
  
  // Podium top 3
  const top1 = sorted[0];
  const top2 = sorted[1];
  const top3 = sorted[2];
  
  // Remaining players (ranks 4+)
  const rest = sorted.slice(3);

  // Trigger confetti if requested
  useEffect(() => {
    if (showConfetti && sorted.length > 0) {
      const duration = 4 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 1000 };

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
        });
      }, 250);

      return () => clearInterval(interval);
    }
  }, [showConfetti, sorted.length]);

  return (
    <div className="w-full max-w-4xl mx-auto p-4 flex flex-col items-center">
      {/* Dynamic Podium Layout */}
      {sorted.length > 0 && (
        <div className="flex justify-center items-end gap-3 sm:gap-6 mt-8 mb-12 w-full max-w-2xl px-2 min-h-[320px]">
          
          {/* 2ND PLACE PODIUM */}
          {top2 && (
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 100 }}
              className="flex flex-col items-center flex-1"
            >
              <div className="mb-3 text-center">
                <div className="h-10 w-10 sm:h-12 sm:w-12 mx-auto rounded-full bg-slate-500/10 border-2 border-slate-300 text-slate-200 flex items-center justify-center font-bold text-sm sm:text-base">
                  {top2.name.slice(0, 2).toUpperCase()}
                </div>
                <p className="mt-2 text-xs sm:text-sm font-bold text-slate-300 truncate max-w-[100px]">{top2.name}</p>
                <p className="text-[10px] sm:text-xs text-slate-400 font-bold">{Math.round(top2.score || 0)} pts</p>
              </div>
              <motion.div 
                initial={{ height: 0 }}
                animate={{ height: 120 }}
                transition={{ delay: 0.6, duration: 0.8, ease: 'easeOut' }}
                className="w-full bg-gradient-to-t from-slate-800 to-slate-700 rounded-t-2xl border-t-2 border-slate-400/40 flex flex-col justify-between p-4 shadow-[0_-10px_25px_rgba(200,200,200,0.03)]"
              >
                <div className="mx-auto rounded-full bg-slate-300/10 p-2 text-slate-300">
                  <Award className="h-5 sm:h-6 sm:w-6" />
                </div>
                <span className="text-3xl sm:text-4xl font-black text-center text-slate-300">2</span>
              </motion.div>
            </motion.div>
          )}

          {/* 1ST PLACE PODIUM (WINNER) */}
          {top1 && (
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 100 }}
              className="flex flex-col items-center flex-1 z-10"
            >
              <div className="mb-3 text-center relative w-full">
                <motion.div 
                  animate={{ rotate: [0, 5, -5, 0], y: [0, -3, 0] }}
                  transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                  className="absolute -top-6 left-1/2 -translate-x-1/2 text-2xl"
                >
                  👑
                </motion.div>
                <div className="h-12 w-12 sm:h-16 sm:w-16 mx-auto rounded-full bg-amber-500/10 border-4 border-amber-400 text-amber-200 flex items-center justify-center font-black text-base sm:text-lg shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                  {top1.name.slice(0, 2).toUpperCase()}
                </div>
                <p className="mt-2 text-sm sm:text-base font-extrabold text-amber-300 truncate max-w-[120px]">{top1.name}</p>
                <p className="text-xs text-amber-400 font-black">{Math.round(top1.score || 0)} pts</p>
              </div>
              <motion.div 
                initial={{ height: 0 }}
                animate={{ height: 170 }}
                transition={{ delay: 0.4, duration: 0.8, ease: 'easeOut' }}
                className="w-full bg-gradient-to-t from-amber-950/80 to-amber-600 rounded-t-2xl border-t-2 border-amber-300/40 flex flex-col justify-between p-4 shadow-[0_-10px_35px_rgba(245,158,11,0.1)] relative"
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.1),transparent)] pointer-events-none rounded-t-2xl" />
                <div className="mx-auto rounded-full bg-amber-300/20 p-2 text-amber-200">
                  <Trophy className="h-6 sm:h-7 sm:w-7 animate-bounce" />
                </div>
                <span className="text-4xl sm:text-5xl font-black text-center text-amber-950">1</span>
              </motion.div>
            </motion.div>
          )}

          {/* 3RD PLACE PODIUM */}
          {top3 && (
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, type: 'spring', stiffness: 100 }}
              className="flex flex-col items-center flex-1"
            >
              <div className="mb-3 text-center">
                <div className="h-10 w-10 sm:h-12 sm:w-12 mx-auto rounded-full bg-amber-700/10 border-2 border-amber-700 text-amber-600 flex items-center justify-center font-bold text-sm sm:text-base">
                  {top3.name.slice(0, 2).toUpperCase()}
                </div>
                <p className="mt-2 text-xs sm:text-sm font-bold text-amber-600 truncate max-w-[100px]">{top3.name}</p>
                <p className="text-[10px] sm:text-xs text-amber-700/80 font-bold">{Math.round(top3.score || 0)} pts</p>
              </div>
              <motion.div 
                initial={{ height: 0 }}
                animate={{ height: 85 }}
                transition={{ delay: 0.8, duration: 0.8, ease: 'easeOut' }}
                className="w-full bg-gradient-to-t from-[#3a2010] to-[#6b3f20] rounded-t-2xl border-t-2 border-[#8a5530]/40 flex flex-col justify-between p-4 shadow-[0_-10px_20px_rgba(138,85,48,0.02)]"
              >
                <div className="mx-auto rounded-full bg-[#8a5530]/10 p-1.5 text-[#ffb77d]">
                  <Award className="h-4 sm:h-5 sm:w-5" />
                </div>
                <span className="text-2xl sm:text-3xl font-black text-center text-[#ffb77d]">3</span>
              </motion.div>
            </motion.div>
          )}
        </div>
      )}

      {/* REST OF LEADERBOARD LIST */}
      {rest.length > 0 && (
        <div className="w-full max-w-2xl space-y-2 mt-4">
          <p className="quizo-label text-left px-2 mb-3">Autres concurrents</p>
          {rest.map((player, index) => (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 * index }}
              key={player.id}
              className="flex items-center justify-between rounded-xl border border-white/[0.05] bg-white/[0.02] p-4 hover:bg-white/[0.04] transition-colors"
            >
              <div className="flex items-center gap-4">
                <span className="font-mono text-sm font-semibold text-[#a79d96] w-6 text-center">#{index + 4}</span>
                <div className="h-8 w-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center font-bold text-xs text-white">
                  {player.name.slice(0, 2).toUpperCase()}
                </div>
                <span className="font-semibold text-white text-sm sm:text-base">{player.name}</span>
              </div>
              <div className="text-right">
                <span className="font-extrabold text-white">{Math.round(player.score || 0)}</span>
                <span className="text-xs text-[#a79d96] ml-1">pts</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};
