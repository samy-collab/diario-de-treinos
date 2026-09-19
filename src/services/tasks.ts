import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import {
  collection,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';

import { auth, db } from '@/lib/firebase';
import type { Task } from '@/types/task';

const tasksCollection = collection(db, 'tasks');

export async function signInWithEmail(email: string, password: string) {
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
}

export async function createAccount(email: string, password: string) {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  return result.user;
}

export function subscribeToTasks(
  userId: string,
  onTasks: (tasks: Task[]) => void,
  onError: (error: Error) => void,
) {
  const tasksQuery = query(tasksCollection, where('userId', '==', userId));

  return onSnapshot(
    tasksQuery,
    (snapshot) => {
      const tasks = snapshot.docs
        .map<Task>((document) => {
          const data = document.data();
          const createdAt = data.createdAt?.toDate?.() ?? null;

          return {
            id: document.id,
            title: data.title,
            createdAt,
          };
        })
        .sort((first, second) => {
          const firstTime = first.createdAt?.getTime() ?? 0;
          const secondTime = second.createdAt?.getTime() ?? 0;
          return secondTime - firstTime;
        });

      onTasks(tasks);
    },
    onError,
  );
}
