export const WORKOUT_TYPES = ['Caminhada', 'Corrida', 'Ciclismo', 'Musculação', 'Natação', 'Outro'] as const;
export const INTENSITIES = ['Leve', 'Moderada', 'Intensa'] as const;

// "as const" permite derivar tipos apenas com os valores aceitos nas opcoes.
export type WorkoutType = (typeof WORKOUT_TYPES)[number];
export type Intensity = (typeof INTENSITIES)[number];

export type Workout = {
  id: string;
  activity: WorkoutType;
  date: string;
  durationMinutes: number;
  distanceKm: number;
  loadKg: number;
  intensity: Intensity;
  notes: string;
  createdAt: Date | null;
};

// O formulario nao fornece id nem createdAt: ambos pertencem a persistencia.
export type WorkoutInput = Omit<Workout, 'id' | 'createdAt'>;
