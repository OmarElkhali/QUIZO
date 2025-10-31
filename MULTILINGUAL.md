# 🌍 Système Multi-langues QUIZO

## Langues disponibles

QUIZO supporte **8 langues** parmi les plus parlées au monde :

| Langue | Code | Drapeau | Locuteurs natifs | Support RTL |
|--------|------|---------|------------------|-------------|
| Français | `fr` | 🇫🇷 | 77M | Non |
| English | `en` | 🇬🇧 | 379M | Non |
| Español | `es` | 🇪🇸 | 460M | Non |
| العربية | `ar` | 🇸🇦 | 274M | **Oui** |
| 中文 | `zh` | 🇨🇳 | 918M | Non |
| हिन्दी | `hi` | 🇮🇳 | 341M | Non |
| Português | `pt` | 🇧🇷 | 221M | Non |
| Deutsch | `de` | 🇩🇪 | 76M | Non |

**Total** : > **2,7 milliards** de locuteurs natifs couverts !

---

## ✨ Fonctionnalités

### 1. Sélecteur de langue dans la Navbar
- **Position** : À droite du logo, à côté du ThemeToggle
- **Affichage** : Drapeau emoji + nom natif de la langue
- **Menu déroulant** : Toutes les 8 langues disponibles
- **Indicateur visuel** : Coche verte (✓) sur la langue active

### 2. Détection automatique
- Détecte automatiquement la langue du navigateur au premier chargement
- Si la langue du navigateur n'est pas supportée, utilise le français par défaut

### 3. Persistance
- La langue choisie est **sauvegardée dans localStorage**
- Persiste entre les sessions (fermeture/réouverture du navigateur)
- Clé : `i18nextLng`

### 4. Support RTL (Right-to-Left)
- **Arabe (العربية)** : Support complet RTL
- Change automatiquement `dir="rtl"` sur `<html>` quand l'arabe est sélectionné
- Revient à `dir="ltr"` pour toutes les autres langues

### 5. Traductions complètes
- **10 catégories** de traductions :
  - `nav` : Navigation (Navbar)
  - `home` : Page d'accueil
  - `createQuiz` : Création de quiz
  - `quiz` : Interface du quiz
  - `results` : Page des résultats
  - `history` : Historique
  - `dashboard` : Dashboard temps réel
  - `join` : Rejoindre un quiz
  - `share` : Partage de quiz
  - `common` : Éléments communs
  - `errors` : Messages d'erreur
  - `auth` : Authentification
  - `footer` : Pied de page

---

## 🛠️ Architecture technique

### Stack
- **react-i18next** : Framework de traduction React
- **i18next** : Moteur de traduction JavaScript
- **i18next-browser-languagedetector** : Détection automatique de la langue

### Structure des fichiers

```
src/
├── i18n/
│   ├── config.ts              # Configuration i18next + export languages
│   └── locales/
│       ├── fr.json            # Traductions françaises
│       ├── en.json            # Traductions anglaises
│       ├── es.json            # Traductions espagnoles
│       ├── ar.json            # Traductions arabes (RTL)
│       ├── zh.json            # Traductions chinoises
│       ├── hi.json            # Traductions hindi
│       ├── pt.json            # Traductions portugaises
│       └── de.json            # Traductions allemandes
├── components/
│   └── LanguageSelector.tsx   # Composant sélecteur de langue
└── main.tsx                   # Import de la config i18n
```

### Configuration i18n (`src/i18n/config.ts`)

```typescript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(LanguageDetector)      // Détection auto
  .use(initReactI18next)      // Intégration React
  .init({
    resources: { ... },        // Import des 8 langues
    fallbackLng: 'fr',         // Langue par défaut
    interpolation: {
      escapeValue: false,      // React échappe déjà
    },
  });
```

---

## 📝 Utilisation dans les composants

### Import du hook
```typescript
import { useTranslation } from 'react-i18next';
```

### Utilisation basique
```typescript
const { t } = useTranslation();

// Dans le JSX
<h1>{t('nav.home')}</h1>
<Button>{t('common.save')}</Button>
```

### Avec variables
```typescript
// JSON
{
  "quiz": {
    "question": "Question {{number}} sur {{total}}"
  }
}

// Code
{t('quiz.question', { number: 5, total: 10 })}
// Affiche : "Question 5 sur 10"
```

### Changer de langue programmatiquement
```typescript
const { i18n } = useTranslation();

// Changer vers l'anglais
i18n.changeLanguage('en');
```

---

## 🎨 Composant LanguageSelector

