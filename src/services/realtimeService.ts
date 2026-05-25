/**
 * Service pour la gestion des compétitions en temps réel
 * Utilise Firebase Realtime Database pour la synchronisation live
 */

import { getDatabase, ref, set, onValue, off, update, remove, push, serverTimestamp } from 'firebase/database';
import { app } from '@/lib/firebase';

const realtimeDb = getDatabase(app);

export interface LiveParticipant {
  id: string;
  name: string;
  email?: string;
  score: number;
  currentQuestionIndex: number;
  answers: Record<string, string>;
  joinedAt: number;
  lastActivity: number;
  isActive: boolean;
  completedAt?: number;
}

export interface CompetitionState {
  status: 'waiting' | 'active' | 'paused' | 'completed';
  currentQuestionIndex: number;
  startedAt?: number;
  pausedAt?: number;
  completedAt?: number;
  participantCount: number;
}

export interface LeaderboardEntry {
  userId: string;
  name: string;
  score: number;
  rank: number;
  answeredQuestions: number;
  correctAnswers: number;
  averageTime: number;
  badges: string[];
}

/**
 * Créer une session de compétition en temps réel
 */
export const createLiveCompetition = async (
  competitionId: string,
  config: {
    maxParticipants?: number;
    showLeaderboard: boolean;
    allowLateJoin: boolean;
    showAnswersLive: boolean;
  }
): Promise<void> => {
  const competitionRef = ref(realtimeDb, `competitions/${competitionId}`);
  
  await set(competitionRef, {
    config,
    state: {
      status: 'waiting',
      currentQuestionIndex: 0,
      participantCount: 0,
      createdAt: serverTimestamp()
    },
    participants: {},
    leaderboard: {},
    chat: []
  });
  
  console.log(`✅ Compétition live créée: ${competitionId}`);
};

/**
 * Rejoindre une compétition en tant que participant
 */
export const joinLiveCompetition = async (
  competitionId: string,
  participant: { id: string; name: string; email?: string }
): Promise<boolean> => {
  const participantRef = ref(realtimeDb, `competitions/${competitionId}/participants/${participant.id}`);
  
  const participantData: LiveParticipant = {
    id: participant.id,
    name: participant.name,
    email: participant.email,
    score: 0,
    currentQuestionIndex: 0,
    answers: {},
    joinedAt: Date.now(),
    lastActivity: Date.now(),
    isActive: true
  };
  
  try {
    await set(participantRef, participantData);
    
    // Mettre à jour le compteur de participants
    const stateRef = ref(realtimeDb, `competitions/${competitionId}/state/participantCount`);
    const countRef = ref(realtimeDb, `competitions/${competitionId}/participants`);
    
    onValue(countRef, (snapshot) => {
      const count = snapshot.size;
      update(ref(realtimeDb, `competitions/${competitionId}/state`), {
        participantCount: count
      });
    }, { onlyOnce: true });
    
    console.log(`✅ ${participant.name} a rejoint la compétition`);
    return true;
  } catch (error) {
    console.error('❌ Erreur lors de la jonction:', error);
    return false;
  }
};

/**
 * Démarrer la compétition
 */
export const startCompetition = async (competitionId: string): Promise<void> => {
  const stateRef = ref(realtimeDb, `competitions/${competitionId}/state`);
  
  await update(stateRef, {
    status: 'active',
    startedAt: serverTimestamp(),
    currentQuestionIndex: 0
  });
  
  console.log(`🚀 Compétition ${competitionId} démarrée`);
};

/**
 * Passer à la question suivante
 */
export const nextQuestion = async (competitionId: string): Promise<void> => {
  const stateRef = ref(realtimeDb, `competitions/${competitionId}/state`);
  
  // Récupérer l'index actuel
  onValue(stateRef, async (snapshot) => {
    const state = snapshot.val() as CompetitionState;
    const nextIndex = state.currentQuestionIndex + 1;
    
    await update(stateRef, {
      currentQuestionIndex: nextIndex
    });
    
    console.log(`➡️ Question ${nextIndex + 1}`);
  }, { onlyOnce: true });
};

