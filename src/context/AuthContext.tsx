import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  signInWithPopup,
  sendEmailVerification,
  updateProfile,
} from 'firebase/auth';
import { auth, githubProvider, googleProvider } from '@/lib/firebase';
import { toast } from 'sonner';

interface User {
  id: string;
  email: string;
  name?: string;
  photoURL?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithGithub: () => Promise<void>;
  signUp: (email: string, password: string, name?: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const authErrorMessage = (error: unknown): string => {
  const code = typeof error === 'object' && error !== null && 'code' in error
    ? String((error as { code?: unknown }).code)
    : '';
  const messages: Record<string, string> = {
    'auth/invalid-credential': 'Email ou mot de passe incorrect.',
    'auth/user-not-found': 'Email ou mot de passe incorrect.',
    'auth/wrong-password': 'Email ou mot de passe incorrect.',
    'auth/email-already-in-use': 'Un compte existe déjà avec cet email.',
    'auth/weak-password': 'Choisissez un mot de passe plus robuste.',
    'auth/popup-closed-by-user': 'La fenêtre de connexion a été fermée.',
    'auth/popup-blocked': 'Autorisez les fenêtres pop-up puis réessayez.',
    'auth/account-exists-with-different-credential': 'Cet email utilise déjà un autre mode de connexion.',
    'auth/unauthorized-domain': 'Ce domaine n’est pas autorisé pour la connexion OAuth.',
  };
  return messages[code] || 'Connexion impossible. Réessayez dans quelques instants.';
};

const validateNewPassword = (password: string) => {
  if (password.length < 10 || !/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password)) {
    throw new Error('Le mot de passe doit contenir au moins 10 caractères, une majuscule, une minuscule et un chiffre.');
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setIsLoading(true);
      if (firebaseUser) {
        setUser({
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          name: firebaseUser.displayName || undefined,
          photoURL: firebaseUser.photoURL || undefined,
        });
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success('Connexion réussie');
    } catch (error) {
      console.warn('Échec de connexion Firebase', { code: typeof error === 'object' && error !== null && 'code' in error ? (error as { code?: unknown }).code : 'unknown' });
      toast.error(authErrorMessage(error));
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setIsLoading(true);

    try {
      await signInWithPopup(auth, googleProvider);
      toast.success('Connexion avec Google réussie');
    } catch (error) {
      console.warn('Échec de connexion Google', { code: typeof error === 'object' && error !== null && 'code' in error ? (error as { code?: unknown }).code : 'unknown' });
      toast.error(authErrorMessage(error));
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithGithub = async () => {
    setIsLoading(true);

    try {
      await signInWithPopup(auth, githubProvider);
      toast.success('Connexion avec GitHub réussie');
    } catch (error) {
      console.warn('Échec de connexion GitHub', { code: typeof error === 'object' && error !== null && 'code' in error ? (error as { code?: unknown }).code : 'unknown' });
      toast.error(authErrorMessage(error));
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string, name?: string) => {
    setIsLoading(true);

    try {
      validateNewPassword(password);
      const { user: firebaseUser } = await createUserWithEmailAndPassword(auth, email, password);

      if (name && firebaseUser) {
        await updateProfile(firebaseUser, { displayName: name });
      }

      await sendEmailVerification(firebaseUser);

      toast.success('Compte créé. Vérifiez votre email pour finaliser la sécurité du compte.');
    } catch (error) {
      console.warn('Échec de création de compte Firebase', { code: typeof error === 'object' && error !== null && 'code' in error ? (error as { code?: unknown }).code : 'validation' });
      toast.error(error instanceof Error && !('code' in error) ? error.message : authErrorMessage(error));
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);

    try {
      await firebaseSignOut(auth);
      toast.success('Déconnexion réussie');
    } catch (error: any) {
      console.error('Erreur de déconnexion:', error);
      toast.error(error.message || 'Échec de la déconnexion');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        signIn,
        signInWithGoogle,
        signInWithGithub,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};
