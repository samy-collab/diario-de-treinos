import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { createWorkout, getWorkout, updateWorkout } from '@/services/workouts';
import {
  INTENSITIES,
  WORKOUT_TYPES,
  type Intensity,
  type WorkoutInput,
  type WorkoutType,
} from '@/types/workout';

export default function WorkoutFormScreen() {
  // A presenca de id transforma o formulario de criacao em formulario de edicao.
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { user, profile } = useAuth();
  const [activity, setActivity] = useState<WorkoutType>('Caminhada');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [duration, setDuration] = useState('');
  const [distance, setDistance] = useState('');
  const [load, setLoad] = useState('');
  const [intensity, setIntensity] = useState<Intensity>('Moderada');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(Boolean(id));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  // Na edicao, busca o documento e preenche os estados antes de mostrar a tela.
  useEffect(() => {
    if (!id || !user) return;
    void getWorkout(user.uid, id)
      .then((item) => {
        if (!item) return setError('Treino não encontrado.');
        setActivity(item.activity);
        setDate(item.date);
        setDuration(String(item.durationMinutes));
        setDistance(item.distanceKm ? String(item.distanceKm) : '');
        setLoad(item.loadKg ? String(item.loadKg) : '');
        setIntensity(item.intensity);
        setNotes(item.notes);
      })
      .catch(() => setError('Não foi possível carregar o treino.'))
      .finally(() => setIsLoading(false));
  }, [id, user]);

  async function handleSave() {
    // Converte virgula decimal brasileira e aplica zero aos campos opcionais.
    const durationMinutes = Number(duration.replace(',', '.'));
    const distanceKm = distance ? Number(distance.replace(',', '.')) : 0;
    const loadKg = load ? Number(load.replace(',', '.')) : 0;
    // Regras de negocio da interface; o Firestore repete as essenciais no servidor.
    if (!isValidDate(date)) return setError('Informe uma data válida no formato AAAA-MM-DD.');
    if (!Number.isFinite(durationMinutes) || durationMinutes <= 0)
      return setError('A duração deve ser maior que zero.');
    if (!Number.isFinite(distanceKm) || distanceKm < 0 || !Number.isFinite(loadKg) || loadKg < 0)
      return setError('Distância e carga não podem ser negativas.');
    if (!user) return setError('Sua sessão expirou. Entre novamente.');
    const input: WorkoutInput = {
      activity,
      date,
      durationMinutes,
      distanceKm,
      loadKg,
      intensity,
      notes: notes.trim(),
    };
    // O id decide entre UPDATE e CREATE. So volta apos a operacao terminar.
    try {
      setIsSaving(true);
      setError('');
      if (id) await updateWorkout(user.uid, id, input);
      else await createWorkout(user.uid, input);
      returnToPreviousScreen();
    } catch {
      setError('Não foi possível salvar. Verifique a internet e tente novamente.');
    } finally {
      setIsSaving(false);
    }
  }

  function returnToPreviousScreen() {
    // Uma pagina recarregada pode nao ter historico. Nesse caso, abre a lista
    // em vez de chamar back() e gerar o aviso GO_BACK no navegador.
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }

  if (isLoading)
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#16a34a" size="large" />
      </View>
    );
  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ title: id ? 'Editar treino' : 'Novo treino' }} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>{id ? 'Atualize seu treino' : 'Como foi seu treino?'}</Text>
          <Text style={styles.help}>
            Preencha os dados abaixo. Distância e carga são opcionais.
          </Text>
          {/* Resumo simples de quem esta registrando o treino. */}
          {profile ? (
            <View style={styles.profileSummary}>
              <Text style={styles.profileName}>{profile.name}</Text>
              <Text style={styles.profileAge}>{profile.age} anos</Text>
            </View>
          ) : null}
          <Text style={styles.label}>Modalidade *</Text>
          <View style={styles.options}>
            {WORKOUT_TYPES.map((item) => (
              <Choice
                key={item}
                label={item}
                selected={activity === item}
                onPress={() => setActivity(item)}
              />
            ))}
          </View>
          <Text style={styles.label}>Data (AAAA-MM-DD) *</Text>
          <TextInput
            keyboardType="numbers-and-punctuation"
            maxLength={10}
            onChangeText={setDate}
            placeholder="2026-09-22"
            style={styles.input}
            value={date}
          />
          <Text style={styles.label}>Duração em minutos *</Text>
          <TextInput
            keyboardType="numeric"
            onChangeText={setDuration}
            placeholder="Ex.: 45"
            style={styles.input}
            value={duration}
          />
          <View style={styles.twoColumns}>
            <View style={styles.column}>
              <Text style={styles.label}>Distância (km)</Text>
              <TextInput
                keyboardType="decimal-pad"
                onChangeText={setDistance}
                placeholder="Ex.: 5,2"
                style={styles.input}
                value={distance}
              />
            </View>
            <View style={styles.column}>
              <Text style={styles.label}>Carga (kg)</Text>
              <TextInput
                keyboardType="decimal-pad"
                onChangeText={setLoad}
                placeholder="Ex.: 30"
                style={styles.input}
                value={load}
              />
            </View>
          </View>
          <Text style={styles.label}>Intensidade *</Text>
          <View style={styles.options}>
            {INTENSITIES.map((item) => (
              <Choice
                key={item}
                label={item}
                selected={intensity === item}
                onPress={() => setIntensity(item)}
              />
            ))}
          </View>
          <Text style={styles.label}>Observações</Text>
          <TextInput
            maxLength={300}
            multiline
            onChangeText={setNotes}
            placeholder="Como você se sentiu?"
            style={[styles.input, styles.textArea]}
            textAlignVertical="top"
            value={notes}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Pressable
            disabled={isSaving}
            onPress={() => void handleSave()}
            style={styles.saveButton}
          >
            {isSaving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveText}>Salvar treino</Text>
            )}
          </Pressable>
          {/* Alternativa visivel para voltar sem salvar, alem da seta do cabecalho. */}
          <Pressable
            disabled={isSaving}
            onPress={returnToPreviousScreen}
            style={styles.cancelButton}
          >
            <Text style={styles.cancelText}>Cancelar e voltar</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Choice({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.choice, selected && styles.choiceSelected]}>
      <Text style={[styles.choiceText, selected && styles.choiceTextSelected]}>{label}</Text>
    </Pressable>
  );
}
// Alem do formato, confirma que a data realmente existe (rejeita 2026-02-31).
function isValidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: '#f8fafc', flex: 1 },
  flex: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  center: { alignItems: 'center', backgroundColor: '#f8fafc', flex: 1, justifyContent: 'center' },
  title: { color: '#14532d', fontSize: 25, fontWeight: '900' },
  help: { color: '#64748b', lineHeight: 21, marginBottom: 14, marginTop: 6 },
  profileSummary: {
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    borderColor: '#bbf7d0',
    borderRadius: 11,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    padding: 12,
  },
  profileName: { color: '#166534', fontWeight: '800' },
  profileAge: { color: '#15803d', fontWeight: '700' },
  label: { color: '#334155', fontSize: 13, fontWeight: '800', marginBottom: 7 },
  input: {
    backgroundColor: '#fff',
    borderColor: '#cbd5e1',
    borderRadius: 11,
    borderWidth: 1,
    fontSize: 16,
    marginBottom: 18,
    minHeight: 50,
    paddingHorizontal: 14,
  },
  textArea: { minHeight: 90, paddingTop: 13 },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 },
  choice: {
    backgroundColor: '#e2e8f0',
    borderRadius: 20,
    paddingHorizontal: 13,
    paddingVertical: 9,
  },
  choiceSelected: { backgroundColor: '#16a34a' },
  choiceText: { color: '#475569', fontWeight: '700' },
  choiceTextSelected: { color: '#fff' },
  twoColumns: { flexDirection: 'row', gap: 12 },
  column: { flex: 1 },
  error: {
    backgroundColor: '#fee2e2',
    borderRadius: 10,
    color: '#991b1b',
    marginBottom: 16,
    padding: 12,
  },
  saveButton: {
    alignItems: 'center',
    backgroundColor: '#16a34a',
    borderRadius: 13,
    justifyContent: 'center',
    minHeight: 52,
  },
  saveText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  cancelButton: {
    alignItems: 'center',
    borderColor: '#cbd5e1',
    borderRadius: 13,
    borderWidth: 1,
    justifyContent: 'center',
    marginTop: 10,
    minHeight: 50,
  },
  cancelText: { color: '#475569', fontWeight: '800' },
});
