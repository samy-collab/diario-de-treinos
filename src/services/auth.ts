import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile } from 'firebase/auth';
import { doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import type { UserProfile } from '@/types/user';

// Esta camada esconde os detalhes do SDK Firebase das telas.
export async function signIn(email: string, password: string) {
  return (await signInWithEmailAndPassword(auth, email, password)).user;
}

export async function createAccount(name: string, age: number, email: string, password: string) {
  const user = (await createUserWithEmailAndPassword(auth, email, password)).user;

  // O nome tambem fica no perfil do Authentication. Nome e idade sao gravados
  // no documento users/{uid}, protegido pelas regras do Firestore.
  await Promise.all([
    updateProfile(user, { displayName: name }),
    setDoc(doc(db, 'users', user.uid), { name, age, createdAt: serverTimestamp() }),
  ]);

  return user;
}

export function subscribeToUserProfile(
  userId: string,
  onProfile: (profile: UserProfile | null) => void,
  onError: () => void,
) {
  // Listener em tempo real cobre inclusive o instante em que uma conta nova
  // cria seu documento de perfil logo depois da autenticacao.
  return onSnapshot(doc(db, 'users', userId), (snapshot) => {
    if (!snapshot.exists()) return onProfile(null);
    const data = snapshot.data();
    onProfile({ name: String(data.name ?? ''), age: Number(data.age ?? 0) });
  }, onError);
}

export async function saveUserProfile(userId: string, name: string, age: number) {
  // Esta funcao atende contas antigas que ainda nao possuem nome e idade.
  // O listener do AuthContext percebe a gravacao e atualiza as telas sozinho.
  await setDoc(doc(db, 'users', userId), { name, age, createdAt: serverTimestamp() });
  if (auth.currentUser) await updateProfile(auth.currentUser, { displayName: name });
}

export async function logout() {
  // Ao sair, o contexto percebe a mudanca e as rotas internas sao bloqueadas.
  await signOut(auth);
}
