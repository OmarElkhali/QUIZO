import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import des traductions
import fr from './locales/fr.json';
import en from './locales/en.json';
import es from './locales/es.json';
import ar from './locales/ar.json';
import zh from './locales/zh.json';
import hi from './locales/hi.json';
import pt from './locales/pt.json';
import de from './locales/de.json';

// Configuration des ressources de traduction
const resources = {
  fr: { translation: fr },
  en: { translation: en },
  es: { translation: es },
  ar: { translation: ar },
  zh: { translation: zh },
  hi: { translation: hi },
  pt: { translation: pt },
  de: { translation: de },
};

// Configuration i18next
i18n
  .use(LanguageDetector) // Détecte automatiquement la langue du navigateur
  .use(initReactI18next) // Passe i18n à react-i18next
  .init({
    resources,
    fallbackLng: 'fr', // Langue par défaut si détection échoue
    lng: localStorage.getItem('i18nextLng') || 'fr', // Langue sauvegardée ou par défaut
    interpolation: {
      escapeValue: false, // React échappe déjà les valeurs
    },
    detection: {
      order: ['localStorage', 'navigator'], // Priorité de détection
      caches: ['localStorage'], // Sauvegarde dans localStorage
    },
  });

export default i18n;

// Export des langues disponibles avec leurs métadonnées
export const languages = [
  { code: 'fr', name: 'Français', flag: '🇫🇷', nativeName: 'Français' },
  { code: 'en', name: 'English', flag: '🇬🇧', nativeName: 'English' },
  { code: 'es', name: 'Español', flag: '🇪🇸', nativeName: 'Español' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦', nativeName: 'العربية', rtl: true },
  { code: 'zh', name: '中文', flag: '🇨🇳', nativeName: '中文简体' },
  { code: 'hi', name: 'हिन्दी', flag: '🇮🇳', nativeName: 'हिन्दी' },
  { code: 'pt', name: 'Português', flag: '🇧🇷', nativeName: 'Português' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪', nativeName: 'Deutsch' },
] as const;