/**
 * Soumettre une réponse
 */
export const submitAnswer = async (
  competitionId: string,
  participantId: string,
  questionId: string,
  answerId: string,
  isCorrect: boolean,
  points: number,
  timeSpent: number
): Promise<void> => {
  const participantRef = ref(realtimeDb, `competitions/${competitionId}/participants/${participantId}`);
  
  // Récupérer les données actuelles
  onValue(participantRef, async (snapshot) => {
    const participant = snapshot.val() as LiveParticipant;
    
    const updatedAnswers = {
      ...participant.answers,
      [questionId]: answerId
    };
    
    const updatedScore = isCorrect ? participant.score + points : participant.score;
    
    await update(participantRef, {
      answers: updatedAnswers,
      score: updatedScore,
      currentQuestionIndex: participant.currentQuestionIndex + 1,
      lastActivity: serverTimestamp()
    });
    
    // Mettre à jour le leaderboard
    await updateLeaderboard(competitionId);
    
  }, { onlyOnce: true });
};

/**
 * Mettre à jour le classement
 */
export const updateLeaderboard = async (competitionId: string): Promise<void> => {
  const participantsRef = ref(realtimeDb, `competitions/${competitionId}/participants`);
  
  onValue(participantsRef, async (snapshot) => {
    const participants = snapshot.val() as Record<string, LiveParticipant>;
    
    if (!participants) return;
    
    // Calculer le classement
    const leaderboard: LeaderboardEntry[] = Object.values(participants)
      .filter(p => p.isActive)
      .map((p, index) => ({
        userId: p.id,
        name: p.name,
        score: p.score,
        rank: 0, // Sera calculé après le tri
        answeredQuestions: Object.keys(p.answers).length,
        correctAnswers: p.score, // Simplification, à affiner
        averageTime: 0, // À calculer si tracking du temps
        badges: [] // À implémenter
      }))
      .sort((a, b) => b.score - a.score)
      .map((entry, index) => ({ ...entry, rank: index + 1 }));
    
    // Sauvegarder le leaderboard
    const leaderboardRef = ref(realtimeDb, `competitions/${competitionId}/leaderboard`);
    await set(leaderboardRef, leaderboard);
    
  }, { onlyOnce: true });
};

/**
 * Écouter les changements d'état de la compétition
 */
export const subscribeToCompetitionState = (
  competitionId: string,
  callback: (state: CompetitionState) => void
): (() => void) => {
  const stateRef = ref(realtimeDb, `competitions/${competitionId}/state`);
  
  onValue(stateRef, (snapshot) => {
    const state = snapshot.val() as CompetitionState;
    callback(state);
  });
  
  // Retourner fonction de désabonnement
  return () => off(stateRef);
};

/**
 * Écouter les participants
 */
export const subscribeToParticipants = (
  competitionId: string,
  callback: (participants: LiveParticipant[]) => void
): (() => void) => {
  const participantsRef = ref(realtimeDb, `competitions/${competitionId}/participants`);
  
  onValue(participantsRef, (snapshot) => {
    const participants = snapshot.val() as Record<string, LiveParticipant>;
    
    if (participants) {
      const participantsList = Object.values(participants);
      callback(participantsList);
    } else {
      callback([]);
    }
  });
  
  return () => off(participantsRef);
};

/**
 * Écouter le leaderboard
 */
export const subscribeToLeaderboard = (
  competitionId: string,
  callback: (leaderboard: LeaderboardEntry[]) => void
): (() => void) => {
  const leaderboardRef = ref(realtimeDb, `competitions/${competitionId}/leaderboard`);
  
  onValue(leaderboardRef, (snapshot) => {
    const leaderboard = snapshot.val() as LeaderboardEntry[];
    callback(leaderboard || []);
  });
  
  return () => off(leaderboardRef);
};

/**
 * Envoyer un message dans le chat
 */
export const sendChatMessage = async (
  competitionId: string,
  participantId: string,
  participantName: string,
  message: string
): Promise<void> => {
  const chatRef = ref(realtimeDb, `competitions/${competitionId}/chat`);
  const newMessageRef = push(chatRef);
  
  await set(newMessageRef, {
    participantId,
    participantName,
    message,
    timestamp: serverTimestamp()
  });
};

