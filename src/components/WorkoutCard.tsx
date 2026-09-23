import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Workout } from '@/types/workout';
import { formatDate } from '@/utils/format';

type WorkoutCardProps = { workout: Workout; onPress: () => void };

// Componente reutilizavel: recebe dados e comportamento por props tipadas,
// sem conhecer Firebase ou navegacao.
export function WorkoutCard({ workout, onPress }: WorkoutCardProps) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.card}>
      <View style={styles.row}>
        <View style={styles.icon}>
          <Text style={styles.iconText}>✓</Text>
        </View>
        <View style={styles.content}>
          <Text style={styles.title}>{workout.activity}</Text>
          <Text style={styles.meta}>
            {formatDate(workout.date)} • {workout.durationMinutes} min
          </Text>
        </View>
        <Text style={styles.intensity}>{workout.intensity}</Text>
      </View>
      {(workout.distanceKm > 0 || workout.loadKg > 0) && (
        <Text style={styles.metrics}>
          {workout.distanceKm > 0 ? `${workout.distanceKm} km` : ''}
          {workout.distanceKm > 0 && workout.loadKg > 0 ? '  •  ' : ''}
          {workout.loadKg > 0 ? `${workout.loadKg} kg` : ''}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderColor: '#dcfce7',
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    padding: 16,
  },
  row: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  icon: {
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    borderRadius: 22,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  iconText: { color: '#15803d', fontSize: 20, fontWeight: '900' },
  content: { flex: 1 },
  title: { color: '#14532d', fontSize: 17, fontWeight: '800' },
  meta: { color: '#64748b', marginTop: 4 },
  intensity: { color: '#166534', fontSize: 12, fontWeight: '800' },
  metrics: { color: '#475569', fontWeight: '600', marginLeft: 56, marginTop: 10 },
});
