import { addDoc, collection, deleteDoc, doc, getDoc, onSnapshot, orderBy, query, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Workout, WorkoutInput } from '@/types/workout';

// O uid faz parte do caminho: cada conta possui sua propria subcolecao.
const workoutsCollection = (userId: string) => collection(db, 'users', userId, 'workouts');
const workoutDocument = (userId: string, workoutId: string) => doc(db, 'users', userId, 'workouts', workoutId);

export function subscribeToWorkouts(userId: string, onWorkouts: (items: Workout[]) => void, onError: (error: Error) => void) {
  // onSnapshot mantem a FlatList sincronizada; orderBy ordena pela data.
  return onSnapshot(query(workoutsCollection(userId), orderBy('date', 'desc')), (snapshot) => {
    onWorkouts(snapshot.docs.map((item) => mapWorkout(item.id, item.data())));
  }, onError);
}

export async function getWorkout(userId: string, workoutId: string) {
  const snapshot = await getDoc(workoutDocument(userId, workoutId));
  return snapshot.exists() ? mapWorkout(snapshot.id, snapshot.data()) : null;
}

export async function createWorkout(userId: string, input: WorkoutInput) {
  // serverTimestamp usa o relogio do servidor, nao o horario do celular.
  await addDoc(workoutsCollection(userId), { ...input, createdAt: serverTimestamp() });
}

export async function updateWorkout(userId: string, workoutId: string, input: WorkoutInput) {
  // updateDoc altera o documento existente e registra a ultima atualizacao.
  await updateDoc(workoutDocument(userId, workoutId), { ...input, updatedAt: serverTimestamp() });
}

export async function removeWorkout(userId: string, workoutId: string) {
  await deleteDoc(workoutDocument(userId, workoutId));
}

function mapWorkout(id: string, data: Record<string, any>): Workout {
  // Converte o formato flexivel do Firestore para o tipo usado pela interface.
  return { id, activity: data.activity, date: String(data.date ?? ''), durationMinutes: Number(data.durationMinutes ?? 0), distanceKm: Number(data.distanceKm ?? 0), loadKg: Number(data.loadKg ?? 0), intensity: data.intensity, notes: String(data.notes ?? ''), createdAt: data.createdAt?.toDate?.() ?? null };
}