/**
 * Écouter le chat
 */
export const subscribeToChatMessages = (
  competitionId: string,
  callback: (messages: any[]) => void
): (() => void) => {
  const chatRef = ref(realtimeDb, `competitions/${competitionId}/chat`);
  
  onValue(chatRef, (snapshot) => {
    const messages = snapshot.val();
    
    if (messages) {
      const messagesList = Object.values(messages);
      callback(messagesList);
    } else {
      callback([]);
    }
  });
  
  return () => off(chatRef);
};

/**
 * Terminer la compétition
 */
export const endCompetition = async (competitionId: string): Promise<void> => {
  const stateRef = ref(realtimeDb, `competitions/${competitionId}/state`);
  
  await update(stateRef, {
    status: 'completed',
    completedAt: serverTimestamp()
  });
  
  // Mettre à jour le leaderboard final
  await updateLeaderboard(competitionId);
  
  console.log(`🏁 Compétition ${competitionId} terminée`);
};

/**
 * Quitter la compétition
 */
export const leaveCompetition = async (
  competitionId: string,
  participantId: string
): Promise<void> => {
  const participantRef = ref(realtimeDb, `competitions/${competitionId}/participants/${participantId}`);
  
  await update(participantRef, {
    isActive: false,
    leftAt: serverTimestamp()
  });
  
  console.log(`👋 Participant ${participantId} a quitté`);
};

/**
 * Supprimer une compétition live (après 24h par exemple)
 */
export const deleteLiveCompetition = async (competitionId: string): Promise<void> => {
  const competitionRef = ref(realtimeDb, `competitions/${competitionId}`);
  await remove(competitionRef);
  
  console.log(`🗑️ Compétition ${competitionId} supprimée`);
};

/**
 * Calculer les badges gagnés
 */
export const calculateBadges = (participant: LiveParticipant, totalQuestions: number): string[] => {
  const badges: string[] = [];
  
  const correctAnswers = participant.score; // Simplification
  const totalAnswered = Object.keys(participant.answers).length;
  const accuracy = totalAnswered > 0 ? (correctAnswers / totalAnswered) * 100 : 0;
  
  // Badge Score Parfait
  if (accuracy === 100 && totalAnswered === totalQuestions) {
    badges.push('perfect-score');
  }
  
  // Badge Participation
  if (totalAnswered > 0) {
    badges.push('participation');
  }
  
  // Badge Finisher
  if (totalAnswered === totalQuestions) {
    badges.push('finisher');
  }
  
  // Badge Accuracy
  if (accuracy >= 90) {
    badges.push('high-accuracy');
  }
  
  return badges;
};

/**
 * Obtenir les statistiques de la compétition
 */
export const getCompetitionStats = async (competitionId: string) => {
  const competitionRef = ref(realtimeDb, `competitions/${competitionId}`);
  
  return new Promise((resolve) => {
    onValue(competitionRef, (snapshot) => {
      const data = snapshot.val();
      
      if (!data) {
        resolve(null);
        return;
      }
      
      const participants = Object.values(data.participants || {}) as LiveParticipant[];
      const activeParticipants = participants.filter(p => p.isActive);
      
      const stats = {
        totalParticipants: participants.length,
        activeParticipants: activeParticipants.length,
        averageScore: participants.reduce((sum, p) => sum + p.score, 0) / participants.length || 0,
        completionRate: (participants.filter(p => p.completedAt).length / participants.length) * 100 || 0,
        state: data.state as CompetitionState
      };
      
      resolve(stats);
    }, { onlyOnce: true });
  });
};

export default {
  createLiveCompetition,
  joinLiveCompetition,
  startCompetition,
  nextQuestion,
  submitAnswer,
  updateLeaderboard,
  subscribeToCompetitionState,
  subscribeToParticipants,
  subscribeToLeaderboard,
  sendChatMessage,
  subscribeToChatMessages,
  endCompetition,
  leaveCompetition,
  deleteLiveCompetition,
  calculateBadges,
  getCompetitionStats
};
