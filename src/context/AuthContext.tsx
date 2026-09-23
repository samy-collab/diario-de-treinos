import type { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { createContext, type PropsWithChildren, useContext, useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';
import { subscribeToUserProfile } from '@/services/auth';
import type { UserProfile } from '@/types/user';

type AuthContextValue = { user: User | null; profile: UserProfile | null; isCheckingSession: boolean };
const AuthContext = createContext<AuthContextValue>({ user: null, profile: null, isCheckingSession: true });

// Centraliza o usuario e a verificacao inicial da sessao para todas as telas.
export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  // Observa login, cadastro, restauracao da sessao e logout. Quando existe uma
  // conta, abre tambem um listener para nome e idade no documento do usuario.
  useEffect(() => {
    let unsubscribeProfile = () => {};
    const unsubscribeAuth = onAuthStateChanged(auth, (nextUser) => {
      unsubscribeProfile();
      setUser(nextUser);
      if (nextUser) {
        unsubscribeProfile = subscribeToUserProfile(nextUser.uid, setProfile, () => setProfile(null));
      } else {
        setProfile(null);
      }
      setIsCheckingSession(false);
    });

    return () => { unsubscribeProfile(); unsubscribeAuth(); };
  }, []);
  return <AuthContext.Provider value={{ user, profile, isCheckingSession }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  // Hook curto evita importar e manipular o contexto em cada tela.
  return useContext(AuthContext);
}
