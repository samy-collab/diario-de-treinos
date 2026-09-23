import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { ConfirmationModal } from '@/components/ConfirmationModal';
import { WorkoutCard } from '@/components/WorkoutCard';
import { useAuth } from '@/context/AuthContext';
import { logout, saveUserProfile } from '@/services/auth';
import { subscribeToWorkouts } from '@/services/workouts';
import { WORKOUT_TYPES, type Workout } from '@/types/workout';
import { currentMonth } from '@/utils/format';

const ALL = 'Todos';

export default function WorkoutsScreen() {
  const router = useRouter(); const { user, profile } = useAuth();
  const [workouts, setWorkouts] = useState<Workout[]>([]); const [activity, setActivity] = useState<string>(ALL); const [isLoading, setIsLoading] = useState(true); const [error, setError] = useState('');
  const [isLogoutConfirmationVisible, setIsLogoutConfirmationVisible] = useState(false);
  const [profileName, setProfileName] = useState(''); const [profileAge, setProfileAge] = useState(''); const [isSavingProfile, setIsSavingProfile] = useState(false); const [profileError, setProfileError] = useState('');
  // Listener em tempo real: entrega a lista inicial e futuras alteracoes.
  // Seu retorno cancela a assinatura quando a tela e desmontada.
  useEffect(() => { if (!user) return; return subscribeToWorkouts(user.uid, (items) => { setWorkouts(items); setError(''); setIsLoading(false); }, () => { setError('Não foi possível carregar os treinos. Confira sua internet e as regras do Firestore.'); setIsLoading(false); }); }, [user]);
  // useMemo recalcula o filtro apenas quando a modalidade ou a lista mudam.
  const visibleWorkouts = useMemo(() => workouts.filter((item) => activity === ALL || item.activity === activity), [activity, workouts]);
  // Regra de negocio: estatisticas mensais calculadas com dados do Firestore.
  const monthWorkouts = useMemo(() => workouts.filter((item) => item.date.startsWith(currentMonth())), [workouts]);
  const monthMinutes = monthWorkouts.reduce((total, item) => total + item.durationMinutes, 0);

  // Abre o modal multiplataforma antes de encerrar a sessao.
  function confirmLogout() { setIsLogoutConfirmationVisible(true); }
  function handleLogout() { setIsLogoutConfirmationVisible(false); void logout(); }

  async function handleSaveProfile() {
    const age = Number(profileAge);
    if (!profileName.trim()) return setProfileError('Informe seu nome.');
    if (!Number.isInteger(age) || age < 1 || age > 120) return setProfileError('Informe uma idade válida entre 1 e 120 anos.');
    if (!user) return;
    try {
      setIsSavingProfile(true); setProfileError('');
      await saveUserProfile(user.uid, profileName.trim(), age);
    } catch {
      setProfileError('Não foi possível salvar o perfil. Tente novamente.');
    } finally {
      setIsSavingProfile(false);
    }
  }

  return <SafeAreaView style={styles.safeArea}><View style={styles.container}>
    <View style={styles.headerRow}><View><Text style={styles.greeting}>{profile?.name ? `Olá, ${profile.name}!` : 'Olá, vamos treinar?'}</Text><Text style={styles.email}>{user?.email}{profile?.age ? ` • ${profile.age} anos` : ''}</Text></View><Pressable onPress={confirmLogout}><Text style={styles.logout}>Sair</Text></Pressable></View>
    {/* Contas antigas completam o perfil aqui; o bloco some depois de salvar. */}
    {!profile ? <View style={styles.profileCard}><Text style={styles.profileTitle}>Complete seu perfil</Text><Text style={styles.profileHelp}>Informe seus dados para personalizar o aplicativo.</Text><View style={styles.profileFields}><TextInput editable={!isSavingProfile} maxLength={60} onChangeText={setProfileName} placeholder="Seu nome" style={styles.profileInput} value={profileName} /><TextInput editable={!isSavingProfile} keyboardType="number-pad" maxLength={3} onChangeText={setProfileAge} placeholder="Idade" style={[styles.profileInput, styles.ageInput]} value={profileAge} /></View>{profileError ? <Text style={styles.profileError}>{profileError}</Text> : null}<Pressable disabled={isSavingProfile} onPress={() => void handleSaveProfile()} style={styles.profileButton}><Text style={styles.profileButtonText}>{isSavingProfile ? 'Salvando...' : 'Salvar perfil'}</Text></Pressable></View> : null}
    <View style={styles.summary}><Text style={styles.summaryLabel}>RESUMO DESTE MÊS</Text><View style={styles.summaryRow}><View><Text style={styles.summaryValue}>{monthWorkouts.length}</Text><Text style={styles.summaryUnit}>treinos</Text></View><View style={styles.divider} /><View><Text style={styles.summaryValue}>{monthMinutes}</Text><Text style={styles.summaryUnit}>minutos</Text></View></View><Text style={styles.summaryHelp}>Resumo calculado com os treinos do Firestore</Text></View>
    <Text style={styles.filterLabel}>Filtrar por modalidade</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filters}>{[ALL, ...WORKOUT_TYPES].map((item) => <Pressable key={item} onPress={() => setActivity(item)} style={[styles.chip, activity === item && styles.chipActive]}><Text style={[styles.chipText, activity === item && styles.chipTextActive]}>{item}</Text></Pressable>)}</ScrollView>
    {error ? <Text style={styles.error}>{error}</Text> : null}
    {/* FlatList renderiza os cards com eficiencia e cobre o estado vazio. */}
    {isLoading ? <View style={styles.center}><ActivityIndicator color="#16a34a" size="large" /><Text style={styles.muted}>Carregando treinos...</Text></View> : <FlatList contentContainerStyle={visibleWorkouts.length ? styles.list : styles.emptyList} data={visibleWorkouts} keyExtractor={(item) => item.id} ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyTitle}>{workouts.length ? 'Nenhum treino neste filtro' : 'Nenhum treino cadastrado'}</Text><Text style={styles.muted}>{workouts.length ? 'Escolha outra modalidade.' : 'Registre seu primeiro treino para acompanhar sua evolução.'}</Text></View>} renderItem={({ item }) => <WorkoutCard workout={item} onPress={() => router.push({ pathname: '/workout/[id]', params: { id: item.id } })} />} />}
    <Pressable onPress={() => router.push('/workout-form')} style={styles.addButton}><Text style={styles.addButtonText}>+ Registrar treino</Text></Pressable>
    <ConfirmationModal confirmLabel="Sair" message="Tem certeza que deseja sair da sua conta?" onCancel={() => setIsLogoutConfirmationVisible(false)} onConfirm={handleLogout} title="Sair da conta" visible={isLogoutConfirmationVisible} />
  </View></SafeAreaView>;
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: '#f8fafc', flex: 1 }, container: { flex: 1, paddingHorizontal: 20, paddingTop: 16 }, headerRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 18 }, greeting: { color: '#14532d', fontSize: 21, fontWeight: '800' }, email: { color: '#64748b', fontSize: 13, marginTop: 2 }, logout: { color: '#dc2626', fontWeight: '700', padding: 8 },
  profileCard: { backgroundColor: '#eff6ff', borderColor: '#bfdbfe', borderRadius: 14, borderWidth: 1, marginBottom: 16, padding: 14 }, profileTitle: { color: '#1e3a8a', fontSize: 16, fontWeight: '800' }, profileHelp: { color: '#64748b', fontSize: 12, marginBottom: 10, marginTop: 3 }, profileFields: { flexDirection: 'row', gap: 8 }, profileInput: { backgroundColor: '#fff', borderColor: '#cbd5e1', borderRadius: 9, borderWidth: 1, flex: 1, minHeight: 42, paddingHorizontal: 11 }, ageInput: { flex: 0, width: 82 }, profileError: { color: '#b91c1c', fontSize: 12, marginTop: 8 }, profileButton: { alignItems: 'center', backgroundColor: '#2563eb', borderRadius: 9, marginTop: 10, padding: 11 }, profileButtonText: { color: '#fff', fontWeight: '800' },
  summary: { backgroundColor: '#15803d', borderRadius: 20, marginBottom: 16, padding: 20 }, summaryLabel: { color: '#bbf7d0', fontSize: 12, fontWeight: '800', letterSpacing: 1 }, summaryRow: { flexDirection: 'row', gap: 24, marginVertical: 10 }, summaryValue: { color: '#fff', fontSize: 30, fontWeight: '900' }, summaryUnit: { color: '#dcfce7' }, divider: { backgroundColor: '#4ade80', width: 1 }, summaryHelp: { color: '#dcfce7', fontSize: 12 },
  filterLabel: { color: '#334155', fontSize: 13, fontWeight: '700' }, filters: { flexGrow: 0, marginBottom: 16, marginTop: 9 }, chip: { backgroundColor: '#e2e8f0', borderRadius: 20, marginRight: 8, paddingHorizontal: 13, paddingVertical: 8 }, chipActive: { backgroundColor: '#16a34a' }, chipText: { color: '#475569', fontSize: 13, fontWeight: '700' }, chipTextActive: { color: '#fff' },
  error: { backgroundColor: '#fee2e2', borderRadius: 10, color: '#991b1b', marginBottom: 12, padding: 12 }, center: { alignItems: 'center', flex: 1, gap: 10, justifyContent: 'center' }, list: { paddingBottom: 90 }, emptyList: { flexGrow: 1, paddingBottom: 90 }, empty: { alignItems: 'center', flex: 1, justifyContent: 'center', padding: 30 }, emptyTitle: { color: '#334155', fontSize: 18, fontWeight: '800', marginBottom: 7, textAlign: 'center' }, muted: { color: '#64748b', lineHeight: 20, textAlign: 'center' },
  addButton: { alignItems: 'center', backgroundColor: '#16a34a', borderRadius: 14, bottom: 18, elevation: 4, left: 20, minHeight: 52, justifyContent: 'center', position: 'absolute', right: 20 }, addButtonText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
