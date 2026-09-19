import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import {
  ActivityIndicator,
  Alert,
  Button,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { auth, db } from '@/lib/firebase';
import { subscribeToTasks } from '@/services/tasks';
import type { Task } from '@/types/task';

const FIRESTORE_TIMEOUT = 10000;

export default function TasksScreen() {
  const [title, setTitle] = useState('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [isCheckingUser, setIsCheckingUser] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribeTasks: (() => void) | undefined;
    let loadingTimeout: ReturnType<typeof setTimeout> | undefined;

    // Primeiro verificamos se existe um usuário autenticado.
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setIsCheckingUser(false);

      if (!user) {
        if (loadingTimeout) clearTimeout(loadingTimeout);
        unsubscribeTasks?.();
        unsubscribeTasks = undefined;
        setUserId(null);
        setIsLoading(false);
        return;
      }

      unsubscribeTasks?.();
      if (loadingTimeout) clearTimeout(loadingTimeout);
      setUserId(user.uid);
      setIsLoading(true);

      // Se o Firestore não responder, a tela não fica carregando para sempre.
      loadingTimeout = setTimeout(() => {
        setIsLoading(false);
        setErrorMessage(
          'O Firestore não respondeu. Verifique a internet, se o banco foi criado e se as regras foram publicadas.',
        );
      }, FIRESTORE_TIMEOUT);

      unsubscribeTasks = subscribeToTasks(
        user.uid,
        (nextTasks) => {
          if (loadingTimeout) clearTimeout(loadingTimeout);
          setErrorMessage(null);
          setTasks(nextTasks);
          setIsLoading(false);
        },
        (error) => {
          if (loadingTimeout) clearTimeout(loadingTimeout);
          setErrorMessage(getErrorMessage(error));
          setIsLoading(false);
        },
      );
    });

    return () => {
      unsubscribeAuth();
      unsubscribeTasks?.();
      if (loadingTimeout) clearTimeout(loadingTimeout);
    };
  }, []);

  if (isCheckingUser) {
    return <LoadingScreen message="Verificando usuário..." />;
  }

  if (!userId) {
    return <Redirect href="/login" />;
  }

  async function handleCreateTask() {
    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      Alert.alert('Título obrigatório', 'Digite um título para criar a tarefa.');
      return;
    }

    if (!userId) {
      Alert.alert('Aguarde', 'A autenticação ainda não terminou.');
      return;
    }

    try {
      setIsSaving(true);
      setErrorMessage(null);

      // 1. collection(db, 'tasks') aponta para a coleção "tasks".
      // 2. addDoc cria um novo documento com um ID automático.
      // 3. O segundo argumento contém os campos que serão salvos.
      await withTimeout(
        addDoc(collection(db, 'tasks'), {
          title: trimmedTitle, // Texto digitado pelo aluno.
          userId, // Permite salvar e consultar apenas as tarefas deste usuário.
          createdAt: serverTimestamp(), // Data gerada pelo servidor do Firebase.
        }),
        FIRESTORE_TIMEOUT,
      );

      setTitle('');
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}>
        <View style={styles.intro}>
          <Text style={styles.eyebrow}>FIRESTORE + EXPO</Text>
          <Text style={styles.heading}>Minhas tarefas</Text>
          <Text style={styles.description}>
            Crie documentos e acompanhe a coleção em tempo real.
          </Text>
        </View>

        <View style={styles.form}>
          <TextInput
            autoCapitalize="sentences"
            editable={!isSaving}
            maxLength={120}
            onChangeText={setTitle}
            onSubmitEditing={() => void handleCreateTask()}
            placeholder="Ex.: estudar Firestore"
            returnKeyType="done"
            style={styles.input}
            value={title}
          />
          <Button
            disabled={isSaving}
            onPress={() => void handleCreateTask()}
            title={isSaving ? 'Salvando...' : 'Adicionar'}
            color="#2563eb"
          />
        </View>

        {errorMessage ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorTitle}>Não foi possível conectar ao Firebase</Text>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        {isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator color="#2563eb" size="large" />
            <Text style={styles.muted}>Carregando tarefas...</Text>
          </View>
        ) : (
          <FlatList
            contentContainerStyle={tasks.length === 0 ? styles.emptyList : styles.list}
            data={tasks}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>Nenhuma tarefa ainda</Text>
                <Text style={styles.muted}>A primeira tarefa aparecerá aqui.</Text>
              </View>
            }
            renderItem={({ item }) => <TaskItem task={item} />}
            showsVerticalScrollIndicator={false}
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function LoadingScreen({ message }: { message: string }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.centered}>
        <ActivityIndicator color="#2563eb" size="large" />
        <Text style={styles.muted}>{message}</Text>
      </View>
    </SafeAreaView>
  );
}

