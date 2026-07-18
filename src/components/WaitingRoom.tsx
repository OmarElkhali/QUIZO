import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, Users, Shield, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Participant } from '@/types/quiz';
import { toast } from 'sonner';

interface WaitingRoomProps {
  shareCode: string;
  participants: Participant[];
  isHost: boolean;
  onStartGame?: () => void;
  gameTitle: string;
}

export const WaitingRoom = ({
  shareCode,
  participants,
  isHost,
  onStartGame,
  gameTitle,
}: WaitingRoomProps) => {
  const [copied, setCopied] = useState(false);

  const copyLink = () => {
    const url = `${window.location.origin}/join-quiz/${shareCode}`;
    navigator.clipboard
      .writeText(url)
      .then(() => {
        setCopied(true);
        toast.success('Lien de partage copié !');
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => toast.error('Impossible de copier le lien'));
  };

  // Modern avatar colors list
  const avatarColors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
    '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
    '#BB8FCE', '#85C1E9', '#F1948A', '#82E0AA'
  ];

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/[0.07] bg-white/[0.03] p-8 backdrop-blur-2xl">
      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-transparent pointer-events-none" />
      
      <div className="relative flex flex-col items-center text-center">
        {/* Animated Badge */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-4 inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-4 py-1.5 text-sm font-semibold text-[#ffb77d]"
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-orange-500"></span>
          </span>
          Salon de Jeu en Direct
        </motion.div>

        <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">{gameTitle}</h2>
        <p className="mt-2 text-sm text-[#a79d96] max-w-md">
          {isHost 
            ? "Invitez vos joueurs à rejoindre en partageant le code ou le lien ci-dessous."
            : "Installez-vous confortablement ! La partie va bientôt démarrer dès que l'animateur la lancera."}
        </p>

        {/* Share Section */}
        <div className="mt-8 flex flex-col sm:flex-row items-center gap-4 bg-black/20 p-3 rounded-2xl border border-white/[0.05]">
          <div className="px-4 py-2 text-left">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-[#ffb77d]/70">Code d'accès</span>
            <span className="font-mono text-3xl font-black tracking-widest text-white">{shareCode}</span>
          </div>
          <div className="h-px w-full sm:h-8 sm:w-px bg-white/10" />
          <Button 
            onClick={copyLink} 
            className="quizo-copper-button flex items-center gap-2 h-12 w-full sm:w-auto px-6"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-950" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Copié !' : 'Copier le lien'}
          </Button>
        </div>

        {/* Participants Summary Header */}
        <div className="mt-12 w-full flex items-center justify-between border-b border-white/[0.07] pb-3 mb-6">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Users className="h-5 w-5 text-[#ffb77d]" />
            Joueurs Connectés ({participants.length})
          </h3>
          {isHost && (
            <Button
              disabled={participants.length === 0}
              onClick={onStartGame}
              className="quizo-copper-button px-6 h-10 flex items-center gap-2 text-sm font-bold disabled:opacity-50"
            >
              <Play className="h-4 w-4 fill-current" />
              Lancer la partie
            </Button>
          )}
        </div>

        {/* Participants Grid */}
        <div className="w-full min-h-[160px]">
          {participants.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-12 text-center text-[#a79d96] bg-white/[0.01] rounded-2xl border border-dashed border-white/[0.05]"
            >
              <Users className="h-10 w-10 text-white/20 mb-3 animate-pulse" />
              <p className="text-sm font-semibold">En attente de joueurs...</p>
              <p className="text-xs text-white/40 mt-1">Partagez le code pour démarrer le quiz.</p>
            </motion.div>
          ) : (
            <motion.div 
              layout
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4"
            >
              <AnimatePresence>
                {participants.map((player, idx) => {
                  const color = avatarColors[idx % avatarColors.length];
                  return (
                    <motion.div
                      key={player.id}
                      initial={{ scale: 0.3, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.3, opacity: 0 }}
                      whileHover={{ scale: 1.05, y: -2 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                      className="relative overflow-hidden flex flex-col items-center justify-center p-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] shadow-[0_4px_20px_rgba(0,0,0,0.15)] group"
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                      <div
                        className="flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold text-white mb-3 shadow-[0_0_15px_rgba(0,0,0,0.2)] border-2"
                        style={{ 
                          backgroundColor: color + '22', 
                          borderColor: color 
                        }}
                      >
                        {player.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-semibold text-white text-sm text-center truncate max-w-full group-hover:text-[#ffb77d] transition-colors">
                        {player.name}
                      </span>
                      {player.userId === player.id && (
                        <span className="absolute top-2 right-2 text-[9px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-400/20 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          Toi
                        </span>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};
