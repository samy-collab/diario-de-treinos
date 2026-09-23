import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, type Persistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { Platform } from 'react-native';

// Variaveis EXPO_PUBLIC_ ficam disponiveis ao codigo do app. Elas identificam
// o projeto; uma chave privada de conta de servico nunca deve ficar aqui.
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Evita inicializar o mesmo app duas vezes durante o hot reload.
const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

function createAuth() {
  // Na web o SDK usa o navegador; no app nativo a sessao vai para AsyncStorage.
  if (Platform.OS === 'web') return getAuth(firebaseApp);
  try {
    return initializeAuth(firebaseApp, { persistence: asyncStoragePersistence });
  } catch {
    return getAuth(firebaseApp);
  }
}

// Adaptador de persistencia no formato esperado pelo Firebase Authentication.
const asyncStoragePersistence = {
  type: 'LOCAL',
  async _isAvailable() {
    return true;
  },
  async _set(key: string, value: unknown) {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  },
  async _get<T>(key: string): Promise<T | null> {
    const value = await AsyncStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : null;
  },
  async _remove(key: string) {
    await AsyncStorage.removeItem(key);
  },
  _addListener() {},
  _removeListener() {},
} as Persistence;

export const auth = createAuth();
// Instancia compartilhada pelos servicos que acessam os treinos.
export const db = getFirestore(firebaseApp);