function TaskItem({ task }: { task: Task }) {
  return (
    <View style={styles.taskItem}>
      <View style={styles.taskDot} />
      <View style={styles.taskContent}>
        <Text style={styles.taskTitle}>{task.title}</Text>
        <Text style={styles.taskDate}>
          {task.createdAt ? task.createdAt.toLocaleString('pt-BR') : 'Salvando...'}
        </Text>
      </View>
    </View>
  );
}

function getErrorMessage(error: unknown) {
  if (!(error instanceof Error)) return 'Ocorreu um erro inesperado.';

  if (
    error.message.includes('permission-denied') ||
    error.message.includes('Missing or insufficient permissions')
  ) {
    return 'A gravação foi recusada. Publique as regras do Firestore e verifique o usuário autenticado.';
  }

  if (error.message.includes('not-found') || error.message.includes('database')) {
    return 'O banco Firestore ainda não existe. Crie o banco padrão no Firebase Console e tente novamente.';
  }

  return error.message;
}

function withTimeout<T>(promise: Promise<T>, milliseconds: number) {
  return new Promise<T>((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(
        new Error(
          'O Firestore não respondeu. Verifique a internet, se o banco foi criado e se as regras foram publicadas.',
        ),
      );
    }, milliseconds);

    promise.then(
      (value) => {
        clearTimeout(timeoutId);
        resolve(value);
      },
      (error) => {
        clearTimeout(timeoutId);
        reject(error);
      },
    );
  });
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#f8fafc',
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },
  intro: {
    paddingBottom: 24,
    paddingTop: 24,
  },
  eyebrow: {
    color: '#2563eb',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  heading: {
    color: '#0f172a',
    fontSize: 32,
    fontWeight: '800',
  },
  description: {
    color: '#64748b',
    fontSize: 16,
    lineHeight: 24,
    marginTop: 8,
  },
  form: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#ffffff',
    borderColor: '#cbd5e1',
    borderRadius: 12,
    borderWidth: 1,
    color: '#0f172a',
    flex: 1,
    fontSize: 16,
    minHeight: 52,
    paddingHorizontal: 16,
  },
  errorBox: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    padding: 14,
  },
  errorTitle: {
    color: '#991b1b',
    fontWeight: '700',
    marginBottom: 4,
  },
  errorText: {
    color: '#b91c1c',
    lineHeight: 20,
  },
  centered: {
    alignItems: 'center',
    flex: 1,
    gap: 12,
    justifyContent: 'center',
  },
  muted: {
    color: '#64748b',
    fontSize: 15,
  },
  list: {
    paddingBottom: 24,
  },
  emptyList: {
    flexGrow: 1,
  },
  emptyState: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  emptyTitle: {
    color: '#334155',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  taskItem: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    flexDirection: 'row',
    marginBottom: 10,
    padding: 16,
  },
  taskDot: {
    backgroundColor: '#60a5fa',
    borderRadius: 6,
    height: 12,
    marginRight: 14,
    width: 12,
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    color: '#1e293b',
    fontSize: 16,
    fontWeight: '600',
  },
  taskDate: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 5,
  },
});
