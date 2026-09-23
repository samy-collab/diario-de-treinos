import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ConfirmationModal } from '@/components/ConfirmationModal';
import { useAuth } from '@/context/AuthContext';
import { getWorkout, removeWorkout } from '@/services/workouts';
import type { Workout } from '@/types/workout';
import { formatDate } from '@/utils/format';

export default function WorkoutDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');
  const [isDeleteConfirmationVisible, setIsDeleteConfirmationVisible] = useState(false);
  // Recarrega ao voltar da edicao; active evita atualizar uma tela desmontada.
  useFocusEffect(
    useCallback(() => {
      if (!user || !id) return;
      let active = true;
      setIsLoading(true);
      void getWorkout(user.uid, id)
        .then((item) => {
          if (!active) return;
          setWorkout(item);
          setError(item ? '' : 'Treino não encontrado.');
        })
        .catch(() => active && setError('Não foi possível carregar o treino.'))
        .finally(() => active && setIsLoading(false));
      return () => {
        active = false;
      };
    }, [id, user]),
  );

  // Confirmacao obrigatoria antes da operacao destrutiva.
  function confirmDelete() {
    setIsDeleteConfirmationVisible(true);
  }
  async function handleDelete() {
    if (!user || !id) return;
    try {
      setIsDeleting(true);
      await removeWorkout(user.uid, id);
      setIsDeleteConfirmationVisible(false);
      router.dismissTo('/');
    } catch {
      setError('Não foi possível excluir o treino.');
      setIsDeleting(false);
      setIsDeleteConfirmationVisible(false);
    }
  }

  if (isLoading)
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#16a34a" size="large" />
      </View>
    );
  if (!workout)
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.link}>Voltar</Text>
        </Pressable>
      </View>
    );
  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ title: workout.activity }} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>TREINO REGISTRADO</Text>
          <Text style={styles.title}>{workout.activity}</Text>
          <Text style={styles.date}>{formatDate(workout.date)}</Text>
        </View>
        <View style={styles.grid}>
          <Metric label="Duração" value={`${workout.durationMinutes} min`} />
          <Metric label="Intensidade" value={workout.intensity} />
          <Metric
            label="Distância"
            value={workout.distanceKm > 0 ? `${workout.distanceKm} km` : 'Não informada'}
          />
          <Metric
            label="Carga"
            value={workout.loadKg > 0 ? `${workout.loadKg} kg` : 'Não informada'}
          />
        </View>
        <View style={styles.notes}>
          <Text style={styles.notesLabel}>Observações</Text>
          <Text style={styles.notesText}>{workout.notes || 'Nenhuma observação.'}</Text>
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Pressable
          onPress={() => router.push({ pathname: '/workout-form', params: { id } })}
          style={styles.editButton}
        >
          <Text style={styles.editText}>Editar treino</Text>
        </Pressable>
        <Pressable disabled={isDeleting} onPress={confirmDelete} style={styles.deleteButton}>
          <Text style={styles.deleteText}>{isDeleting ? 'Excluindo...' : 'Excluir treino'}</Text>
        </Pressable>
        <ConfirmationModal
          confirmLabel="Excluir"
          isLoading={isDeleting}
          message="Esta ação não pode ser desfeita. Deseja continuar?"
          onCancel={() => setIsDeleteConfirmationVisible(false)}
          onConfirm={() => void handleDelete()}
          title="Excluir treino"
          visible={isDeleteConfirmationVisible}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: '#f8fafc', flex: 1 },
  content: { padding: 20 },
  center: {
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    flex: 1,
    gap: 15,
    justifyContent: 'center',
    padding: 30,
  },
  hero: { backgroundColor: '#15803d', borderRadius: 20, marginBottom: 16, padding: 22 },
  eyebrow: { color: '#bbf7d0', fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
  title: { color: '#fff', fontSize: 30, fontWeight: '900', marginTop: 5 },
  date: { color: '#dcfce7', fontSize: 16, marginTop: 5 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  metric: {
    backgroundColor: '#fff',
    borderColor: '#e2e8f0',
    borderRadius: 14,
    borderWidth: 1,
    minHeight: 88,
    padding: 14,
    width: '48%',
  },
  metricLabel: { color: '#64748b', fontSize: 12, fontWeight: '700' },
  metricValue: { color: '#14532d', fontSize: 17, fontWeight: '800', marginTop: 8 },
  notes: { backgroundColor: '#fff', borderRadius: 14, marginVertical: 16, padding: 16 },
  notesLabel: { color: '#334155', fontWeight: '800', marginBottom: 8 },
  notesText: { color: '#475569', lineHeight: 22 },
  error: { color: '#b91c1c', textAlign: 'center' },
  link: { color: '#15803d', fontWeight: '800' },
  editButton: {
    alignItems: 'center',
    backgroundColor: '#16a34a',
    borderRadius: 12,
    marginTop: 5,
    padding: 15,
  },
  editText: { color: '#fff', fontWeight: '800' },
  deleteButton: {
    alignItems: 'center',
    borderColor: '#fca5a5',
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 10,
    padding: 15,
  },
  deleteText: { color: '#dc2626', fontWeight: '800' },
});