### Fonctionnalités
- **Dropdown menu** avec toutes les langues
- **Affichage actuel** : Drapeau + nom natif
- **Coche verte** sur la langue active
- **RTL automatique** pour l'arabe
- **Responsive** : Cache le nom sur mobile, affiche seulement le drapeau

### Utilisation
```tsx
import { LanguageSelector } from '@/components/LanguageSelector';

// Dans Navbar
<LanguageSelector />
```

---

## 🔧 Ajouter une nouvelle langue

### 1. Créer le fichier de traduction
```bash
src/i18n/locales/it.json  # Exemple : Italien
```

### 2. Copier la structure de `fr.json`
```json
{
  "nav": { ... },
  "home": { ... },
  "createQuiz": { ... },
  ...
}
```

### 3. Ajouter dans `config.ts`
```typescript
import it from './locales/it.json';

const resources = {
  ...
  it: { translation: it },
};

export const languages = [
  ...
  { code: 'it', name: 'Italiano', flag: '🇮🇹', nativeName: 'Italiano' },
] as const;
```

---

## 🧪 Tests

### Tester une langue spécifique
1. Ouvrir l'application
2. Cliquer sur le **Globe** dans la Navbar
3. Sélectionner une langue
4. Vérifier que **tous les textes** changent
5. Recharger la page : la langue persiste ✅

### Tester le RTL (Arabe)
1. Sélectionner **العربية** (🇸🇦)
2. Vérifier que le texte s'aligne à droite
3. Vérifier que les menus s'ouvrent du bon côté
4. Revenir au français : RTL se désactive ✅

### Tester la détection auto
1. Vider le localStorage : `localStorage.clear()`
2. Changer la langue du navigateur (Paramètres Chrome/Firefox)
3. Recharger l'application
4. Vérifie que la langue correspond ✅

---

## 📊 Statistiques de traduction

| Catégorie | Clés | Mots (FR) | Statut |
|-----------|------|-----------|--------|
| `nav` | 11 | ~30 | ✅ 100% |
| `home` | 4 | ~20 | ✅ 100% |
| `createQuiz` | 14 | ~80 | ✅ 100% |
| `quiz` | 7 | ~20 | ✅ 100% |
| `results` | 11 | ~40 | ✅ 100% |
| `history` | 12 | ~50 | ✅ 100% |
| `dashboard` | 17 | ~60 | ✅ 100% |
| `join` | 9 | ~35 | ✅ 100% |
| `share` | 9 | ~30 | ✅ 100% |
| `common` | 17 | ~30 | ✅ 100% |
| `errors` | 7 | ~25 | ✅ 100% |
| `auth` | 11 | ~40 | ✅ 100% |
| `footer` | 5 | ~15 | ✅ 100% |
| **TOTAL** | **134** | **~475** | ✅ **100%** |

**Toutes les langues** ont exactement les mêmes clés traduites !

---

## 🌐 Coverage mondial

### Répartition géographique

| Région | Langues | Population couverte |
|--------|---------|---------------------|
| Europe | FR, EN, ES, DE, PT | ~700M |
| Asie | ZH, HI, AR | ~1,5B |
| Amériques | EN, ES, PT | ~900M |
| Moyen-Orient | AR | ~400M |
| Afrique | FR, AR, EN | ~500M |

**Total mondial** : > **4 milliards** de personnes peuvent utiliser QUIZO dans leur langue !

---

## 🚀 Prochaines étapes (optionnel)

### Langues à ajouter
- 🇯🇵 Japonais (128M locuteurs)
- 🇷🇺 Russe (154M locuteurs)
- 🇰🇷 Coréen (77M locuteurs)
- 🇹🇷 Turc (79M locuteurs)
- 🇮🇩 Indonésien (43M locuteurs)

### Améliorations
- [ ] Traduction automatique avec API (DeepL, Google Translate)
- [ ] Crowdsourcing des traductions (contributeurs communautaires)
- [ ] Détection de la langue du contenu uploadé
- [ ] Traduction des questions générées par l'IA

---

## 📖 Ressources

- [react-i18next Documentation](https://react.i18next.com/)
- [i18next Documentation](https://www.i18next.com/)
- [Emoji Flags](https://emojipedia.org/flags/)
- [RTL CSS Best Practices](https://rtlstyling.com/)

---

**Auteur** : Système i18n QUIZO  
**Date** : Octobre 2025  
**Version** : 1.0.0  
**Langues** : 8 (FR, EN, ES, AR, ZH, HI, PT, DE)
