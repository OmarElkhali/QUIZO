import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  console.warn(
    'Variables Supabase manquantes (VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY). ' +
    'Le stockage de fichiers ne fonctionnera pas.'
  );
}

export const QUIZ_FILES_BUCKET = 'quiz-files';

export const supabase = SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY
  ? createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

export const getSupabaseStorageErrorMessage = (error: { message?: string } | null | undefined): string => {
  const message = error?.message || 'Erreur Supabase Storage inconnue';
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes('bucket not found')) {
    return `Le bucket Supabase "${QUIZ_FILES_BUCKET}" est introuvable. Appliquez la migration Supabase storage.`;
  }

  if (lowerMessage.includes('row-level security') || lowerMessage.includes('policy')) {
    return `Les policies Storage du bucket "${QUIZ_FILES_BUCKET}" bloquent l'upload. Appliquez la migration Supabase storage.`;
  }

  return message;
};

export const initializeBucket = async (): Promise<boolean> => {
  if (!supabase) return false;
  const { error } = await supabase.storage.from(QUIZ_FILES_BUCKET).list('', { limit: 1 });
  if (error) {
    console.error('Supabase Storage bucket check failed:', getSupabaseStorageErrorMessage(error));
    return false;
  }
  return true;
};
